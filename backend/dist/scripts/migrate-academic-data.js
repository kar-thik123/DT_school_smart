"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const prisma_1 = __importDefault(require("../prisma"));
async function main() {
    console.log('Starting silent data migration using raw SQL to bypass TypeScript schema checks...');
    // Find all active students with a valid section
    const studentRole = await prisma_1.default.role.findFirst({
        where: { name: { in: ['STUDENT', 'Student'] } }
    });
    if (!studentRole) {
        console.error('Student role not found. Aborting.');
        return;
    }
    const students = await prisma_1.default.user.findMany({
        where: {
            role_id: studentRole.id,
            is_active: true,
            section_id: { not: null },
            grade_id: { not: null }
        }
    });
    console.log(`Found ${students.length} active students with defined sections/grades.`);
    let newMappings = 0;
    for (const student of students) {
        if (!student.grade_id)
            continue;
        const subjects = await prisma_1.default.subject.findMany({
            where: { grade_id: student.grade_id, organization_id: student.organization_id }
        });
        for (const subject of subjects) {
            const id = require('crypto').randomUUID();
            // Upsert logic in raw sql
            const query = `
        INSERT INTO "student_subject_mapping" 
        ("id", "organization_id", "student_id", "subject_id", "subject_type")
        VALUES 
        (CAST($1 AS UUID), CAST($2 AS UUID), CAST($3 AS UUID), CAST($4 AS UUID), 'MANDATORY')
        ON CONFLICT ("student_id", "subject_id") DO NOTHING;
      `;
            const result = await prisma_1.default.$executeRawUnsafe(query, id, student.organization_id, student.id, subject.id);
            if (result)
                newMappings++;
        }
    }
    console.log(`Processed ${newMappings} new student-subject relationships (idempotent).`);
}
main().catch(e => {
    console.error('[Migration Error]', e.message);
    process.exit(1);
});
