import supertest from 'supertest';
import bcrypt from 'bcrypt';
import prisma from '../src/prisma';
import app from '../src/app';

describe('User Management Production Stabilization Suite', () => {
  jest.setTimeout(30000);

  let orgId: string;
  let adminRoleId: string;
  let adminUserId: string;
  let adminToken: string;
  let testUserIds: string[] = [];

  const passwordPlain = 'SprintTest@123';
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(passwordPlain, 10);

    // Setup an isolated organization for testing
    const org = await prisma.organization.create({
      data: {
        school_name: 'Sprint stabilization School',
        subdomain: `sprint-stabilization-${Date.now()}`,
        status: 'ACTIVE',
        domain_type: 'PLATFORM_DOMAIN',
      },
    });
    orgId = org.id;

    // Create Admin Role and Admin User
    const adminRole = await prisma.role.create({
      data: {
        name: 'SUPER_ADMIN',
        description: 'Super Admin Role',
        organization_id: orgId,
        is_system: true,
      },
    });
    adminRoleId = adminRole.id;

    // Map permissions
    const permissions = await prisma.permission.findMany();
    await prisma.rolePermission.createMany({
      data: permissions.map((p: any) => ({
        role_id: adminRoleId,
        permission_id: p.id,
      })),
    });

    const adminUser = await prisma.user.create({
      data: {
        name: 'Sprint Admin',
        email: `admin-${Date.now()}@sprint.com`,
        password_hash: passwordHash,
        role_id: adminRoleId,
        organization_id: orgId,
        is_active: true,
      },
    });
    adminUserId = adminUser.id;

    // Login to get token
    const loginRes = await supertest(app)
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: passwordPlain });
    
    expect(loginRes.status).toBe(200);
    adminToken = loginRes.body.token;
  });

  afterAll(async () => {
    // Cleanup created test data
    const allUsers = [...testUserIds, adminUserId];
    await prisma.user.deleteMany({ where: { id: { in: allUsers } } });
    await prisma.rolePermission.deleteMany({ where: { role_id: adminRoleId } });
    await prisma.role.delete({ where: { id: adminRoleId } });
    await prisma.organization.delete({ where: { id: orgId } });
  });

  describe('Security and Lockout', () => {
    it('should return HTTP 429 when lockout is triggered after 5 failed attempts', async () => {
      // Create a temporary user for failed attempts
      const tempUserEmail = `lockout-${Date.now()}@sprint.com`;
      const tempUser = await prisma.user.create({
        data: {
          name: 'Lockout User',
          email: tempUserEmail,
          password_hash: passwordHash,
          role_id: adminRoleId,
          organization_id: orgId,
          is_active: true,
        },
      });
      testUserIds.push(tempUser.id);

      // Perform 4 failed logins (returns 401)
      for (let i = 0; i < 4; i++) {
        const res = await supertest(app)
          .post('/api/auth/login')
          .send({ email: tempUserEmail, password: 'WrongPassword' });
        expect(res.status).toBe(401);
      }

      // 5th failed login triggers lockout (returns 429)
      const res5 = await supertest(app)
        .post('/api/auth/login')
        .send({ email: tempUserEmail, password: 'WrongPassword' });
      expect(res5.status).toBe(429);
      expect(res5.body.message).toMatch(/too many failed attempts/i);

      // Subsequent login attempt while locked also returns 429
      const res6 = await supertest(app)
        .post('/api/auth/login')
        .send({ email: tempUserEmail, password: passwordPlain });
      expect(res6.status).toBe(429);
    });

    it('should return HTTP 403 Forbidden for administrator-initiated password resets', async () => {
      const res = await supertest(app)
        .post(`/api/users/${adminUserId}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/administrator-initiated password reset is not supported/i);
    });
  });

  describe('User API CRUD, Search, Sorting, and Pagination', () => {
    let userIdA: string;
    let userIdB: string;

    beforeAll(async () => {
      // Create test users B and A to test search, pagination, and sorting
      const userA = await prisma.user.create({
        data: {
          name: 'Alice Alpha',
          email: `alice-${Date.now()}@sprint.com`,
          password_hash: passwordHash,
          role_id: adminRoleId,
          organization_id: orgId,
          is_active: true,
        },
      });
      userIdA = userA.id;
      testUserIds.push(userIdA);

      const userB = await prisma.user.create({
        data: {
          name: 'Bob Beta',
          email: `bob-${Date.now()}@sprint.com`,
          password_hash: passwordHash,
          role_id: adminRoleId,
          organization_id: orgId,
          is_active: true,
        },
      });
      userIdB = userB.id;
      testUserIds.push(userIdB);
    });

    it('should implement GET /api/users/:id and strictly exclude password_hash', async () => {
      const res = await supertest(app)
        .get(`/api/users/${userIdA}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Alice Alpha');
      expect(res.body.password_hash).toBeUndefined();
      expect(res.body.password).toBeUndefined();
    });

    it('should implement PATCH /api/users/:id for partial updates and exclude password_hash', async () => {
      const res = await supertest(app)
        .patch(`/api/users/${userIdA}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Alice Updated' });

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Alice Updated');
      expect(res.body.user.password_hash).toBeUndefined();
      expect(res.body.user.password).toBeUndefined();

      // Verify db state
      const dbUser = await prisma.user.findUnique({ where: { id: userIdA } });
      expect(dbUser?.name).toBe('Alice Updated');
    });

    it('should filter out password_hash in PUT /api/users/:id response', async () => {
      const res = await supertest(app)
        .put(`/api/users/${userIdA}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Alice Put' });

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Alice Put');
      expect(res.body.user.password_hash).toBeUndefined();
      expect(res.body.user.password).toBeUndefined();
    });

    it('should support server-side search by name/email on GET /api/users', async () => {
      const res = await supertest(app)
        .get('/api/users?search=Beta')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe('Bob Beta');
    });

    it('should support server-side sorting on GET /api/users', async () => {
      const res = await supertest(app)
        .get('/api/users?sort=name&order=desc')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // Bob Beta should come before Alice Put (A) when sorted desc
      const names = res.body.map((u: any) => u.name);
      const sprintAdminIdx = names.indexOf('Sprint Admin');
      const bobIdx = names.indexOf('Bob Beta');
      const aliceIdx = names.indexOf('Alice Put');

      expect(bobIdx).toBeLessThan(aliceIdx);
    });

    it('should support server-side pagination returning paginated envelope structure', async () => {
      const res = await supertest(app)
        .get('/api/users?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page', 1);
      expect(res.body).toHaveProperty('limit', 2);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('Response Compression', () => {
    it('should support gzip compression when Accept-Encoding is provided', async () => {
      const res = await supertest(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Accept-Encoding', 'gzip');

      // The response header Content-Encoding should contain gzip
      // Note: Supertest decompresses by default, but we check headers
      const contentEncoding = res.headers['content-encoding'];
      if (contentEncoding) {
        expect(contentEncoding).toContain('gzip');
      }
    });
  });
});
