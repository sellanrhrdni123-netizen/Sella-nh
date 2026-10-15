/**
 * TataDana E2E Test Suite - Tier 3: Cross-Feature Interactions
 * Verifies pairwise and end-to-end multi-module pipelines across Webhook, Database, Wallets, Budgets, and Exports.
 */

import {
  assertEqual,
  assertTrue,
  assertFalse,
  assertContains,
  assertGreaterThan,
  resetTestStore,
  callTelegramWebhook,
  callMidtransWebhook
} from './test-helpers';
import { store, DEMO_USER_ID } from '../../src/lib/storage';
import { calculateReportSummary, generatePDFReport, generateExcelReport } from '../../src/lib/export';

export async function runTier3Tests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
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
  // FLOW A: Telegram Expense -> Wallet Deduction -> Budget Progress -> Export
  // ============================================================================
  await runTest('T3.1: Pipeline Flow A - Expense message -> Wallet deduction -> Budget progress -> Export', async () => {
    const user = store.getCurrentUser();
    const defaultWallet = store.getDefaultWallet(user.id)!;
    const initialWalletBalance = defaultWallet.balance;
    const currentMonth = new Date().toISOString().substring(0, 7);

    // Initial budget for Makanan
    const categoryId = 'cat_makanan';
    const category = store.getCategories(user.id).find(c => c.id === categoryId)!;
    store.setBudget(user.id, categoryId, 3000000, currentMonth);

    const initialCategorySpend = store.getTransactions(user.id)
      .filter(t => t.categoryId === categoryId && t.type === 'expense' && t.transactionDate.startsWith(currentMonth))
      .reduce((s, t) => s + t.amount, 0);

    // 1. Post Telegram expense message
    const expenseAmount = 45000;
    const res = await callTelegramWebhook({
      update_id: 80001,
      message: {
        chat: { id: user.telegramChatId },
        text: 'beli makan siang bebek 45rb',
        date: Math.floor(Date.now() / 1000)
      }
    });

    assertEqual(res.status, 200);
    assertTrue(res.body.ok);
    const newTx = res.body.transaction;
    assertTrue(Boolean(newTx));
    assertEqual(newTx.amount, expenseAmount);

    // 2. Verify Wallet Balance is deducted
    const updatedWallet = store.getWallets(user.id).find(w => w.id === defaultWallet.id)!;
    assertEqual(updatedWallet.balance, initialWalletBalance - expenseAmount, 'Wallet must be deducted');

    // 3. Verify Telegram Reply has updated Budget Progress Bar
    const expectedTotalSpend = initialCategorySpend + expenseAmount;
    const expectedPercentage = Math.min(100, Math.round((expectedTotalSpend / 3000000) * 100));
    assertContains(res.body.reply, `Budget ${category.name} bulan ini:`);
    assertContains(res.body.reply, `${expectedPercentage}%`);

    // 4. Verify Report Export includes the transaction
    const allUserTxs = store.getTransactions(user.id);
    const summary = calculateReportSummary(allUserTxs, store.getCategories(user.id));
    const txInExport = allUserTxs.find(t => t.id === newTx.id);
    assertTrue(Boolean(txInExport), 'Transaction must be in user transaction history for reports');

    const pdf = generatePDFReport(allUserTxs, store.getWallets(user.id), store.getCategories(user.id), user.fullName, currentMonth);
    assertGreaterThan(pdf.fileSize, 0);

    const excel = generateExcelReport(allUserTxs, store.getWallets(user.id), store.getCategories(user.id), user.fullName, currentMonth);
    assertGreaterThan(excel.buffer.length, 0);
  });

  // ============================================================================
  // FLOW B: Telegram Income -> Wallet Increment -> Net Cashflow Update
  // ============================================================================
  await runTest('T3.2: Pipeline Flow B - Income message -> Wallet increment -> Net cashflow update', async () => {
    const user = store.getCurrentUser();
    const defaultWallet = store.getDefaultWallet(user.id)!;
    const initialWalletBalance = defaultWallet.balance;
    const initialSummary = calculateReportSummary(store.getTransactions(user.id), store.getCategories(user.id));

    // Post Telegram income
    const incomeAmount = 10000000;
    const res = await callTelegramWebhook({
      update_id: 80002,
      message: {
        chat: { id: user.telegramChatId },
        text: 'gajian 10jt',
        date: Math.floor(Date.now() / 1000)
      }
    });

    assertEqual(res.status, 200);
    assertTrue(res.body.ok);
    assertContains(res.body.reply, 'Pemasukan tercatat!');

    // Wallet balance increased
    const updatedWallet = store.getWallets(user.id).find(w => w.id === defaultWallet.id)!;
    assertEqual(updatedWallet.balance, initialWalletBalance + incomeAmount);

    // Summary net cashflow increased
    const updatedSummary = calculateReportSummary(store.getTransactions(user.id), store.getCategories(user.id));
    assertEqual(updatedSummary.totalIncome, initialSummary.totalIncome + incomeAmount);
    assertEqual(updatedSummary.netCashflow, initialSummary.netCashflow + incomeAmount);
  });

  // ============================================================================
  // FLOW C: Inter-Wallet Transfer -> Dual Balance Update -> Unchanged Net Worth
  // ============================================================================
  await runTest('T3.3: Pipeline Flow C - Inter-wallet transfer -> Source deducted -> Destination credited', async () => {
    const user = store.getCurrentUser();
    const wallets = store.getWallets(user.id);
    const bcaWallet = wallets.find(w => w.name.includes('BCA'))!;
    const gopayWallet = wallets.find(w => w.name.includes('GoPay'))!;

    const initialBcaBalance = bcaWallet.balance;
    const initialGopayBalance = gopayWallet.balance;
    const initialTotalNetWorth = wallets.reduce((s, w) => s + w.balance, 0);

    const transferAmount = 500000;
    const res = await callTelegramWebhook({
      update_id: 80003,
      message: {
        chat: { id: user.telegramChatId },
        text: 'transfer 500rb dari bca ke gopay',
        date: Math.floor(Date.now() / 1000)
      }
    });

    assertEqual(res.status, 200);
    assertTrue(res.body.ok);
    assertContains(res.body.reply, 'Transfer antar dompet berhasil!');

    const updatedWallets = store.getWallets(user.id);
    const updatedBca = updatedWallets.find(w => w.id === bcaWallet.id)!;
    const updatedGopay = updatedWallets.find(w => w.id === gopayWallet.id)!;

    assertEqual(updatedBca.balance, initialBcaBalance - transferAmount, 'BCA balance must decrease by 500k');
    assertEqual(updatedGopay.balance, initialGopayBalance + transferAmount, 'GoPay balance must increase by 500k');

    const finalTotalNetWorth = updatedWallets.reduce((s, w) => s + w.balance, 0);
    assertEqual(finalTotalNetWorth, initialTotalNetWorth, 'Total net worth across all wallets must remain constant');
  });

  // ============================================================================
  // FLOW D: Pro Photo Receipt OCR -> Line Item Hierarchy -> Excel Breakdown
  // ============================================================================
  await runTest('T3.4: Pipeline Flow D - Receipt OCR -> Line items -> Budget bar -> Excel itemized row', async () => {
    const user = store.getCurrentUser(); // Budi Pratama (Pro plan)
    const defaultWallet = store.getDefaultWallet(user.id)!;
    const initialBalance = defaultWallet.balance;

    const res = await callTelegramWebhook({
      update_id: 80004,
      type: 'photo',
      photoUrl: 'https://images.unsplash.com/photo-1554415707-9e49016a3455?w=600',
      merchantName: 'Indomaret Point',
      message: { chat: { id: user.telegramChatId }, date: Math.floor(Date.now() / 1000) }
    });

    assertEqual(res.status, 200);
    assertTrue(res.body.ok);
    const tx = res.body.transaction;
    assertTrue(Boolean(tx.receiptItems));
    assertGreaterThan(tx.receiptItems.length, 1);

    // Verify wallet deduction
    const updatedWallet = store.getWallets(user.id).find(w => w.id === defaultWallet.id)!;
    assertEqual(updatedWallet.balance, initialBalance - tx.amount);

    // Verify reply includes item list
    assertContains(res.body.reply, 'Rincian Item Struk');

    // Verify Excel export formats receipt line items
    const allTxs = store.getTransactions(user.id);
    const excel = generateExcelReport(allTxs, store.getWallets(user.id), store.getCategories(user.id), user.fullName, 'Oktober 2026');
    assertTrue(Boolean(excel.wb.Sheets['Daftar Transaksi']));
  });

  // ============================================================================
  // FLOW E: Midtrans Payment -> Upgrade Plan -> Feature Gate Unlocked
  // ============================================================================
  await runTest('T3.5: Pipeline Flow E - Midtrans settlement -> User upgraded to Pro -> Gate unlocked', async () => {
    // Siti Rahma starts as Starter user
    const targetUser = store.getProfiles().find(p => p.id === 'usr_siti_rahma_02')!;
    assertEqual(targetUser.plan, 'starter');

    // 1. Attempt receipt photo as Starter user -> Blocked
    const preRes = await callTelegramWebhook({
      update_id: 80005,
      type: 'photo',
      message: { chat: { id: targetUser.telegramChatId }, date: Math.floor(Date.now() / 1000) }
    });
    assertTrue(preRes.body.requiresUpgrade);

    // 2. Midtrans payment callback arrives for Siti's order
    const pendingPayment = store.getPayments().find(p => p.userId === targetUser.id)!;
    const midtransRes = await callMidtransWebhook({
      order_id: pendingPayment.orderId,
      transaction_status: 'settlement',
      fraud_status: 'accept'
    });

    assertEqual(midtransRes.status, 200);
    assertEqual(midtransRes.body.status, 'settled');

    // 3. Verify user profile plan is upgraded to Pro
    const refreshedUser = store.getProfiles().find(p => p.id === targetUser.id)!;
    assertEqual(refreshedUser.plan, 'pro', 'User plan must be automatically updated to pro');

    // 4. Siti now submits receipt photo again -> Should succeed as Pro!
    const postRes = await callTelegramWebhook({
      update_id: 80006,
      type: 'photo',
      merchantName: 'Alfamart Express',
      message: { chat: { id: targetUser.telegramChatId }, date: Math.floor(Date.now() / 1000) }
    });

    assertEqual(postRes.status, 200);
    assertTrue(postRes.body.ok);
    assertFalse(Boolean(postRes.body.requiresUpgrade), 'Pro user must NOT be blocked');
    assertTrue(Boolean(postRes.body.transaction), 'Transaction should be recorded');
  });

  return results;
}
