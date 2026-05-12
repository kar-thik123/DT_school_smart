"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting Identity Permission Migration...');
    // 1. Create Identity Permissions
    const identities = ['IS_STUDENT', 'IS_TEACHER', 'IS_PARENT', 'IS_MANAGEMENT'];
    const createdPermissions = [];
    for (const action of identities) {
        let perm = await prisma.permission.findFirst({
            where: { module: 'IDENTITY', action }
        });
        if (!perm) {
            perm = await prisma.permission.create({
                data: {
                    module: 'IDENTITY',
                    action,
                    description: `Identifies user as a ${action.split('_')[1].toLowerCase()}`
                }
            });
            console.log(`Created permission: IDENTITY:${action}`);
        }
        else {
            console.log(`Permission IDENTITY:${action} already exists.`);
        }
        createdPermissions.push(perm);
    }
    const [permStudent, permTeacher, permParent, permManagement] = createdPermissions;
    // 2. Map IS_TEACHER to roles with is_teaching_role = true
    // Note: is_teaching_role was removed from schema.prisma after this script ran successfully.
    /*
    const teachingRoles = await prisma.role.findMany({
      where: { is_teaching_role: true }
    });
  
    for (const role of teachingRoles) {
      const existingMap = await prisma.rolePermission.findFirst({
        where: { role_id: role.id, permission_id: permTeacher.id }
      });
      if (!existingMap) {
        await prisma.rolePermission.create({
          data: {
            role_id: role.id,
            permission_id: permTeacher.id
          }
        });
        console.log(`Mapped IDENTITY:IS_TEACHER to role: ${role.name}`);
      }
    }
    */
    // 3. Map IS_STUDENT to roles with name = 'STUDENT'
    const studentRoles = await prisma.role.findMany({
        where: { name: { in: ['STUDENT', 'Student'] } }
    });
    for (const role of studentRoles) {
        const existingMap = await prisma.rolePermission.findFirst({
            where: { role_id: role.id, permission_id: permStudent.id }
        });
        if (!existingMap) {
            await prisma.rolePermission.create({
                data: {
                    role_id: role.id,
                    permission_id: permStudent.id
                }
            });
            console.log(`Mapped IDENTITY:IS_STUDENT to role: ${role.name}`);
        }
    }
    // 4. Map IS_MANAGEMENT to SUPER_ADMIN, SYSTEM_ADMIN, MANAGEMENT
    const mgmtRoles = await prisma.role.findMany({
        where: { name: { in: ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'MANAGEMENT'] } }
    });
    for (const role of mgmtRoles) {
        const existingMap = await prisma.rolePermission.findFirst({
            where: { role_id: role.id, permission_id: permManagement.id }
        });
        if (!existingMap) {
            await prisma.rolePermission.create({
                data: {
                    role_id: role.id,
                    permission_id: permManagement.id
                }
            });
            console.log(`Mapped IDENTITY:IS_MANAGEMENT to role: ${role.name}`);
        }
    }
    console.log('Migration of Identity permissions complete!');
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
