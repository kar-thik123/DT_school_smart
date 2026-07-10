const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function makeRequest(path, method, data, token) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : '';
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body || '{}') }));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTestSuite() {
  console.log('--- STARTING HYBRID AUDIT MIDDLEWARE TEST SUITE ---\n');

  try {
    // 1. LOGIN
    console.log('[1/5] Logging in as Admin...');
    const loginRes = await makeRequest('/api/auth/login', 'POST', { email: 'rpcadmin@gmail.com', password: 'password123' });
    if (loginRes.status !== 200) throw new Error('Login failed');
    const token = loginRes.data.token;
    console.log('      Success! Token acquired.\n');

    // 2. CREATE (POST)
    console.log('[2/5] Testing CREATE (POST /api/roles)...');
    const roleName = `Integration Test Role ${Date.now()}`;
    const createRes = await makeRequest('/api/roles', 'POST', { name: roleName, description: 'Testing CREATE mapping' }, token);
    const roleId = createRes.data.id;
    console.log(`      Success! Role Created. Extracted ID: ${roleId}\n`);

    // 3. UPDATE (PUT)
    console.log(`[3/5] Testing UPDATE (PUT /api/roles/${roleId})...`);
    await makeRequest(`/api/roles/${roleId}`, 'PUT', { name: `${roleName} - Updated` }, token);
    console.log('      Success! Role Updated.\n');

    // 4. DELETE (DELETE)
    console.log(`[4/5] Testing DELETE (DELETE /api/roles/${roleId})...`);
    await makeRequest(`/api/roles/${roleId}`, 'DELETE', null, token);
    console.log('      Success! Role Deleted.\n');

    // 5. VERIFY AUDIT LOGS
    console.log('[5/5] Querying Database to Verify Middleware Interception...');
    await new Promise(r => setTimeout(r, 1000)); // allow async middleware to finish

    const logs = await prisma.auditLog.findMany({
      where: { entity_id: roleId },
      orderBy: { timestamp: 'asc' }
    });

    console.log(`      Found ${logs.length} audit logs for entity ${roleId}:`);
    logs.forEach(log => {
      console.log(`      -> [${log.action_type}] on [${log.entity_type}] at ${log.timestamp}`);
    });

    if (logs.length === 3 && logs[0].action_type === 'CREATE' && logs[1].action_type === 'UPDATE' && logs[2].action_type === 'DELETE') {
      console.log('\n✅ TEST SUITE PASSED: The Hybrid Middleware successfully mapped POST, PUT, and DELETE requests universally!');
    } else {
      console.log('\n❌ TEST SUITE FAILED: Expected 3 logs (CREATE, UPDATE, DELETE).');
    }

  } catch (error) {
    console.error('Test Suite Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runTestSuite();
