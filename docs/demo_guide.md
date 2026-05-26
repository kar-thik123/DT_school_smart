# Orchestration Guide: School SaaS Pilot Demonstration

This guide provides a step-by-step walkthrough for presenting the School SaaS platform to school boards, principals, and IT directors, leveraging our one-click seed utilities to configure a complete, beautifully populated school database instantly.

---

## 🚀 Pre-Demo Preparation: One-Click Environment Prep

Before your presentation, initialize a clean, highly structured institution tenant:

### 1. Initialize Academic Hierarchy & Curriculum
Run the standard demo seeder from the backend terminal directory:
```bash
cd d:\DT_school_smart\backend
npx ts-node src/scripts/seed-demo-school.ts
```
This single script sets up:
* **Academic Year**: `2026-2027`
* **Grades**: Grades 6 through 10
* **Sections**: Section A & Section B for each grade
* **Core Curriculum**: Syllabi, Units, Topics, and Subtopics for Math, Physics, Chemistry, and English
* **Teacher Accounts**: `alice.cooper@schoolsaas.com` & `robert.plant@schoolsaas.com`
* **Real Audit Logs**: Pre-populates the new Live System Logs page with systemic actions

### 2. (Optional) Stress-Test & Scalability Setup
If presenting to large institutional networks, run the stress seeder to inject 1,000+ real practice attempts instantly:
```bash
npx ts-node src/scripts/stress-test-data.ts
```
This showcases the optimized dashboard query speeds (<200ms) under enterprise-level load.

---

## 🎭 Demo Flow Scenarios

We recommend walking the audience through these three core scenarios:

### Scenario A — Central Governance & Master Configuration
1. Log in as **Super Admin**.
2. Navigate to **Administration > Settings** (`/admin/administration/settings`).
3. Show the **Master Configuration Dashboard**:
   * Highlight how easily the school can toggle modular features (Completion Mgmt, Question Bank, MFA).
4. Save settings and show the instant confirmation alerts.

### Scenario B — Curriculum Tracking & Course Coverage
1. Log in as a teacher (e.g. `alice.cooper@schoolsaas.com` / `Demo@123`).
2. Navigate to **Completion Management** (`/admin/administration/completion-mgmt`).
3. Expand **Grade 9 > Section A > Mathematics**.
4. Show how teachers can toggle syllabus units, topics, and subtopics, highlighting the cascading check-states.
5. Emphasize that toggling these features triggers audit entries automatically.

### Scenario C — Audit trail & Transparency Compliance
1. Log in as **Super Admin**.
2. Navigate to **Settings > System Logs** (`/admin/settings/system-logs`).
3. Present the live list of audit trails, proving to school administrators that every toggle, teacher assignment, and curriculum import is captured, timestamped, and attributed.
