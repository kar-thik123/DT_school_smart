const jwt = require('jsonwebtoken');

async function testProvisioning() {
  const token = jwt.sign(
    {
      user_id: '4925dad3-344f-42a1-af9b-30d99686d9b8',
      organization_id: '03cbb38d-03f5-4bda-a0b3-e402ae3cc870'
    },
    process.env.JWT_SECRET || 'supersecret_jwt_key_for_dev_only',
    { expiresIn: '1d' }
  );

  const payloads = [
    {
      school_name: 'Test SaaS',
      contact_email: 'saas@example.com',
      domain_type: 'subdomain',
      subdomain: 'test-saas',
      licensed_seats: 10,
      admin_name: 'SaaS Admin',
      admin_email: 'admin@test-saas.com',
      admin_password: 'Password123!',
      backup_enabled: true
    },
    {
      school_name: 'Test Custom Domain',
      contact_email: 'custom@example.com',
      domain_type: 'custom',
      custom_domain: 'test-custom.com',
      licensed_seats: 10,
      admin_name: 'Custom Admin',
      admin_email: 'admin@test-custom.com',
      admin_password: 'Password123!',
      backup_enabled: true
    },
    {
      school_name: 'Test On Premise',
      contact_email: 'onprem@example.com',
      domain_type: 'on_premise',
      licensed_seats: 10,
      admin_name: 'OnPrem Admin',
      admin_email: 'admin@test-onprem.com',
      admin_password: 'Password123!',
      backup_enabled: true
    }
  ];

  for (const payload of payloads) {
    try {
      const response = await fetch('http://localhost:5000/api/organizations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      console.log(`Response for ${payload.domain_type}:`, data);
    } catch (err) {
      console.error(`Error for ${payload.domain_type}:`, err);
    }
  }
}

testProvisioning();
