"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🚀 Starting KMSS Academic Structure Seeding...');
    // 1. Get KMSS organization
    const org = await prisma.organization.findUnique({
        where: { subdomain: 'KMSS' }
    });
    if (!org) {
        console.error('❌ KMSS Organization not found!');
        return;
    }
    const orgId = org.id;
    console.log(`KMSS Org ID: ${orgId}`);
    // 2. Find or Create Academic Year
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
        console.log(`Using Existing Academic Year: ${academicYear.name}`);
    }
    const yearId = academicYear.id;
    // 3. Find or Create Board
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
        console.log(`Using Existing Board: ${board.name}`);
    }
    // 4. Create Grades & Sections
    const gradeNames = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];
    const sectionNames = ['Section A', 'Section B'];
    const createdGrades = [];
    const createdSections = [];
    for (const gName of gradeNames) {
        // Strip "Grade " prefix before DB query/insertion as per system normalization
        const normalizedName = gName.replace(/^grade\s*/i, '').trim();
        let grade = await prisma.grade.findFirst({
            where: { name: normalizedName, organization_id: orgId, academic_year_id: yearId }
        });
        if (!grade) {
            grade = await prisma.grade.create({
                data: {
                    name: normalizedName,
                    organization_id: orgId,
                    academic_year_id: yearId
                }
            });
            console.log(`Created Grade: ${grade.name}`);
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
                console.log(`  Created Section: ${section.name} for Grade ${grade.name}`);
            }
            createdSections.push(section);
        }
    }
    // 5. Create Core Subjects
    const subjectNames = ['Mathematics', 'Physics', 'Chemistry', 'English Literature'];
    for (const grade of createdGrades) {
        for (const subName of subjectNames) {
            let subject = await prisma.subject.findFirst({
                where: { name: subName, grade_id: grade.id, organization_id: orgId }
            });
            if (!subject) {
                subject = await prisma.subject.create({
                    data: {
                        name: subName,
                        grade_id: grade.id,
                        organization_id: orgId
                    }
                });
                console.log(`  Created Subject: ${subject.name} for Grade ${grade.name}`);
            }
            // Link to sections via Default Subject Groups
            const gradeSections = createdSections.filter(s => s.grade_id === grade.id);
            for (const sec of gradeSections) {
                const groupName = `${grade.name} - ${sec.name} (Default)`;
                let defaultGroup = await prisma.subjectGroup.findFirst({
                    where: {
                        name: groupName,
                        grade_id: grade.id,
                        section_id: sec.id,
                        organization_id: orgId
                    }
                });
                if (!defaultGroup) {
                    defaultGroup = await prisma.subjectGroup.create({
                        data: {
                            name: groupName,
                            grade_id: grade.id,
                            section_id: sec.id,
                            organization_id: orgId
                        }
                    });
                    console.log(`    Created default SubjectGroup: ${defaultGroup.name}`);
                }
                // Link Subject to default group
                const existingLink = await prisma.subjectGroupSubject.findFirst({
                    where: { group_id: defaultGroup.id, subject_id: subject.id }
                });
                if (!existingLink) {
                    await prisma.subjectGroupSubject.create({
                        data: {
                            group_id: defaultGroup.id,
                            subject_id: subject.id,
                            subject_type: 'MANDATORY'
                        }
                    });
                }
            }
        }
    }
    console.log('🎉 KMSS Academic Structure Seeding Complete!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
