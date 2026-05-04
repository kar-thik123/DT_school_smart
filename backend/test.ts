import prisma from './src/prisma';

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, section_id: true, grade_id: true, role: { select: { name: true } }, is_active: true, created_at: true },
      take: 1
    });
    console.log("USERS OK:", users);
  } catch (e: any) {
    console.error("USERS ERROR:", e.message);
  }
}
main();
