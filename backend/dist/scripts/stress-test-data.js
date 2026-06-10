"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('⚡ Starting Large Data Stress-Testing Script...');
    // 1. Get references to seed entities
    const org = await prisma.organization.findFirst();
    if (!org) {
        console.error('❌ Error: No organization found. Please run "seed-demo-school.ts" first!');
        process.exit(1);
    }
    const student = await prisma.user.findFirst({
        where: {
            organization_id: org.id,
            role: { name: 'STUDENT' } // or whatever role matches student
        }
    }) || await prisma.user.findFirst({
        where: { organization_id: org.id }
    });
    if (!student) {
        console.error('❌ Error: No user found to assign attempts. Please run "seed-demo-school.ts" first!');
        process.exit(1);
    }
    const topic = await prisma.topic.findFirst({
        where: { organization_id: org.id }
    });
    const subject = await prisma.subject.findFirst({
        where: { organization_id: org.id }
    });
    if (!topic || !subject) {
        console.error('❌ Error: Missing curriculum topics or subjects. Please run "seed-demo-school.ts" first!');
        process.exit(1);
    }
    console.log(`Using Student ID: ${student.id} (${student.name})`);
    console.log(`Using Subject: ${subject.name} (ID: ${subject.id})`);
    console.log(`Using Topic: ${topic.name} (ID: ${topic.id})`);
    // 2. Bulk Insert 1,000 PracticeAttempts using createMany
    console.log('Inserting 1,000 mock PracticeAttempt records...');
    const attemptsToInsert = [];
    const now = new Date();
    for (let i = 1; i <= 1000; i++) {
        const totalQ = 10;
        const correctQ = Math.floor(Math.random() * 11); // 0 to 10 correct
        attemptsToInsert.push({
            organization_id: org.id,
            student_id: student.id,
            subject_id: subject.id,
            topic_id: topic.id,
            total_questions: totalQ,
            correct_answers: correctQ,
            created_at: new Date(now.getTime() - i * 60 * 1000) // subtract minutes to distribute timestamps
        });
    }
    const startTime = Date.now();
    const result = await prisma.practiceAttempt.createMany({
        data: attemptsToInsert
    });
    const duration = Date.now() - startTime;
    console.log(`\n✅ Successfully inserted ${result.count} attempts in ${duration}ms!`);
    // 3. Verify N+1 speed by simulating analytics queries
    console.log('\nValidating database query speed under load...');
    const testStartTime = Date.now();
    const loadedAttempts = await prisma.practiceAttempt.findMany({
        where: { organization_id: org.id },
        take: 1000
    });
    const testDuration = Date.now() - testStartTime;
    console.log(`Retrieved ${loadedAttempts.length} records in ${testDuration}ms!`);
    if (testDuration < 100) {
        console.log('⚡ PERFORMANCE RATING: EXCELLENT (database indexes are operating cleanly!)');
    }
    else {
        console.log('⚠️ PERFORMANCE RATING: SLOW (check database connectivity and connection pool)');
    }
}
main()
    .catch((e) => {
    console.error('❌ Error during stress-test execution:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
