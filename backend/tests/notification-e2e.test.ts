import supertest from 'supertest';
import bcrypt from 'bcrypt';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import fs from 'fs';
import prisma from '../src/prisma';
import app from '../src/app';
import { server } from '../src/server';
import { getFlatPermissions } from '../src/config/permissions';

describe('Notification System E2E Suite', () => {
  jest.setTimeout(120000); // Need plenty of time for 9 modules

  let port: number;
  
  // Scoped Data
  let orgId: string;
  let adminId: string;
  let adminToken: string;
  let adminSocket: ClientSocket;

  let teacherId: string;
  let teacherToken: string;
  let teacherSocket: ClientSocket;

  let studentId: string;
  let studentToken: string;
  let studentSocket: ClientSocket;

  let studentRoleId: string;

  let academicYearId: string;
  let gradeId: string;
  let sectionId: string;
  let subjectId: string;
  let unitId: string;
  let topicId: string;
  let subjectGroupId: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address() as any;
        port = address.port;
        resolve();
      });
    });
    console.log(`Test server listening on port ${port}`);
    await setupTestContext();
    console.log(`Test context setup complete.`);
  });

  afterAll(async () => {
    await cleanupTestContext();
    server.close();
  });

  async function setupTestContext() {
    fs.appendFileSync('debug-setup.log', 'setupTestContext: hashing password...\n');
    // Create base generic password
    const passwordPlain = 'Notification@123';
    const passwordHash = await bcrypt.hash(passwordPlain, 10);

    const uniqueSuffix = Date.now().toString();

    fs.appendFileSync('debug-setup.log', 'setupTestContext: creating org...\n');
    // Organization
    const org = await prisma.organization.create({
      data: {
        school_name: 'Notification E2E School',
        subdomain: `notif-${uniqueSuffix}`,
        status: 'ACTIVE',
        domain_type: 'PLATFORM_DOMAIN'
      }
    });
    orgId = org.id;

    fs.appendFileSync('debug-setup.log', 'setupTestContext: creating roles...\n');
    // Roles
    const adminRole = await prisma.role.create({
      data: { name: 'SUPER_ADMIN', description: 'Admin', organization_id: orgId }
    });
    const teacherRole = await prisma.role.create({
      data: { name: 'TEACHER', description: 'Teacher', organization_id: orgId }
    });
    const studentRole = await prisma.role.create({
      data: { name: 'STUDENT', description: 'Student', organization_id: orgId }
    });
    studentRoleId = studentRole.id;

    fs.appendFileSync('debug-setup.log', 'setupTestContext: creating permissions...\n');
    // We must give these roles the required permissions
    const allPerms = getFlatPermissions();
    try {
      await prisma.permission.createMany({
        data: allPerms.map((p: any) => ({
          module: p.module,
          action: p.action,
          description: p.description
        })),
        skipDuplicates: true
      });
    } catch (err) {
      fs.appendFileSync('debug-setup.log', 'setupTestContext: perm error: ' + err + '\n');
    }

    const allDbPerms = await prisma.permission.findMany();
    await prisma.rolePermission.createMany({
      data: [
        ...allDbPerms.map((p: any) => ({ role_id: adminRole.id, permission_id: p.id })),
        ...allDbPerms.map((p: any) => ({ role_id: teacherRole.id, permission_id: p.id })),
        ...allDbPerms.map((p: any) => ({ role_id: studentRole.id, permission_id: p.id }))
      ],
      skipDuplicates: true,
    });

    fs.appendFileSync('debug-setup.log', 'setupTestContext: creating users...\n');
    // Users
    const adminUser = await prisma.user.create({
      data: { name: 'Admin E2E', email: `admin_${uniqueSuffix}@notif.com`, password_hash: passwordHash, role_id: adminRole.id, organization_id: orgId, is_active: true }
    });
    adminId = adminUser.id;

    const teacherUser = await prisma.user.create({
      data: { name: 'Teacher E2E', email: `teacher_${uniqueSuffix}@notif.com`, password_hash: passwordHash, role_id: teacherRole.id, organization_id: orgId, is_active: true }
    });
    teacherId = teacherUser.id;

    const studentUser = await prisma.user.create({
      data: { name: 'Student E2E', email: `student_${uniqueSuffix}@notif.com`, password_hash: passwordHash, role_id: studentRole.id, organization_id: orgId, is_active: true }
    });
    studentId = studentUser.id;

    fs.appendFileSync('debug-setup.log', 'setupTestContext: creating academic data...\n');
    // Academic Data
    const year = await prisma.academicYear.create({
      data: { name: '2026-E2E', organization_id: orgId, is_active: true }
    });
    academicYearId = year.id;

    const grade = await prisma.grade.create({
      data: { name: 'Grade 10 E2E', academic_year_id: academicYearId, organization_id: orgId }
    });
    gradeId = grade.id;

    const section = await prisma.section.create({
      data: { name: 'Section A E2E', grade_id: gradeId, organization_id: orgId }
    });
    sectionId = section.id;

    const subject = await prisma.subject.create({
      data: { name: 'Math E2E', grade_id: gradeId, organization_id: orgId }
    });
    subjectId = subject.id;

    const unit = await prisma.unit.create({
      data: { name: 'Unit 1', subject_id: subjectId, grade_id: gradeId, organization_id: orgId }
    });
    unitId = unit.id;

    const topic = await prisma.topic.create({
      data: { name: 'Topic 1', unit_id: unitId, organization_id: orgId }
    });
    topicId = topic.id;

    const group = await prisma.subjectGroup.create({
      data: { name: 'Math Group', section_id: sectionId, grade_id: gradeId, organization_id: orgId }
    });
    subjectGroupId = group.id;
    await prisma.studentGroupMapping.create({
      data: { student_id: studentId, organization_id: orgId, academic_year_id: academicYearId, group_id: group.id }
    });

    fs.appendFileSync('debug-setup.log', 'setupTestContext: authenticating users...\n');
    // Login users to get tokens
    const loginAdmin = await supertest(app).post('/api/auth/login').send({ email: `admin_${uniqueSuffix}@notif.com`, password: passwordPlain });
    adminToken = loginAdmin.body.token;

    const loginTeacher = await supertest(app).post('/api/auth/login').send({ email: `teacher_${uniqueSuffix}@notif.com`, password: passwordPlain });
    teacherToken = loginTeacher.body.token;

    const loginStudent = await supertest(app).post('/api/auth/login').send({ email: `student_${uniqueSuffix}@notif.com`, password: passwordPlain });
    studentToken = loginStudent.body.token;

    fs.appendFileSync('debug-setup.log', `setupTestContext: connecting sockets to port ${port}...\n`);
    // Connect Sockets
    adminSocket = Client(`http://localhost:${port}`, { auth: { token: adminToken } });
    teacherSocket = Client(`http://localhost:${port}`, { auth: { token: teacherToken } });
    studentSocket = Client(`http://localhost:${port}`, { auth: { token: studentToken } });

    await new Promise(r => setTimeout(r, 1000)); // Wait for sockets to connect
    fs.appendFileSync('debug-setup.log', 'setupTestContext: done\n');
  }

  async function cleanupTestContext() {
    adminSocket?.disconnect();
    teacherSocket?.disconnect();
    studentSocket?.disconnect();

    // Cascading delete via org
    await prisma.organization.delete({ where: { id: orgId } }).catch(() => {});
  }

  // Utility to wait for socket event
  function waitForNotification(socket: ClientSocket): Promise<any> {
    return new Promise((resolve) => {
      socket.once('new-notification', (payload) => {
        resolve(payload);
      });
    });
  }

  // ==========================================
  // SCENARIO 1: Internal Mail
  // ==========================================
  it('Internal Mail: User A sends mail, User B receives real-time notification', async () => {
    const notifyPromise = waitForNotification(teacherSocket);

    // Admin sends mail to teacher
    const res = await supertest(app)
      .post('/api/mails/send')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-academic-year-id', academicYearId)
      .send({
        receiverId: teacherId,
        subject: 'E2E Test Subject',
        body: 'E2E Test Body'
      });

    expect(res.status).toBe(201);

    const payload = await notifyPromise;
    expect(payload.type).toBe('email');
    expect(payload.userId).toBe(teacherId);
    expect(payload.isRead).toBe(false);
    expect(payload.id).toBeDefined();

    // Verify DB
    const dbNotif = await prisma.notificationRecipient.findUnique({ where: { id: payload.id }});
    expect(dbNotif).not.toBeNull();
    expect(dbNotif?.is_read).toBe(false);

    // Mark as read
    const readRes = await supertest(app)
      .patch(`/api/notifications/${payload.id}/read`)
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(readRes.status).toBe(200);

    const updatedNotif = await prisma.notificationRecipient.findUnique({ where: { id: payload.id }});
    expect(updatedNotif?.is_read).toBe(true);
  });

  // ==========================================
  // SCENARIO 2: Completion Tracking
  // ==========================================
  it('Completion Tracking: Student receives assignment notification', async () => {
    // Assign Teacher to Math subject
    await prisma.teacherAssignment.create({
      data: {
        teacher_id: teacherId, organization_id: orgId, academic_year_id: academicYearId,
        subject_id: subjectId, assignment_type: 'SUBJECT_TEACHER', grade_id: gradeId
      }
    });

    const notifyPromise = waitForNotification(studentSocket); 
    
    // Enroll student in Section so they are resolved by audience resolver
    const existingSectionEnroll = await prisma.studentEnrollment.findFirst({
        where: { student_id: studentId, section_id: sectionId }
    });
    if (!existingSectionEnroll) {
        await prisma.studentEnrollment.create({
          data: { student_id: studentId, organization_id: orgId, academic_year_id: academicYearId, grade_id: gradeId, section_id: sectionId }
        });
    }

    const res = await supertest(app)
      .post('/api/completion/toggle')
      .set('Authorization', `Bearer ${teacherToken}`)
      .set('x-academic-year-id', academicYearId)
      .send({
        grade_id: gradeId, section_id: sectionId, subject_id: subjectId,
        level: 'TOPIC', id: topicId, is_completed: true, send_notification: true
      });
    
    expect(res.status).toBe(200);
    
    const payload = await notifyPromise;
    expect(payload.type).toBe('TOPIC');
  });

  // ==========================================
  // SCENARIO 3: Teacher Assignment
  // ==========================================
  it('Teacher Assignment: Teacher receives a notification', async () => {
    const notifyPromise = waitForNotification(teacherSocket);

    const res = await supertest(app)
      .post('/api/teacher-assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-academic-year-id', academicYearId)
      .send({
        teacher_id: teacherId, grade_id: gradeId, subject_id: subjectId, assignment_type: 'SUBJECT_TEACHER'
      });

    expect(res.status).toBe(201);

    const payload = await notifyPromise;
    expect(payload.type).toBe('TEACHER_ASSIGNMENT');
  });

  // ==========================================
  // SCENARIO 4: Student Enrollment
  // ==========================================
  it('Student Enrollment: Student receives enrollment notification', async () => {
    const notifyPromise = waitForNotification(studentSocket);

    const res = await supertest(app)
      .post('/api/student-enrollments/bulk-enroll')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-academic-year-id', academicYearId)
      .send({
        student_ids: [studentId],
        grade_id: gradeId,
        section_id: sectionId,
        subject_group_id: subjectGroupId
      });

    expect(res.status).toBe(200);

    const payload = await notifyPromise;
    expect(payload.type).toBe('STUDENT_ENROLLMENT');
  });

  // ==========================================
  // SCENARIO 5: Skill Verification
  // ==========================================
  it('Skill Verification: Student receives approval notification', async () => {
    const skill = await prisma.skill.create({
      data: { skill_name: 'E2E Skill', skill_type: 'SPORTS', user_id: studentId, organization_id: orgId }
    });

    await prisma.skillVerificationAssignment.create({
      data: {
        organization_id: orgId,
        skill_types: ['SPORTS'],
        verifier_ids: [adminId],
        grade_ids: [],
        section_ids: []
      }
    });

    const notifyPromise = waitForNotification(studentSocket);

    const res = await supertest(app)
      .patch(`/api/skills/${skill.id}/status`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .set('x-academic-year-id', academicYearId)
      .send({ status: 'approved' });

    expect(res.status).toBe(200);

    const payload = await notifyPromise;
    expect(payload.type).toBe('SKILL_VERIFICATION');
    expect(payload.message).toContain('approved');
  });

  // ==========================================
  // SCENARIO 6: User & Role Management
  // ==========================================
  it('User Management: New user receives creation notification', async () => {
    const res = await supertest(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'New User E2E',
        email: 'newuser@notif.com',
        password: 'Password@123',
        role_id: studentRoleId
      });

    if (res.status !== 201) console.log('User Management Error:', res.body);
    expect(res.status).toBe(201);
    const newUserId = res.body.user.id;

    const dbNotifs = await prisma.notificationRecipient.findMany({ where: { user_id: newUserId }});
    expect(dbNotifs.length).toBeGreaterThanOrEqual(1);
  });

  // ==========================================
  // SCENARIO 7: Academic Management
  // ==========================================
  it('Academic Management: Activate Academic Year notifies admins', async () => {
    const notifyPromise = waitForNotification(adminSocket);

    const res = await supertest(app)
      .post(`/api/academic/academic-years/${academicYearId}/activate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ confirm: true });

    if (res.status !== 200) console.log('Academic Management Error:', res.body);
    expect(res.status).toBe(200);

    const payload = await notifyPromise;
    expect(payload.type).toBe('ACADEMIC_MANAGEMENT');
  });

  // ==========================================
  // SCENARIO 8: Question Bank
  // ==========================================
  it('Question Bank: Create question notifies user', async () => {
    const notifyPromise = waitForNotification(teacherSocket);

    const res = await supertest(app)
      .post('/api/question-bank')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        question_text: 'E2E Q',
        marks: 5,
        difficulty: 'EASY',
        subject_id: subjectId,
        grade_id: gradeId,
        type: 'TRUE_FALSE',
        answer_config: { correct_answer: true }
      });

    if (res.status !== 201) console.log('Question Bank Error:', res.body);
    expect(res.status).toBe(201);

    const payload = await notifyPromise;
    expect(payload.type).toBe('QUESTION_BANK');
  });

  // ==========================================
  // NEGATIVE TESTS
  // ==========================================
  it('Negative - Offline Recipient: Disconnect socket, trigger event, verify DB persistence', async () => {
    studentSocket.disconnect();

    const res = await supertest(app)
      .post('/api/student-enrollments/bulk-enroll')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-academic-year-id', academicYearId)
      .send({
        student_ids: [studentId],
        grade_id: gradeId,
        section_id: sectionId,
        subject_group_id: subjectGroupId
      });

    expect(res.status).toBe(200);

    const dbNotifs = await prisma.notificationRecipient.findMany({
      where: { user_id: studentId },
      orderBy: { id: 'desc' },
      take: 1
    });
    
    expect(dbNotifs.length).toBeGreaterThan(0);
    
    studentSocket.connect();
  });
});
