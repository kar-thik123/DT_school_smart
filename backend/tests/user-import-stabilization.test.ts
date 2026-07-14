import supertest from 'supertest';
import bcrypt from 'bcrypt';
import prisma from '../src/prisma';
import app from '../src/app';

describe('Bulk User Import Stabilization Patch Suite', () => {
  jest.setTimeout(45000);

  let orgId: string;
  let adminRoleId: string;
  let teacherRoleId: string;
  let studentRoleId: string;
  let adminUserId: string;
  let adminToken: string;
  let testUserIds: string[] = [];

  const passwordPlain = 'StabilizeTest@123';
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(passwordPlain, 10);

    // 1. Setup isolated organization
    const org = await prisma.organization.create({
      data: {
        school_name: 'Import Stabilization School',
        subdomain: `import-stabilization-${Date.now()}`,
        status: 'ACTIVE',
        domain_type: 'PLATFORM_DOMAIN',
        login_limit: 5 // Low limit to test license exceeded limits
      }
    });
    orgId = org.id;

    // Create low limit organization license
    await prisma.organizationLicense.create({
      data: {
        organization_id: orgId,
        licensed_seats: 5, // Match login_limit
        status: 'ACTIVE',
        grace_period_days: 7,
        warning_threshold: 80
      }
    });

    // 2. Create Roles
    // SUPER_ADMIN
    const adminRole = await prisma.role.create({
      data: {
        name: 'SUPER_ADMIN',
        description: 'Super Admin Role',
        organization_id: orgId,
        is_system: true
      }
    });
    adminRoleId = adminRole.id;

    // TEACHER
    const teacherRole = await prisma.role.create({
      data: {
        name: 'TEACHER',
        description: 'Teacher Role',
        organization_id: orgId,
        is_system: false
      }
    });
    teacherRoleId = teacherRole.id;

    // STUDENT
    const studentRole = await prisma.role.create({
      data: {
        name: 'STUDENT',
        description: 'Student Role',
        organization_id: orgId,
        is_system: false
      }
    });
    studentRoleId = studentRole.id;

    // 3. Map permissions to Super Admin role
    const permissions = await prisma.permission.findMany();
    await prisma.rolePermission.createMany({
      data: permissions.map((p: any) => ({
        role_id: adminRoleId,
        permission_id: p.id
      }))
    });

    // Map IDENTITY:IS_STUDENT to STUDENT role
    const isStudentPerm = permissions.find((p: any) => p.module === 'IDENTITY' && p.action === 'IS_STUDENT');
    if (isStudentPerm) {
      await prisma.rolePermission.create({
        data: {
          role_id: studentRoleId,
          permission_id: isStudentPerm.id
        }
      });
    }

    // 4. Create Active Academic Year
    await prisma.academicYear.create({
      data: {
        name: '2026-2027',
        organization_id: orgId,
        is_active: true
      }
    });

    // 5. Create Admin User
    const adminUser = await prisma.user.create({
      data: {
        name: 'Import Admin',
        email: `admin-${Date.now()}@stabilize.com`,
        password_hash: passwordHash,
        role_id: adminRoleId,
        organization_id: orgId,
        is_active: true
      }
    });
    adminUserId = adminUser.id;

    // 6. Login to get token
    const loginRes = await supertest(app)
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: passwordPlain });
    
    expect(loginRes.status).toBe(200);
    adminToken = loginRes.body.token;
  });

  afterAll(async () => {
    // Clean up created student profiles
    const profiles = await prisma.studentProfile.findMany({
      where: { organization_id: orgId }
    });
    await prisma.studentProfile.deleteMany({
      where: { id: { in: profiles.map((p: any) => p.id) } }
    });

    // Clean up users
    const allUsers = await prisma.user.findMany({
      where: { organization_id: orgId }
    });
    await prisma.user.deleteMany({
      where: { id: { in: allUsers.map((u: any) => u.id) } }
    });

    // Clean up academic years
    await prisma.academicYear.deleteMany({
      where: { organization_id: orgId }
    });

    // Clean up role permissions
    await prisma.rolePermission.deleteMany({
      where: { role_id: { in: [adminRoleId, teacherRoleId, studentRoleId] } }
    });

    // Clean up roles
    await prisma.role.deleteMany({
      where: { id: { in: [adminRoleId, teacherRoleId, studentRoleId] } }
    });

    // Clean up license
    await prisma.organizationLicense.deleteMany({
      where: { organization_id: orgId }
    });

    // Clean up organization
    await prisma.organization.delete({
      where: { id: orgId }
    });
  });

  describe('CSV Analyze Phase Validation', () => {
    it('should catch duplicate emails and mobile/admission numbers inside the database', async () => {
      // Create user pre-existing in DB
      const existingUser = await prisma.user.create({
        data: {
          name: 'Existing Database User',
          email: 'db-existing@stabilize.com',
          password_hash: passwordHash,
          role_id: teacherRoleId,
          organization_id: orgId,
          is_active: true
        }
      });
      testUserIds.push(existingUser.id);

      await prisma.studentProfile.create({
        data: {
          user_id: existingUser.id,
          organization_id: orgId,
          admission_number: 'ADM-999',
          mobile_number: '9898989898'
        }
      });

      // Prepare CSV contents containing DB duplicate email and mobile
      const csvContent = 
        `Name,Email,Role,Roll Number,Admission Number,Mobile Number,Password\n` +
        `New Student,newstudent@stabilize.com,STUDENT,,ADM-101,9800000001,Password123\n` +
        `Duplicate Email,db-existing@stabilize.com,TEACHER,,ADM-102,9800000002,Password123\n` +
        `Duplicate Admission,another@stabilize.com,STUDENT,,ADM-999,9800000003,Password123\n` +
        `Duplicate Mobile,one-more@stabilize.com,STUDENT,,ADM-104,9898989898,Password123\n`;

      const analyzeRes = await supertest(app)
        .post('/api/bulk-import/users/analyze')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(csvContent), 'import.csv');

      expect(analyzeRes.status).toBe(200);
      expect(analyzeRes.body.validRowsCount).toBe(1);
      expect(analyzeRes.body.invalidRowsCount).toBe(3);

      const invalidPreview = analyzeRes.body.invalidPreview;
      expect(invalidPreview.length).toBe(3);

      // Verify exact reason messages are returned
      const emailDup = invalidPreview.find((r: any) => r.data.Name === 'Duplicate Email');
      expect(emailDup.errors[0]).toContain('Email already exists');

      const admDup = invalidPreview.find((r: any) => r.data.Name === 'Duplicate Admission');
      expect(admDup.errors[0]).toContain('Admission Number already exists');

      const mobDup = invalidPreview.find((r: any) => r.data.Name === 'Duplicate Mobile');
      expect(mobDup.errors[0]).toContain('Mobile number already exists');
    });

    it('should catch duplicate emails, mobile numbers, and admission numbers within the CSV file itself', async () => {
      const csvContent = 
        `Name,Email,Role,Roll Number,Admission Number,Mobile Number,Password\n` +
        `User 1,csvdup1@stabilize.com,TEACHER,,ADM-201,9800000011,Password123\n` +
        `User 2,csvdup1@stabilize.com,TEACHER,,ADM-202,9800000012,Password123\n` + // Duplicate Email
        `User 3,csvdup2@stabilize.com,STUDENT,,ADM-201,9800000013,Password123\n` + // Duplicate Admission Number
        `User 4,csvdup3@stabilize.com,STUDENT,,ADM-204,9800000011,Password123\n`; // Duplicate Mobile Number

      const analyzeRes = await supertest(app)
        .post('/api/bulk-import/users/analyze')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(csvContent), 'import.csv');

      expect(analyzeRes.status).toBe(200);
      expect(analyzeRes.body.validRowsCount).toBe(1);
      expect(analyzeRes.body.invalidRowsCount).toBe(3);

      const invalidPreview = analyzeRes.body.invalidPreview;
      expect(invalidPreview.find((r: any) => r.data.Name === 'User 2').errors[0]).toContain('Duplicate email');
      expect(invalidPreview.find((r: any) => r.data.Name === 'User 3').errors[0]).toContain('Duplicate admission number');
      expect(invalidPreview.find((r: any) => r.data.Name === 'User 4').errors[0]).toContain('Duplicate mobile number');
    });

    it('should report capacity exceeded during the Analyze phase', async () => {
      // Limit is 5. Existing active count is 2 (admin user + existing user).
      // If we attempt to analyze 5 valid rows, it will exceed limit (7 > 5).
      const csvContent = 
        `Name,Email,Role,Roll Number,Admission Number,Mobile Number,Password\n` +
        `Row 1,cap1@stabilize.com,TEACHER,,,,Password123\n` +
        `Row 2,cap2@stabilize.com,TEACHER,,,,Password123\n` +
        `Row 3,cap3@stabilize.com,TEACHER,,,,Password123\n` +
        `Row 4,cap4@stabilize.com,TEACHER,,,,Password123\n` +
        `Row 5,cap5@stabilize.com,TEACHER,,,,Password123\n`;

      const analyzeRes = await supertest(app)
        .post('/api/bulk-import/users/analyze')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(csvContent), 'import.csv');

      expect(analyzeRes.status).toBe(200);
      expect(analyzeRes.body.validRowsCount).toBe(0);
      expect(analyzeRes.body.invalidRowsCount).toBe(5);
      expect(analyzeRes.body.invalidPreview[0].errors[0]).toContain('License exceeded');
    });
  });

  describe('CSV Commit Phase safety', () => {
    it('should execute the commit and successfully insert teacher and student profiles without P2003', async () => {
      // Re-create a clean valid set (within limit).
      // Active = 2. Proposed = 2. Total = 4 <= 5.
      const csvContent = 
        `Name,Email,Role,Roll Number,Admission Number,Mobile Number,Password\n` +
        `Teacher Commit,teachercommit@stabilize.com,TEACHER,,,,Password123\n` +
        `Student Commit,studentcommit@stabilize.com,STUDENT,,ADM-777,9877777777,Password123\n`;

      const analyzeRes = await supertest(app)
        .post('/api/bulk-import/users/analyze')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(csvContent), 'import.csv');

      expect(analyzeRes.status).toBe(200);
      expect(analyzeRes.body.validRowsCount).toBe(2);
      expect(analyzeRes.body.invalidRowsCount).toBe(0);

      const jobId = analyzeRes.body.jobId;

      // Commit the jobId
      const commitRes = await supertest(app)
        .post('/api/bulk-import/users/commit')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ jobId });

      expect(commitRes.status).toBe(200);
      expect(commitRes.body.result.success_count).toBe(2);
      expect(commitRes.body.result.failure_count).toBe(0);

      // Verify DB state
      const createdTeacher = await prisma.user.findUnique({
        where: { email: 'teachercommit@stabilize.com' },
        include: { student_profile: true }
      });
      expect(createdTeacher).not.toBeNull();
      // Teacher role must not have a StudentProfile created!
      expect(createdTeacher?.student_profile).toBeNull();

      const createdStudent = await prisma.user.findUnique({
        where: { email: 'studentcommit@stabilize.com' },
        include: { student_profile: true }
      });
      expect(createdStudent).not.toBeNull();
      // Student role must have a StudentProfile successfully created!
      expect(createdStudent?.student_profile).not.toBeNull();
      expect(createdStudent?.student_profile?.admission_number).toBe('ADM-777');
    });

    it('should return HTTP 400 when committing on a license capacity limit breach', async () => {
      // Attempting to commit a large batch that exceeds capacity
      const csvContent = 
        `Name,Email,Role,Roll Number,Admission Number,Mobile Number,Password\n` +
        `Exceed 1,ex1@stabilize.com,TEACHER,,,,Password123\n` +
        `Exceed 2,ex2@stabilize.com,TEACHER,,,,Password123\n` +
        `Exceed 3,ex3@stabilize.com,TEACHER,,,,Password123\n` +
        `Exceed 4,ex4@stabilize.com,TEACHER,,,,Password123\n`;

      const analyzeRes = await supertest(app)
        .post('/api/bulk-import/users/analyze')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from(csvContent), 'import.csv');

      expect(analyzeRes.status).toBe(200);
      // Valid rows count should be 0 because license capacity limits were breached!
      expect(analyzeRes.body.validRowsCount).toBe(0);

      const jobId = analyzeRes.body.jobId;

      // Commit should fail with HTTP 400 Bad Request
      const commitRes = await supertest(app)
        .post('/api/bulk-import/users/commit')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ jobId });

      expect(commitRes.status).toBe(400);
      expect(commitRes.body.message).toBe('No valid rows provided for commit.');
    });
  });
});
