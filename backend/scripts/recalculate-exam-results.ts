import { PrismaClient } from '@prisma/client';
import { ExaminationCalculationService } from '../src/services/ExaminationCalculationService';

const prisma = new PrismaClient();

async function runMigration() {
  console.log('--- STARTING EXAM RESULT RECALCULATION MIGRATION ---');

  const recordsToFix = await prisma.studentExamResult.findMany({
    where: {
      OR: [
        { percentage: null },
        { total_obtained_marks: null },
        { total_max_marks: null }
      ]
    },
    include: {
      subject_results: true
    }
  });

  const totalScanned = recordsToFix.length;
  let totalFixed = 0;
  let totalFailed = 0;

  console.log(`Found ${totalScanned} records requiring recalculation.`);

  for (const record of recordsToFix) {
    try {
      // Recalculate
      const calculated = ExaminationCalculationService.calculateAggregateResult(record.subject_results as any);

      // Update in DB
      await prisma.studentExamResult.update({
        where: { id: record.id },
        data: {
          total_max_marks: calculated.total_max_marks,
          total_obtained_marks: calculated.total_obtained_marks,
          percentage: calculated.percentage
        }
      });

      // Verification (Safeguard 3)
      const verifySumObtained = record.subject_results.reduce((acc, sub) => acc + (sub.is_absent ? 0 : Number(sub.obtained_marks || 0)), 0);
      const verifySumMax = record.subject_results.reduce((acc, sub) => acc + Number(sub.max_marks || 0), 0);
      const verifyPercentage = verifySumMax > 0 ? Number(((verifySumObtained / verifySumMax) * 100).toFixed(2)) : 0;

      if (verifySumObtained !== calculated.total_obtained_marks || 
          verifySumMax !== calculated.total_max_marks || 
          verifyPercentage !== calculated.percentage) {
        console.error(`VALIDATION FAILED for Result ${record.id}`);
        console.error(`Expected: Obs=${verifySumObtained}, Max=${verifySumMax}, %=${verifyPercentage}`);
        console.error(`Got: Obs=${calculated.total_obtained_marks}, Max=${calculated.total_max_marks}, %=${calculated.percentage}`);
        totalFailed++;
      } else {
        totalFixed++;
      }

    } catch (error) {
      console.error(`Error updating record ${record.id}:`, error);
      totalFailed++;
    }
  }

  const successRate = totalScanned > 0 ? ((totalFixed / totalScanned) * 100).toFixed(2) : '100.00';

  console.log('\n--- MIGRATION SUMMARY ---');
  console.log(`Records Scanned: ${totalScanned}`);
  console.log(`Records Fixed: ${totalFixed}`);
  console.log(`Records Failed: ${totalFailed}`);
  console.log(`Success Rate: ${successRate}%`);

  if (totalFailed > 0) {
    console.error('\n❌ MIGRATION COMPLETED WITH ERRORS');
    process.exit(1);
  } else {
    console.log('\n✅ MIGRATION SUCCESSFUL');
    process.exit(0);
  }
}

runMigration()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
