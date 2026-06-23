// ========================================
// MASTER SEED LOGIN CREDENTIALS
// ========================================

// COMMON PASSWORD FOR ALL USERS:
// password123

// ========================================
// SUPER ADMIN USER
// ========================================

// 1.
// Email : superadmin@masterseed.com
// Password : password123

// ========================================
// MANAGEMENT USERS
// ========================================

// 1.
// Email : admin1@masterseed.com
// Password : password123

// 2.
// Email : admin2@masterseed.com
// Password : password123

// ========================================
// TEACHER USERS
// ========================================

// 1.
// Email : teacher1@masterseed.com
// Password : password123

// 2.
// Email : teacher2@masterseed.com
// Password : password123

// 3.
// Email : teacher3@masterseed.com
// Password : password123

// 4.
// Email : teacher4@masterseed.com
// Password : password123

// 5.
// Email : teacher5@masterseed.com
// Password : password123

// ========================================
// STUDENT USERS
// ========================================

// 1.
// Email : student1@masterseed.com
// Password : password123

// 2.
// Email : student2@masterseed.com
// Password : password123

// 3.
// Email : student3@masterseed.com
// Password : password123

// 4.
// Email : student4@masterseed.com
// Password : password123

// 5.
// Email : student5@masterseed.com
// Password : password123

// 6.
// Email : student6@masterseed.com
// Password : password123

// 7.
// Email : student7@masterseed.com
// Password : password123

// 8.
// Email : student8@masterseed.com
// Password : password123

// 9.
// Email : student9@masterseed.com
// Password : password123

// 10.
// Email : student10@masterseed.com
// Password : password123

// ========================================


