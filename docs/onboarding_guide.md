# Onboarding & Implementation Guide: School SaaS Platform

Welcome to the School SaaS Platform implementation and setup guide. This document walks you through the step-by-step process of onboarding a new school tenant from scratch.

---

## 📋 Onboarding Checklist

Follow this linear sequence of steps to prepare the platform for real-school operations:

1. **Organization Creation**: Initialize the tenant profile with its unique subdomain.
2. **Academic Structure Setup**: Configure Board, Medium, and Active Academic Years.
3. **Grade & Section Mapping**: Define grade levels (e.g. Grade 1-10) and classroom sections (e.g. A, B).
4. **Curriculum Definition**: Register subjects and load units, topics, and subtopics.
5. **Staff Onboarding & Role Governance**: Add teachers and assign granular capability-driven permissions.
6. **Classroom Mapping**: Link teachers to grades, sections, and subjects.
7. **Student Enrollment**: Add student accounts and allocate them to sections and elective subject groups.

---

## 🛠 Step 1 — Organization Creation & Setup

Every school operates inside a secure, fully isolated tenant partition.

### Initial Configuration
* Access the Organization Management panel `/organization`.
* Complete the school profile details:
  * **School Name**: (e.g. *Chennai Excellence Academy*)
  * **Subdomain**: (e.g. `chennaix`) - Used for tenant resolution and custom portal access.
  * **License Duration**: Set the active subscription term.

> [!WARNING]
> Subdomains must be unique across the SaaS cluster and must consist only of lowercase letters, numbers, and hyphens.

---

## 🏫 Step 2 — Academic Structure Initialization

Once the organization is active, set up the institutional structure:

### Configuration Steps
1. Navigate to `/admin/administration/academic-structure`.
2. Add an **Academic Year** (e.g. `2026-2027`) and toggle it to **Active**.
3. Create **Grades** (e.g. `Grade 9`) using the standard button.
4. Create **Sections** (e.g. `Section A`) mapped to the respective Grade.

---

## 📚 Step 3 — Curriculum & Syllabus Mapping

Map the subjects and textbooks taught at each grade level:

1. Navigate to `/admin/administration/units-list`.
2. Create **Subjects** (e.g. `Mathematics`, `Science`).
3. For each Subject, click the action menu to map **Units** (e.g. `Unit 1: Algebra`).
4. Drildown into each Unit to add **Topics** and **Subtopics** representing the lesson plan.

---

## 👥 Step 4 — Staff Onboarding & Assignments

Onboard teachers and allocate them to their specific academic contexts:

### Creating Teacher Accounts
1. Go to User Management `/admin/administration/users`.
2. Add a new user with the `TEACHER` role and enter their primary institutional email.

### Classroom & Subject Assignment
1. Navigate to `/admin/administration/teacher-assignment`.
2. Select a **Grade** and **Section** from the centralized context dropdown.
3. Choose a **Class Teacher** responsible for attendance and overall section records.
4. In the **Subject Teachers** tab, map specific instructors to each available subject.
