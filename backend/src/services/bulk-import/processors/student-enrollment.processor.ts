import { BulkImportProcessor, ResolvedDataMap, ValidationResult, CommitResult } from '../bulk-import.types';
import prisma from '../../../prisma';
import { EnrollmentStatus } from '@prisma/client';
import { StudentEnrollmentService, EnrollmentPayload } from '../../student-enrollment.service';

export class StudentEnrollmentProcessor implements BulkImportProcessor {
  private resolved: ResolvedDataMap = {
    users: {},
    academic_years: {},
    grades: {},
    sections: {},
    subject_groups: {},
    section_capacities: {},
    section_current_counts: {},
    existing_enrollments: {}
  };
  private fileUniqueSet: Set<string> = new Set();
  private sectionAddedCount: Record<string, number> = {};

  private normalizeString(val: any): string {
    if (typeof val !== 'string') return '';
    return val.replace(/\s+/g, ' ').trim().toLowerCase();
  }

  constructor(private organizationId: string, private userId: string, private academicYearId: string) { }

  async resolveRelations(rows: any[]): Promise<ResolvedDataMap> {
    const emails = Array.from(new Set(rows.map((r: any) => this.normalizeString(r.student_email)).filter(Boolean)));

    const [users, academicYears, grades, sections, groups] = await Promise.all([
      prisma.user.findMany({
        where: {
          organization_id: this.organizationId,
          email: { in: emails },
          role: { permissions: { some: { permission: { module: 'IDENTITY', action: 'IS_STUDENT' } } } }
        }
      }),
      prisma.academicYear.findMany({
        where: { organization_id: this.organizationId }
      }),
      prisma.grade.findMany({
        where: { organization_id: this.organizationId }
      }),
      prisma.section.findMany({
        where: { organization_id: this.organizationId }
      }),
      prisma.subjectGroup.findMany({
        where: { organization_id: this.organizationId }
      }),
    ]);

    this.resolved.users = Object.fromEntries(users.map((u: any) => [this.normalizeString(u.email), u]));
    this.resolved.academic_years = Object.fromEntries(academicYears.map((ay: any) => [this.normalizeString(ay.name), ay]));
    this.resolved.grades = Object.fromEntries(grades.map((g: any) => [this.normalizeString(g.name), g]));
    this.resolved.sections = Object.fromEntries(sections.map((s: any) => [`${s.grade_id}_${this.normalizeString(s.name)}`, s]));
    this.resolved.subject_groups = Object.fromEntries(groups.map((g: any) => [`${g.section_id}_${this.normalizeString(g.name)}`, g]));

    // For capacity validation in analyze phase
    const sectionIds = sections.map((s: any) => s.id);
    const counts = await prisma.studentEnrollment.groupBy({
      by: ['section_id'],
      where: { section_id: { in: sectionIds }, organization_id: this.organizationId, status: EnrollmentStatus.ACTIVE },
      _count: { student_id: true }
    });
    this.resolved.section_capacities = Object.fromEntries(sections.map((s: any) => [s.id, s.capacity]));
    this.resolved.section_current_counts = Object.fromEntries(counts.map((c: any) => [c.section_id, c._count.student_id]));

    // Fetch existing enrollments to avoid double counting capacity delta
    const userIds = users.map((u: any) => u.id);
    if (userIds.length > 0) {
      const existing = await prisma.studentEnrollment.findMany({
        where: { student_id: { in: userIds }, academic_year_id: this.academicYearId, organization_id: this.organizationId }
      });
      this.resolved.existing_enrollments = Object.fromEntries(existing.map((e: any) => [e.student_id, e]));
    }

    this.sectionAddedCount = {}; // Reset

    return this.resolved;
  }