import { PrismaClient, AssignmentType, EnrollmentStatus, QuestionType, DifficultyLevel } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting master seed script...');

  // 1. Organization & License
  const org = await prisma.organization.upsert({
    where: { subdomain: 'masterseed' },
    update: {},
    create: {
      school_name: 'Master Seed Academy',
      subdomain: 'masterseed',
      status: 'ACTIVE',
      domain_type: 'subdomain',
      login_limit: 1000,
    }
  });
  console.log(`Organization created: ${org.school_name}`);

  await prisma.organizationLicense.upsert({
    where: { organization_id: org.id },
    update: {},
    create: {
      organization_id: org.id,
      licensed_seats: 1000,
      status: 'ACTIVE',
      grace_period_days: 7,
      warning_threshold: 80,
      renewal_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    }
  });

  // 2. Base Settings (Board & Medium)
  const board = await prisma.board.upsert({
    where: { name_organization_id: { name: 'CBSE', organization_id: org.id } },
    update: {},
    create: { name: 'CBSE', organization_id: org.id }
  });

  const medium = await prisma.medium.upsert({
    where: { name_organization_id: { name: 'English', organization_id: org.id } },
    update: {},
    create: { name: 'English', organization_id: org.id }
  });

  // 3. Permissions
  const permissionsData = [
    { module: 'IDENTITY', action: 'IS_MANAGEMENT', description: 'Management role identifier' },
    { module: 'IDENTITY', action: 'IS_TEACHER', description: 'Teacher role identifier' },
    { module: 'IDENTITY', action: 'IS_STUDENT', description: 'Student role identifier' },
    { module: 'ACADEMIC_STRUCTURE', action: 'VIEW', description: 'Read academic data' },
    { module: 'ACADEMIC_STRUCTURE', action: 'UPDATE', description: 'Edit academic data' },
    { module: 'EXAMINATION', action: 'VIEW', description: 'View examinations' },
    { module: 'EXAMINATION', action: 'MANAGE', description: 'Manage examinations' },
  ];

  const permissions = [];
  for (const p of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: { module_action: { module: p.module, action: p.action } },
      update: {},
      create: p
    });
    permissions.push(perm);
  }

  // 4. Roles
  const rolesData = [
    { name: 'SUPER_ADMIN', permissions: ['IS_MANAGEMENT', 'VIEW', 'UPDATE', 'MANAGE'] },
    { name: 'MANAGEMENT', permissions: ['IS_MANAGEMENT', 'VIEW', 'UPDATE', 'MANAGE'] },
    { name: 'TEACHER', permissions: ['IS_TEACHER', 'VIEW'] },
    { name: 'STUDENT', permissions: ['IS_STUDENT', 'VIEW'] }
  ];

  const roleMap: Record<string, string> = {};
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name_organization_id: { name: r.name, organization_id: org.id } },
      update: {},
      create: {
        name: r.name,
        organization_id: org.id,
        is_system: false,
      }
    });
    roleMap[r.name] = role.id;

    for (const pAction of r.permissions) {
      // Find all permissions with this action to grant them all, 
      // or specify module:action in the array to be precise. For simplicity, grant all matching actions.
      const perms = permissions.filter(p => p.action === pAction);
      for (const perm of perms) {
        await prisma.rolePermission.upsert({
          where: { role_id_permission_id: { role_id: role.id, permission_id: perm.id } },
          update: {},
          create: { role_id: role.id, permission_id: perm.id }
        });
      }
    }
  }

  // 5. Academic Structure (Years, Grades, Sections, Subjects, Subject Groups)
  const academicYear = await prisma.academicYear.upsert({
    where: { name_organization_id: { name: '2025-2026', organization_id: org.id } },
    update: {},
    create: {
      name: '2025-2026',
      organization_id: org.id,
      is_active: true,
      start_date: new Date('2025-04-01'),
      end_date: new Date('2026-03-31')
    }
  });

  const grades = ['10th', '11th'];
  const sections = ['A', 'B', 'C', 'D', 'E'];
  const gradeRecords = [];
  const sectionRecords = [];
  const subjectGroupRecords = [];
  const subjectRecords = [];

  for (const gName of grades) {
    const grade = await prisma.grade.upsert({
      where: { name_academic_year_id_organization_id: { name: gName, academic_year_id: academicYear.id, organization_id: org.id } },
      update: {},
      create: { name: gName, academic_year_id: academicYear.id, organization_id: org.id }
    });
    gradeRecords.push(grade);

    // Subjects per grade
    const subjects = [
      'Mathematics',
      'Science',
      'English',
      'Social Science',
      'Computer Science'
    ];
    for (const subjName of subjects) {
      const subject = await prisma.subject.upsert({
        where: { name_grade_id_organization_id: { name: subjName, grade_id: grade.id, organization_id: org.id } },
        update: {},
        create: { name: subjName, grade_id: grade.id, organization_id: org.id }
      });
      subjectRecords.push(subject);
    }

    for (const sName of sections) {
      const section = await prisma.section.upsert({
        where: { name_grade_id_organization_id: { name: sName, grade_id: grade.id, organization_id: org.id } },
        update: {},
        create: { name: sName, grade_id: grade.id, organization_id: org.id, capacity: 40 }
      });
      sectionRecords.push(section);

      // Subject Group per section
      const groupName = `${gName}-${sName}-Core`;
      const subjectGroup = await prisma.subjectGroup.upsert({
        where: { name_grade_id_section_id_organization_id: { name: groupName, grade_id: grade.id, section_id: section.id, organization_id: org.id } },
        update: {},
        create: { name: groupName, grade_id: grade.id, section_id: section.id, organization_id: org.id }
      });
      subjectGroupRecords.push(subjectGroup);
    }
  }

  // 6. Users
  const password_hash = await bcrypt.hash('password123', 10);
  const allUsers = [];

  const createUser = async (name: string, email: string, roleName: string, gradeId?: string, sectionId?: string) => {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name,
        email,
        password_hash,
        role_id: roleMap[roleName],
        organization_id: org.id,
        grade_id: gradeId || null,
        section_id: sectionId || null
      }
    });

    if (roleName === 'STUDENT') {
      await prisma.studentProfile.upsert({
        where: { user_id: user.id },
        update: {},
        create: {
          user_id: user.id,
          organization_id: org.id,
          admission_number: `ADM-${Math.floor(Math.random() * 10000)}`,
        }
      });
    }

    allUsers.push(user);
    return user;
  };

  // Super Admin
  const superAdmin = await createUser('Super Admin', 'superadmin@masterseed.com', 'SUPER_ADMIN');

  // Management
  const mgt1 = await createUser('Admin One', 'admin1@masterseed.com', 'MANAGEMENT');
  const mgt2 = await createUser('Admin Two', 'admin2@masterseed.com', 'MANAGEMENT');

  // Teachers
  const teachers = [];
  for (let i = 1; i <= 5; i++) {
    const t = await createUser(`Teacher ${i}`, `teacher${i}@masterseed.com`, 'TEACHER');
    teachers.push(t);
  }

  // Students & Enrollments
  for (let i = 1; i <= 10; i++) {
    const grade = gradeRecords[i % 2];
    const section = sectionRecords.filter(s => s.grade_id === grade.id)[i % 5];
    const group = subjectGroupRecords.find(sg => sg.section_id === section.id);

    const student = await createUser(`Student ${i}`, `student${i}@masterseed.com`, 'STUDENT', grade.id, section.id);

    await prisma.studentEnrollment.upsert({
      where: { student_id_academic_year_id_organization_id: { student_id: student.id, academic_year_id: academicYear.id, organization_id: org.id } },
      update: {},
      create: {
        organization_id: org.id,
        student_id: student.id,
        academic_year_id: academicYear.id,
        grade_id: grade.id,
        section_id: section.id,
        subject_group_id: group?.id,
        status: EnrollmentStatus.ACTIVE
      }
    });

    if (group) {
      await prisma.studentGroupMapping.upsert({
        where: { student_id_group_id: { student_id: student.id, group_id: group.id } },
        update: {},
        create: {
          organization_id: org.id,
          student_id: student.id,
          group_id: group.id
        }
      });
    }
  }

  // 7. Teacher Assignments
  for (let i = 0; i < teachers.length; i++) {
    const t = teachers[i];
    const grade = gradeRecords[0];
    const subject = subjectRecords.find(s => s.grade_id === grade.id);

    await prisma.teacherAssignment.create({
      data: {
        organization_id: org.id,
        academic_year_id: academicYear.id,
        teacher_id: t.id,
        assignment_type: AssignmentType.SUBJECT_TEACHER,
        grade_id: grade.id,
        subject_id: subject?.id
      }
    });
  }

  // 8. Curriculum Structure & Questions
  console.log('Generating curriculum and questions...');
  
  const questionBank: Record<string, any[]> = {
    Mathematics: [
      { question: 'What is the value of 12 × 8?', options: ['96', '88', '108', '92'], answer: '96' },
      { question: 'Solve: 45 + 27', options: ['62', '72', '82', '52'], answer: '72' },
      { question: 'What is the square root of 144?', options: ['10', '11', '12', '13'], answer: '12' },
      { question: 'What is 15% of 200?', options: ['20', '25', '30', '35'], answer: '30' },
      { question: 'Find the value of 9²', options: ['18', '27', '81', '72'], answer: '81' },
      { question: 'What is the perimeter of a square with side 5 cm?', options: ['10 cm', '15 cm', '20 cm', '25 cm'], answer: '20 cm' },
      { question: 'Solve: 100 ÷ 4', options: ['20', '25', '30', '40'], answer: '25' },
      { question: 'Which is a prime number?', options: ['9', '15', '17', '21'], answer: '17' },
      { question: 'What is the value of π approximately?', options: ['2.14', '3.14', '4.13', '1.34'], answer: '3.14' },
      { question: 'Convert 0.75 into percentage', options: ['25%', '50%', '75%', '100%'], answer: '75%' }
    ],
    Science: [
      { question: 'What planet is known as the Red Planet?', options: ['Earth', 'Mars', 'Venus', 'Jupiter'], answer: 'Mars' },
      { question: 'What gas do plants absorb?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Helium'], answer: 'Carbon Dioxide' },
      { question: 'Which organ pumps blood?', options: ['Lungs', 'Brain', 'Heart', 'Liver'], answer: 'Heart' },
      { question: 'Water freezes at what temperature?', options: ['0°C', '10°C', '50°C', '100°C'], answer: '0°C' },
      { question: 'What is H2O?', options: ['Salt', 'Water', 'Oxygen', 'Hydrogen'], answer: 'Water' },
      { question: 'Which vitamin comes from sunlight?', options: ['Vitamin A', 'Vitamin B', 'Vitamin C', 'Vitamin D'], answer: 'Vitamin D' },
      { question: 'Which force pulls objects to Earth?', options: ['Magnetism', 'Gravity', 'Electricity', 'Pressure'], answer: 'Gravity' },
      { question: 'Which part of plant conducts photosynthesis?', options: ['Root', 'Stem', 'Leaf', 'Flower'], answer: 'Leaf' },
      { question: 'Which gas is essential for breathing?', options: ['Carbon Dioxide', 'Hydrogen', 'Oxygen', 'Nitrogen'], answer: 'Oxygen' },
      { question: 'What is the boiling point of water?', options: ['50°C', '75°C', '100°C', '120°C'], answer: '100°C' }
    ],
    English: [
      { question: 'Choose the correct spelling.', options: ['Beautifull', 'Beautiful', 'Beautifal', 'Beautifool'], answer: 'Beautiful' },
      { question: 'What is the synonym of "Happy"?', options: ['Sad', 'Angry', 'Joyful', 'Tired'], answer: 'Joyful' },
      { question: 'Choose the noun.', options: ['Run', 'Quickly', 'School', 'Blue'], answer: 'School' },
      { question: 'What is the antonym of "Hot"?', options: ['Warm', 'Cold', 'Heat', 'Fire'], answer: 'Cold' },
      { question: 'Identify the verb.', options: ['Apple', 'Jump', 'Green', 'Table'], answer: 'Jump' },
      { question: 'Which punctuation ends a question?', options: ['.', ',', '?', '!'], answer: '?' },
      { question: 'Choose the correct article: ___ apple', options: ['A', 'An', 'The', 'No article'], answer: 'An' },
      { question: 'What is the plural of "Child"?', options: ['Childs', 'Children', 'Childes', 'Childrens'], answer: 'Children' },
      { question: 'Choose the adjective.', options: ['Beautiful', 'Run', 'Slowly', 'Book'], answer: 'Beautiful' },
      { question: 'Which sentence is correct?', options: ['He go to school.', 'He goes to school.', 'He going to school.', 'He gone to school.'], answer: 'He goes to school.' }
    ],
    'Social Science': [
      { question: 'Who is known as the Father of the Nation in India?', options: ['Nehru', 'Subash Chandra Bose', 'Mahatma Gandhi', 'Bhagat Singh'], answer: 'Mahatma Gandhi' },
      { question: 'What is the capital of India?', options: ['Mumbai', 'Delhi', 'Chennai', 'Kolkata'], answer: 'Delhi' },
      { question: 'How many states are there in India?', options: ['28', '29', '30', '31'], answer: '28' },
      { question: 'Which is the largest continent?', options: ['Africa', 'Asia', 'Europe', 'Australia'], answer: 'Asia' },
      { question: 'Who wrote the Indian Constitution?', options: ['Gandhi', 'Ambedkar', 'Nehru', 'Patel'], answer: 'Ambedkar' },
      { question: 'Which river is called the Ganga of the South?', options: ['Godavari', 'Kaveri', 'Krishna', 'Yamuna'], answer: 'Kaveri' },
      { question: 'India became independent in which year?', options: ['1945', '1946', '1947', '1950'], answer: '1947' },
      { question: 'What is the national animal of India?', options: ['Lion', 'Tiger', 'Elephant', 'Peacock'], answer: 'Tiger' },
      { question: 'Which planet is closest to the Sun?', options: ['Earth', 'Venus', 'Mercury', 'Mars'], answer: 'Mercury' },
      { question: 'Who was the first Prime Minister of India?', options: ['Gandhi', 'Nehru', 'Patel', 'Ambedkar'], answer: 'Nehru' }
    ],
    'Computer Science': [
      { question: 'What does CPU stand for?', options: ['Central Process Unit', 'Central Processing Unit', 'Computer Personal Unit', 'Control Processing Unit'], answer: 'Central Processing Unit' },
      { question: 'Which device is used to type?', options: ['Mouse', 'Keyboard', 'Monitor', 'Printer'], answer: 'Keyboard' },
      { question: 'What is the brain of the computer?', options: ['RAM', 'CPU', 'Monitor', 'Hard Disk'], answer: 'CPU' },
      { question: 'Which is an input device?', options: ['Printer', 'Speaker', 'Mouse', 'Projector'], answer: 'Mouse' },
      { question: 'What does HTML stand for?', options: ['Hyper Text Markup Language', 'HighText Machine Language', 'Hyper Tool Multi Language', 'Hyperlinks Text Machine Language'], answer: 'Hyper Text Markup Language' },
      { question: 'Which company developed Windows?', options: ['Apple', 'Google', 'Microsoft', 'IBM'], answer: 'Microsoft' },
      { question: 'Which storage device stores data permanently?', options: ['RAM', 'ROM', 'Cache', 'Register'], answer: 'ROM' },
      { question: 'What is the full form of URL?', options: ['Uniform Resource Locator', 'Universal Resource Link', 'Uniform Read Locator', 'Unique Resource Locator'], answer: 'Uniform Resource Locator' },
      { question: 'Which language is mainly used for web pages?', options: ['Python', 'Java', 'HTML', 'C++'], answer: 'HTML' },
      { question: 'What does WWW stand for?', options: ['World Wide Web', 'World Web Wide', 'Wide World Web', 'Web World Wide'], answer: 'World Wide Web' }
    ]
  };

  const difficulties = [DifficultyLevel.EASY, DifficultyLevel.MEDIUM, DifficultyLevel.HARD];
  
  for (const subj of subjectRecords) {
    const syllabus = await prisma.syllabus.upsert({
      where: { subject_id_board_id_organization_id: { subject_id: subj.id, board_id: board.id, organization_id: org.id } },
      update: {},
      create: {
        subject_id: subj.id,
        board_id: board.id,
        organization_id: org.id,
        description: `${subj.name} Curriculum`
      }
    });

    const unit = await prisma.unit.create({
      data: {
        name: `${subj.name} Basics`,
        organization_id: org.id,
        subject_id: subj.id,
        syllabus_id: syllabus.id
      }
    });

    const topic = await prisma.topic.create({
      data: {
        name: `Introduction to ${subj.name}`,
        organization_id: org.id,
        unit_id: unit.id
      }
    });

    const subtopic = await prisma.subTopic.create({
      data: {
        name: `Core Concepts`,
        organization_id: org.id,
        topic_id: topic.id
      }
    });

    // Generate specific MCQs
    const qList = questionBank[subj.name] || [];
    for (let i = 0; i < qList.length; i++) {
      const q = qList[i];
      const difficulty = difficulties[i % 3];
      
      const correct_option = q.options.indexOf(q.answer);
      const explanation = `The correct answer is ${q.answer}.`;

      await prisma.question.create({
        data: {
          organization_id: org.id,
          created_by: teachers[0].id,
          subject_id: subj.id,
          unit_id: unit.id,
          topic_id: topic.id,
          sub_topic_id: subtopic.id,
          question_text: q.question,
          type: QuestionType.MCQ_SINGLE,
          marks: difficulty === DifficultyLevel.HARD ? 5 : (difficulty === DifficultyLevel.MEDIUM ? 3 : 1),
          difficulty,
          answer_config: {
            options: q.options,
            correct_answer: correct_option,
            explanation
          },
          answer: String(correct_option)
        }
      });
    }

    // Topic Activations
    const group = subjectGroupRecords.find(g => g.grade_id === subj.grade_id);
    if (group) {
      await prisma.topicActivation.upsert({
        where: { topic_id_subject_group_id_organization_id: { topic_id: topic.id, subject_group_id: group.id, organization_id: org.id } },
        update: {},
        create: {
          organization_id: org.id,
          topic_id: topic.id,
          subject_group_id: group.id,
          is_active: true
        }
      });
    }
  }

  console.log('Seed executed successfully.');
  process.exit(1);
}

main()
  .catch((e) => {
    console.error('Error in seed script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
