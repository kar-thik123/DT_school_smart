import { BulkImportProcessor, ResolvedDataMap, ValidationResult, CommitResult } from '../bulk-import.types';
import prisma from '../../../prisma';

export class StudentMappingProcessor implements BulkImportProcessor {
  private resolved: ResolvedDataMap = {
    users: {},
    grades: {},
    sections: {},
    groups: {},
    mappings: []
  };
  private fileUniqueSet: Set<string> = new Set();
  
  constructor(private organizationId: string, private userId: string) {}

  async resolveRelations(rows: any[]): Promise<ResolvedDataMap> {
    // Pre-normalize incoming row keys
    const emails = Array.from(new Set(rows.map((r: any) => r.student_email?.trim().toLowerCase()).filter(Boolean)));
    
    // Fetch all structural records for this org to allow case-insensitive memory mapping
    const [users, grades, sections, groups] = await Promise.all([
      prisma.user.findMany({ 
        where: { organization_id: this.organizationId, email: { in: emails }, role: { name: 'STUDENT' } } 
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

    // Fast mapping indices using forced lowercase for absolute forgiveness
    this.resolved.users = Object.fromEntries(users.map((u: any) => [u.email.toLowerCase(), u]));
    this.resolved.grades = Object.fromEntries(grades.map((g: any) => [g.name.trim().toLowerCase(), g]));
    
    // Composite mapping for names that might overlap across trees
    this.resolved.sections = Object.fromEntries(sections.map((s: any) => [`${s.grade_id}_${s.name.trim().toLowerCase()}`, s]));
    this.resolved.groups = Object.fromEntries(groups.map((g: any) => [`${g.section_id}_${g.name.trim().toLowerCase()}`, g]));
    
    // Query existing mappings for resolved students to handle conflicts
    const studentIds = users.map((u: any) => u.id);
    if (studentIds.length > 0) {
      this.resolved.mappings = await prisma.studentGroupMapping.findMany({
        where: {
          organization_id: this.organizationId,
          student_id: { in: studentIds }
        },
        include: {
          group: {
            include: { grade: true, section: true }
          }
        }
      });
    } else {
      this.resolved.mappings = [];
    }
    
    return this.resolved;
  }

  async validateRow(row: any): Promise<ValidationResult> {
    // 1. Required Fields Validation (Strictly Normalized)
    const rawEmail = row.student_email;
    const rawGrade = row.grade_name;
    const rawSection = row.section_name;
    const rawGroup = row.group_name;

    const email = rawEmail?.trim().toLowerCase();
    const gradeName = rawGrade?.trim().toLowerCase();
    const sectionName = rawSection?.trim().toLowerCase();
    const groupName = rawGroup?.trim().toLowerCase();

    const errors: string[] = [];
    if (!email) errors.push("Missing student_email");
    if (!gradeName) errors.push("Missing grade_name");
    if (!sectionName) errors.push("Missing section_name");
    if (!groupName) errors.push("Missing group_name");

    // 2. Intra-file uniqueness check
    if (email && sectionName) {
      const uniqueKey = `${email}_${sectionName}`;
      if (this.fileUniqueSet.has(uniqueKey)) {
          errors.push(`Duplicate mapping: Student is mapped multiple times in section '${rawSection}' within this file.`);
      }
      this.fileUniqueSet.add(uniqueKey);
    }

    if (errors.length > 0) return { status: 'ERROR', errors, data: row };

    // 3. Relational Existence & Consistency Validation
    const user = this.resolved.users[email];
    if (!user) errors.push(`Student with email '${rawEmail}' not found or is not a student.`);

    const grade = this.resolved.grades[gradeName];
    if (!grade) errors.push(`Grade '${rawGrade}' not found.`);

    let section: any;
    if (grade) {
       section = this.resolved.sections[`${grade.id}_${sectionName}`];
       // Debug Log as requested
       if (!section) {
           console.log({
             input: rawSection,
             normalized: `${grade.id}_${sectionName}`,
             availableSections: Object.keys(this.resolved.sections)
           });
           errors.push(`Section '${rawSection}' does not exist under Grade '${rawGrade}'.`);
       }
    }

    let group: any;
    if (section) {
       group = this.resolved.groups[`${section.id}_${groupName}`];
       if (!group) errors.push(`Subject Group '${rawGroup}' does not exist under Section '${rawSection}'.`);
    }

    if (errors.length > 0) return { status: 'ERROR', errors, data: row };

    const existingMapping = this.resolved.mappings.find((m: any) => 
       m.student_id === user.id && m.group.section_id === section.id
    );

    if (!existingMapping) {
      // Pass resolved core IDs to the raw data block for ultra-fast Commit phase
      return { 
        status: 'VALID', 
        data: {
          ...row,
          resolved_student_id: user.id,
          resolved_group_id: group.id
        }
      };
    }

    if (existingMapping.group_id === group.id) {
       return { status: 'DUPLICATE', data: row, errors: ['Already assigned to this group'] };
    }

    return {
       status: 'CONFLICT',
       data: {
         ...row,
         student_id: user.id,
         student_email: email,
         target_group_id: group.id,
         target_group_name: group.name,
         current_mapping_id: existingMapping.id,
         current_group_name: existingMapping.group.name,
         current_section_name: existingMapping.group.section.name,
         current_grade_name: existingMapping.group.grade.name
       }
    };
  }

  async commit(validRows: any[], conflictResolutions?: { mapping_id: string, action: 'MOVE' | 'SKIP', row: any }[]): Promise<CommitResult> {
    const result = await prisma.$transaction(async (tx: any) => {
      let success = 0;
      let failure = 0;
      
      // Phase 1: Handle conflict resolutions
      if (conflictResolutions && conflictResolutions.length > 0) {
        for (const res of conflictResolutions) {
          if (res.action === 'MOVE' && res.mapping_id && res.row) {
            try {
              // Delete old mapping
              await tx.studentGroupMapping.delete({
                where: { id: res.mapping_id }
              });

              // Create new mapping
              await tx.studentGroupMapping.upsert({
                where: {
                  student_id_group_id: {
                    student_id: res.row.student_id,
                    group_id: res.row.target_group_id
                  }
                },
                update: {}, 
                create: {
                  organization_id: this.organizationId,
                  student_id: res.row.student_id,
                  group_id: res.row.target_group_id
                }
              });
              success++;
            } catch (e) {
              console.error('[Bulk-StudentMapping-Commit] Conflict resolution failed:', e);
              failure++;
            }
          }
          // SKIP actions do nothing
        }
      }

      // Phase 2: Perform discrete isolated upserts across the valid block
      for (const row of validRows) {
        if (!row.resolved_student_id || !row.resolved_group_id) {
          failure++;
          continue;
        }

        try {
          await tx.studentGroupMapping.upsert({
            where: {
              student_id_group_id: {
                student_id: row.resolved_student_id,
                group_id: row.resolved_group_id
              }
            },
            update: {}, // Idempotent execution
            create: {
              organization_id: this.organizationId,
              student_id: row.resolved_student_id,
              group_id: row.resolved_group_id
            }
          });
          success++;
        } catch (e) {
          console.error('[Bulk-StudentMapping-Commit] Row failed:', e);
          failure++;
        }
      }
      return { success, failure };
    });

    return { success_count: result.success, failure_count: result.failure };
  }
}
