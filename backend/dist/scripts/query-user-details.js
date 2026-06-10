"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'karthik2jonam@gmail.com' },
        include: { role: true, organization: true }
    });
    console.log('User:', user);
}
main().catch(console.error).finally(() => prisma.$disconnect());
