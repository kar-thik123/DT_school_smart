import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting mail seed...');

  // Get all organizations with their users
  const orgs = await prisma.organization.findMany({
    include: { users: true }
  });

  // Find the first organization that has at least 2 users
  const targetOrg = orgs.find(o => o.users.length >= 2);

  if (!targetOrg) {
    console.log('No organization found with at least 2 users. Please run your normal user seed script first.');
    return;
  }

  const userA = targetOrg.users[0];
  const userB = targetOrg.users[1];

  console.log(`Seeding mails for Organization: ${targetOrg.school_name}`);
  console.log(`User A (Sender): ${userA.name} (${userA.email})`);
  console.log(`User B (Receiver): ${userB.name} (${userB.email})`);

  // Clear existing test mails for this organization to avoid duplicates
  await prisma.internalMail.deleteMany({
    where: { organization_id: targetOrg.id }
  });

  const mails = [
    {
      organization_id: targetOrg.id,
      senderId: userA.id,
      receiverId: userB.id,
      subject: 'Welcome to the new Mail System!',
      body: 'Hello, this is a test email to check if the inbox works. You should see this in your Inbox.',
      status: 'SENT' as any,
      isRead: false
    },
    {
      organization_id: targetOrg.id,
      senderId: userB.id,
      receiverId: userA.id,
      subject: 'Re: Welcome to the new Mail System!',
      body: 'Thanks! I received it loud and clear.',
      status: 'SENT' as any,
      isRead: true
    },
    {
      organization_id: targetOrg.id,
      senderId: userA.id,
      receiverId: userB.id,
      subject: 'Draft Email',
      body: 'This is a draft. Do not send yet. It should appear in the Drafts folder of User A.',
      status: 'DRAFT' as any,
      isRead: false
    },
    {
      organization_id: targetOrg.id,
      senderId: userA.id,
      receiverId: userB.id,
      subject: 'Deleted Email from A to B',
      body: 'This email was deleted by the receiver. It should appear in the Trash folder of User B.',
      status: 'SENT' as any,
      isRead: true,
      deletedByReceiver: true
    }
  ];

  for (const mail of mails) {
    await prisma.internalMail.create({ data: mail });
  }

  console.log('Mails seeded successfully! Log in as User A or User B to check the folders.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
