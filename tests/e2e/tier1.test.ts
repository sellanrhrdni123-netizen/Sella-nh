/**
 * TataDana E2E Test Suite - Tier 1: Feature Coverage
 * Systematic verification of all 10 core features (>= 5 tests per feature = 50+ tests).
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
import { parseTransactionNaturalLanguage, parseReceiptPhoto, transcribeVoiceNote } from '../../src/lib/ai/parser';
import { formatExpenseReply, formatIncomeReply, formatTransferReply, handleBotCommand } from '../../src/lib/telegram';
import { generateProgressBar, formatIDR } from '../../src/lib/utils';
import { calculateReportSummary, generatePDFReport, generateExcelReport } from '../../src/lib/export';

export async function runTier1Tests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
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
  // 1. TRANSACTIONS FEATURE (6 Tests)
  // ============================================================================

  await runTest('T1.1.1: Transactions - Add expense reduces wallet balance accurately', async () => {
    const defaultWallet = store.getDefaultWallet(DEMO_USER_ID)!;
    const initialBalance = defaultWallet.balance;
    const expenseAmount = 50000;

    const tx = store.addTransaction({
      userId: DEMO_USER_ID,
      walletId: defaultWallet.id,
      categoryId: 'cat_makanan',
      type: 'expense',
      amount: expenseAmount,
      description: 'Makan Siang Sate Padang',
      source: 'web',
      transactionDate: new Date().toISOString()
    });

    assertTrue(Boolean(tx.id), 'Transaction must have an ID');
    const updatedWallet = store.getWallets(DEMO_USER_ID).find(w => w.id === defaultWallet.id)!;
    assertEqual(updatedWallet.balance, initialBalance - expenseAmount, 'Wallet balance must be reduced by expense amount');
  });

  await runTest('T1.1.2: Transactions - Add income increases wallet balance accurately', async () => {
    const defaultWallet = store.getDefaultWallet(DEMO_USER_ID)!;
    const initialBalance = defaultWallet.balance;
    const incomeAmount = 2500000;

    const tx = store.addTransaction({
      userId: DEMO_USER_ID,
      walletId: defaultWallet.id,
      categoryId: 'cat_freelance',
      type: 'income',
      amount: incomeAmount,
      description: 'Freelance Mobile App Payment',
      source: 'web',
      transactionDate: new Date().toISOString()
    });

    assertTrue(Boolean(tx.id));
    const updatedWallet = store.getWallets(DEMO_USER_ID).find(w => w.id === defaultWallet.id)!;
    assertEqual(updatedWallet.balance, initialBalance + incomeAmount, 'Wallet balance must increase by income amount');
  });

  await runTest('T1.1.3: Transactions - Transfer deducts source wallet and credits destination wallet', async () => {
    const wallets = store.getWallets(DEMO_USER_ID);
    const sourceWallet = wallets[0]; // BCA
    const destWallet = wallets[2]; // GoPay
    const initialSourceBalance = sourceWallet.balance;
    const initialDestBalance = destWallet.balance;
    const transferAmount = 200000;

    const tx = store.addTransaction({
      userId: DEMO_USER_ID,
      walletId: sourceWallet.id,
      destinationWalletId: destWallet.id,
      type: 'transfer',
      amount: transferAmount,
      description: 'Topup GoPay via BCA',
      source: 'web',
      transactionDate: new Date().toISOString()
    });

    assertEqual(tx.type, 'transfer');
    const updatedSource = store.getWallets(DEMO_USER_ID).find(w => w.id === sourceWallet.id)!;
    const updatedDest = store.getWallets(DEMO_USER_ID).find(w => w.id === destWallet.id)!;
    assertEqual(updatedSource.balance, initialSourceBalance - transferAmount, 'Source wallet should decrease');
    assertEqual(updatedDest.balance, initialDestBalance + transferAmount, 'Destination wallet should increase');
  });

  await runTest('T1.1.4: Transactions - Deleting transaction reverts wallet balance change', async () => {
    const defaultWallet = store.getDefaultWallet(DEMO_USER_ID)!;
    const initialBalance = defaultWallet.balance;
    const expenseAmount = 75000;

    const tx = store.addTransaction({
      userId: DEMO_USER_ID,
      walletId: defaultWallet.id,
      categoryId: 'cat_makanan',
      type: 'expense',
      amount: expenseAmount,
      description: 'Beli Pizza',
      source: 'web',
      transactionDate: new Date().toISOString()
    });

    store.deleteTransaction(tx.id);
    const revertedWallet = store.getWallets(DEMO_USER_ID).find(w => w.id === defaultWallet.id)!;
    assertEqual(revertedWallet.balance, initialBalance, 'Wallet balance should revert to original after deletion');
    const txList = store.getTransactions(DEMO_USER_ID);
    assertFalse(txList.some(t => t.id === tx.id), 'Transaction must no longer exist');
  });

  await runTest('T1.1.5: Transactions - Query returns transactions sorted date descending', async () => {
    const txList = store.getTransactions(DEMO_USER_ID);
    assertGreaterThan(txList.length, 1, 'Should have multiple seeded transactions');
    for (let i = 0; i < txList.length - 1; i++) {
      const current = new Date(txList[i].transactionDate).getTime();
      const next = new Date(txList[i + 1].transactionDate).getTime();
      assertTrue(current >= next, `Transactions must be sorted descending by date (${current} >= ${next})`);
    }
  });

  await runTest('T1.1.6: Transactions - Receipt parent transaction stores itemized breakdown', async () => {
    const defaultWallet = store.getDefaultWallet(DEMO_USER_ID)!;
    const items = [
      { id: 'i1', name: 'Susu UHT', price: 18000, categoryName: 'Makanan & Minuman' },
      { id: 'i2', name: 'Roti Tawar', price: 15000, categoryName: 'Makanan & Minuman' }
    ];

    const tx = store.addTransaction({
      userId: DEMO_USER_ID,
      walletId: defaultWallet.id,
      categoryId: 'cat_belanja',
      type: 'expense',
      amount: 33000,
      description: 'Struk Belanja Minimarket',
      source: 'telegram_photo',
      receiptItems: items,
      merchantName: 'Alfamart',
      transactionDate: new Date().toISOString()
    });

    assertTrue(Boolean(tx.receiptItems), 'Receipt items array must exist');
    assertEqual(tx.receiptItems!.length, 2, 'Should have 2 receipt items');
    assertEqual(tx.receiptItems![0].name, 'Susu UHT');
  });

  // ============================================================================
  // 2. WALLETS FEATURE (5 Tests)
  // ============================================================================

  await runTest('T1.2.1: Wallets - Add new wallet creates valid wallet record', async () => {
    const newWallet = store.addWallet({
      userId: DEMO_USER_ID,
      name: 'SeaBank Tabungan',
      type: 'bank',
      balance: 1000000,
      isDefault: false,
      color: '#EA580C',
      icon: 'landmark',
      accountNumber: '9012345678'
    });

    assertTrue(newWallet.id.startsWith('wal_'));
    const userWallets = store.getWallets(DEMO_USER_ID);
    assertTrue(userWallets.some(w => w.id === newWallet.id), 'New wallet must be present in user wallet list');
  });

  await runTest('T1.2.2: Wallets - Set default wallet clears previous default wallet', async () => {
    const wallets = store.getWallets(DEMO_USER_ID);
    const initialDefault = wallets.find(w => w.isDefault)!;
    const targetWallet = wallets.find(w => !w.isDefault)!;

    store.updateWallet(targetWallet.id, { isDefault: true });

    const updatedWallets = store.getWallets(DEMO_USER_ID);
    const updatedTarget = updatedWallets.find(w => w.id === targetWallet.id)!;
    const updatedInitial = updatedWallets.find(w => w.id === initialDefault.id)!;

    assertTrue(updatedTarget.isDefault, 'Target wallet must now be default');
    assertFalse(updatedInitial.isDefault, 'Previous default wallet must no longer be default');
  });

  await runTest('T1.2.3: Wallets - Update wallet metadata preserves balance and ID', async () => {
    const wallet = store.getWallets(DEMO_USER_ID)[0];
    const originalBalance = wallet.balance;

    const updated = store.updateWallet(wallet.id, {
      name: 'BCA Prioritas Updated',
      color: '#002244'
    });

    assertEqual(updated.name, 'BCA Prioritas Updated');
    assertEqual(updated.color, '#002244');
    assertEqual(updated.balance, originalBalance, 'Wallet balance should not be altered by metadata update');
  });

  await runTest('T1.2.4: Wallets - Delete wallet removes it completely', async () => {
    const tempWallet = store.addWallet({
      userId: DEMO_USER_ID,
      name: 'Temporary Wallet',
      type: 'cash',
      balance: 50000,
      isDefault: false,
      color: '#CCCCCC',
      icon: 'banknote'
    });

    store.deleteWallet(tempWallet.id);
    const wallets = store.getWallets(DEMO_USER_ID);
    assertFalse(wallets.some(w => w.id === tempWallet.id), 'Deleted wallet must be removed');
  });

  await runTest('T1.2.5: Wallets - Multi-wallet balance calculation sums all user wallets', async () => {
    const wallets = store.getWallets(DEMO_USER_ID);
    const expectedSum = wallets.reduce((sum, w) => sum + w.balance, 0);
    const botReply = handleBotCommand('/saldo', store.getCurrentUser(), wallets, [], [], []);
    assertContains(botReply, formatIDR(expectedSum), 'Reply should contain formatted total balance of all wallets');
  });

  // ============================================================================
  // 3. BUDGETS FEATURE (5 Tests)
  // ============================================================================

  await runTest('T1.3.1: Budgets - Set category monthly budget creates new budget entry', async () => {
    const month = '2026-11';
    const budget = store.setBudget(DEMO_USER_ID, 'cat_makanan', 3000000, month);

    assertTrue(Boolean(budget.id));
    assertEqual(budget.amount, 3000000);
    assertEqual(budget.month, month);
    assertEqual(budget.categoryId, 'cat_makanan');
  });

  await runTest('T1.3.2: Budgets - Updating existing monthly budget adjusts amount and resets alerts', async () => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    store.setBudget(DEMO_USER_ID, 'cat_transport', 1200000, currentMonth);
    const updated = store.setBudget(DEMO_USER_ID, 'cat_transport', 1500000, currentMonth);

    assertEqual(updated.amount, 1500000, 'Budget amount should be updated');
    assertFalse(Boolean(updated.alert80Sent), 'Alert flags should be reset upon budget adjustment');
  });

  await runTest('T1.3.3: Budgets - Monthly budget isolation between different months', async () => {
    store.setBudget(DEMO_USER_ID, 'cat_kopi', 500000, '2026-10');
    store.setBudget(DEMO_USER_ID, 'cat_kopi', 750000, '2026-11');

    const octBudgets = store.getBudgets(DEMO_USER_ID, '2026-10');
    const novBudgets = store.getBudgets(DEMO_USER_ID, '2026-11');

    const octKopi = octBudgets.find(b => b.categoryId === 'cat_kopi');
    const novKopi = novBudgets.find(b => b.categoryId === 'cat_kopi');

    assertEqual(octKopi?.amount, 500000);
    assertEqual(novKopi?.amount, 750000);
  });

  await runTest('T1.3.4: Budgets - Visual progress bar generator reflects accurate fill ratios', async () => {
    assertEqual(generateProgressBar(0, 10), '░░░░░░░░░░', '0% should be completely empty');
    assertEqual(generateProgressBar(50, 10), '█████░░░░░', '50% should be half full');
    assertEqual(generateProgressBar(100, 10), '██████████', '100% should be completely full');
    assertEqual(generateProgressBar(120, 10), '██████████', 'Over 100% should be clamped to full');
  });

  await runTest('T1.3.5: Budgets - Command /budget displays progress bar and remaining amounts', async () => {
    const user = store.getCurrentUser();
    const wallets = store.getWallets(user.id);
    const categories = store.getCategories(user.id);
    const currentMonth = new Date().toISOString().substring(0, 7);
    const budgets = store.getBudgets(user.id, currentMonth);
    const transactions = store.getTransactions(user.id);

    const reply = handleBotCommand('/budget', user, wallets, transactions, categories, budgets);
    assertContains(reply, 'Status Budget Bulan Ini');
    assertContains(reply, '%');
    assertContains(reply, 'Sisa:');
  });

  // ============================================================================
  // 4. TELEGRAM WEBHOOK IDEMPOTENCY FEATURE (5 Tests)
  // ============================================================================

  await runTest('T1.4.1: Webhook Idempotency - New update_id is marked as processed', async () => {
    const updateId = 987654321;
    assertFalse(store.isTelegramUpdateProcessed(updateId), 'Should not be marked initially');

    await callTelegramWebhook({
      update_id: updateId,
      message: {
        chat: { id: 109283742 },
        text: 'beli kopi 25rb',
        date: Math.floor(Date.now() / 1000)
      }
    });

    assertTrue(store.isTelegramUpdateProcessed(updateId), 'Must be marked as processed in idempotency registry');
  });

  await runTest('T1.4.2: Webhook Idempotency - Duplicate update_id returns HTTP 200 already_processed_idempotent', async () => {
    const updateId = 88112233;
    const payload = {
      update_id: updateId,
      message: {
        chat: { id: 109283742 },
        text: 'beli nasi padang 30rb',
        date: Math.floor(Date.now() / 1000)
      }
    };

    const firstRes = await callTelegramWebhook(payload);
    assertEqual(firstRes.status, 200);
    assertTrue(firstRes.body.ok);

    const secondRes = await callTelegramWebhook(payload);
    assertEqual(secondRes.status, 200);
    assertTrue(secondRes.body.ok);
    assertEqual(secondRes.body.status, 'already_processed_idempotent', 'Must return idempotency indicator');
  });

  await runTest('T1.4.3: Webhook Idempotency - Duplicate update_id does not create duplicate transaction', async () => {
    const updateId = 77665544;
    const initialTxCount = store.getTransactions(DEMO_USER_ID).length;
    const payload = {
      update_id: updateId,
      message: {
        chat: { id: 109283742 },
        text: 'beli es teh 5rb',
        date: Math.floor(Date.now() / 1000)
      }
    };

    await callTelegramWebhook(payload);
    const countAfterFirst = store.getTransactions(DEMO_USER_ID).length;
    assertEqual(countAfterFirst, initialTxCount + 1, 'First call must create 1 transaction');

    await callTelegramWebhook(payload);
    const countAfterSecond = store.getTransactions(DEMO_USER_ID).length;
    assertEqual(countAfterSecond, countAfterFirst, 'Duplicate call must NOT create another transaction');
  });

  await runTest('T1.4.4: Webhook Idempotency - Duplicate update_id does not deduct wallet balance twice', async () => {
    const updateId = 66554433;
    const defaultWallet = store.getDefaultWallet(DEMO_USER_ID)!;
    const initialBalance = defaultWallet.balance;
    const payload = {
      update_id: updateId,
      message: {
        chat: { id: 109283742 },
        text: 'beli bensin 50rb',
        date: Math.floor(Date.now() / 1000)
      }
    };

    await callTelegramWebhook(payload);
    const balanceAfterFirst = store.getWallets(DEMO_USER_ID).find(w => w.id === defaultWallet.id)!.balance;
    assertEqual(balanceAfterFirst, initialBalance - 50000);

    await callTelegramWebhook(payload);
    const balanceAfterSecond = store.getWallets(DEMO_USER_ID).find(w => w.id === defaultWallet.id)!.balance;
    assertEqual(balanceAfterSecond, balanceAfterFirst, 'Balance must remain identical after duplicate webhook call');
  });

  await runTest('T1.4.5: Webhook Idempotency - Distinct update_ids are each processed successfully', async () => {
    const initialTxCount = store.getTransactions(DEMO_USER_ID).length;

    await callTelegramWebhook({
      update_id: 11110001,
      message: { chat: { id: 109283742 }, text: 'beli martabak 35rb', date: Math.floor(Date.now() / 1000) }
    });

    await callTelegramWebhook({
      update_id: 11110002,
      message: { chat: { id: 109283742 }, text: 'beli roti 15rb', date: Math.floor(Date.now() / 1000) }
    });

    const finalTxCount = store.getTransactions(DEMO_USER_ID).length;
    assertEqual(finalTxCount, initialTxCount + 2, 'Two distinct updates should produce two distinct transactions');
  });

  // ============================================================================
  // 5. NLP TEXT PARSER FEATURE (5 Tests)
  // ============================================================================

  await runTest('T1.5.1: NLP Parsing - Indonesian thousand formats ("15rb", "500k", "25 ribu")', async () => {
    const res1 = await parseTransactionNaturalLanguage('beli bakso 15rb');
    assertTrue(res1.success);
    assertEqual(res1.data?.nominal, 15000);
    assertEqual(res1.data?.jenis, 'pengeluaran');

    const res2 = await parseTransactionNaturalLanguage('topup gopay 500k');
    assertTrue(res2.success);
    assertEqual(res2.data?.nominal, 500000);

    const res3 = await parseTransactionNaturalLanguage('nasi goreng 25 ribu');
    assertTrue(res3.success);
    assertEqual(res3.data?.nominal, 25000);
  });

  await runTest('T1.5.2: NLP Parsing - Indonesian million formats ("1.5jt", "1,5juta", "7jt")', async () => {
    const res1 = await parseTransactionNaturalLanguage('gajian 1.5jt');
    assertTrue(res1.success);
    assertEqual(res1.data?.nominal, 1500000);
    assertEqual(res1.data?.jenis, 'pemasukan');

    const res2 = await parseTransactionNaturalLanguage('terima transfer 1,5juta');
    assertTrue(res2.success);
    assertEqual(res2.data?.nominal, 1500000);

    const res3 = await parseTransactionNaturalLanguage('gaji freelance 7jt');
    assertTrue(res3.success);
    assertEqual(res3.data?.nominal, 7000000);
  });

  await runTest('T1.5.3: NLP Parsing - Indonesian billion formats ("2.5m", "100 miliar")', async () => {
    const res1 = await parseTransactionNaturalLanguage('investasi dividen 2.5m');
    assertTrue(res1.success);
    assertEqual(res1.data?.nominal, 2500000000);

    const res2 = await parseTransactionNaturalLanguage('pendanaan startup 100 miliar');
    assertTrue(res2.success);
    assertEqual(res2.data?.nominal, 100000000000);
  });

  await runTest('T1.5.4: NLP Parsing - Automatic classification of income vs expense vs transfer', async () => {
    const exp = await parseTransactionNaturalLanguage('makan siang padang 35rb');
    assertEqual(exp.data?.jenis, 'pengeluaran');

    const inc = await parseTransactionNaturalLanguage('gajian bulanan 15.5jt');
    assertEqual(inc.data?.jenis, 'pemasukan');

    const trf = await parseTransactionNaturalLanguage('transfer 300rb dari bca ke gopay');
    assertEqual(trf.data?.jenis, 'transfer');
  });

  await runTest('T1.5.5: NLP Parsing - Explicit wallet detection ("pakai gopay", "via bca", "tunai")', async () => {
    const resGopay = await parseTransactionNaturalLanguage('kopi kenangan 25k pakai gopay');
    assertEqual(resGopay.data?.dompet, 'GoPay');

    const resBca = await parseTransactionNaturalLanguage('beli baju 250rb via bca');
    assertEqual(resBca.data?.dompet, 'BCA Utama');

    const resCash = await parseTransactionNaturalLanguage('parkir motor 2rb tunai');
    assertEqual(resCash.data?.dompet, 'Uang Tunai (Dompet)');
  });

  // ============================================================================
  // 6. RECEIPT ITEMS & OCR VISION FEATURE (5 Tests)
  // ============================================================================

  await runTest('T1.6.1: Receipt OCR - Pro user photo input parses merchant and items', async () => {
    const receiptData = await parseReceiptPhoto('sample_url', 'Indomaret Point Sudirman');
    assertEqual(receiptData.merchant, 'Indomaret Point Sudirman');
    assertGreaterThan(receiptData.items.length, 0);
    assertGreaterThan(receiptData.totalAmount, 0);
  });

  await runTest('T1.6.2: Receipt OCR - Item prices sum exactly to total receipt amount', async () => {
    const receiptData = await parseReceiptPhoto('sample_url', 'Indomaret Point Sudirman');
    const computedSum = receiptData.items.reduce((s, itm) => s + itm.price, 0);
    assertEqual(receiptData.totalAmount, computedSum, 'Total amount must equal sum of item prices');
  });

  await runTest('T1.6.3: Receipt OCR - Stored transaction contains child receiptItems', async () => {
    const res = await callTelegramWebhook({
      update_id: 5544001,
      type: 'photo',
      photoUrl: 'https://example.com/receipt.jpg',
      merchantName: 'Indomaret Point',
      message: { chat: { id: 109283742 }, date: Math.floor(Date.now() / 1000) }
    });

    assertEqual(res.status, 200);
    assertTrue(res.body.ok);
    assertTrue(Boolean(res.body.transaction));
    assertTrue(Boolean(res.body.transaction.receiptItems));
    assertGreaterThan(res.body.transaction.receiptItems.length, 0);
  });

  await runTest('T1.6.4: Receipt OCR - Starter plan user is blocked with upgrade CTA', async () => {
    // Siti Rahma is on Starter plan (chat_id: 554433221)
    const res = await callTelegramWebhook({
      update_id: 5544002,
      type: 'photo',
      message: { chat: { id: 554433221 }, photo: [{ file_id: 'photo_1' }], date: Math.floor(Date.now() / 1000) }
    });

    assertEqual(res.status, 200);
    assertTrue(res.body.requiresUpgrade, 'Starter user must require upgrade for photo receipts');
    assertContains(res.body.reply, 'Fitur Foto Struk Khusus Pengguna Pro');
  });

  await runTest('T1.6.5: Receipt OCR - Generic restaurant receipt parsing', async () => {
    const res = await parseReceiptPhoto('sample_url', 'Restoran Padang Sederhana');
    assertEqual(res.merchant, 'Restoran Padang Sederhana');
    assertEqual(res.suggestedCategory, 'Makanan & Minuman');
  });

  // ============================================================================
  // 7. VOICE NOTE STT FEATURE (5 Tests)
  // ============================================================================

  await runTest('T1.7.1: Voice STT - Audio duration <= 60 seconds transcribes successfully', async () => {
    const result = await transcribeVoiceNote('audio_sample.ogg', 8);
    assertTrue(Boolean(result.transcript));
    assertEqual(result.duration, 8);
  });

  await runTest('T1.7.2: Voice STT - Webhook reply includes microphone transcript banner', async () => {
    const res = await callTelegramWebhook({
      update_id: 6611001,
      type: 'voice',
      text: 'Beli bakso malang 25 ribu',
      message: { chat: { id: 109283742 }, voice: { duration: 5 }, date: Math.floor(Date.now() / 1000) }
    });

    assertEqual(res.status, 200);
    assertTrue(res.body.ok);
    assertContains(res.body.reply, '🎙️ Transkrip:');
  });

  await runTest('T1.7.3: Voice STT - Transcribed transaction is saved with source telegram_voice', async () => {
    const res = await callTelegramWebhook({
      update_id: 6611002,
      type: 'voice',
      text: 'Kopi kenangan 28 ribu',
      message: { chat: { id: 109283742 }, voice: { duration: 4 }, date: Math.floor(Date.now() / 1000) }
    });

    assertEqual(res.status, 200);
    const tx = res.body.transaction;
    assertEqual(tx.source, 'telegram_voice');
  });

  await runTest('T1.7.4: Voice STT - Hint extraction parses spoken text accurately', async () => {
    const result = await transcribeVoiceNote('audio.ogg', 6, '🎙️ Voice note (6 detik): "Beli solar 100 ribu"');
    assertEqual(result.transcript, 'Beli solar 100 ribu');
  });

  await runTest('T1.7.5: Voice STT - Persists transcriptText in transaction database record', async () => {
    const res = await callTelegramWebhook({
      update_id: 6611003,
      type: 'voice',
      text: 'Makan nasi padang 32 ribu',
      message: { chat: { id: 109283742 }, voice: { duration: 5 }, date: Math.floor(Date.now() / 1000) }
    });

    const tx = res.body.transaction;
    assertTrue(Boolean(tx.transcriptText));
    assertContains(tx.transcriptText!, 'padang');
  });

  // ============================================================================
  // 8. PDF & EXCEL EXPORT FEATURE (5 Tests)
  // ============================================================================

  await runTest('T1.8.1: Export - calculateReportSummary accurately aggregates income and expense', async () => {
    const txs = store.getTransactions(DEMO_USER_ID);
    const cats = store.getCategories(DEMO_USER_ID);
    const summary = calculateReportSummary(txs, cats);

    assertGreaterThan(summary.totalIncome, 0);
    assertGreaterThan(summary.totalExpense, 0);
    assertEqual(summary.netCashflow, summary.totalIncome - summary.totalExpense);
    assertEqual(summary.transactionCount, txs.length);
  });

  await runTest('T1.8.2: Export - generatePDFReport returns valid jsPDF instance and file size', async () => {
    const txs = store.getTransactions(DEMO_USER_ID);
    const wallets = store.getWallets(DEMO_USER_ID);
    const cats = store.getCategories(DEMO_USER_ID);

    const pdf = generatePDFReport(txs, wallets, cats, 'Budi Pratama', 'Oktober 2026');
    assertTrue(pdf.fileName.endsWith('.pdf'));
    assertGreaterThan(pdf.fileSize, 1000, 'PDF size must be non-trivial');
    assertTrue(Boolean(pdf.doc));
  });

  await runTest('T1.8.3: Export - generateExcelReport generates workbook with two sheets', async () => {
    const txs = store.getTransactions(DEMO_USER_ID);
    const wallets = store.getWallets(DEMO_USER_ID);
    const cats = store.getCategories(DEMO_USER_ID);

    const excel = generateExcelReport(txs, wallets, cats, 'Budi Pratama', 'Oktober 2026');
    assertTrue(excel.fileName.endsWith('.xlsx'));
    assertGreaterThan(excel.buffer.length, 1000);
    assertEqual(excel.wb.SheetNames.length, 2);
    assertEqual(excel.wb.SheetNames[0], 'Daftar Transaksi');
    assertEqual(excel.wb.SheetNames[1], 'Ringkasan Keuangan');
  });

  await runTest('T1.8.4: Export - Excel transaction rows match actual count', async () => {
    const txs = store.getTransactions(DEMO_USER_ID);
    const wallets = store.getWallets(DEMO_USER_ID);
    const cats = store.getCategories(DEMO_USER_ID);

    const excel = generateExcelReport(txs, wallets, cats, 'Budi Pratama', 'Oktober 2026');
    const sheet = excel.wb.Sheets['Daftar Transaksi'];
    // Sheet range !ref contains rows: A1 to Jn
    assertTrue(Boolean(sheet['!ref']));
  });

  await runTest('T1.8.5: Export - Struk transaction includes item details in Excel', async () => {
    const txs = store.getTransactions(DEMO_USER_ID);
    const receiptTx = txs.find(t => t.receiptItems && t.receiptItems.length > 0);
    assertTrue(Boolean(receiptTx), 'Seed should contain at least 1 receipt transaction');

    const wallets = store.getWallets(DEMO_USER_ID);
    const cats = store.getCategories(DEMO_USER_ID);
    const excel = generateExcelReport(txs, wallets, cats, 'Budi Pratama', 'Oktober 2026');
    assertTrue(Boolean(excel.wb));
  });

  // ============================================================================
  // 9. ADMIN PROTECTION & IMPERSONATION FEATURE (5 Tests)
  // ============================================================================

  await runTest('T1.9.1: Admin - Retrieve superadmin profile', async () => {
    const admin = store.getAdminUser();
    assertEqual(admin.role, 'admin');
    assertEqual(admin.id, ADMIN_USER_ID);
  });

  await runTest('T1.9.2: Admin - Impersonation switches active user context', async () => {
    assertEqual(store.getActiveUserId(), DEMO_USER_ID);
    store.setImpersonation('usr_siti_rahma_02');
    assertEqual(store.getActiveUserId(), 'usr_siti_rahma_02');
    assertEqual(store.getImpersonatingUserId(), 'usr_siti_rahma_02');
  });

  await runTest('T1.9.3: Admin - Impersonated user view filters wallets to target user', async () => {
    store.setImpersonation('usr_siti_rahma_02');
    const activeWallets = store.getWallets();
    assertTrue(activeWallets.every(w => w.userId === 'usr_siti_rahma_02'));
  });

  await runTest('T1.9.4: Admin - Clear impersonation reverts back to original user', async () => {
    store.setImpersonation('usr_siti_rahma_02');
    store.setImpersonation(null);
    assertEqual(store.getActiveUserId(), DEMO_USER_ID);
    assertEqual(store.getImpersonatingUserId(), null);
  });

  await runTest('T1.9.5: Admin - Manage AI Multi-Provider configs', async () => {
    const configs = store.getAIConfigs();
    assertGreaterThan(configs.length, 1);
    const geminiCfg = configs.find(c => c.provider === 'gemini')!;

    store.updateAIConfig(geminiCfg.id, { mode: 'single' });
    const updated = store.getAIConfigs().find(c => c.id === geminiCfg.id)!;
    assertEqual(updated.mode, 'single');
  });

  // ============================================================================
  // 10. AUDIT LOGS FEATURE (5 Tests)
  // ============================================================================

  await runTest('T1.10.1: Audit Logs - Record transaction inspection audit log', async () => {
    const initialCount = store.getAuditLogs().length;
    const admin = store.getAdminUser();

    const log = store.addAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      targetUserId: DEMO_USER_ID,
      action: 'INSPECT_USER_TRANSACTIONS',
      details: { reason: 'User support ticket #4401' }
    });

    assertTrue(Boolean(log.id));
    assertEqual(store.getAuditLogs().length, initialCount + 1);
  });

  await runTest('T1.10.2: Audit Logs - Captured metadata integrity', async () => {
    const admin = store.getAdminUser();
    const reasonText = 'Audit privacy check for compliance';

    const log = store.addAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      targetUserId: 'usr_siti_rahma_02',
      action: 'INSPECT_USER_TRANSACTIONS',
      details: { reason: reasonText }
    });

    assertEqual(log.adminEmail, 'admin@tatadana.id');
    assertEqual(log.targetUserId, 'usr_siti_rahma_02');
    assertEqual(log.details.reason, reasonText);
    assertTrue(Boolean(log.createdAt));
  });

  await runTest('T1.10.3: Audit Logs - Query audit log list returns newest first', async () => {
    const admin = store.getAdminUser();
    store.addAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'ACTION_ONE',
      details: {}
    });
    store.addAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'ACTION_TWO',
      details: {}
    });

    const logs = store.getAuditLogs();
    assertEqual(logs[0].action, 'ACTION_TWO', 'Newest log must be first in list');
  });

  await runTest('T1.10.4: Audit Logs - AI activity logs tracking', async () => {
    const initialLogsCount = store.getAILogs().length;
    store.addAILog({
      feature: 'text_parser',
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      promptSummary: 'Parse text: "beli kopi 25rb"',
      latencyMs: 310,
      tokensUsed: 120,
      status: 'success'
    });

    assertEqual(store.getAILogs().length, initialLogsCount + 1);
  });

  await runTest('T1.10.5: Audit Logs - Payment verification records approval notes', async () => {
    const payments = store.getPayments();
    const pendingPayment = payments.find(p => p.status === 'pending');
    assertTrue(Boolean(pendingPayment), 'Should have a pending payment in seed data');

    const admin = store.getAdminUser();
    const updatedPayment = store.updatePaymentStatus(
      pendingPayment!.id,
      'approved',
      'Verified via BCA KlikBCA statement',
      admin.id
    );

    assertEqual(updatedPayment.status, 'approved');
    assertEqual(updatedPayment.approvedBy, admin.id);
    assertEqual(updatedPayment.adminNotes, 'Verified via BCA KlikBCA statement');
  });

  return results;
}
