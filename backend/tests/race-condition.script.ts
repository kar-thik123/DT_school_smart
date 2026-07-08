import * as http from "http";
import { IncomingMessage, RequestOptions } from "http";

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_URL = "http://127.0.0.1:5000/api/teacher-assignments";
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZGFhYzJkMjQtNjNhMC00NTZiLWE3YjYtYWEzODBkMjNiMTRlIiwib3JnYW5pemF0aW9uX2lkIjoiODFiODRlNTYtMjc2ZS00ZjZhLThlNGUtYmYxZDkwYWZkNWI2IiwiaWF0IjoxNzgzNDIwOTU1LCJleHAiOjE3ODM1MDczNTV9.X4Qd4oiR5oMw_GRkuoXloe_6sU6s15AqhBku4BEVgBo";

const payload = JSON.stringify({
  teacher_id: "d09b0b0e-d85f-44f3-83d4-3fda4819b036",

  assignment_type: "SUBJECT_TEACHER",
  grade_id: "61b3ba95-7f45-41d8-87f9-fee21eddbc56",
  section_id: "5a414629-f463-47a7-80ff-e3355896a13e",
  subject_id: "646f3f45-d003-4ad1-8cc8-9e827178eec7",
});

const headers = {
  "Content-Type": "application/json",
  "Content-Length": Buffer.byteLength(payload),
  Authorization: `Bearer ${AUTH_TOKEN}`,
};

// ============================================================================

interface ApiResult {
  request: number;
  status: number | string;
  response: any;
}

function fireRequest(requestNumber: number): Promise<ApiResult> {
  return new Promise((resolve) => {
    const url = new URL(API_URL);

    const options: RequestOptions = {
      hostname: url.hostname,
      port: Number(url.port),
      path: url.pathname + url.search,
      method: "POST",
      headers,
    };

    const req = http.request(options, (res: IncomingMessage) => {
      let data = "";

      res.on("data", (chunk: Buffer) => {
        data += chunk.toString();
      });

      res.on("end", () => {
        let parsed: any;

        try {
          parsed = data ? JSON.parse(data) : {};
        } catch {
          parsed = {
            raw: data,
          };
        }

        resolve({
          request: requestNumber,
          status: res.statusCode ?? 0,
          response: parsed,
        });
      });
    });

    req.on("error", (err: Error) => {
      resolve({
        request: requestNumber,
        status: "NETWORK_ERROR",
        response: {
          message: err.message || JSON.stringify(err),
        },
      });
    });

    req.write(payload);
    req.end();
  });
}

async function testRaceCondition(): Promise<void> {
  console.log("🔥 Sending two simultaneous requests...\n");

  const results = await Promise.allSettled<ApiResult>([
    fireRequest(1),
    fireRequest(2),
  ]);

  console.log("================ RESULTS ================\n");

  for (const result of results) {
    if (result.status === "rejected") {
      console.log("❌ Request Failed");
      console.log(result.reason);
      console.log("-----------------------------------------");
      continue;
    }

    const { request, status, response } = result.value;

    switch (status) {
      case 201:
        console.log(`✅ Request ${request}: SUCCESS (${status})`);
        console.log(`Message: ${response.message}`);
        break;

      case 409:
        console.log(`⚠️ Request ${request}: DUPLICATE BLOCKED (${status})`);
        console.log(`Message: ${response.message}`);
        break;

      case 400:
        console.log(`❌ Request ${request}: BAD REQUEST (${status})`);
        console.log(response);
        break;

      case 401:
        console.log(`❌ Request ${request}: UNAUTHORIZED (${status})`);
        console.log("Check your Bearer token.");
        break;

      case 403:
        console.log(`❌ Request ${request}: FORBIDDEN (${status})`);
        console.log(response);
        break;

      case 500:
        console.log(`❌ Request ${request}: INTERNAL SERVER ERROR (${status})`);
        console.log(response);
        break;

      case "NETWORK_ERROR":
        console.log(`❌ Request ${request}: NETWORK ERROR`);
        console.log(`Message: ${response.message}`);
        break;

      default:
        console.log(`ℹ️ Request ${request}: STATUS ${status}`);
        console.log(response);
    }

    console.log("-----------------------------------------");
  }

  console.log("\n🏁 Test completed.");
}

testRaceCondition().catch((err: Error) => {
  console.error("Unexpected Error:");
  console.error(err);
});
