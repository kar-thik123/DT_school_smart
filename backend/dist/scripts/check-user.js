"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const users = await prisma.user.findMany({
        include: {
            role: true
        }
    });
    console.log('ALL USERS IN DATABASE:');
    users.forEach((u) => {
        console.log(`- ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role?.name}`);
    });
}
main()
    .catch(e => console.error(e))
    .finally(async () => {
    await prisma.$disconnect();
});
