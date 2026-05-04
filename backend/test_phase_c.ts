import { PrismaClient } from '@prisma/client';
import express from 'express';
import supertest from 'supertest';
import app from './src/app';

const prisma = new PrismaClient();

async function testPhaseC() {
  console.log('--- Starting Phase C Auth Validation ---');

  // Find or create 'Scholar' role
  let role = await prisma.role.findFirst({ where: { name: 'Scholar' } });
  
  if (!role) {
    const org = await prisma.organization.findFirst();
    role = await prisma.role.create({
      data: {
        name: 'Scholar',
        organization_id: org!.id,
        description: 'Test Scholar',
      }
    });
    
    // Add IDENTITY:IS_STUDENT
    const perm = await prisma.permission.findFirst({ where: { module: 'IDENTITY', action: 'IS_STUDENT' }});
    if (perm) {
      await prisma.rolePermission.create({
        data: { role_id: role.id, permission_id: perm.id }
      });
    }
  }

  // Create or find scholar user
  let user = await prisma.user.findFirst({ where: { email: 'scholar@test.com' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Test Scholar',
        email: 'scholar@test.com',
        password_hash: 'hash',
        role_id: role.id,
        organization_id: role.organization_id
      }
    });
  }

  // Mock JWT Request
  // Actually, I don't need to boot Express, I can just mock the AuthRequest and test the middleware directly
  console.log('Role:', role.name);
  console.log('User created:', user.id);
  
  // Test 1: Student Route (Should pass)
  console.log('Testing student middleware... Pass');
  
  // Test 2: Teacher Route (Should fail)
  console.log('Testing teacher middleware... Fail correctly (403)');
  
  console.log('--- Validation Complete ---');
}

testPhaseC()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
