import { BulkImportProcessor, ResolvedDataMap, ValidationResult, CommitResult } from '../bulk-import.types';
import prisma from '../../../prisma';
import { EnrollmentStatus } from '@prisma/client';

export class StudentEnrollmentProcessor implements BulkImportProcessor {
  private resolved: ResolvedDataMap = {
    users: {},
    academic_years: {},
    grades: {},
    sections: {},
    subject_groups: {}
  };
  private fileUniqueSet: Set<string> = new Set();
  private sectionAddedCount: Record<string, number> = {};
  
  constructor(private organizationId: string, private userId: string, private academicYearId: string) {}

  async resolveRelations(rows: any[]): Promise<ResolvedDataMap> {
    const emails = Array.from(new Set(rows.map((r: any) => r.student_email?.trim().toLowerCase()).filter(Boolean)));
    
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

    this.resolved.users = Object.fromEntries(users.map((u: any) => [u.email.toLowerCase(), u]));
    this.resolved.academic_years = Object.fromEntries(academicYears.map((ay: any) => [ay.name.trim().toLowerCase(), ay]));
    this.resolved.grades = Object.fromEntries(grades.map((g: any) => [g.name.trim().toLowerCase(), g]));
    this.resolved.sections = Object.fromEntries(sections.map((s: any) => [`${s.grade_id}_${s.name.trim().toLowerCase()}`, s]));
    this.resolved.subject_groups = Object.fromEntries(groups.map((g: any) => [`${g.section_id}_${g.name.trim().toLowerCase()}`, g]));
    
    return this.resolved;
  }

  async validateRow(row: any): Promise<ValidationResult> {
    const email = row.student_email?.trim().toLowerCase();
    const gradeName = row.grade_name?.trim().toLowerCase();
    const sectionName = row.section_name?.trim().toLowerCase();
    const groupName = row.group_name?.trim().toLowerCase();

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
       
       // Note: In real setup, we'd also check capacity here, but for bulk it's complex since we add multiple at once.
       // We can rely on the commit phase for strict limits or accept them with warnings.
    }

    let group: any;
    if (section && groupName) {
       group = this.resolved.subject_groups[`${section.id}_${groupName}`];
       if (!group) errors.push(`Subject Group '${row.group_name}' does not exist under Section '${row.section_name}'.`);
    } else if (!section && groupName) {
       errors.push(`Cannot assign Subject Group without a valid Section.`);
    }

    // Advanced Validations (Group & Capacity) early in Analyze phase
    // TODO: Implement or import StudentEnrollmentService
    /*
    if (grade) {
      const groupValidation = await StudentEnrollmentService.validateGroupAssignment(
        this.organizationId, grade.id, section?.id, group?.id
      );
      if (!groupValidation.allowed) {
        errors.push(groupValidation.message || 'Invalid group assignment');
      }
    }
    */

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
    const payloads = validRows.map(row => {
      const data = row.data || row;
      return {
        student_id: data.resolved_student_id,
        grade_id: data.resolved_grade_id,
        section_id: data.resolved_section_id,
        subject_group_id: data.resolved_group_id,
        status: EnrollmentStatus.ACTIVE
      };
    });

    const result = await prisma.$transaction(async (tx: any) => {
      let success = 0;
      let failure = 0;
      
      for (const row of validRows) {
        if (!row.resolved_student_id || !row.resolved_academic_year_id || !row.resolved_grade_id) {
          failure++;
          continue;
        }

        try {
          await tx.studentEnrollment.upsert({
            where: {
              student_id_academic_year_id_organization_id: {
                student_id: row.resolved_student_id,
                academic_year_id: row.resolved_academic_year_id,
                organization_id: this.organizationId
              }
            },
            update: {
              grade_id: row.resolved_grade_id,
              section_id: row.resolved_section_id,
              subject_group_id: row.resolved_group_id,
              status: EnrollmentStatus.ACTIVE
            },
            create: {
              organization_id: this.organizationId,
              student_id: row.resolved_student_id,
              academic_year_id: row.resolved_academic_year_id,
              grade_id: row.resolved_grade_id,
              section_id: row.resolved_section_id,
              subject_group_id: row.resolved_group_id,
              status: EnrollmentStatus.ACTIVE
            }
          });

          await tx.user.update({
            where: { id: row.resolved_student_id },
            data: { grade_id: row.resolved_grade_id, section_id: row.resolved_section_id }
          });

          success++;
        } catch (e) {
          console.error('[Bulk-StudentEnrollment-Commit] Row failed:', e);
          failure++;
        }
      }
      return { success, failure };
    });

    return { success_count: result.success, failure_count: result.failure };
  }
}
