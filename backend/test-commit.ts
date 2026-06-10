import prisma from './src/prisma';
import { UserProcessor } from './src/services/bulk-import/processors/user.processor';

async function run() {
  try {
    const org = await prisma.organization.findFirst();
    if (!org) return;

    const proc = new UserProcessor(org.id, "dummy-user-id", "dummy-year-id");
    
    // Simulate commit
    const result = await proc.commit([
      {
        name: "Test User",
        email: "test.commit.bug@example.com",
        password: "Password123",
        role_id: "721759ea-44a6-48c0-bc6f-e3802cecd3a1", // Any UUID
        is_active: true
      }
    ]);
    console.log("Success:", result);
  } catch(e) {
    console.error("Error thrown:", e);
  }
}

run().finally(() => prisma.$disconnect());
