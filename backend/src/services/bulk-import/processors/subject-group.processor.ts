import { BulkImportProcessor, ResolvedDataMap, ValidationResult, CommitResult } from '../bulk-import.types';
import prisma from '../../../prisma';

export class SubjectGroupProcessor implements BulkImportProcessor {
  private resolved: ResolvedDataMap = {
    grades: {},
    sections: {},
    subjects: {}
  };
  private fileUniqueSet: Set<string> = new Set();

  constructor(private organizationId: string, private userId: string) {}

  async resolveRelations(rows: any[]): Promise<ResolvedDataMap> {
    const gradeNames = Array.from(new Set(rows.map((r: any) => r.grade_name?.trim().toLowerCase()).filter(Boolean)));
    const sectionNames = Array.from(new Set(rows.map((r: any) => r.section_name?.trim().toLowerCase()).filter(Boolean)));

    // Parse all subject names in one pass
    const subjectNames = Array.from(new Set(
      rows.flatMap(r => (r.subjects || '').split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean))
    ));

    // 1. Fetch ALL Grades globally
    const grades = await prisma.grade.findMany({
      where: { organization_id: this.organizationId },
      select: { id: true, name: true }
    });
    this.resolved.grades = Object.fromEntries(grades.map((g: any) => [g.name.trim().toLowerCase(), g]));

    // Match referenced gradeIds to tightly scope the subjects and sections queries
    const gradeIds = gradeNames.map(name => this.resolved.grades[name]?.id).filter(Boolean);

    let sections: any[] = [];
    let subjects: any[] = [];

    let allowedSectionSubjects: any[] = [];

    if (gradeIds.length > 0) {
      [sections, subjects] = await Promise.all([
        prisma.section.findMany({
          where: { organization_id: this.organizationId, grade_id: { in: gradeIds } },
          select: { id: true, name: true, grade_id: true }
        }),
        prisma.subject.findMany({
          where: { organization_id: this.organizationId, grade_id: { in: gradeIds } },
          select: { id: true, name: true, grade_id: true }
        })
      ]);

      const sectionIds = sections.map((s: any) => s.id);
      if (sectionIds.length > 0) {
        allowedSectionSubjects = await prisma.subjectGroupSubject.findMany({
          where: { group: { section_id: { in: sectionIds }, organization_id: this.organizationId } },
          select: { subject_id: true, group: { select: { section_id: true } } }
        });
      }
    }

    // Composite key prevents cross-grade section collisions
    this.resolved.sections = Object.fromEntries(sections.map((s: any) => [`${s.grade_id}_${s.name.trim().toLowerCase()}`, s]));
    // Composite key: grade_id + normalized subject_name enforces grade-level subject scoping
    this.resolved.subjects = Object.fromEntries(subjects.map((s: any) => [`${s.grade_id}_${s.name.trim().toLowerCase()}`, s]));

    this.resolved.sectionAllowedSubjects = {};
    for (const item of allowedSectionSubjects) {
      const secId = item.group.section_id;
      if (!this.resolved.sectionAllowedSubjects[secId]) {
        this.resolved.sectionAllowedSubjects[secId] = new Set<string>();
      }
      this.resolved.sectionAllowedSubjects[secId].add(item.subject_id);
    }

    return this.resolved;
  }

  async validateRow(row: any): Promise<ValidationResult> {
    const groupName = row.group_name?.trim();
    const gradeName = row.grade_name?.trim();
    const sectionName = row.section_name?.trim();
    const rawSubjects = row.subjects || '';

    const errors: string[] = [];

    // ── 1. Required fields ──────────────────────────────────────────────────
    if (!groupName) errors.push('Missing group_name');
    if (!gradeName) errors.push('Missing grade_name');
    if (!sectionName) errors.push('Missing section_name');
    if (errors.length > 0) return { status: 'ERROR', errors, data: row };

    // ── 2. Grade / Section existence and relationship ───────────────────────
    const grade = this.resolved.grades[gradeName.toLowerCase()];
    if (!grade) errors.push(`Grade '${gradeName}' not found.`);

    let section: any;
    if (grade) {
      section = this.resolved.sections[`${grade.id}_${sectionName.toLowerCase()}`];
      if (!section) errors.push(`Section '${sectionName}' does not exist under Grade '${gradeName}'.`);
    }
    if (errors.length > 0) return { status: 'ERROR', errors, data: row };

    // ── 3. Subject parsing and validation ───────────────────────────────────
    const subjectNames = rawSubjects.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);

    if (subjectNames.length === 0) {
      errors.push('Missing subjects');
    }

    const resolvedSubjects: any[] = [];

    for (const name of subjectNames) {
      const subj = this.resolved.subjects[`${grade.id}_${name}`];
      if (!subj) {
        errors.push(`Subject '${name}' not found under Grade '${gradeName}'.`);
      } else {
        const allowedSet = this.resolved.sectionAllowedSubjects?.[section.id];
        if (!allowedSet || !allowedSet.has(subj.id)) {
           errors.push(`Subject '${subj.name}' not available in Section '${sectionName}'.`);
        } else {
           resolvedSubjects.push(subj);
        }
      }
    }

    if (errors.length > 0) return { status: 'ERROR', errors, data: row };

    // ── 4. Intra-file duplicate detection ───────────────────────────────────
    const uniqueKey = `${groupName}_${section.id}`;
    if (this.fileUniqueSet.has(uniqueKey)) {
      errors.push(`Duplicate entry: Group '${groupName}' already defined for Section '${sectionName}' in this file.`);
    }
    this.fileUniqueSet.add(uniqueKey);
    if (errors.length > 0) return { status: 'ERROR', errors, data: row };

    // ── 5. Attach resolved IDs for commit ───────────────────────────────────
    return {
      status: 'VALID',
      data: {
        ...row,
        resolved_grade_id: grade.id,
        resolved_section_id: section.id,
        resolved_subject_ids: resolvedSubjects.map((s: any) => s.id)
      }
    };
  }

  async commit(validRows: any[]): Promise<CommitResult> {
    const result = await prisma.$transaction(async (tx: any) => {
      let success = 0;
      let failure = 0;

      for (const row of validRows) {
        try {
          const groupName: string = row.group_name.trim();

          // Upsert the SubjectGroup itself
          const group = await tx.subjectGroup.upsert({
            where: {
              name_grade_id_section_id_organization_id: {
                name: groupName,
                grade_id: row.resolved_grade_id,
                section_id: row.resolved_section_id,
                organization_id: this.organizationId
              }
            },
            create: {
              name: groupName,
              grade_id: row.resolved_grade_id,
              section_id: row.resolved_section_id,
              organization_id: this.organizationId
            },
            update: {} // Idempotent — don't overwrite manually managed fields
          });

          // Link subjects
          for (const subjectId of (row.resolved_subject_ids || [])) {
            await tx.subjectGroupSubject.upsert({
              where: { group_id_subject_id: { group_id: group.id, subject_id: subjectId } },
              create: { group_id: group.id, subject_id: subjectId, subject_type: 'MANDATORY' }, // UI uses MANDATORY behavior inherently
              update: { subject_type: 'MANDATORY' }
            });
          }

          success++;
        } catch (e) {
          console.error('[Bulk-SubjectGroup-Commit] Row failed:', e);
          failure++;
        }
      }

      return { success, failure };
    });

    return { success_count: result.success, failure_count: result.failure };
  }
}
