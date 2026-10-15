/**
 * TataDana E2E Test Suite - Tier 4: Real-World Application Scenarios
 * Validates complete end-to-end Indonesian fintech user journeys.
 */

import {
  assertEqual,
  assertTrue,
  assertFalse,
  assertContains,
  assertGreaterThan,
  resetTestStore,
  callTelegramWebhook
} from './test-helpers';
import { store, DEMO_USER_ID, ADMIN_USER_ID } from '../../src/lib/storage';
import { formatIDR } from '../../src/lib/utils';
import { handleBotCommand } from '../../src/lib/telegram';
import { calculateReportSummary, generatePDFReport, generateExcelReport } from '../../src/lib/export';

export async function runTier4Tests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  const runTest = async (name: string, fn: () => void | Promise<void>) => {
    try {
      resetTestStore();
      await fn();
      results.push({ name, passed: true });
    } catch (err: any) {
      results.push({ name, passed: false, error: err.stack || err.message || String(err) });
    }
  };

  // ============================================================================
  // JOURNEY 1: New Indonesian User Onboarding Journey
  // ============================================================================
  await runTest('T4.1: Real-World Journey 1 - New user registration -> Set BCA -> Telegram chat -> First expense -> /saldo & /budget', async () => {
    const newUserId = 'usr_anita_wijaya_04';
    const currentMonth = new Date().toISOString().substring(0, 7);

    // 1. User registers profile
    const anitaProfile = {
      id: newUserId,
      email: 'anita.wijaya@gmail.com',
      fullName: 'Anita Wijaya',
      phoneNumber: '+6281311223344',
      currency: 'IDR',
      plan: 'starter' as const,
      role: 'user' as const,
      telegramChatId: 778899001,
      telegramUsername: 'anitawijaya',
      telegramConnected: true,
      dailyReminderEnabled: true,
      reminderFrequency: 1 as const,
      reminderTimes: ['19:30'],
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    (store as any).profiles.push(anitaProfile);

    // 2. Set default BCA wallet with initial balance Rp5.000.000
    const bcaWallet = store.addWallet({
      userId: newUserId,
      name: 'BCA Utama Anita',
      type: 'bank',
      balance: 5000000,
      isDefault: true,
      color: '#00529C',
      icon: 'landmark'
    });

    // 3. Set Categories
    const catMakanan = store.addCategory({
      userId: newUserId,
      name: 'Makanan & Minuman',
      type: 'expense',
      emoji: '🍜',
      color: '#F97316',
      isDefault: true
    });

    // 4. Set monthly budget for Makanan: Rp1.500.000
    store.setBudget(newUserId, catMakanan.id, 1500000, currentMonth);

    // 5. User sends first Telegram transaction: "makan bakso campur 25rb"
    const webhookRes = await callTelegramWebhook({
      update_id: 90001,
      message: {
        chat: { id: 778899001 },
        text: 'makan bakso campur 25rb',
        date: Math.floor(Date.now() / 1000)
      }
    });

    assertEqual(webhookRes.status, 200);
    assertTrue(webhookRes.body.ok);
    assertContains(webhookRes.body.reply, 'Pengeluaran tercatat!');
    assertContains(webhookRes.body.reply, 'Nominal : Rp25.000');

    // 6. Check updated wallet balance: 5.000.000 - 25.000 = 4.975.000
    const updatedWallet = store.getWallets(newUserId).find(w => w.id === bcaWallet.id)!;
    assertEqual(updatedWallet.balance, 4975000);

    // 7. Test bot slash command: /saldo
    const saldoReply = handleBotCommand(
      '/saldo',
      anitaProfile,
      store.getWallets(newUserId),
      store.getTransactions(newUserId),
      store.getCategories(newUserId),
      store.getBudgets(newUserId)
    );
    assertContains(saldoReply, 'Rp4.975.000');

    // 8. Test bot slash command: /budget
    const budgetReply = handleBotCommand(
      '/budget',
      anitaProfile,
      store.getWallets(newUserId),
      store.getTransactions(newUserId),
      store.getCategories(newUserId),
      store.getBudgets(newUserId)
    );
    assertContains(budgetReply, 'Sisa: Rp1.475.000 / Rp1.500.000');
  });

  // ============================================================================
  // JOURNEY 2: Monthly Indonesian Financial Life Cycle
  // ============================================================================
  await runTest('T4.2: Real-World Journey 2 - Monthly life cycle: salary -> bills -> groceries -> /bulan ini -> export', async () => {
    const user = store.getCurrentUser();
    const currentMonth = new Date().toISOString().substring(0, 7);
    const initialTxsCount = store.getTransactions(user.id).length;

    // Day 1: Gaji masuk
    await callTelegramWebhook({
      update_id: 91001,
      message: { chat: { id: user.telegramChatId }, text: 'gajian 15.5jt', date: Math.floor(Date.now() / 1000) }
    });

    // Day 5: Bayar kost bulanan
    await callTelegramWebhook({
      update_id: 91002,
      message: { chat: { id: user.telegramChatId }, text: 'bayar kost 2.2jt', date: Math.floor(Date.now() / 1000) }
    });

    // Day 12: Belanja supermarket via foto struk
    await callTelegramWebhook({
      update_id: 91003,
      type: 'photo',
      merchantName: 'Indomaret Point Sudirman',
      photoUrl: 'https://images.unsplash.com/photo-1554415707-9e49016a3455?w=600',
      message: { chat: { id: user.telegramChatId }, date: Math.floor(Date.now() / 1000) }
    });

    // Day 15: Kopi nongkrong via voice note
    await callTelegramWebhook({
      update_id: 91004,
      type: 'voice',
      text: 'Kopi kenangan 28 ribu gopay',
      message: { chat: { id: user.telegramChatId }, voice: { duration: 5 }, date: Math.floor(Date.now() / 1000) }
    });

    // Verify 4 new transactions recorded
    const finalTxs = store.getTransactions(user.id);
    assertEqual(finalTxs.length, initialTxsCount + 4);

    // User checks monthly recap via Telegram: /bulan ini
    const monthReply = handleBotCommand(
      '/bulan ini',
      user,
      store.getWallets(user.id),
      finalTxs,
      store.getCategories(user.id),
      store.getBudgets(user.id)
    );
    assertContains(monthReply, `Rekap Keuangan Bulan Ini (${currentMonth})`);
    assertContains(monthReply, 'Top Pengeluaran per Kategori:');

    // Export monthly PDF and Excel reports
    const summary = calculateReportSummary(finalTxs, store.getCategories(user.id));
    assertGreaterThan(summary.totalIncome, 15000000);
    assertGreaterThan(summary.totalExpense, 2000000);

    const pdf = generatePDFReport(finalTxs, store.getWallets(user.id), store.getCategories(user.id), user.fullName, currentMonth);
    assertTrue(pdf.fileSize > 2000);

    const excel = generateExcelReport(finalTxs, store.getWallets(user.id), store.getCategories(user.id), user.fullName, currentMonth);
    assertTrue(excel.buffer.length > 2000);
  });

  // ============================================================================
  // JOURNEY 3: AI Financial Advisor Trigger on Spending Spike
  // ============================================================================
  await runTest('T4.3: Real-World Journey 3 - Financial Advisor triggers on category spending spike', async () => {
    const user = store.getCurrentUser(); // Pro user Budi Pratama
    const currentMonth = new Date().toISOString().substring(0, 7);

    // Set Coffee & Hanging Out category budget to 600.000
    const catKopi = store.getCategories(user.id).find(c => c.name.includes('Kopi'))!;
    store.setBudget(user.id, catKopi.id, 600000, currentMonth);

    // Make single large purchase: "traktir kopi starbucks 150rb"
    // 150.000 / 600.000 = 25% in one single transaction (threshold is >= 20%)
    const res = await callTelegramWebhook({
      update_id: 92001,
      message: {
        chat: { id: user.telegramChatId },
        text: 'kopi starbucks 150rb',
        date: Math.floor(Date.now() / 1000)
      }
    });

    assertEqual(res.status, 200);
    assertTrue(res.body.ok);

    // Verify Financial Advisor banner is appended to the Telegram reply
    assertContains(res.body.reply, '🤖 *Financial Advisor*');
    assertContains(res.body.reply, 'menghabiskan 25% dari seluruh budget kategori ini dalam satu kali bayar');
    assertContains(res.body.reply, '💡 *Saran:*');
  });

  // ============================================================================
  // JOURNEY 4: Superadmin Privacy-Compliant Customer Support Journey
  // ============================================================================
  await runTest('T4.4: Real-World Journey 4 - Superadmin support: audit trail -> impersonation -> safe return', async () => {
    const admin = store.getAdminUser();
    const targetUserId = 'usr_siti_rahma_02';
    const targetUser = store.getProfiles().find(p => p.id === targetUserId)!;

    // 1. Customer support inquiry: Admin opens audit inspection
    const auditReason = 'Tiket #8821: Investigasi struk belanja tidak masuk laporan';
    const auditLog = store.addAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      targetUserId,
      action: 'INSPECT_USER_TRANSACTIONS',
      details: {
        reason: auditReason,
        targetUserName: targetUser.fullName
      }
    });

    assertTrue(Boolean(auditLog.id));
    assertEqual(auditLog.action, 'INSPECT_USER_TRANSACTIONS');
    assertEqual(auditLog.details.reason, auditReason);

    // 2. Admin impersonates customer
    store.setImpersonation(targetUserId);
    assertEqual(store.getActiveUserId(), targetUserId);

    // 3. Admin views target user's data in user context
    const impersonatedWallets = store.getWallets();
    assertTrue(impersonatedWallets.every(w => w.userId === targetUserId));

    const impersonatedTxs = store.getTransactions();
    assertTrue(impersonatedTxs.every(t => t.userId === targetUserId));

    // 4. Admin finishes support and safely returns to admin view
    store.setImpersonation(null);
    assertEqual(store.getActiveUserId(), DEMO_USER_ID);
    assertEqual(store.getImpersonatingUserId(), null);

    // 5. Verify audit log trail persisted
    const allAudit = store.getAuditLogs();
    assertTrue(allAudit.some(a => a.id === auditLog.id));
  });

  return results;
}
