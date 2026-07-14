import supertest from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';

async function run() {
  console.log("========== SIMULATING BROWSER REQUEST ==========");
  
  // 1. Generate SUPER_ADMIN token matching user2@example.com (KMHSS)
  const token = jwt.sign(
    {
      user_id: '4adaff7f-b41d-4ef2-b185-75e8228d41e6',
      organization_id: '0f928784-d039-436b-bc42-0e17fb33fd8c',
      role: 'SUPER_ADMIN'
    },
    'supersecret_jwt_key_for_dev_only',
    { expiresIn: '1d' }
  );

  // CSV content matching typical browser upload
  const csvContent = 
    `Name,Email,Role,Roll Number,Admission Number,Mobile Number,Password\n` +
    `Browser User A,browser_a_${Date.now()}@example.com,TEACHER,,,,Password123\n` +
    `Browser User B,browser_b_${Date.now()}@example.com,TEACHER,,,,Password123\n`;

  // 2. Trigger Analyze Phase
  console.log("Triggering POST /api/bulk-import/users/analyze...");
  const analyzeRes = await supertest(app)
    .post('/api/bulk-import/users/analyze')
    .set('Authorization', `Bearer ${token}`)
    .attach('file', Buffer.from(csvContent), 'import.csv');

  console.log("Analyze Response Status:", analyzeRes.status);
  const jobId = analyzeRes.body.jobId;
  console.log("Resolved Job ID:", jobId);

  if (!jobId) {
    console.error("Job ID not generated!");
    return;
  }

  // 3. Trigger Commit Phase
  console.log("Triggering POST /api/bulk-import/users/commit...");
  const commitRes = await supertest(app)
    .post('/api/bulk-import/users/commit')
    .set('Authorization', `Bearer ${token}`)
    .send({ jobId });

  console.log("Commit Response Status:", commitRes.status);
  console.log("Commit Response Body:", JSON.stringify(commitRes.body, null, 2));
  console.log("=================================================");
}

run().catch(console.error);
