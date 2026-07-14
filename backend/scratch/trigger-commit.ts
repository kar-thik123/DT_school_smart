import http from 'http';
import jwt from 'jsonwebtoken';

// Helper to make POST requests
function post(path: string, headers: any, body: any): Promise<{ status: number, body: any }> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers
      }
    }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode || 0, body: JSON.parse(responseBody) });
        } catch {
          resolve({ status: res.statusCode || 0, body: responseBody });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Helper to make multipart analyze request
function postMultipart(token: string, csvContent: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const filename = 'import.csv';
    
    let body = `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`;
    body += 'Content-Type: text/csv\r\n\r\n';
    body += csvContent + '\r\n';
    body += `--${boundary}--\r\n`;

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/bulk-import/users/analyze',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseBody));
        } catch {
          resolve(responseBody);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  console.log('Generating JWT Token directly...');
  const token = jwt.sign(
    {
      user_id: 'daac2d24-63a0-456b-a7b6-aa380d23b14e',
      organization_id: '81b84e56-276e-4f6a-8e4e-bf1d90afd5b6',
      role: 'SUPER_ADMIN'
    },
    'supersecret_jwt_key_for_dev_only',
    { expiresIn: '1d' }
  );

  // CSV content with 1 valid teacher row and 1 student row (role STUDENT)
  const csvContent = 
    `Name,Email,Role,Roll Number,Admission Number,Mobile Number,Password\n` +
    `Unique User A,unique_a_${Date.now()}@example.com,TEACHER,,,,password123\n` +
    `Unique User B,unique_b_${Date.now()}@example.com,STUDENT,,ADM_TEST_${Date.now()},9800000099,password123\n`;

  console.log('Analyzing CSV...');
  const analyzeRes = await postMultipart(token, csvContent);
  console.log('Analyze Response:', JSON.stringify(analyzeRes, null, 2));

  const jobId = analyzeRes.jobId;
  if (!jobId) {
    console.error('Failed to get jobId from analyze');
    return;
  }

  console.log('Committing Job:', jobId);
  const commitRes = await post('/api/bulk-import/users/commit', {
    'Authorization': `Bearer ${token}`
  }, { jobId });

  console.log('Commit Response Status:', commitRes.status);
  console.log('Commit Response Body:', JSON.stringify(commitRes.body, null, 2));
}

run().catch(console.error);