  async validateRow(row: any): Promise<ValidationResult> {
    const email = this.normalizeString(row.student_email);
    const gradeName = this.normalizeString(row.grade_name);
    const sectionName = this.normalizeString(row.section_name);
    const groupName = this.normalizeString(row.group_name);

    const errors: string[] = [];
    if (!email) errors.push("Missing student_email");
    if (!gradeName) errors.push("Missing grade_name");

    // Intra-file uniqueness check (a student can only be enrolled once per academic year in the file)
    if (email) {
      const uniqueKey = `${email}_${this.academicYearId}`;
      if (this.fileUniqueSet.has(uniqueKey)) {
        errors.push(`Duplicate mapping: Student is mapped multiple times in this file.`);
      }
      this.fileUniqueSet.add(uniqueKey);
    }

    if (errors.length > 0) return { status: 'ERROR', errors, data: row };

    const user = this.resolved.users[email];
    if (!user) errors.push(`Student with email '${row.student_email}' not found or is not a student.`);

    if (!this.academicYearId) errors.push(`Active Academic Year is missing.`);

    const grade = this.resolved.grades[gradeName];
    if (!grade) errors.push(`Grade '${row.grade_name}' not found.`);

    let section: any;
    if (grade && sectionName) {
      section = this.resolved.sections[`${grade.id}_${sectionName}`];
      if (!section) errors.push(`Section '${row.section_name}' does not exist under Grade '${row.grade_name}'.`);
    }

    let group: any;
    if (section && groupName) {
      group = this.resolved.subject_groups[`${section.id}_${groupName}`];
      if (!group) errors.push(`Subject Group '${row.group_name}' does not exist under Section '${row.section_name}'.`);
    } else if (!section && groupName) {
      errors.push(`Cannot assign Subject Group without a valid Section.`);
    }

    // Advanced Validations (Group & Capacity) early in Analyze phase
    if (grade) {
      const groupValidation = await StudentEnrollmentService.validateGroupAssignment(
        this.organizationId, grade.id, section?.id, group?.id
      );
      if (!groupValidation.allowed) {
        errors.push(groupValidation.message || 'Invalid group assignment');
      }
    }

    if (user) {
      const existingEnrollment = this.resolved.existing_enrollments[user.id];
      if (existingEnrollment) {
        if (existingEnrollment.grade_id === grade?.id && existingEnrollment.section_id === section?.id) {
          errors.push(`Student is already enrolled in Grade '${row.grade_name}' and Section '${row.section_name}'.`);
        } else {
          errors.push(`Student is already enrolled in a different Grade/Section in this academic year.`);
        }
      }
    }

    if (section && user) {
      const existingEnrollment = this.resolved.existing_enrollments[user.id];
      const isAlreadyInSection = existingEnrollment && existingEnrollment.section_id === section.id;

      if (!isAlreadyInSection) {
        const cap = this.resolved.section_capacities[section.id];
        if (cap) {
          const current = this.resolved.section_current_counts[section.id] || 0;
          const addedSoFar = this.sectionAddedCount[section.id] || 0;
          if (current + addedSoFar + 1 > cap) {
            errors.push(`Section capacity exceeded (Max: ${cap}, Current: ${current}, Incoming: ${addedSoFar + 1}).`);
          } else {
            this.sectionAddedCount[section.id] = addedSoFar + 1;
          }
        }
      }
    }

    if (errors.length > 0) return { status: 'ERROR', errors, data: row };

    return {
      status: 'VALID',
      data: {
        ...row,
        resolved_student_id: user.id,
        resolved_academic_year_id: this.academicYearId,
        resolved_grade_id: grade.id,
        resolved_section_id: section?.id || null,
        resolved_group_id: group?.id || null
      }
    };
  }

  async commit(validRows: any[], conflictResolutions?: any[]): Promise<CommitResult> {
    const payloads: EnrollmentPayload[] = validRows.map(row => {
      const data = row.data || row;
      return {
        student_id: data.resolved_student_id,
        grade_id: data.resolved_grade_id,
        section_id: data.resolved_section_id,
        subject_group_id: data.resolved_group_id,
        status: EnrollmentStatus.ACTIVE
      };
    });

    try {
      const result = await StudentEnrollmentService.bulkEnrollStudents(
        this.organizationId,
        this.academicYearId,
        payloads
      );
      return { success_count: result.success, failure_count: result.failure };
    } catch (e: any) {
      console.error('[Bulk-StudentEnrollment-Commit] Batch failed:', e);
      // If the batch fails due to a late capacity throw or transaction error
      return { success_count: 0, failure_count: validRows.length };
    }
  }
}
