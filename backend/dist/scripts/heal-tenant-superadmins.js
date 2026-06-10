"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const permissions_1 = require("../config/permissions");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🚀 Starting Tenant SUPER_ADMIN Role Healing...');
    // 1. Get Platform Core organization
    const platformOrg = await prisma.organization.findUnique({
        where: { subdomain: 'sys' }
    });
    if (!platformOrg) {
        console.error('❌ Platform Core organization (subdomain: sys) not found!');
        return;
    }
    console.log(`Platform Core Org ID: ${platformOrg.id}`);
    // 2. Fetch all organizations
    const orgs = await prisma.organization.findMany();
    console.log(`Found ${orgs.length} organizations in database.`);
    // 3. Fetch all tenant-scoped permissions
    const permissions = await prisma.permission.findMany();
    const tenantPermissions = permissions.filter(p => permissions_1.PERMISSION_DOMAINS[p.module] === 'TENANT');
    console.log(`Found ${tenantPermissions.length} tenant-scoped permissions.`);
    // 4. Iterate over organizations (skip platform core)
    for (const org of orgs) {
        if (org.id === platformOrg.id)
            continue;
        console.log(`\nProcessing Org: ${org.school_name} (${org.subdomain}) [ID: ${org.id}]`);
        // Find or Create SUPER_ADMIN role for this organization
        let superAdminRole = await prisma.role.findFirst({
            where: { name: 'SUPER_ADMIN', organization_id: org.id }
        });
        if (!superAdminRole) {
            superAdminRole = await prisma.role.create({
                data: {
                    name: 'SUPER_ADMIN',
                    description: `School Owner — full access to ${org.school_name}`,
                    organization_id: org.id,
                    is_system: true
                }
            });
            console.log(`  + Created SUPER_ADMIN role: ${superAdminRole.id}`);
        }
        else {
            console.log(`  * SUPER_ADMIN role already exists: ${superAdminRole.id}`);
        }
        // Ensure all tenant permissions are mapped to this role
        const existingMappings = await prisma.rolePermission.findMany({
            where: { role_id: superAdminRole.id }
        });
        const existingPermIds = new Set(existingMappings.map(m => m.permission_id));
        const newMappingsData = tenantPermissions
            .filter(p => !existingPermIds.has(p.id))
            .map(p => ({
            role_id: superAdminRole.id,
            permission_id: p.id
        }));
        if (newMappingsData.length > 0) {
            await prisma.rolePermission.createMany({
                data: newMappingsData
            });
            console.log(`  + Mapped ${newMappingsData.length} new tenant permissions to SUPER_ADMIN role.`);
        }
        else {
            console.log(`  * All ${tenantPermissions.length} tenant permissions are already mapped.`);
        }
        // Find users in this organization referencing the wrong SUPER_ADMIN role
        const usersToFix = await prisma.user.findMany({
            where: {
                organization_id: org.id,
                role: {
                    name: 'SUPER_ADMIN',
                    NOT: { organization_id: org.id }
                }
            },
            include: { role: true }
        });
        console.log(`  Found ${usersToFix.length} users with mismatched SUPER_ADMIN role.`);
        for (const user of usersToFix) {
            console.log(`  -> Fixing user ${user.name} (${user.email}). Changing role from ${user.role?.id} (org: ${user.role?.organization_id}) to ${superAdminRole.id} (org: ${org.id})`);
            await prisma.user.update({
                where: { id: user.id },
                data: { role_id: superAdminRole.id }
            });
            console.log(`     User ${user.email} updated successfully.`);
        }
    }
    console.log('\n🎉 SUPER_ADMIN Role Healing Complete!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
