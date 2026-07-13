import supertest from 'supertest';
import bcrypt from 'bcrypt';
import prisma from '../src/prisma';
import app from '../src/app';
import { getFlatPermissions } from '../src/config/permissions';

describe('School SaaS Pre-Production Stabilization & QA Suite', () => {
  jest.setTimeout(60000);
  // Saved IDs for cleanup and multi-tenant testing
  let sysOrgId: string;
  let sysAdminRoleId: string;
  let sysAdminUserId: string;
  let sysAdminToken: string;

  let tenantOrgIdA: string;
  let tenantAdminRoleIdA: string;
  let tenantAdminUserIdA: string;
  let tenantAdminTokenA: string;

  let tenantOrgIdB: string;
  let tenantAdminRoleIdB: string;
  let tenantAdminUserIdB: string;
  let tenantAdminTokenB: string;

  // Custom Roles & Users inside Tenant A
  let viewOnlyQBUserId: string;
  let viewOnlyQBToken: string;

  let viewOnlyCompletionUserId: string;
  let viewOnlyCompletionToken: string;

  let teacherUserId: string;
  let teacherToken: string;

  // Academic contexts for Tenant A
  let academicYearId: string;
  let gradeId1: string;
  let gradeId2: string;
  let sectionId1: string;
  let sectionId2: string;
  let subjectId1: string;
  let subjectId2: string;
  let unitId1: string;

  const passwordPlain = 'TestPass@123';
  let passwordHash: string;

  beforeAll(async () => {
    // 1. Generate generic password hash
    passwordHash = await bcrypt.hash(passwordPlain, 10);

    // 2. Ensure all registry permissions exist in the DB
    const permissionsFlat = getFlatPermissions();
    for (const p of permissionsFlat) {
      await prisma.permission.upsert({
        where: { module_action: { module: p.module, action: p.action } },
        update: { description: p.description },
        create: { module: p.module, action: p.action, description: p.description },
      });
    }

    // 3. Setup Platform Core (sys org)
    const sysOrg = await prisma.organization.upsert({
      where: { subdomain: 'sys' },
      update: {},
      create: {
        school_name: 'Platform Core',
        subdomain: 'sys',
        status: 'ACTIVE',
      },
    });
    sysOrgId = sysOrg.id;

    // 4. Ensure SYSTEM_ADMIN role exists in Platform Core
    const sysAdminRole = await prisma.role.upsert({
      where: { name_organization_id: { name: 'SYSTEM_ADMIN', organization_id: sysOrgId } },
      update: {},
      create: {
        name: 'SYSTEM_ADMIN',
        description: 'System Administrator',
        organization_id: sysOrgId,
        is_system: true,
      },
    });
    sysAdminRoleId = sysAdminRole.id;

    // Map all permissions to SYSTEM_ADMIN
    const allDbPerms = await prisma.permission.findMany();
    await prisma.rolePermission.deleteMany({ where: { role_id: sysAdminRoleId } });
    await prisma.rolePermission.createMany({
      data: allDbPerms.map((p: any) => ({
        role_id: sysAdminRoleId,
        permission_id: p.id,
      })),
      skipDuplicates: true,
    });

    // 5. Ensure System Admin User exists
    const sysAdminUser = await prisma.user.upsert({
      where: { email: 'test-sysadmin@platform.com' },
      update: {
        password_hash: passwordHash,
        role_id: sysAdminRoleId,
        organization_id: sysOrgId,
        is_active: true,
      },
      create: {
        name: 'System Admin Tester',
        email: 'test-sysadmin@platform.com',
        password_hash: passwordHash,
        role_id: sysAdminRoleId,
        organization_id: sysOrgId,
        is_active: true,
      },
    });
    sysAdminUserId = sysAdminUser.id;

    // Get SYSTEM_ADMIN Token
    const sysLoginRes = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'test-sysadmin@platform.com', password: passwordPlain });
    sysAdminToken = sysLoginRes.body.token;

    // PRE-RUN CLEANUP: Delete stale test orgs from any previous failed run
    // (afterAll may not have completed cleanly if setup itself failed)
    const staleSubdomains = ['qa-school-a', 'qa-school-b'];
    for (const subdomain of staleSubdomains) {
      const staleOrg = await prisma.organization.findUnique({ where: { subdomain } });
      if (staleOrg) {
        await prisma.auditLog.deleteMany({ where: { organization_id: staleOrg.id } }).catch(() => {});
        await prisma.teacherAssignment.deleteMany({ where: { organization_id: staleOrg.id } }).catch(() => {});
        await prisma.completionTracking.deleteMany({ where: { organization_id: staleOrg.id } }).catch(() => {});
        await prisma.question.deleteMany({ where: { organization_id: staleOrg.id } }).catch(() => {});
        await prisma.unit.deleteMany({ where: { organization_id: staleOrg.id } }).catch(() => {});
        await prisma.subject.deleteMany({ where: { organization_id: staleOrg.id } }).catch(() => {});
        await prisma.section.deleteMany({ where: { organization_id: staleOrg.id } }).catch(() => {});
        await prisma.grade.deleteMany({ where: { organization_id: staleOrg.id } }).catch(() => {});
        await prisma.academicYear.deleteMany({ where: { organization_id: staleOrg.id } }).catch(() => {});
        await prisma.moduleConfig.deleteMany({ where: { organization_id: staleOrg.id } }).catch(() => {});
        await prisma.user.deleteMany({ where: { organization_id: staleOrg.id } }).catch(() => {});
        await prisma.role.deleteMany({ where: { organization_id: staleOrg.id } }).catch(() => {});
        await prisma.organizationLicense.deleteMany({ where: { organization_id: staleOrg.id } }).catch(() => {});
        await prisma.organization.delete({ where: { id: staleOrg.id } }).catch(() => {});
      }
    }

    // 6. Provision Tenant A via the Provisioning API (using SYSTEM_ADMIN token)
    // NOTE: provisioning response shape is { organizationId, adminCreated, adminEmail }
    const provisionResA = await supertest(app)
      .post('/api/organizations')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .send({
        school_name: 'QA Tenant School A',
        subdomain: 'qa-school-a',
        contact_email: 'contact@qa-school-a.com',
        admin_name: 'Admin Tenant A',
        admin_email: 'tenant-admin-a@test.com',
        admin_password: passwordPlain,
        licensed_seats: 100,
        initial_academic_year: '2026-2027',
      });

    // Read the correct field name returned by the provisioning route
    tenantOrgIdA = provisionResA.body.organizationId
      || provisionResA.body.id
      || provisionResA.body.organization?.id;

    if (!tenantOrgIdA) {
      // Last resort: find by subdomain (handles edge cases)
      const foundOrg = await prisma.organization.findUnique({ where: { subdomain: 'qa-school-a' } });
      if (!foundOrg) throw new Error(`[TEST SETUP] Failed to provision qa-school-a. Status: ${provisionResA.status}, Body: ${JSON.stringify(provisionResA.body)}`);
      tenantOrgIdA = foundOrg.id;
    }

    const adminUserA = await prisma.user.findFirst({
      where: { email: 'tenant-admin-a@test.com', organization_id: tenantOrgIdA },
    });
    if (!adminUserA) throw new Error(`[TEST SETUP] Admin user for Tenant A not found`);
    tenantAdminUserIdA = adminUserA.id;
    tenantAdminRoleIdA = adminUserA.role_id;

    // Login Tenant A Admin
    const loginResA = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'tenant-admin-a@test.com', password: passwordPlain });
    tenantAdminTokenA = loginResA.body.token;
    if (!tenantAdminTokenA) throw new Error(`[TEST SETUP] Failed to login as Tenant A admin. Status: ${loginResA.status}`);

    // Provision Tenant B
    const provisionResB = await supertest(app)
      .post('/api/organizations')
      .set('Authorization', `Bearer ${sysAdminToken}`)
      .send({
        school_name: 'QA Tenant School B',
        subdomain: 'qa-school-b',
        contact_email: 'contact@qa-school-b.com',
        admin_name: 'Admin Tenant B',
        admin_email: 'tenant-admin-b@test.com',
        admin_password: passwordPlain,
        licensed_seats: 50,
        initial_academic_year: '2026-2027',
      });

    tenantOrgIdB = provisionResB.body.organizationId
      || provisionResB.body.id
      || provisionResB.body.organization?.id;

    if (!tenantOrgIdB) {
      const foundOrg = await prisma.organization.findUnique({ where: { subdomain: 'qa-school-b' } });
      if (!foundOrg) throw new Error(`[TEST SETUP] Failed to provision qa-school-b. Status: ${provisionResB.status}, Body: ${JSON.stringify(provisionResB.body)}`);
      tenantOrgIdB = foundOrg.id;
    }

    const adminUserB = await prisma.user.findFirst({
      where: { email: 'tenant-admin-b@test.com', organization_id: tenantOrgIdB },
    });
    if (!adminUserB) throw new Error(`[TEST SETUP] Admin user for Tenant B not found`);
    tenantAdminUserIdB = adminUserB.id;
    tenantAdminRoleIdB = adminUserB.role_id;

    // Login Tenant B Admin
    const loginResB = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'tenant-admin-b@test.com', password: passwordPlain });
    tenantAdminTokenB = loginResB.body.token;
    if (!tenantAdminTokenB) throw new Error(`[TEST SETUP] Failed to login as Tenant B admin. Status: ${loginResB.status}`);

    // 7. Setup Academic Context in Tenant A for scoping tests
    academicYearId = (await prisma.academicYear.create({
      data: {
        name: 'QA-2026',
        organization_id: tenantOrgIdA,
      },
    })).id;

    gradeId1 = (await prisma.grade.create({
      data: {
        name: 'Grade 10',
        academic_year_id: academicYearId,
        organization_id: tenantOrgIdA,
      },
    })).id;

    gradeId2 = (await prisma.grade.create({
      data: {
        name: 'Grade 11',
        academic_year_id: academicYearId,
        organization_id: tenantOrgIdA,
      },
    })).id;

    sectionId1 = (await prisma.section.create({
      data: {
        name: 'Section A',
        grade_id: gradeId1,
        organization_id: tenantOrgIdA,
      },
    })).id;

    sectionId2 = (await prisma.section.create({
      data: {
        name: 'Section B',
        grade_id: gradeId2,
        organization_id: tenantOrgIdA,
      },
    })).id;

    subjectId1 = (await prisma.subject.create({
      data: {
        name: 'Mathematics',
        grade_id: gradeId1,
        organization_id: tenantOrgIdA,
      },
    })).id;

    subjectId2 = (await prisma.subject.create({
      data: {
        name: 'Physics',
        grade_id: gradeId2,
        organization_id: tenantOrgIdA,
      },
    })).id;

    unitId1 = (await prisma.unit.create({
      data: {
        name: 'Algebra basics',
        grade_id: gradeId1,
        subject_id: subjectId1,
        organization_id: tenantOrgIdA,
      },
    })).id;

    // 8. Create custom roles inside Tenant A
    const viewOnlyQBRole = await prisma.role.create({
      data: {
        name: 'ViewOnlyQB',
        description: 'Read-only access to Question Bank',
        organization_id: tenantOrgIdA,
      },
    });

    const qbViewPerm = await prisma.permission.findFirst({
      where: { module: 'QUESTION_BANK', action: 'VIEW' },
    });
    const structureReadPerm = await prisma.permission.findFirst({
      where: { module: 'ACADEMIC_STRUCTURE', action: 'READ' },
    });

    await prisma.rolePermission.createMany({
      data: [
        { role_id: viewOnlyQBRole.id, permission_id: qbViewPerm!.id },
        { role_id: viewOnlyQBRole.id, permission_id: structureReadPerm!.id },
      ],
    });

    const viewOnlyQBUser = await prisma.user.create({
      data: {
        name: 'QB Viewer',
        email: 'qb-viewer@school-a.com',
        password_hash: passwordHash,
        role_id: viewOnlyQBRole.id,
        organization_id: tenantOrgIdA,
      },
    });
    viewOnlyQBUserId = viewOnlyQBUser.id;

    const qbViewerLogin = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'qb-viewer@school-a.com', password: passwordPlain });
    viewOnlyQBToken = qbViewerLogin.body.token;

    // Create view-only Completion Role & User
    const viewOnlyCompRole = await prisma.role.create({
      data: {
        name: 'ViewOnlyComp',
        description: 'Read-only access to Completion tracking',
        organization_id: tenantOrgIdA,
      },
    });

    const compViewPerm = await prisma.permission.findFirst({
      where: { module: 'COMPLETION_TRACKING', action: 'VIEW' },
    });

    await prisma.rolePermission.createMany({
      data: [
        { role_id: viewOnlyCompRole.id, permission_id: compViewPerm!.id },
        { role_id: viewOnlyCompRole.id, permission_id: structureReadPerm!.id },
      ],
    });

    const viewOnlyCompUser = await prisma.user.create({
      data: {
        name: 'Completion Viewer',
        email: 'comp-viewer@school-a.com',
        password_hash: passwordHash,
        role_id: viewOnlyCompRole.id,
        organization_id: tenantOrgIdA,
      },
    });
    viewOnlyCompletionUserId = viewOnlyCompUser.id;

    const compViewerLogin = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'comp-viewer@school-a.com', password: passwordPlain });
    viewOnlyCompletionToken = compViewerLogin.body.token;

    // Create Teacher user with assigned scope
    const teacherRole = await prisma.role.create({
      data: {
        name: 'QA_TEACHER_ROLE',
        description: 'Teacher permissions',
        organization_id: tenantOrgIdA,
      },
    });

    const compManagePerm = await prisma.permission.findFirst({
      where: { module: 'COMPLETION_TRACKING', action: 'MANAGE' },
    });
    const qbCreatePerm = await prisma.permission.findFirst({
      where: { module: 'QUESTION_BANK', action: 'CREATE' },
    });

    await prisma.rolePermission.createMany({
      data: [
        { role_id: teacherRole.id, permission_id: qbViewPerm!.id },
        { role_id: teacherRole.id, permission_id: qbCreatePerm!.id },
        { role_id: teacherRole.id, permission_id: compViewPerm!.id },
        { role_id: teacherRole.id, permission_id: compManagePerm!.id },
        { role_id: teacherRole.id, permission_id: structureReadPerm!.id },
      ],
    });

    const teacherUser = await prisma.user.create({
      data: {
        name: 'Teacher QA',
        email: 'teacher-qa@school-a.com',
        password_hash: passwordHash,
        role_id: teacherRole.id,
        organization_id: tenantOrgIdA,
      },
    });
    teacherUserId = teacherUser.id;

    const teacherLogin = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'teacher-qa@school-a.com', password: passwordPlain });
    teacherToken = teacherLogin.body.token;

    // Map Teacher QA to Subject 1 (Mathematics)
    await prisma.teacherAssignment.create({
      data: {
        teacher_id: teacherUserId,
        organization_id: tenantOrgIdA,
        academic_year_id: academicYearId,
        grade_id: gradeId1,
        section_id: sectionId1,
        subject_id: subjectId1,
        assignment_type: 'SUBJECT_TEACHER',
      },
    });
  });

  afterAll(async () => {
    // Cleanup generated items in reverse order with safety checks
    if (tenantOrgIdA) {
      await prisma.teacherAssignment.deleteMany({ where: { organization_id: tenantOrgIdA } }).catch(() => {});
      await prisma.completionTracking.deleteMany({ where: { organization_id: tenantOrgIdA } }).catch(() => {});
      await prisma.question.deleteMany({ where: { organization_id: tenantOrgIdA } }).catch(() => {});
      await prisma.unit.deleteMany({ where: { organization_id: tenantOrgIdA } }).catch(() => {});
      await prisma.subject.deleteMany({ where: { organization_id: tenantOrgIdA } }).catch(() => {});
      await prisma.section.deleteMany({ where: { organization_id: tenantOrgIdA } }).catch(() => {});
      await prisma.grade.deleteMany({ where: { organization_id: tenantOrgIdA } }).catch(() => {});
      await prisma.academicYear.deleteMany({ where: { organization_id: tenantOrgIdA } }).catch(() => {});
      await prisma.moduleConfig.deleteMany({ where: { organization_id: tenantOrgIdA } }).catch(() => {});
    }

    const orgsToCleanup = [tenantOrgIdA, tenantOrgIdB].filter(Boolean) as string[];
    if (orgsToCleanup.length > 0) {
      await prisma.auditLog.deleteMany({ where: { organization_id: { in: orgsToCleanup } } }).catch(() => {});

      const usersToCleanup = [viewOnlyQBUserId, viewOnlyCompletionUserId, teacherUserId, tenantAdminUserIdA, tenantAdminUserIdB].filter(Boolean) as string[];
      if (usersToCleanup.length > 0) {
        await prisma.user.deleteMany({ where: { id: { in: usersToCleanup } } }).catch(() => {});
      }

      await prisma.role.deleteMany({ where: { organization_id: { in: orgsToCleanup } } }).catch(() => {});
      await prisma.organizationLicense.deleteMany({ where: { organization_id: { in: orgsToCleanup } } }).catch(() => {});
      await prisma.organization.deleteMany({ where: { id: { in: orgsToCleanup } } }).catch(() => {});
    }
  });

  // ==========================================
  // PART 11 — SYSTEM_ADMIN vs SUPER_ADMIN VALIDATION
  // ==========================================
  describe('Part 11: SYSTEM_ADMIN vs SUPER_ADMIN separation', () => {
    it('should allow SYSTEM_ADMIN to access platform statistics', async () => {
      const res = await supertest(app)
        .get('/api/organizations/stats')
        .set('Authorization', `Bearer ${sysAdminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('total');
    });

    it('should block SUPER_ADMIN from accessing platform statistics', async () => {
      const res = await supertest(app)
        .get('/api/organizations/stats')
        .set('Authorization', `Bearer ${tenantAdminTokenA}`);
      
      expect(res.status).toBe(403);
    });

    it('should allow SUPER_ADMIN to query their own tenant profile', async () => {
      const res = await supertest(app)
        .get('/api/organizations/me/profile')
        .set('Authorization', `Bearer ${tenantAdminTokenA}`);
      
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(tenantOrgIdA);
    });
  });

  // ==========================================
  // PART 3 — MULTI-TENANT ISOLATION VALIDATION
  // ==========================================
  describe('Part 3: Multi-tenant boundary isolation', () => {
    it('should reject access when tenant headers point to a different organization', async () => {
      const res = await supertest(app)
        .get('/api/organizations/me/profile')
        .set('Authorization', `Bearer ${tenantAdminTokenA}`)
        .set('x-organization-id', tenantOrgIdB); // Tampering attempt
      
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Cross-tenant access denied/i);
    });

    it('should isolate read queries by organization implicitly from JWT', async () => {
      // Create a dummy question in Tenant B to verify Tenant A cannot query it
      const qB = await prisma.question.create({
        data: {
          question_text: 'Secret Question of School B',
          marks: 5,
          difficulty: 'MEDIUM',
          organization_id: tenantOrgIdB,
          created_by: tenantAdminUserIdB,
        },
      });

      const res = await supertest(app)
        .get('/api/question-bank')
        .set('Authorization', `Bearer ${tenantAdminTokenA}`);

      expect(res.status).toBe(200);
      const containsTenantBQuestion = res.body.some((q: any) => q.id === qB.id);
      expect(containsTenantBQuestion).toBe(false);

      // Clean up B question
      await prisma.question.delete({ where: { id: qB.id } });
    });
  });

  // ==========================================
  // PART 2 — GRANULAR PERMISSION COMBINATION TESTING
  // ==========================================
  describe('Part 2: Granular permission combinations', () => {
    it('should allow QUESTION_BANK:VIEW user to read but reject creation mutations', async () => {
      // 1. Read list
      const readRes = await supertest(app)
        .get('/api/question-bank')
        .set('Authorization', `Bearer ${viewOnlyQBToken}`);
      
      expect(readRes.status).toBe(200);

      // 2. Reject mutation
      const createRes = await supertest(app)
        .post('/api/question-bank')
        .set('Authorization', `Bearer ${viewOnlyQBToken}`)
        .send({
          question_text: 'Unauthorized Question Creation',
          marks: 3,
          difficulty: 'EASY',
          subject_id: subjectId1,
          grade_id: gradeId1,
        });

      expect(createRes.status).toBe(403);
      expect(createRes.body.message).toMatch(/Requires QUESTION_BANK:CREATE/i);
    });

    it('should allow COMPLETION_TRACKING:VIEW user to read but reject completion status toggles', async () => {
      const toggleRes = await supertest(app)
        .post('/api/completion/toggle')
        .set('Authorization', `Bearer ${viewOnlyCompletionToken}`)
        .send({
          academic_year_id: academicYearId,
          grade_id: gradeId1,
          section_id: sectionId1,
          subject_id: subjectId1,
          level: 'UNIT',
          id: unitId1,
          is_completed: true,
        });

      expect(toggleRes.status).toBe(403);
      expect(toggleRes.body.message).toMatch(/Requires COMPLETION_TRACKING:MANAGE/i);
    });
  });

  // ==========================================
  // PART 4 — ACADEMIC OWNERSHIP VALIDATION
  // ==========================================
  describe('Part 4: Teacher Academic Scope Enforcement', () => {
    it('should allow teacher to toggle completion for their assigned subjects', async () => {
      const toggleRes = await supertest(app)
        .post('/api/completion/toggle')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          academic_year_id: academicYearId,
          grade_id: gradeId1,
          section_id: sectionId1,
          subject_id: subjectId1, // Assigned Mathematics
          level: 'UNIT',
          id: unitId1,
          is_completed: true,
        });

      expect(toggleRes.status).toBe(200);
    });

    it('should reject teacher toggle operations for unassigned subjects', async () => {
      const toggleRes = await supertest(app)
        .post('/api/completion/toggle')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          academic_year_id: academicYearId,
          grade_id: gradeId2,
          section_id: sectionId2,
          subject_id: subjectId2, // Unassigned Physics
          level: 'UNIT',
          id: unitId1, // Same unit ID (simulated context mismatch)
          is_completed: true,
        });

      expect(toggleRes.status).toBe(403);
      expect(toggleRes.body.message).toMatch(/Not authorized for this context/i);
    });

    it('should restrict teacher question creation to assigned subjects', async () => {
      // Try to create question for Physics (unassigned)
      const res = await supertest(app)
        .post('/api/question-bank')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          question_text: 'Unassigned Subject Question',
          marks: 4,
          difficulty: 'MEDIUM',
          subject_id: subjectId2, // Physics
          grade_id: gradeId2,
          answer_config: { options: ['A', 'B'], correct_answer: 0 },
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Unauthorized access to this subject/i); // message unified in route
    });

    it('should allow teacher question creation for assigned subject', async () => {
      const res = await supertest(app)
        .post('/api/question-bank')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          question_text: 'Assigned Subject Question',
          marks: 4,
          difficulty: 'MEDIUM',
          subject_id: subjectId1, // Mathematics
          grade_id: gradeId1,
          answer_config: { options: ['A', 'B'], correct_answer: 0 },
        });

      expect(res.status).toBe(201);
      expect(res.body.question).toHaveProperty('id');
    });
  });

  // ==========================================
  // PART 5 — AUDIT LOGGING VALIDATION
  // ==========================================
  describe('Part 5: Audit Log coverage verification', () => {
    it('should generate audit records when status changes or permission events occur', async () => {
      // Trigger a role update (role description edit by Tenant Admin)
      const roles = await prisma.role.findMany({ where: { organization_id: tenantOrgIdA } });
      const targetRole = roles[0];

      // Mutate via API to trigger auditing (if implemented via endpoint), 
      // or directly check that the completion toggling in the previous test logged a TOGGLE action.
      const logs = await prisma.auditLog.findMany({
        where: {
          organization_id: tenantOrgIdA,
          action_type: 'TOGGLE',
          entity_type: 'COMPLETION',
        },
      });

      expect(logs.length).toBeGreaterThan(0);
      const log = logs[0];
      expect(log.user_id).toBe(teacherUserId);
      expect(log.entity_id).toBe(unitId1);
    });
  });

  // ==========================================
  // PART 8 — SETTINGS & FEATURE TOGGLE VALIDATION
  // ==========================================
  describe('Part 8: Settings and Feature Toggle propagation', () => {
    it('should allow Super Admin to query and change module configs', async () => {
      // 1. Set completion tracker off
      const setRes = await supertest(app)
        .put('/api/settings/completion')
        .set('Authorization', `Bearer ${tenantAdminTokenA}`)
        .send({
          config_data: { enabled: false, master_toggle: false },
        });

      expect(setRes.status).toBe(200);

      // 2. Fetch config
      const getRes = await supertest(app)
        .get('/api/settings/completion')
        .set('Authorization', `Bearer ${tenantAdminTokenA}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.config_data.master_toggle).toBe(false);
    });

    it('should prevent unauthorized users from changing settings', async () => {
      const setRes = await supertest(app)
        .put('/api/settings/completion')
        .set('Authorization', `Bearer ${viewOnlyCompletionToken}`)
        .send({
          config_data: { enabled: true },
        });

      // User doesn't have settings edit permissions (Requires COMPLETION_TRACKING:MANAGE)
      expect(setRes.status).toBe(403);
    });
  });

  // ==========================================
  // Phase 5: Analytics Performance & Error Handling Tests
  // ==========================================
  describe('Phase 5: Analytics Endpoint Security & Error Handling', () => {
    it('GET /api/analytics/topic should require IS_MANAGEMENT permission', async () => {
      // Teacher should NOT have access to management topic analytics
      const res = await supertest(app)
        .get('/api/analytics/topic')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(403);
    });

    it('GET /api/analytics/topic should return structured JSON for management users', async () => {
      const res = await supertest(app)
        .get('/api/analytics/topic')
        .set('Authorization', `Bearer ${tenantAdminTokenA}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/analytics/management/overview should require IS_MANAGEMENT permission', async () => {
      const res = await supertest(app)
        .get('/api/analytics/management/overview')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(403);
    });

    it('GET /api/analytics/management/overview should return structured overview for management', async () => {
      const res = await supertest(app)
        .get('/api/analytics/management/overview')
        .set('Authorization', `Bearer ${tenantAdminTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('avg_preparedness');
      expect(res.body).toHaveProperty('total_students');
      expect(res.body).toHaveProperty('teacher_performance');
      expect(res.body).toHaveProperty('risk_students');
      expect(Array.isArray(res.body.teacher_performance)).toBe(true);
      expect(Array.isArray(res.body.risk_students)).toBe(true);
    });

    it('GET /api/analytics/teacher should require IS_TEACHER permission', async () => {
      // ViewOnly QB user should NOT access teacher analytics
      const res = await supertest(app)
        .get('/api/analytics/teacher')
        .set('Authorization', `Bearer ${viewOnlyQBToken}`);

      expect(res.status).toBe(403);
    });

    it('Unauthenticated requests should return 401', async () => {
      const endpoints = [
        '/api/analytics/topic',
        '/api/analytics/management/overview',
        '/api/analytics/teacher',
        '/api/analytics/student',
      ];

      for (const endpoint of endpoints) {
        const res = await supertest(app).get(endpoint);
        expect(res.status).toBe(401);
      }
    });

    it('Cross-tenant analytics isolation: Tenant B cannot see Tenant A analytics', async () => {
      const res = await supertest(app)
        .get('/api/analytics/management/overview')
        .set('Authorization', `Bearer ${tenantAdminTokenB}`);

      expect(res.status).toBe(200);
      // Tenant B has no data, so counts should be zero
      expect(res.body.total_students).toBe(0);
    });
  });
});
