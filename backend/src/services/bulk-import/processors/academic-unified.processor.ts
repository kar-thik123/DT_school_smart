import { BulkImportProcessor, ResolvedDataMap, ValidationResult, CommitResult } from '../bulk-import.types';
import prisma from '../../../prisma';

/**
 * Unified Academic Structure Processor
 * Handles grade_name, section_name, subject_name, unit_name, topic_name in one flow.
 * Processes top-down hierarchically, permitting omitted columns smoothly.
 */
export class AcademicUnifiedProcessor implements BulkImportProcessor {
  private activeAcademicYearId?: string;

  constructor(private organizationId: string, private userId: string, private academicYearId: string) {
    this.activeAcademicYearId = academicYearId;
  }

  async resolveRelations(rows: any[]): Promise<ResolvedDataMap> {
    return {};
  }

  async validateRow(row: any): Promise<ValidationResult> {
    const gradeName = row.grade_name?.trim();
    const errors: string[] = [];

    if (!gradeName) {
      errors.push('Missing grade_name (root entity required)');
    }

    if (!this.activeAcademicYearId) {
      errors.push('No active Academic Year found. Please create one before importing.');
    }

    // We do NOT validate existence of lower levels here because it's allowed to be dynamic deeply.
    // If they provided section_name but omitted subject_name, that's valid.

    return errors.length > 0
      ? { status: 'ERROR', errors, data: row }
      : { status: 'VALID', data: row };
  }

  async commit(validRows: any[]): Promise<CommitResult> {
    // The /commit route creates a fresh processor instance (separate from /analyze),
    // so we must re-fetch the active academic year here.
    if (!this.activeAcademicYearId) {
      await this.resolveRelations(validRows);
    }

    const result = await prisma.$transaction(async (tx: any) => {
      let success = 0;
      let failure = 0;
      let skipped = 0;
      const seenSignatures = new Set<string>();

      for (const row of validRows) {
        try {
          const gName = row.grade_name?.trim().replace(/^grade\s*/i, '').trim();
          const secName = row.section_name?.trim();
          const subName = row.subject_name?.trim();
          const unitName = row.unit_name?.trim();
          const topicName = row.topic_name?.trim();

          if (!gName || !this.activeAcademicYearId) {
             failure++;
             continue;
          }

          // Skip completely duplicated rows in the same spreadsheet to save DB hits
          const signature = `${gName}|${secName}|${subName}|${unitName}|${topicName}`;
          if (seenSignatures.has(signature)) {
            skipped++;
            continue;
          }
          seenSignatures.add(signature);

          // 1. GRADE
          const grade = await tx.grade.upsert({
            where: { name_academic_year_id_organization_id: { name: gName, academic_year_id: this.activeAcademicYearId, organization_id: this.organizationId } },
            create: { name: gName, academic_year_id: this.activeAcademicYearId, organization_id: this.organizationId },
            update: {}
          });
          console.log(`[DEBUG_BULK] Created/Found Grade: ${gName} | ID: ${grade.id} | Org: ${this.organizationId} | Year: ${this.activeAcademicYearId}`);

          // 2. SECTION (Optional)
          let section = null;
          if (secName) {
            section = await tx.section.upsert({
              where: { name_grade_id_organization_id: { name: secName, grade_id: grade.id, organization_id: this.organizationId } },
              create: { name: secName, grade_id: grade.id, organization_id: this.organizationId },
              update: {}
            });
            console.log(`[DEBUG_BULK] Created/Found Section: ${secName} | ID: ${section.id}`);
          }

          // 3. SUBJECT (Optional)
          let subject = null;
          if (subName) {
            subject = await tx.subject.upsert({
              where: { name_grade_id_organization_id: { name: subName, grade_id: grade.id, organization_id: this.organizationId } },
              create: { name: subName, grade_id: grade.id, organization_id: this.organizationId },
              update: {}
            });
            console.log(`[DEBUG_BULK] Created/Found Subject: ${subName} | ID: ${subject.id}`);

            // 3.5 LINK SUBJECT TO SECTION(S)
            // If a section was provided in this CSV row → link to that section only.
            // If NO section was provided → link to ALL existing sections of the grade
            // so the subject is visible in the UI tree (not orphaned).
            const sectionsToLink: any[] = [];
            if (section) {
              sectionsToLink.push(section);
            } else {
              // Auto-link to all existing sections for this grade
              const allSections = await tx.section.findMany({
                where: { grade_id: grade.id, organization_id: this.organizationId }
              });
              sectionsToLink.push(...allSections);
            }

            for (const sec of sectionsToLink) {
              const defaultGroupName = `${grade.name} - ${sec.name} (Default)`;
              const group = await tx.subjectGroup.upsert({
                where: { name_grade_id_section_id_organization_id: { name: defaultGroupName, grade_id: grade.id, section_id: sec.id, organization_id: this.organizationId } },
                create: { name: defaultGroupName, grade_id: grade.id, section_id: sec.id, organization_id: this.organizationId },
                update: {}
              });
              console.log(`[DEBUG_BULK] Created/Found SubjectGroup: ${defaultGroupName} | ID: ${group.id}`);

              await tx.subjectGroupSubject.upsert({
                where: { group_id_subject_id: { group_id: group.id, subject_id: subject.id } },
                create: { group_id: group.id, subject_id: subject.id, subject_type: 'MANDATORY' },
                update: {}
              });
              console.log(`[DEBUG_BULK] Linked Subject ${subject.id} to Group ${group.id}`);
            }
          }

          // 4. UNIT (Optional, requires Subject)
          let unit = null;
          if (unitName && subject) {
            unit = await tx.unit.findFirst({
              where: { name: unitName, subject_id: subject.id, organization_id: this.organizationId }
            });
            if (!unit) {
              unit = await tx.unit.create({
                data: { name: unitName, subject_id: subject.id, organization_id: this.organizationId }
              });
            }
          }

          // 5. TOPIC (Optional, requires Unit)
          if (topicName && unit) {
            const topic = await tx.topic.findFirst({
              where: { name: topicName, unit_id: unit.id, organization_id: this.organizationId }
            });
            if (!topic) {
               await tx.topic.create({
                data: { name: topicName, unit_id: unit.id, organization_id: this.organizationId }
              });
            }
          }

          success++;
        } catch (e) {
          console.error('[UnifiedAcademicProcessor]', e);
          failure++;
        }
      }

      return { success, failure, skipped };
    });

    return { 
      success_count: result.success, 
      failure_count: result.failure,
      ...(result.skipped > 0 && { skipped_count: result.skipped })
    } as CommitResult;
  }
}
