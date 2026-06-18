import prisma from '../prisma';
import { Prisma } from '@prisma/client';
import { getActiveAcademicYearId } from '../utils/academic-helper';

export class DashboardSyncService {
  /**
   * Synchronously updates the Practice metrics on the Student Dashboard Summary
   * and Weekly Trend after a quiz submission.
   * 
   * @param organization_id The ID of the organization
   * @param student_id The ID of the student
   */
  static async updatePracticeMetrics(organization_id: string, student_id: string): Promise<void> {
    try {
      const academic_year_id = await getActiveAcademicYearId(organization_id);

      // Use a read-committed transaction to avoid race conditions. 
      // Prisma interactive transactions are perfect for this.
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 1. Calculate overall practice stats
        const aggregates = await tx.practiceAttempt.aggregate({
          where: { student_id, organization_id, academic_year_id },
          _sum: {
            correct_answers: true,
            total_questions: true,
          },
        });

        const totalCorrect = aggregates._sum.correct_answers || 0;
        const totalAttempted = aggregates._sum.total_questions || 0;
        const accuracy = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;

        // 2. Upsert StudentDashboardSummary
        await tx.studentDashboardSummary.upsert({
          where: {
            organization_id_student_id_academic_year_id: {
              organization_id,
              student_id,
              academic_year_id,
            },
          },
          update: {
            practice_accuracy: accuracy,
            questions_attempted: totalAttempted,
            last_activity_at: new Date(),
          },
          create: {
            organization_id,
            student_id,
            academic_year_id,
            practice_accuracy: accuracy,
            questions_attempted: totalAttempted,
            last_activity_at: new Date(),
          },
        });

        // 3. Calculate this week's practice stats
        // Week starts on Monday
        const now = new Date();
        const dayOfWeek = now.getUTCDay() || 7; // 1-7 (Mon-Sun)
        const weekStartDate = new Date(now);
        weekStartDate.setUTCDate(now.getUTCDate() - dayOfWeek + 1);
        weekStartDate.setUTCHours(0, 0, 0, 0);

        const weeklyAggregates = await tx.practiceAttempt.aggregate({
          where: {
            student_id,
            organization_id,
            academic_year_id,
            created_at: {
              gte: weekStartDate,
            },
          },
          _sum: {
            correct_answers: true,
            total_questions: true,
          },
        });

        const weeklyCorrect = weeklyAggregates._sum.correct_answers || 0;
        const weeklyAttempted = weeklyAggregates._sum.total_questions || 0;
        const weeklyAccuracy = weeklyAttempted > 0 ? (weeklyCorrect / weeklyAttempted) * 100 : 0;

        // 4. Upsert StudentDashboardWeeklyTrend
        await tx.studentDashboardWeeklyTrend.upsert({
          where: {
            organization_id_student_id_academic_year_id_week_start_date: {
              organization_id,
              student_id,
              academic_year_id,
              week_start_date: weekStartDate,
            },
          },
          update: {
            accuracy_percentage: weeklyAccuracy,
            questions_attempted: weeklyAttempted,
          },
          create: {
            organization_id,
            student_id,
            academic_year_id,
            week_start_date: weekStartDate,
            accuracy_percentage: weeklyAccuracy,
            questions_attempted: weeklyAttempted,
          },
        });
      });
    } catch (error) {
      console.error('[DashboardSyncService] updatePracticeMetrics failed:', error);
      // Fails silently for the user so it doesn't break their quiz submission flow
    }
  }

  /**
   * Synchronously updates the Skill metrics on the Student Dashboard Summary
   * after a skill status change.
   * 
   * @param organization_id The ID of the organization
   * @param student_id The ID of the student
   */
  static async updateSkillMetrics(organization_id: string, student_id: string): Promise<void> {
    try {
      const academic_year_id = await getActiveAcademicYearId(organization_id);

      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const skills = await tx.skill.groupBy({
          by: ['status'],
          where: { user_id: student_id, organization_id, academic_year_id },
          _count: {
            _all: true,
          },
        });

        let verified = 0;
        let pending = 0;

        for (const group of skills) {
          if (group.status === 'verified') verified = group._count._all;
          if (group.status === 'pending') pending = group._count._all;
        }

        const totalSkills = verified + pending;
        const skillsCompletionPercentage = totalSkills > 0 ? (verified / totalSkills) * 100 : 0;

        await tx.studentDashboardSummary.upsert({
          where: {
            organization_id_student_id_academic_year_id: {
              organization_id,
              student_id,
              academic_year_id,
            },
          },
          update: {
            verified_skills: verified,
            pending_skills: pending,
            skills_completion_percentage: skillsCompletionPercentage,
            last_activity_at: new Date(),
          },
          create: {
            organization_id,
            student_id,
            academic_year_id,
            verified_skills: verified,
            pending_skills: pending,
            skills_completion_percentage: skillsCompletionPercentage,
            last_activity_at: new Date(),
          },
        });
      });
    } catch (error) {
      console.error('[DashboardSyncService] updateSkillMetrics failed:', error);
    }
  }
}
