const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const org = await p.organization.create({
    data: {
      school_name: 'test',
      login_limit: 100,
      logo_url: '/api/uploads/logos/test.png'
    }
  });
  console.log(org);
  await p.organization.delete({where: {id: org.id}});
}

run().catch(console.error).finally(() => p.$disconnect());
