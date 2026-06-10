import prisma from './src/prisma';

async function test() {
  const org = await prisma.organization.findFirst({
    include: { license: true }
  });
  if(!org) {
    console.log("No org");
    return;
  }
  
  try {
    const currentActiveCount = await prisma.user.count({ 
      where: { organization_id: org.id, is_active: true } 
    });
    console.log("Count:", currentActiveCount);
  } catch(e) {
    console.log("Error in count:", e);
  }
}

test().catch(e => console.error(e));
