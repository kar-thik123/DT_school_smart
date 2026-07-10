const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTest() {
  console.log('1. Logging in to get token...');
  
  const loginData = JSON.stringify({ email: 'rpcadmin@gmail.com', password: 'password123' });
  const loginReq = http.request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const parsed = JSON.parse(data);
      if (!parsed.token) {
        console.error('Login failed!', parsed);
        process.exit(1);
      }
      console.log('Login successful.');
      const token = parsed.token;
      
      console.log('2. Triggering POST /api/roles to create a dummy role...');
      const roleData = JSON.stringify({ name: `Test Role ${Date.now()}`, description: 'Created by audit middleware test script' });
      
      const roleReq = http.request({
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/roles',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(roleData),
          'Authorization': `Bearer ${token}`
        }
      }, (roleRes) => {
        let rData = '';
        roleRes.on('data', chunk => rData += chunk);
        roleRes.on('end', async () => {
          console.log(`Role Creation API Status: ${roleRes.statusCode}`);
          console.log(`Role Response: ${rData}`);
          
          console.log('3. Checking Audit Log database table...');
          // Wait 1 second for the async middleware to write to the DB
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const latestLog = await prisma.auditLog.findFirst({
            orderBy: { timestamp: 'desc' }
          });
          
          console.log('\n--- LATEST AUDIT LOG ---');
          console.dir(latestLog, { depth: null });
          console.log('------------------------\n');
          
          if (latestLog && latestLog.action_type === 'CREATE' && latestLog.entity_type === 'ROLE') {
            console.log('SUCCESS: The Hybrid Middleware automatically captured the POST request and mapped it perfectly!');
          } else {
            console.log('FAILED: The middleware did not log the event as expected.');
          }
          
          process.exit(0);
        });
      });
      roleReq.write(roleData);
      roleReq.end();
    });
  });
  loginReq.write(loginData);
  loginReq.end();
}

runTest().catch(console.error);
