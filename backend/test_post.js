
const http = require("http");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

(async () => {
  const prisma = new PrismaClient();
  const token = jwt.sign({ user_id: "4925dad3-344f-42a1-af9b-30d99686d9b8", role: "SYSTEM_ADMIN", organization_id: "4925dad3-344f-42a1-af9b-30d99686d9b8" }, "supersecret_jwt_key_for_dev_only", { expiresIn: "1d" });
  
  const payload = {
    school_name: "Test Logo Post",
    contact_email: "testpost@example.com",
    logo_url: "/api/uploads/logos/logo.png",
    domain_type: "Platform Domain",
    subdomain: "testpost" + Math.floor(Math.random()*1000),
    admin_email: "admin" + Math.floor(Math.random()*1000) + "@test.com",
    admin_password: "Password123!",
    initial_academic_year: "2026-2027",
    login_limit: 100,
    backup_enabled: false
  };
  
  const data = JSON.stringify(payload);
  const req = http.request({
    hostname: "localhost",
    port: 5000,
    path: "/api/organizations",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data),
      "Authorization": "Bearer " + token
    }
  }, res => {
    let body = "";
    res.on("data", chunk => body += chunk.toString());
    res.on("end", async () => {
      console.log("Response:", body);
      try {
        const parsed = JSON.parse(body);
        const orgId = parsed.organizationId || parsed.id;
        if (orgId) {
          const org = await prisma.organization.findUnique({ where: { id: orgId }});
          console.log("Database Row logo_url:", org ? org.logo_url : "NOT FOUND");
        }
      } catch(e) { console.log(e); }
      prisma.$disconnect();
    });
  });
  
  req.on("error", e => console.log(e));
  req.write(data);
  req.end();
})();

