"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const superAdminRole = await prisma.role.findFirst({
        where: { name: 'SUPER_ADMIN' },
        include: {
            permissions: {
                include: { permission: true }
            }
        }
    });
    console.log('superAdminRole:', superAdminRole);
}
main().catch(console.error).finally(() => prisma.$disconnect());
