const jwt = require('jsonwebtoken');

async function test() {
  const token = jwt.sign({
    user_id: '765048a1-7bb4-4704-8ae8-77a1eb9f1809',
    organization_id: '4383d24a-6f60-4061-8cdf-84a6b22e3b39',
  }, process.env.JWT_SECRET || 'supersecret_jwt_key_for_dev_only');

  try {
    const res = await fetch('http://localhost:5000/api/bulk-import/users/commit', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        validRows: [
          {
            name: "Test User",
            email: "test.route@example.com",
            password: "Password123",
            role_id: "721759ea-44a6-48c0-bc6f-e3802cecd3a1",
            is_active: true
          }
        ]
      })
    });
    const data = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", data);
  } catch (e) {
    console.log("Fetch error:", e.message);
  }
}

test();
