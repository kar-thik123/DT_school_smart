"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const grades = await prisma.grade.count();
    const sections = await prisma.section.count();
    const subjects = await prisma.subject.count();
    const units = await prisma.unit.count();
    const topics = await prisma.topic.count();
    const topicActivations = await prisma.topicActivation.count();
    const completionTrackings = await prisma.completionTracking.count();
    console.log('DATABASE CURRICULUM STATISTICS:');
    console.log('Grades count:', grades);
    console.log('Sections count:', sections);
    console.log('Subjects count:', subjects);
    console.log('Units count:', units);
    console.log('Topics count:', topics);
    console.log('Topic Activations count:', topicActivations);
    console.log('Completion Trackings count:', completionTrackings);
    if (grades > 0) {
        const sampleGrades = await prisma.grade.findMany({ take: 3 });
        console.log('Sample Grades:');
        sampleGrades.forEach(g => console.log(`- ${g.name} (ID: ${g.id}, Org: ${g.organization_id})`));
    }
}
main()
    .catch(e => console.error(e))
    .finally(async () => {
    await prisma.$disconnect();
});
