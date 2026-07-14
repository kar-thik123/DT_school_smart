import prisma from '../../prisma';
import { BulkImportSchema } from '../user-validation.service';

export interface ValidationErrorDetails {
  row: number;
  field: string;
  value: string;
  reason: string;
}

export interface ValidationSummary {
  total: number;
  valid: number;
  invalid: number;
}

export interface UserImportValidationResult {
  processedRows: any[]; // In the exact same order as input rows
  errors: ValidationErrorDetails[];
  summary: ValidationSummary;
  licenseLimit?: number;
  currentActiveCount?: number;
}

export class UserImportValidationService {
  /**
   * Performs comprehensive validation of a batch of user import rows against database constraints,
   * file duplicates, relations, and organization license seat limits.
   */
  static async validateBatch(
    rows: any[],
    organizationId: string,
    isCommit = false
  ): Promise<UserImportValidationResult> {
    const errors: ValidationErrorDetails[] = [];
    const processedRows: any[] = [];

    // 1. Gather all lookup parameters
    const emails = new Set<string>();
    const admissionNumbers = new Set<string>();
    const mobileNumbers = new Set<string>();
    const rollNumbers = new Set<string>();
    const roleNames = new Set<string>();
    const gradeNames = new Set<string>();
    const sectionNames = new Set<string>();

    rows.forEach((row) => {
      const email = (row['Email Address'] || row['Email'] || row.email || '').trim().toLowerCase();
      if (email) emails.add(email);

      const admission = (row['Admission Number'] || row.admission_number || '').trim();
      if (admission) admissionNumbers.add(admission);

      const mobile = (row['Mobile Number'] || row.mobile_number || '').trim();
      if (mobile) mobileNumbers.add(mobile);

      const roll = (row['Roll Number'] || row.roll_number || '').trim();
      if (roll) rollNumbers.add(roll);

      const role = (row['Role'] || row.role || '').trim();
      if (role) roleNames.add(role.toUpperCase());

      const grade = (row['Grade'] || row.grade || '').trim();
      if (grade) gradeNames.add(grade.toUpperCase());

      const section = (row['Section'] || row.section || '').trim();
      if (section) sectionNames.add(section.toUpperCase());
    });

    // 2. Fetch database records in bulk
    const [
      dbUsers,
      dbProfiles,
      dbRollUsers,
      dbRoles,
      dbGrades,
      dbSections,
      org,
      currentActiveCount
    ] = await Promise.all([
      // Existing global users by email
      prisma.user.findMany({
        where: { email: { in: Array.from(emails) } },
        select: { email: true }
      }),
      // Existing profiles by admission/mobile in this tenant
      prisma.studentProfile.findMany({
        where: {
          organization_id: organizationId,
          OR: [
            { admission_number: { in: Array.from(admissionNumbers) } },
            { mobile_number: { in: Array.from(mobileNumbers) } }
          ]
        },
        select: { admission_number: true, mobile_number: true }
      }),
      // Existing users by roll number in this tenant
      prisma.user.findMany({
        where: {
          organization_id: organizationId,
          roll_number: { in: Array.from(rollNumbers) }
        },
        select: { roll_number: true }
      }),
      // Roles: strictly local or global system roles (exclude other tenants)
      prisma.role.findMany({
        where: {
          OR: [
            { organization_id: organizationId },
            { is_system: true, organization_id: null }
          ]
        },
        select: { id: true, name: true }
      }),
      // Grades
      prisma.grade.findMany({
        where: { organization_id: organizationId, name: { in: Array.from(gradeNames) } },
        select: { id: true, name: true }
      }),
      // Sections
      prisma.section.findMany({
        where: { organization_id: organizationId, name: { in: Array.from(sectionNames) } },
        select: { id: true, name: true }
      }),
      // Organization License
      prisma.organization.findUnique({
        where: { id: organizationId },
        include: { license: true }
      }),
      // Active users count
      prisma.user.count({
        where: { organization_id: organizationId, is_active: true }
      })
    ]);

    // 3. Create lookup sets/maps
    const existingEmails = new Set(dbUsers.map((u: any) => u.email.toLowerCase()));
    const existingAdmissions = new Set(dbProfiles.map((p: any) => p.admission_number).filter(Boolean));
    const existingMobiles = new Set(dbProfiles.map((p: any) => p.mobile_number).filter(Boolean));
    const existingRolls = new Set(dbRollUsers.map((u: any) => u.roll_number).filter(Boolean));

    const rolesMap = Object.fromEntries(dbRoles.map((r: any) => [r.name.trim().toUpperCase(), r.id]));
    const gradesMap = Object.fromEntries(dbGrades.map((g: any) => [g.name.trim().toUpperCase(), g.id]));
    const sectionsMap = Object.fromEntries(dbSections.map((s: any) => [s.name.trim().toUpperCase(), s.id]));

    // File-level duplicate tracking
    const fileEmails = new Set<string>();
    const fileAdmissions = new Set<string>();
    const fileMobiles = new Set<string>();
    const fileRolls = new Set<string>();

    const limit = org?.license?.licensed_seats || org?.login_limit || 100;

    // 4. Validate rows iteratively
    rows.forEach((row, index) => {
      const rowNum = index + 1;
      const rowErrors: string[] = [];

      let name = '';
      let email = '';
      let roleName = '';
      let rollNumber = '';
      let admissionNumber = '';
      let mobileNumber = '';
      let password = '';
      let roleId = '';
      let gradeId = '';
      let sectionId = '';

      if (isCommit) {
        // Direct assignment from already resolved payload during commit phase
        name = (row.name || '').trim();
        email = (row.email || '').trim().toLowerCase();
        rollNumber = (row.roll_number || '').trim();
        admissionNumber = (row.admission_number || '').trim();
        mobileNumber = (row.mobile_number || '').trim();
        password = (row.password || '').trim();
        roleId = (row.role_id || '').trim();
        roleName = (row.role_name || row.role || '').trim();
        gradeId = (row.grade_id || '').trim();
        sectionId = (row.section_id || '').trim();
      } else {
        // Normalize row keys for Zod during analyze phase
        const mappedData = {
          name: (row['Name'] || row.name || '').trim(),
          email: (row['Email Address'] || row['Email'] || row.email || '').trim(),
          role: (row['Role'] || row.role || '').trim(),
          roll_number: (row['Roll Number'] || row.roll_number || '').trim(),
          admission_number: (row['Admission Number'] || row.admission_number || '').trim(),
          mobile_number: (row['Mobile Number'] || row.mobile_number || '').trim(),
          password: (row['Password'] || row.password || '').trim()
        };

        const parseResult = BulkImportSchema.safeParse(mappedData);
        if (!parseResult.success) {
          parseResult.error.issues.forEach(issue => {
            const field = issue.path.join('.');
            errors.push({
              row: rowNum,
              field,
              value: (mappedData as any)[field] || '',
              reason: issue.message
            });
            rowErrors.push(issue.message);
          });
          processedRows.push({ status: 'ERROR', errors: rowErrors, data: row });
          return;
        }

        name = parseResult.data.name;
        email = parseResult.data.email;
        roleName = parseResult.data.role || '';
        rollNumber = parseResult.data.roll_number || '';
        admissionNumber = parseResult.data.admission_number || '';
        mobileNumber = parseResult.data.mobile_number || '';
        password = parseResult.data.password || '';
      }

      // File-level Duplicate Validation
      if (email) {
        const cleanEmail = email.toLowerCase();
        if (fileEmails.has(cleanEmail)) {
          const reason = `Duplicate email '${email}' in file.`;
          errors.push({ row: rowNum, field: 'email', value: email, reason });
          rowErrors.push(reason);
        }
        fileEmails.add(cleanEmail);
      }

      if (admissionNumber) {
        if (fileAdmissions.has(admissionNumber)) {
          const reason = `Duplicate admission number '${admissionNumber}' in file.`;
          errors.push({ row: rowNum, field: 'admission_number', value: admissionNumber, reason });
          rowErrors.push(reason);
        }
        fileAdmissions.add(admissionNumber);
      }

      if (mobileNumber) {
        if (fileMobiles.has(mobileNumber)) {
          const reason = `Duplicate mobile number '${mobileNumber}' in file.`;
          errors.push({ row: rowNum, field: 'mobile_number', value: mobileNumber, reason });
          rowErrors.push(reason);
        }
        fileMobiles.add(mobileNumber);
      }

      if (rollNumber) {
        if (fileRolls.has(rollNumber)) {
          const reason = `Duplicate roll number '${rollNumber}' in file.`;
          errors.push({ row: rowNum, field: 'roll_number', value: rollNumber, reason });
          rowErrors.push(reason);
        }
        fileRolls.add(rollNumber);
      }

      // Database-level Duplicate Validation
      if (email && existingEmails.has(email.toLowerCase())) {
        const reason = 'Email already exists.';
        errors.push({ row: rowNum, field: 'email', value: email, reason });
        rowErrors.push(reason);
      }

      if (admissionNumber && existingAdmissions.has(admissionNumber)) {
        const reason = 'Admission Number already exists.';
        errors.push({ row: rowNum, field: 'admission_number', value: admissionNumber, reason });
        rowErrors.push(reason);
      }

      if (mobileNumber && existingMobiles.has(mobileNumber)) {
        const reason = 'Mobile number already exists.';
        errors.push({ row: rowNum, field: 'mobile_number', value: mobileNumber, reason });
        rowErrors.push(reason);
      }

      if (rollNumber && existingRolls.has(rollNumber)) {
        const reason = 'Roll number already exists.';
        errors.push({ row: rowNum, field: 'roll_number', value: rollNumber, reason });
        rowErrors.push(reason);
      }

      // Relationship Validations (Only for Analyze phase)
      if (!isCommit) {
        roleId = roleName ? rolesMap[roleName.trim().toUpperCase()] : '';
        if (roleName && !roleId) {
          const reason = `Role '${roleName}' not found.`;
          errors.push({ row: rowNum, field: 'role', value: roleName, reason });
          rowErrors.push(reason);
        }

        const gradeName = (row['Grade'] || row.grade || '').trim();
        gradeId = gradeName ? gradesMap[gradeName.toUpperCase()] : '';
        if (gradeName && !gradeId) {
          const reason = `Grade '${gradeName}' not found.`;
          errors.push({ row: rowNum, field: 'grade', value: gradeName, reason });
          rowErrors.push(reason);
        }

        const sectionName = (row['Section'] || row.section || '').trim();
        sectionId = sectionName ? sectionsMap[sectionName.toUpperCase()] : '';
        if (sectionName && !sectionId) {
          const reason = `Section '${sectionName}' not found.`;
          errors.push({ row: rowNum, field: 'section', value: sectionName, reason });
          rowErrors.push(reason);
        }
      }

      if (rowErrors.length > 0) {
        processedRows.push({ status: 'ERROR', errors: rowErrors, data: row });
      } else {
        processedRows.push({
          status: 'VALID',
          data: {
            name,
            email,
            password: password || 'changeme123',
            role_id: roleId || null,
            role_name: roleName?.toUpperCase() || null,
            grade_id: gradeId || null,
            section_id: sectionId || null,
            roll_number: rollNumber || null,
            admission_number: admissionNumber || null,
            mobile_number: mobileNumber || null,
            is_active: true
          }
        });
      }
    });

    // 5. License capacity validation against proposed valid rows
    const validRowsCount = processedRows.filter(r => r.status === 'VALID').length;
    const totalValidProposed = currentActiveCount + validRowsCount;
    if (totalValidProposed > limit) {
      const capacityExceededReason = `License exceeded. Limit: ${limit}, Active: ${currentActiveCount}, Trying to add: ${validRowsCount}`;
      
      // Move all valid rows to invalid due to capacity breach
      processedRows.forEach((row) => {
        if (row.status === 'VALID') {
          row.status = 'ERROR';
          row.errors = [capacityExceededReason];
        }
      });
      
      // Push global error details
      errors.push({
        row: 0,
        field: 'license',
        value: '',
        reason: capacityExceededReason
      });
    }

    const finalValidCount = processedRows.filter(r => r.status === 'VALID').length;
    const finalInvalidCount = rows.length - finalValidCount;

    return {
      processedRows,
      errors,
      summary: {
        total: rows.length,
        valid: finalValidCount,
        invalid: finalInvalidCount
      },
      licenseLimit: limit,
      currentActiveCount
    };
  }
}
