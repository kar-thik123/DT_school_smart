"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const permissions_1 = require("../config/permissions");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting Clean Active SaaS Permission Seeding...');
    // 1. Delete all existing permissions and role mappings
    console.log('Clearing old role-permission mappings...');
    await prisma.rolePermission.deleteMany({});
    console.log('Clearing old permissions...');
    await prisma.permission.deleteMany({});
    // 2. Fetch new clean permissions list from config
    const flatPermissions = (0, permissions_1.getFlatPermissions)();
    console.log(`Prepared ${flatPermissions.length} clean permissions for seeding.`);
    // 3. Create all new permissions in the database
    const permissionMap = {}; // module:action -> id
    for (const item of flatPermissions) {
        const created = await prisma.permission.create({
            data: {
                module: item.module,
                action: item.action,
                description: item.description
            }
        });
        const key = `${item.module}:${item.action}`;
        permissionMap[key] = created.id;
        console.log(`Created permission: ${key}`);
    }
    // 4. Fetch all existing roles to map their permissions
    const roles = await prisma.role.findMany();
    console.log(`Mapping permissions for ${roles.length} roles in DB.`);
    for (const role of roles) {
        const roleNameUpper = role.name.toUpperCase();
        // SUPER_ADMIN gets ALL TENANT permissions mapped dynamically
        if (roleNameUpper === 'SUPER_ADMIN') {
            const rpData = Object.entries(permissionMap)
                .filter(([key]) => {
                const [mod, act] = key.split(':');
                return permissions_1.PERMISSION_DOMAINS[mod] === 'TENANT' && !(mod === 'IDENTITY' && act === 'IS_SYSTEM_ADMIN');
            })
                .map(([_, pid]) => ({
                role_id: role.id,
                permission_id: pid
            }));
            await prisma.rolePermission.createMany({ data: rpData });
            console.log(`Mapped all ${rpData.length} tenant permissions to SUPER_ADMIN (Role ID: ${role.id})`);
        }
        // TEACHER gets dynamic assigned permissions by default:
        // IDENTITY:IS_TEACHER, QUESTION_BANK:VIEW, COMPLETION_TRACKING:VIEW
        else if (roleNameUpper === 'TEACHER') {
            const teacherPermKeys = [
                'IDENTITY:IS_TEACHER',
                'QUESTION_BANK:VIEW',
                'COMPLETION_TRACKING:VIEW'
            ];
            const rpData = teacherPermKeys
                .map(key => ({ role_id: role.id, permission_id: permissionMap[key] }))
                .filter(x => x.permission_id !== undefined);
            if (rpData.length > 0) {
                await prisma.rolePermission.createMany({ data: rpData });
                console.log(`Mapped ${rpData.length} permissions to TEACHER role: ${role.name}`);
            }
        }
        // STUDENT gets IDENTITY:IS_STUDENT, MCQ:VIEW, MCQ:ATTEMPT
        else if (roleNameUpper === 'STUDENT') {
            const studentPermKeys = [
                'IDENTITY:IS_STUDENT',
                'MCQ:VIEW',
                'MCQ:ATTEMPT'
            ];
            const rpData = studentPermKeys
                .map(key => ({ role_id: role.id, permission_id: permissionMap[key] }))
                .filter(x => x.permission_id !== undefined);
            if (rpData.length > 0) {
                await prisma.rolePermission.createMany({ data: rpData });
                console.log(`Mapped ${rpData.length} permissions to STUDENT role: ${role.name}`);
            }
        }
        // MANAGEMENT gets IDENTITY:IS_MANAGEMENT
        else if (roleNameUpper === 'MANAGEMENT') {
            const mgmtPermKeys = ['IDENTITY:IS_MANAGEMENT'];
            const rpData = mgmtPermKeys
                .map(key => ({ role_id: role.id, permission_id: permissionMap[key] }))
                .filter(x => x.permission_id !== undefined);
            if (rpData.length > 0) {
                await prisma.rolePermission.createMany({ data: rpData });
                console.log(`Mapped ${rpData.length} permissions to MANAGEMENT role: ${role.name}`);
            }
        }
    }
    console.log('Clean active SaaS permission seeding complete!');
}
main()
    .catch(e => {
    console.error('Error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
