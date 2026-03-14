import { prisma } from '../prisma.js';
import { emailService } from '../services/email.js';

export async function checkDueReminders() {
  console.log('🔍 Checking for items due soon...');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  dayAfterTomorrow.setHours(0, 0, 0, 0);

  // Find loans due tomorrow
  const dueSoon = await prisma.loan.findMany({
    where: {
      returnedAt: null,
      dueDate: {
        gte: dayAfterTomorrow,
        lte: tomorrow,
      },
    },
    include: {
      user: true,
      item: true,
    },
  });

  console.log(`📬 Found ${dueSoon.length} items due soon`);

  for (const loan of dueSoon) {
    if (loan.user && loan.item) {
      await emailService.sendDueSoonReminder(
        loan.user.email,
        loan.user.name,
        loan.item.name,
        loan.dueDate
      );
    }
  }
}

export async function checkOverdueReminders() {
  console.log('🔍 Checking for overdue items...');

  const now = new Date();

  // Find overdue loans
  const overdue = await prisma.loan.findMany({
    where: {
      returnedAt: null,
      dueDate: {
        lt: now,
      },
    },
    include: {
      user: true,
      item: true,
    },
  });

  console.log(`⚠️  Found ${overdue.length} overdue items`);

  for (const loan of overdue) {
    if (loan.user && loan.item) {
      await emailService.sendOverdueNotice(
        loan.user.email,
        loan.user.name,
        loan.item.name,
        loan.dueDate
      );
    }
  }
}

// Run reminders (can be called via cron or manually)
export async function runDailyReminders() {
  console.log('🚀 Running daily reminder checks...');
  await checkDueReminders();
  await checkOverdueReminders();
  console.log('✅ Daily reminders complete');
}

// If running as a standalone script (via tsx)
// Note: import.meta is not available in CommonJS, but tsx handles this
if (require.main === module) {
  runDailyReminders()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
