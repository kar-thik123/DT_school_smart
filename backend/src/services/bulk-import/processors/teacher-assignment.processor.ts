import { BulkImportProcessor, ResolvedDataMap, ValidationResult, CommitResult } from '../bulk-import.types';
import prisma from '../../../prisma';

const VALID_ASSIGNMENT_TYPES = ['CLASS_INCHARGE', 'SUBJECT_TEACHER'];

export class TeacherAssignmentProcessor implements BulkImportProcessor {
  private resolved: ResolvedDataMap = {
    teachers: {},
    grades: {},
    sections: {},
    subjects: {}
  };
  private fileUniqueSet: Set<string> = new Set();

  constructor(private organizationId: string, private userId: string) {}

  async resolveRelations(rows: any[]): Promise<ResolvedDataMap> {
    const emails = Array.from(new Set(rows.map((r: any) => r.teacher_email?.trim().toLowerCase()).filter(Boolean)));
    const gradeNames = Array.from(new Set(rows.map((r: any) => r.grade_name?.trim().toLowerCase()).filter(Boolean)));

    // 1. Fetch Teachers and ALL Grades
    const [teachers, grades] = await Promise.all([
      prisma.user.findMany({
        where: {
          organization_id: this.organizationId,
          email: { in: emails },
          role: { name: { in: ['TEACHER', 'HOD', 'PRINCIPAL'] } }
        },
        select: { id: true, email: true, name: true }
      }),
      prisma.grade.findMany({
        where: { organization_id: this.organizationId },
        select: { id: true, name: true }
      })
    ]);

    this.resolved.teachers = Object.fromEntries(teachers.map((u: any) => [u.email.toLowerCase(), u]));
    this.resolved.grades = Object.fromEntries(grades.map((g: any) => [g.name.trim().toLowerCase(), g]));

    const gradeIds = gradeNames.map(name => this.resolved.grades[name]?.id).filter(Boolean);

    let sections: any[] = [];
    let subjects: any[] = [];

    // 2. Fetch Sections and Subjects explicitly scoped by the matched grades
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
    }

    // Composite: grade_id + normalized section_name
    this.resolved.sections = Object.fromEntries(sections.map((s: any) => [`${s.grade_id}_${s.name.trim().toLowerCase()}`, s]));
    
    // Composite: grade_id + normalized subject_name
    this.resolved.subjects = Object.fromEntries(subjects.map((s: any) => [`${s.grade_id}_${s.name.trim().toLowerCase()}`, s]));

    return this.resolved;
  }

  async validateRow(row: any): Promise<ValidationResult> {
    const email = row.teacher_email?.trim().toLowerCase();
    const assignmentType = row.assignment_type?.trim().toUpperCase().replace(/\s+/g, '_');
    const gradeName = row.grade_name?.trim();
    const sectionName = row.section_name?.trim();
    const subjectName = row.subject_name?.trim();

    const errors: string[] = [];

    // ── 1. Required field presence ──────────────────────────────────────────
    if (!email) errors.push('Missing teacher_email');
    if (!assignmentType) errors.push('Missing assignment_type');
    if (!gradeName) errors.push('Missing grade_name');
    if (!sectionName) errors.push('Missing section_name');

    if (!VALID_ASSIGNMENT_TYPES.includes(assignmentType)) {
      errors.push(`Invalid assignment_type '${assignmentType}'. Must be CLASS_INCHARGE or SUBJECT_TEACHER.`);
    }

    if (errors.length > 0) return { status: 'ERROR', errors, data: row };

    // ── 2. Conditional subject rules ────────────────────────────────────────
    if (assignmentType === 'CLASS_INCHARGE' && subjectName) {
      errors.push(`subject_name must be empty for CLASS_INCHARGE assignments.`);
    }
    if (assignmentType === 'SUBJECT_TEACHER' && !subjectName) {
      errors.push(`subject_name is required for SUBJECT_TEACHER assignments.`);
    }

    if (errors.length > 0) return { status: 'ERROR', errors, data: row };

    // ── 3. Relational existence checks ──────────────────────────────────────
    const teacher = this.resolved.teachers[email];
    if (!teacher) errors.push(`Teacher with email '${email}' not found or is not a teacher role.`);

    const grade = this.resolved.grades[gradeName.toLowerCase()];
    if (!grade) errors.push(`Grade '${gradeName}' not found.`);

    let section: any;
    if (grade) {
      section = this.resolved.sections[`${grade.id}_${sectionName.toLowerCase()}`];
      if (!section) errors.push(`Section '${sectionName}' does not exist under Grade '${gradeName}'.`);
    }

    let subject: any = null;
    if (assignmentType === 'SUBJECT_TEACHER' && grade && subjectName) {
      subject = this.resolved.subjects[`${grade.id}_${subjectName.toLowerCase()}`];
      if (!subject) errors.push(`Subject '${subjectName}' does not exist under Grade '${gradeName}'.`);
    }

    if (errors.length > 0) return { status: 'ERROR', errors, data: row };

    // ── 4. Intra-file duplicate detection ───────────────────────────────────
    const uniqueKey = `${email}_${sectionName}_${subjectName || 'INCHARGE'}`;
    if (this.fileUniqueSet.has(uniqueKey)) {
      errors.push(`Duplicate entry: Teacher '${email}' already assigned to section '${sectionName}' with subject '${subjectName || 'CLASS_INCHARGE'}' in this file.`);
    }
    this.fileUniqueSet.add(uniqueKey);

    if (errors.length > 0) return { status: 'ERROR', errors, data: row };

    // ── 5. Attach resolved IDs for commit phase ─────────────────────────────
    return {
      status: 'VALID',
      data: {
        ...row,
        assignment_type: assignmentType,
        resolved_teacher_id: teacher.id,
        resolved_grade_id: grade.id,
        resolved_section_id: section.id,
        resolved_subject_id: subject?.id || null
      }
    };
  }

  async commit(validRows: any[]): Promise<CommitResult> {
    const result = await prisma.$transaction(async (tx: any) => {
      let success = 0;
      let failure = 0;

      for (const row of validRows) {
        if (!row.resolved_teacher_id || !row.resolved_grade_id) {
          failure++;
          continue;
        }

        try {
          // Use createMany with skipDuplicates to match existing API behavior safely
          await tx.teacherAssignment.createMany({
            data: [{
              organization_id: this.organizationId,
              teacher_id: row.resolved_teacher_id,
              assignment_type: row.assignment_type,
              grade_id: row.resolved_grade_id,
              section_id: row.resolved_section_id || null,
              subject_id: row.assignment_type === 'CLASS_INCHARGE' ? null : (row.resolved_subject_id || null)
            }],
            skipDuplicates: true
          });
          success++;
        } catch (e) {
          console.error('[Bulk-TeacherAssignment-Commit] Row failed:', e);
          failure++;
        }
      }

      return { success, failure };
    });

    return { success_count: result.success, failure_count: result.failure };
  }
}
