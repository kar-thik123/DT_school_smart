import { BulkImportProcessor, ResolvedDataMap, ValidationResult, CommitResult } from '../bulk-import.types';
import prisma from '../../../prisma';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { BulkImportSchema } from '../../user-validation.service';

export class UserProcessor implements BulkImportProcessor {
  private rolesMap: Record<string, string> = {};
  private gradesMap: Record<string, string> = {};
  private sectionsMap: Record<string, string> = {};
  
  private existingEmails = new Set<string>();
  private existingAdmissionNumbers = new Set<string>();
  private existingMobileNumbers = new Set<string>();

  private fileEmails = new Set<string>();
  private fileAdmissionNumbers = new Set<string>();
  private fileMobileNumbers = new Set<string>();

  constructor(private organizationId: string, private userId: string, private academicYearId: string) {}

  async resolveRelations(rows: any[]): Promise<ResolvedDataMap> {
    const roleNames = Array.from(new Set(rows.map(r => r['Role']?.trim() || r.role?.trim()).filter(Boolean)));
    
    // Check for 'Email Address' or 'Email'
    const emails = Array.from(new Set(rows.map(r => r['Email Address']?.trim()?.toLowerCase() || r['Email']?.trim()?.toLowerCase() || r.email?.trim()?.toLowerCase()).filter(Boolean)));
    const admissionNumbers = Array.from(new Set(rows.map(r => r['Admission Number']?.trim() || r.admission_number?.trim()).filter(Boolean)));
    const mobileNumbers = Array.from(new Set(rows.map(r => r['Mobile Number']?.trim() || r.mobile_number?.trim()).filter(Boolean)));

    // Fetch relations sequentially to prevent connection pool spikes
    const roles = await prisma.role.findMany({
      where: {
        OR: [
          { organization_id: this.organizationId },
          { is_system: true }
        ]
      },
      select: { id: true, name: true }
    });

    const globalUsers = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { email: true }
    });

    const studentProfiles = await prisma.studentProfile.findMany({
      where: {
        organization_id: this.organizationId,
        OR: [
          { admission_number: { in: admissionNumbers } },
          { mobile_number: { in: mobileNumbers } }
        ]
      },
      select: { admission_number: true, mobile_number: true }
    });

    const org = await prisma.organization.findUnique({
      where: { id: this.organizationId },
      include: { license: true }
    });

    this.rolesMap = Object.fromEntries(roles.map((r: any) => [r.name.trim().toUpperCase(), r.id]));

    globalUsers.forEach((u: any) => this.existingEmails.add(u.email.toLowerCase()));
    studentProfiles.forEach((sp: any) => {
      if (sp.admission_number) this.existingAdmissionNumbers.add(sp.admission_number);
      if (sp.mobile_number) this.existingMobileNumbers.add(sp.mobile_number);
    });

    return {};
  }

  async validateRow(row: any): Promise<ValidationResult> {
    const errors: string[] = [];
    
    // Normalize keys from CSV for Zod
    const mappedData = {
      name: row['Name']?.trim() || row.name?.trim(),
      email: row['Email Address']?.trim() || row['Email']?.trim() || row.email?.trim(),
      role: row['Role']?.trim() || row.role?.trim(),
      roll_number: row['Roll Number']?.trim() || row.roll_number?.trim(),
      admission_number: row['Admission Number']?.trim() || row.admission_number?.trim(),
      mobile_number: row['Mobile Number']?.trim() || row.mobile_number?.trim(),
      password: row['Password']?.trim() || row.password?.trim()
    };

    const parseResult = BulkImportSchema.safeParse(mappedData);
    if (!parseResult.success) {
      parseResult.error.issues.forEach(issue => {
        errors.push(`${issue.path.join('.')}: ${issue.message}`);
      });
      return { status: 'ERROR', errors, data: row };
    }

    const { name, email, role: roleName, roll_number: rollNumber, admission_number: admissionNumber, mobile_number: mobileNumber, password } = parseResult.data;

    // Duplicate check - File Level
    if (email) {
      if (this.fileEmails.has(email)) errors.push(`Duplicate email '${email}' in file.`);
      this.fileEmails.add(email);
    }
    if (admissionNumber) {
      if (this.fileAdmissionNumbers.has(admissionNumber)) errors.push(`Duplicate admission number '${admissionNumber}' in file.`);
      this.fileAdmissionNumbers.add(admissionNumber);
    }
    if (mobileNumber) {
      if (this.fileMobileNumbers.has(mobileNumber)) errors.push(`Duplicate mobile number '${mobileNumber}' in file.`);
      this.fileMobileNumbers.add(mobileNumber);
    }

    // Duplicate check - Database Level
    if (email && this.existingEmails.has(email)) {
      errors.push(`Email '${email}' already exists globally.`);
    }
    if (admissionNumber && this.existingAdmissionNumbers.has(admissionNumber)) {
      errors.push(`Admission number '${admissionNumber}' already exists in tenant.`);
    }
    if (mobileNumber && this.existingMobileNumbers.has(mobileNumber)) {
      errors.push(`Mobile number '${mobileNumber}' already exists in tenant.`);
    }

    // Relations Validation
    const roleId = roleName ? this.rolesMap[roleName.trim().toUpperCase()] : undefined;
    if (roleName && !roleId) errors.push(`Role '${roleName}' not found or not permitted.`);

    if (errors.length > 0) {
      return { status: 'ERROR', errors, data: row };
    }

    return {
      status: 'VALID',
      data: {
        name,
        email,
        password: password || 'changeme123', // Default for legacy support if optional
        role_id: roleId,
        role_name: roleName?.toUpperCase(),
        roll_number: rollNumber || null,
        admission_number: admissionNumber || null,
        mobile_number: mobileNumber || null,
        is_active: true
      }
    };
  }

  async commit(validRows: any[]): Promise<CommitResult> {
    const org = await prisma.organization.findUnique({
      where: { id: this.organizationId },
      include: { license: true }
    });
    
    const limit = org?.license?.licensed_seats || org?.login_limit || 100;
    const currentActiveCount = await prisma.user.count({ 
      where: { organization_id: this.organizationId, is_active: true } 
    });

    if (currentActiveCount + validRows.length > limit) {
      throw new Error(`License limit exceeded. Tenant allows ${limit} users, currently has ${currentActiveCount}, and tried to import ${validRows.length}.`);
    }

    const startTime = Date.now();
    const BATCH_SIZE = 250;
    console.log(`[User Import] Started for ${validRows.length} total records. Batch size: ${BATCH_SIZE}.`);

    let success = 0;
    let failure = 0;

    // Process in batches of 250
    
    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batch = validRows.slice(i, i + BATCH_SIZE);
      
      try {
        // Pre-hash passwords for the batch (in smaller chunks if needed, but 250 bcrypts in Promise.all is okay, or chunk to 50)
        // Let's chunk bcrypt to 50 to avoid blocking the event loop for too long
        for (let j = 0; j < batch.length; j += 50) {
          const hashBatch = batch.slice(j, j + 50);
          await Promise.all(hashBatch.map(async (row) => {
            row.hashedPassword = await bcrypt.hash(row.password, 10);
            row.generatedId = uuidv4();
          }));
        }

        // Commit batch inside a transaction
        await prisma.$transaction(async (tx: any) => {
          // Prepare User data
          const usersData = batch.map((row: any) => ({
            id: row.generatedId,
            organization_id: this.organizationId,
            name: row.name,
            email: row.email,
            password_hash: row.hashedPassword,
            role_id: row.role_id,
            roll_number: row.roll_number,
            is_active: true
          }));

          // Prepare Student Profile data if applicable
          const studentProfilesData = batch
            .filter((row: any) => row.admission_number || row.mobile_number)
            .map((row: any) => ({
              id: uuidv4(),
              user_id: row.generatedId,
              organization_id: this.organizationId,
              admission_number: row.admission_number,
              mobile_number: row.mobile_number
            }));

          // Insert Users
          await tx.user.createMany({
            data: usersData,
            skipDuplicates: true // batch-level duplicate protection
          });

          // Insert Student Profiles
          if (studentProfilesData.length > 0) {
            await tx.studentProfile.createMany({
              data: studentProfilesData,
              skipDuplicates: true
            });
          }
        });

        success += batch.length;
      } catch (error) {
        console.error('[UserProcessor] Batch commit error:', error);
        failure += batch.length;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[User Import] Completed in ${duration}ms. Success: ${success}, Failure: ${failure}.`);

    return { success_count: success, failure_count: failure };
  }
}
