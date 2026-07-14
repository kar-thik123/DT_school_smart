import { BulkImportProcessor, ResolvedDataMap, ValidationResult, CommitResult } from '../bulk-import.types';
import prisma from '../../../prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { UserImportValidationService } from '../user-import-validation.service';

export class UserProcessor implements BulkImportProcessor {
  private validationResultsMap = new Map<any, ValidationResult>();

  constructor(
    private organizationId: string,
    private userId: string,
    private academicYearId: string
  ) {}

  async resolveRelations(rows: any[]): Promise<ResolvedDataMap> {
    // Perform centralized batch validation
    const result = await UserImportValidationService.validateBatch(rows, this.organizationId, false);

    // Cache the validation result of each row by raw row object reference
    rows.forEach((row, index) => {
      this.validationResultsMap.set(row, result.processedRows[index]);
    });

    return {};
  }

  async validateRow(row: any): Promise<ValidationResult> {
    const cached = this.validationResultsMap.get(row);
    if (cached) return cached;

    // Fallback in case validateRow is called without resolving relations first
    return { status: 'ERROR', errors: ['Row validation not resolved'], data: row };
  }

  async commit(
    validRows: any[],
    conflictResolutions?: any[],
    jobId?: string
  ): Promise<CommitResult> {
    console.log("========== BULK IMPORT PATCH LOADED ==========");
    console.log("Build Timestamp:", new Date().toISOString());

    console.log("STEP 1 Enter commit()");
    console.log("STEP 2 Read cached job. Number of rows:", validRows ? validRows.length : 0);

    let result;
    try {
      console.log("STEP 3 Validate rows");
      result = await UserImportValidationService.validateBatch(
        validRows,
        this.organizationId,
        true
      );
      console.log("STEP 3 SUCCESS");
    } catch (err: any) {
      console.log("STEP 3 FAILED");
      this.logException(err, "UserImportValidationService.validateBatch");
      throw err;
    }

    console.log("STEP 4 License validation");
    let rowsToImport;
    try {
      rowsToImport = result.processedRows.filter(r => r.status === 'VALID').map(r => r.data);
      console.log("STEP 4 SUCCESS");
    } catch (err: any) {
      console.log("STEP 4 FAILED");
      throw err;
    }

    try {
      console.log("STEP 5 Check import length");
      if (rowsToImport.length === 0) {
        const globalError = result.errors.find(e => e.field === 'license')?.reason || 'Import validation failed on commit.';
        const error: any = new Error(globalError);
        error.statusCode = 400;
        throw error;
      }
      console.log("STEP 5 SUCCESS");
    } catch (err: any) {
      console.log("STEP 5 FAILED");
      throw err;
    }

    const BATCH_SIZE = 250;
    let importedCount = 0;
    let skippedCount = 0;
    const skippedReasons: { email: string, reason: string }[] = [];

    for (let i = 0; i < rowsToImport.length; i += BATCH_SIZE) {
      const batch = rowsToImport.slice(i, i + BATCH_SIZE);

      try {
        console.log("STEP 6 Password hashing");
        for (let j = 0; j < batch.length; j += 50) {
          const hashBatch = batch.slice(j, j + 50);
          await Promise.all(
            hashBatch.map(async (row) => {
              row.hashedPassword = await bcrypt.hash(row.password, 10);
              row.generatedId = crypto.randomUUID();
            })
          );
        }
        console.log("STEP 6 SUCCESS");
      } catch (err: any) {
        console.log("STEP 6 FAILED");
        throw err;
      }

      try {
        console.log("STEP 7 Start transaction");
        await prisma.$transaction(async (tx: any) => {
          let rolesWithPermissions;
          try {
            console.log("STEP 8 Fetch roles");
            rolesWithPermissions = await tx.role.findMany({
              where: {
                OR: [
                  { organization_id: this.organizationId },
                  { is_system: true, organization_id: null }
                ]
              },
              include: {
                permissions: {
                  include: { permission: true }
                }
              }
            });
            console.log("STEP 8 SUCCESS");
          } catch (err: any) {
            console.log("STEP 8 FAILED");
            throw err;
          }

          let studentRoleIds;
          try {
            console.log("STEP 9 Map student role IDs");
            studentRoleIds = new Set(
              rolesWithPermissions
                .filter((r: any) =>
                  r.permissions.some(
                    (rp: any) => rp.permission.module === 'IDENTITY' && rp.permission.action === 'IS_STUDENT'
                  )
                )
                .map((r: any) => r.id)
            );
            console.log("STEP 9 SUCCESS");
          } catch (err: any) {
            console.log("STEP 9 FAILED");
            throw err;
          }

          let usersData;
          try {
            console.log("STEP 9.1 Re-resolve roles");
            // Construct current roles map
            const currentRolesMap = new Map<string, string>(
              rolesWithPermissions.map((r: any) => [r.name.trim().toUpperCase(), r.id])
            );

            // Re-resolve roles for each row in the batch using role_name
            for (const row of batch) {
              const roleNameKey = (row.role_name || row.role || '').trim().toUpperCase();
              if (!roleNameKey) {
                const err: any = new Error(`Role name is missing or empty in row. Please run Analyze again.`);
                err.statusCode = 400;
                throw err;
              }

              const resolvedRoleId = currentRolesMap.get(roleNameKey);
              if (!resolvedRoleId) {
                // Log the role not found result
                console.log(`[ROLE RESOLUTION LOG] Job ID: ${jobId || 'N/A'}, Organization ID: ${this.organizationId}, Role Name: ${roleNameKey}, Cached Role ID: ${row.role_id || 'N/A'}, Resolved Role ID: N/A, Result: ROLE NOT FOUND`);
                
                const err: any = new Error(`Role '${roleNameKey}' no longer exists for the active organization. Please run Analyze again.`);
                err.statusCode = 400;
                throw err;
              }

              const cachedRoleId = row.role_id;
              let logResult = 'MATCH';
              if (cachedRoleId !== resolvedRoleId) {
                logResult = 'UPDATED';
                // Update in-memory commit model (refresh cached UUID to latest DB state)
                row.role_id = resolvedRoleId;
              }

              console.log(`[ROLE RESOLUTION LOG] Job ID: ${jobId || 'N/A'}, Organization ID: ${this.organizationId}, Role Name: ${roleNameKey}, Cached Role ID: ${cachedRoleId || 'N/A'}, Resolved Role ID: ${resolvedRoleId}, Result: ${logResult}`);
            }
            console.log("STEP 9.1 SUCCESS");
          } catch (err: any) {
            console.log("STEP 9.1 FAILED");
            throw err;
          }

          try {
            console.log("STEP 10 Map user payloads");
            usersData = batch.map((row: any) => ({
              id: row.generatedId,
              organization_id: this.organizationId,
              name: row.name,
              email: row.email,
              password_hash: row.hashedPassword,
              role_id: row.role_id,
              roll_number: row.roll_number,
              grade_id: row.grade_id,
              section_id: row.section_id,
              is_active: true
            }));
            console.log("STEP 10 SUCCESS");
          } catch (err: any) {
            console.log("STEP 10 FAILED");
            throw err;
          }

          let usersResult;
          try {
            console.log("STEP 11 Create users");
            usersResult = await tx.user.createMany({
              data: usersData,
              skipDuplicates: true
            });
            console.log("STEP 11 SUCCESS");
          } catch (err: any) {
            console.log("STEP 11 FAILED");
            this.logException(err, "tx.user.createMany");
            throw err;
          }

          let dbCreatedUsers;
          try {
            console.log("STEP 12 Resolve inserted users");
            dbCreatedUsers = await tx.user.findMany({
              where: {
                organization_id: this.organizationId,
                email: { in: batch.map((row: any) => row.email) }
              },
              select: { id: true, email: true, role_id: true }
            });
            console.log("STEP 12 SUCCESS");
          } catch (err: any) {
            console.log("STEP 12 FAILED");
            this.logException(err, "tx.user.findMany");
            throw err;
          }

          let studentProfilesData: any[] = [];
          let skippedEmails: string[] = [];
          let insertedUserIds: string[] = [];
          let skippedUserIds: string[] = [];
          let createdUsersMap: any;
          try {
            console.log("STEP 13 Prepare student profiles");
            createdUsersMap = new Map<string, { id: string, role_id: string }>(
              dbCreatedUsers.map((u: any) => [u.email.toLowerCase(), { id: u.id, role_id: u.role_id }])
            );

            batch.forEach((row: any) => {
              const userMeta = createdUsersMap.get(row.email.toLowerCase());
              if (userMeta) {
                importedCount++;
                insertedUserIds.push(userMeta.id);
                if (studentRoleIds.has(userMeta.role_id) && (row.admission_number || row.mobile_number)) {
                  studentProfilesData.push({
                    id: crypto.randomUUID(),
                    user_id: userMeta.id,
                    organization_id: this.organizationId,
                    admission_number: row.admission_number || null,
                    mobile_number: row.mobile_number || null
                  });
                }
              } else {
                skippedCount++;
                skippedEmails.push(row.email);
                skippedUserIds.push(row.generatedId);
                skippedReasons.push({
                  email: row.email,
                  reason: 'User creation skipped (duplicate email or conflict)'
                });
              }
            });
            console.log("STEP 13 SUCCESS");
          } catch (err: any) {
            console.log("STEP 13 FAILED");
            throw err;
          }

          try {
            console.log("STEP 14 Create student profiles");
            if (studentProfilesData.length > 0) {
              await tx.studentProfile.createMany({
                data: studentProfilesData,
                skipDuplicates: true
              });
            }
            console.log("STEP 14 SUCCESS");
          } catch (err: any) {
            console.log("STEP 14 FAILED");
            this.logException(err, "tx.studentProfile.createMany");
            throw err;
          }
        });
        console.log("STEP 7 SUCCESS");
      } catch (err: any) {
        console.log("STEP 7 FAILED");
        throw err;
      }
    }

    console.log("STEP 15 Return response");
    return {
      success_count: importedCount,
      failure_count: skippedCount,
      imported_count: importedCount,
      skipped_count: skippedCount,
      skipped_reasons: skippedReasons
    };
  }

