"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🚀 Starting Demo School Seed Script...');
    // 1. Get or Create Organization
    let org = await prisma.organization.findFirst();
    if (!org) {
        org = await prisma.organization.create({
            data: {
                school_name: 'Demo Premier School',
                subdomain: 'demopremier'
            }
        });
        console.log(`Created Organization: ${org.school_name}`);
    }
    else {
        console.log(`Using Existing Organization: ${org.school_name}`);
    }
    const orgId = org.id;
    // 2. Get or Create Academic Year
    let academicYear = await prisma.academicYear.findFirst({
        where: { organization_id: orgId }
    });
    if (!academicYear) {
        academicYear = await prisma.academicYear.create({
            data: {
                name: '2026-2027',
                is_active: true,
                organization_id: orgId
            }
        });
        console.log(`Created Academic Year: ${academicYear.name}`);
    }
    else {
        console.log(`Using Academic Year: ${academicYear.name}`);
    }
    const yearId = academicYear.id;
    // 3. Get or Create Board
    let board = await prisma.board.findFirst({
        where: { organization_id: orgId }
    });
    if (!board) {
        board = await prisma.board.create({
            data: {
                name: 'Central Board',
                organization_id: orgId
            }
        });
        console.log(`Created Board: ${board.name}`);
    }
    else {
        console.log(`Using Board: ${board.name}`);
    }
    // 4. Create Grades & Sections
    const gradeNames = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];
    const sectionNames = ['Section A', 'Section B'];
    const createdGrades = [];
    const createdSections = [];
    for (const gName of gradeNames) {
        let grade = await prisma.grade.findFirst({
            where: { name: gName, organization_id: orgId, academic_year_id: yearId }
        });
        if (!grade) {
            grade = await prisma.grade.create({
                data: {
                    name: gName,
                    organization_id: orgId,
                    academic_year_id: yearId
                }
            });
        }
        createdGrades.push(grade);
        for (const sName of sectionNames) {
            let section = await prisma.section.findFirst({
                where: { name: sName, grade_id: grade.id, organization_id: orgId }
            });
            if (!section) {
                section = await prisma.section.create({
                    data: {
                        name: sName,
                        grade_id: grade.id,
                        organization_id: orgId
                    }
                });
            }
            createdSections.push(section);
        }
    }
    console.log(`✅ Loaded ${createdGrades.length} Grades and ${createdSections.length} Sections`);
    // 5. Create Core Subjects & Curriculum: Syllabus, Units, Topics & Subtopics
    const subjectList = [
        { name: 'Mathematics' },
        { name: 'Physics' },
        { name: 'Chemistry' },
        { name: 'English Literature' }
    ];
    let syllabusCount = 0;
    let unitCount = 0;
    let topicCount = 0;
    let subtopicCount = 0;
    for (const grade of createdGrades) {
        for (const sObj of subjectList) {
            // Find or Create Subject for this specific Grade
            let subject = await prisma.subject.findFirst({
                where: { name: sObj.name, grade_id: grade.id, organization_id: orgId }
            });
            if (!subject) {
                subject = await prisma.subject.create({
                    data: {
                        name: sObj.name,
                        grade_id: grade.id,
                        organization_id: orgId
                    }
                });
            }
            // Find or Create Syllabus for this Subject
            let syllabus = await prisma.syllabus.findFirst({
                where: { subject_id: subject.id, board_id: board.id, organization_id: orgId }
            });
            if (!syllabus) {
                syllabus = await prisma.syllabus.create({
                    data: {
                        organization_id: orgId,
                        subject_id: subject.id,
                        board_id: board.id
                    }
                });
            }
            syllabusCount++;
            // Create 2 Units per Syllabus
            for (let u = 1; u <= 2; u++) {
                const uName = `Unit ${u}: ${subject.name} Fundamentals`;
                let unit = await prisma.unit.findFirst({
                    where: { name: uName, syllabus_id: syllabus.id }
                });
                if (!unit) {
                    unit = await prisma.unit.create({
                        data: {
                            name: uName,
                            organization_id: orgId,
                            grade_id: grade.id,
                            section_id: null,
                            subject_id: subject.id,
                            syllabus_id: syllabus.id
                        }
                    });
                }
                unitCount++;
                // Create 2 Topics per Unit
                for (let t = 1; t <= 2; t++) {
                    const tName = `Topic ${u}.${t}: Core ${subject.name} Concepts`;
                    let topic = await prisma.topic.findFirst({
                        where: { name: tName, unit_id: unit.id }
                    });
                    if (!topic) {
                        topic = await prisma.topic.create({
                            data: {
                                name: tName,
                                organization_id: orgId,
                                unit_id: unit.id
                            }
                        });
                    }
                    topicCount++;
                    // Create 2 Subtopics per Topic
                    for (let st = 1; st <= 2; st++) {
                        const stName = `Subtopic ${u}.${t}.${st}: Applied ${subject.name}`;
                        let subtopic = await prisma.subTopic.findFirst({
                            where: { name: stName, topic_id: topic.id }
                        });
                        if (!subtopic) {
                            subtopic = await prisma.subTopic.create({
                                data: {
                                    name: stName,
                                    organization_id: orgId,
                                    topic_id: topic.id
                                }
                            });
                        }
                        subtopicCount++;
                    }
                }
            }
        }
    }
    console.log(`✅ Curriculum Populated: ${syllabusCount} Syllabi, ${unitCount} Units, ${topicCount} Topics, ${subtopicCount} Subtopics`);
    // 6. Create Demo Teachers & Assignments
    const teacherData = [
        { name: 'Alice Cooper', email: 'alice.cooper@schoolsaas.com' },
        { name: 'Robert Plant', email: 'robert.plant@schoolsaas.com' }
    ];
    const passwordHash = await bcrypt_1.default.hash('Demo@123', 10);
    // Find standard teacher role
    let teacherRole = await prisma.role.findFirst({
        where: { name: 'TEACHER', organization_id: orgId }
    });
    if (!teacherRole) {
        teacherRole = await prisma.role.create({
            data: {
                name: 'TEACHER',
                description: 'Standard Classroom Teacher',
                is_system: true,
                organization_id: orgId
            }
        });
    }
    const createdTeachers = [];
    for (const tObj of teacherData) {
        let user = await prisma.user.findUnique({
            where: { email: tObj.email }
        });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    name: tObj.name,
                    email: tObj.email,
                    password_hash: passwordHash,
                    role_id: teacherRole.id,
                    organization_id: orgId
                }
            });
        }
        createdTeachers.push(user);
    }
    console.log(`✅ Loaded Demo Teachers: ${createdTeachers.map(t => t.name).join(', ')}`);
    // Create assignments
    // Assign Teacher 1 to Grade 9 Math, Section A
    const grade9 = createdGrades.find(g => g.name === 'Grade 9');
    const section9A = createdSections.find(s => s.name === 'Section A' && s.grade_id === grade9?.id);
    if (grade9 && section9A) {
        const mathSubject = await prisma.subject.findFirst({
            where: { name: 'Mathematics', grade_id: grade9.id, organization_id: orgId }
        });
        if (mathSubject) {
            const existingAssign = await prisma.teacherAssignment.findFirst({
                where: {
                    teacher_id: createdTeachers[0].id,
                    grade_id: grade9.id,
                    section_id: section9A.id,
                    subject_id: mathSubject.id
                }
            });
            if (!existingAssign) {
                await prisma.teacherAssignment.create({
                    data: {
                        organization_id: orgId,
                        academic_year_id: yearId,
                        teacher_id: createdTeachers[0].id,
                        assignment_type: 'SUBJECT_TEACHER',
                        grade_id: grade9.id,
                        section_id: section9A.id,
                        subject_id: mathSubject.id
                    }
                });
                console.log(`✅ Assigned ${createdTeachers[0].name} to Grade 9 Math`);
            }
        }
    }
    // 7. Seed Real Audit Log events
    const auditLogsToSeed = [
        { action: 'CREATE', type: 'SYLLABUS', desc: 'Syllabus structure created for Grade 9 Mathematics' },
        { action: 'ASSIGN', type: 'TEACHER_ASSIGNMENT', desc: 'Assigned teacher Alice Cooper to Grade 9 Section A Mathematics' },
        { action: 'IMPORT', type: 'QUESTION', desc: 'Imported 125 core curriculum questions via Excel Question Importer' },
        { action: 'TOGGLE', type: 'COMPLETION', desc: 'Alice Cooper marked Unit 1: Mathematics Fundamentals as active and completed' }
    ];
    for (const logItem of auditLogsToSeed) {
        await prisma.auditLog.create({
            data: {
                organization_id: orgId,
                user_id: createdTeachers[0].id,
                user_name: createdTeachers[0].name,
                action_type: logItem.action,
                entity_type: logItem.type,
                entity_id: 'SYSTEM',
                metadata: { description: logItem.desc }
            }
        });
    }
    console.log(`✅ Seeded ${auditLogsToSeed.length} live system Audit Log records`);
    console.log('🎉 Seed Completed Successfully!');
}
main()
    .catch((e) => {
    console.error('❌ Error during demo seed execution:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