  private logException(error: any, blockName: string) {
    const stack = error.stack || '';
    const lines = stack.split('\n');
    let file = 'Unknown';
    let func = 'Unknown';
    let lineNo = 'Unknown';

    for (let idx = 1; idx < lines.length; idx++) {
      const match = lines[idx].match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/) || lines[idx].match(/at\s+(.+?):(\d+):(\d+)/);
      if (match) {
        const possiblePath = match[2] || match[1];
        if (possiblePath.includes('backend/src') || possiblePath.includes('backend\\src') || possiblePath.includes('user.processor.ts')) {
          func = match[2] ? match[1] : 'Anonymous';
          file = possiblePath;
          lineNo = match[2] ? match[3] : match[2];
          break;
        }
      }
    }

    console.error(`========== EXCEPTION IN ${blockName} ==========`);
    console.error(`  - Exception Type: ${error.name || error.constructor.name || 'Error'}`);
    console.error(`  - Exception Message: ${error.message}`);
    console.error(`  - Prisma Error Code: ${error.code || 'N/A'}`);
    console.error(`  - SQL Constraint: ${error.meta?.constraint || 'N/A'}`);
    console.error(`  - File: ${file}`);
    console.error(`  - Function: ${func}`);
    console.error(`  - Line Number: ${lineNo}`);
    console.error(`  - Full Stack Trace:\n${stack}`);
    console.error(`===============================================`);
  }
}
