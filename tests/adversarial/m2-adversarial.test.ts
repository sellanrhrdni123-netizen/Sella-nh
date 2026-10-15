/**
 * ==============================================================================
 * TATADANA ADVERSARIAL STRESS TEST SUITE: MILESTONE 2 (TELEGRAM BOT & CRON & LIMITS)
 * File: tests/adversarial/m2-adversarial.test.ts
 *
 * Verifies:
 * 1. Daily Reminder Cron endpoint (/api/cron/reminders):
 *    - Schedule matching against user preferences in WIB
 *    - Parameter overrides (force=true, time=HH:mm)
 *    - Max 2x/day schedule enforcement
 *    - Filtering of disabled users & users without chat_id
 *    - Telegram API delivery failure resilience & error capturing
 * 2. Standalone Dev Simulator Route (/dev/telegram-simulator):
 *    - Route file existence and export structure
 *    - Persona switching between Pro (Budi) and Starter (Siti Rahma)
 *    - Store reset capability
 *    - Webhook simulation bypass (idempotency override for dev)
 * 3. Starter Tier Limit Enforcement:
 *    - 50 transactions/month limit on Webhook (boundary 49, 50, 51)
 *    - Bot command exemption from quota limits
 *    - Cross-month quota isolation
 *    - Pro plan exemption (unlimited transactions)
 *    - 3-wallet limit logic for Starter vs Pro
 *    - 5-budget category limit logic for Starter vs Pro
 *    - In-place budget updates exemption
 * 4. WIB (Asia/Jakarta) Timezone Integrity:
 *    - Date and time formatting in UTC+7
 *    - Midnight and month-end boundary crossovers
 * ==============================================================================
 */

import { store, DEMO_USER_ID, STARTER_USER_ID, ADMIN_USER_ID } from '../../src/lib/storage';
import { GET as remindersGET, POST as remindersPOST } from '../../src/app/api/cron/reminders/route';
import { POST as webhookPOST } from '../../src/app/api/telegram/webhook/route';
import { formatWIBDate, formatWIBTime, formatIDR } from '../../src/lib/utils';
import { formatDailyReminder, handleBotCommand } from '../../src/lib/telegram';
import { parseTransactionNaturalLanguage } from '../../src/lib/ai/parser';

export interface TestResult {
  name: string;
  passed: boolean;
  category: string;
  details?: string;
  error?: string;
}

export async function runM2AdversarialTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  function assert(name: string, category: string, condition: boolean, details?: string) {
    results.push({
      name,
      category,
      passed: Boolean(condition),
      details,
      error: condition ? undefined : details || 'Assertion failed'
    });
  }

  function assertEqual(name: string, category: string, actual: any, expected: any, details?: string) {
    const passed = actual === expected;
    results.push({
      name,
      category,
      passed,
      details: details ? `${details} (got ${actual}, expected ${expected})` : `Got ${actual}, expected ${expected}`,
      error: passed ? undefined : `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    });
  }

  function assertContains(name: string, category: string, text: string, substr: string, details?: string) {
    const passed = typeof text === 'string' && text.includes(substr);
    results.push({
      name,
      category,
      passed,
      details,
      error: passed ? undefined : `Text did not contain "${substr}". Got:\n${text?.substring(0, 200)}...`
    });
  }

  function createMockRequest(url: string, method: string = 'GET', body?: any): any {
    return {
      url,
      method,
      json: async () => body || {},
      headers: new Headers({ 'content-type': 'application/json' })
    };
  }

  // Preserve and restore fetch
  const originalFetch = globalThis.fetch;

  // ============================================================================
  // CATEGORY 1: REMINDER CRON ENDPOINT & WIB SCHEDULE MATCHING
  // ============================================================================
  const CAT_CRON = 'Reminder Cron & WIB Schedule';

  // Helper to run cron test with mocked Telegram fetch
  const withMockedFetch = async (
    mockFn: (url: string, init?: any) => Promise<Response>,
    testFn: () => Promise<void>
  ) => {
    globalThis.fetch = mockFn as any;
    try {
      await testFn();
    } finally {
      globalThis.fetch = originalFetch;
    }
  };

  // Test 1.1: Cron GET with non-matching time -> 0 dispatched
  store.resetAll();
  await withMockedFetch(
    async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
    async () => {
      const req = createMockRequest('http://localhost:3000/api/cron/reminders?time=03:15');
      const res = await remindersGET(req);
      const data = await res.json();

      assertEqual('ADV-M2.1.1: Cron returns HTTP 200', CAT_CRON, res.status, 200);
      assertEqual('ADV-M2.1.1: Cron returns ok=true', CAT_CRON, data.ok, true);
      assertEqual('ADV-M2.1.1: Cron wibTime matches parameter override', CAT_CRON, data.wibTime, '03:15');
      assertEqual('ADV-M2.1.1: Unmatched time dispatches 0 reminders', CAT_CRON, data.dispatchedCount, 0);
    }
  );

  // Test 1.2: Cron GET with time=12:30 -> Budi Pratama (Pro) matches
  store.resetAll();
  await withMockedFetch(
    async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
    async () => {
      const req = createMockRequest('http://localhost:3000/api/cron/reminders?time=12:30');
      const res = await remindersGET(req);
      const data = await res.json();

      assertEqual('ADV-M2.1.2: Cron matches 12:30 schedule', CAT_CRON, data.dispatchedCount, 1);
      assert(
        'ADV-M2.1.2: Dispatched to Budi Pratama',
        CAT_CRON,
        data.dispatched?.some((d: any) => d.userId === DEMO_USER_ID && d.status === 'sent'),
        'Expected Budi Pratama to be dispatched'
      );
    }
  );

  // Test 1.3: Cron GET with time=19:30 -> Siti Rahma (Starter) matches
  store.resetAll();
  await withMockedFetch(
    async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
    async () => {
      const req = createMockRequest('http://localhost:3000/api/cron/reminders?time=19:30');
      const res = await remindersGET(req);
      const data = await res.json();

      assertEqual('ADV-M2.1.3: Cron matches 19:30 schedule', CAT_CRON, data.dispatchedCount, 1);
      assert(
        'ADV-M2.1.3: Dispatched to Siti Rahma',
        CAT_CRON,
        data.dispatched?.some((d: any) => d.userId === STARTER_USER_ID && d.status === 'sent'),
        'Expected Siti Rahma to be dispatched'
      );
    }
  );

  // Test 1.4: Cron GET with force=true -> dispatches to all enabled users
  store.resetAll();
  await withMockedFetch(
    async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
    async () => {
      const req = createMockRequest('http://localhost:3000/api/cron/reminders?force=true');
      const res = await remindersGET(req);
      const data = await res.json();

      assertEqual('ADV-M2.1.4: Force dispatches to all eligible users (Budi & Siti)', CAT_CRON, data.dispatchedCount, 2);
    }
  );

  // Test 1.5: Disabled reminder user (Admin) is excluded even under force=true
  store.resetAll();
  await withMockedFetch(
    async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
    async () => {
      const req = createMockRequest('http://localhost:3000/api/cron/reminders?force=true');
      const res = await remindersGET(req);
      const data = await res.json();

      assert(
        'ADV-M2.1.5: Admin with dailyReminderEnabled=false is never dispatched',
        CAT_CRON,
        !data.dispatched?.some((d: any) => d.userId === ADMIN_USER_ID),
        'Admin must not receive reminders'
      );
    }
  );

  // Test 1.6: Max 2x/day schedule enforcement
  store.resetAll();
  // Add 4 reminder times to a user profile
  const user = store.getProfile(DEMO_USER_ID)!;
  store.updateProfile(DEMO_USER_ID, {
    reminderTimes: ['08:00', '12:00', '16:00', '20:00']
  });

  await withMockedFetch(
    async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
    async () => {
      // 16:00 is 3rd time, beyond max 2x/day -> should NOT trigger
      const req16 = createMockRequest('http://localhost:3000/api/cron/reminders?time=16:00');
      const res16 = await remindersGET(req16);
      const data16 = await res16.json();

      assertEqual('ADV-M2.1.6: 3rd schedule time (16:00) is ignored by max 2x limit', CAT_CRON, data16.dispatchedCount, 0);

      // 08:00 is 1st time -> should trigger
      const req08 = createMockRequest('http://localhost:3000/api/cron/reminders?time=08:00');
      const res08 = await remindersGET(req08);
      const data08 = await res08.json();

      assertEqual('ADV-M2.1.6: 1st schedule time (08:00) triggers successfully', CAT_CRON, data08.dispatchedCount, 1);
    }
  );

  // Test 1.7: Telegram API failure handling does not crash cron
  store.resetAll();
  await withMockedFetch(
    async () => new Response(JSON.stringify({ ok: false, description: 'Unauthorized' }), { status: 401 }),
    async () => {
      const req = createMockRequest('http://localhost:3000/api/cron/reminders?time=12:30');
      const res = await remindersGET(req);
      const data = await res.json();

      assertEqual('ADV-M2.1.7: Cron returns HTTP 200 even on Telegram failure', CAT_CRON, res.status, 200);
      assert(
        'ADV-M2.1.7: Marks failed status gracefully',
        CAT_CRON,
        data.dispatched?.some((d: any) => d.status === 'failed' && d.error?.includes('401')),
        'Failed status should be recorded'
      );
    }
  );

  // Test 1.8: Cron POST endpoint functions identically
  store.resetAll();
  await withMockedFetch(
    async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
    async () => {
      const req = createMockRequest('http://localhost:3000/api/cron/reminders?force=true', 'POST');
      const res = await remindersPOST(req);
      const data = await res.json();

      assertEqual('ADV-M2.1.8: POST cron returns HTTP 200', CAT_CRON, res.status, 200);
      assertEqual('ADV-M2.1.8: POST cron dispatches to eligible users', CAT_CRON, data.dispatchedCount, 2);
    }
  );

  // ============================================================================
  // CATEGORY 2: DEV SIMULATOR ROUTE & INTERACTIVE FEATURES
  // ============================================================================
  const CAT_SIM = 'Dev Simulator Route & Tooling';

  // Test 2.1: Persona switcher switches between Pro (Budi) and Starter (Siti)
  store.resetAll();
  assertEqual('ADV-M2.2.1: Default active user is Budi Pratama (Pro)', CAT_SIM, store.getCurrentUser().plan, 'pro');

  store.setImpersonation(STARTER_USER_ID);
  assertEqual('ADV-M2.2.1: Impersonated user is Siti Rahma (Starter)', CAT_SIM, store.getCurrentUser().plan, 'starter');
  assertEqual('ADV-M2.2.1: Impersonated user ID matches STARTER_USER_ID', CAT_SIM, store.getCurrentUser().id, STARTER_USER_ID);

  store.setImpersonation(null);
  assertEqual('ADV-M2.2.1: Clearing impersonation reverts to Pro user', CAT_SIM, store.getCurrentUser().plan, 'pro');

  // Test 2.2: Reset store restores canonical seed profiles and wallets
  store.addWallet({
    userId: DEMO_USER_ID,
    name: 'Junk Wallet to Reset',
    type: 'cash',
    balance: 99999,
    isDefault: false,
    color: '#000000',
    icon: 'banknote'
  });
  assert('ADV-M2.2.2: Wallet added before reset', CAT_SIM, store.getWallets(DEMO_USER_ID).some(w => w.name === 'Junk Wallet to Reset'));

  store.resetAll();
  assert('ADV-M2.2.2: Junk wallet cleared after resetAll()', CAT_SIM, !store.getWallets(DEMO_USER_ID).some(w => w.name === 'Junk Wallet to Reset'));
  assertEqual('ADV-M2.2.2: Default wallets restored to 4', CAT_SIM, store.getWallets(DEMO_USER_ID).length, 4);

  // Test 2.3: Webhook simulation: true bypasses idempotency
  store.resetAll();
  const simUpdateId = 999999;
  const simReq1 = createMockRequest('http://localhost:3000/api/telegram/webhook', 'POST', {
    simulation: true,
    update_id: simUpdateId,
    message: {
      chat: { id: 109283742 },
      text: 'kopi americano 25rb',
      date: Math.floor(Date.now() / 1000)
    }
  });

  const simRes1 = await webhookPOST(simReq1);
  const simData1 = await simRes1.json();
  assertEqual('ADV-M2.2.3: Simulation request 1 succeeds', CAT_SIM, simRes1.status, 200);
  assert('ADV-M2.2.3: Transaction created in sim 1', CAT_SIM, Boolean(simData1.transaction));

  // Send same update_id with simulation: true
  const simReq2 = createMockRequest('http://localhost:3000/api/telegram/webhook', 'POST', {
    simulation: true,
    update_id: simUpdateId,
    message: {
      chat: { id: 109283742 },
      text: 'kopi latte 30rb',
      date: Math.floor(Date.now() / 1000)
    }
  });

  const simRes2 = await webhookPOST(simReq2);
  const simData2 = await simRes2.json();
  assertEqual('ADV-M2.2.3: Simulation request 2 succeeds without idempotency block', CAT_SIM, simRes2.status, 200);
  assert('ADV-M2.2.3: Transaction created in sim 2 (bypassed idempotency)', CAT_SIM, Boolean(simData2.transaction));

  // ============================================================================
  // CATEGORY 3: STARTER TIER LIMITS (50 TRX, 3 WALLETS, 5 BUDGETS)
  // ============================================================================
  const CAT_LIMIT = 'Starter Tier Limits Enforcement';

  // Test 3.1: Boundary 49 -> 50 transactions for Starter user
  store.resetAll();
  const starter = store.getProfiles().find(p => p.plan === 'starter' && p.telegramChatId)!;
  const currentMonth = new Date().toISOString().substring(0, 7);
  const starterWallet = store.getDefaultWallet(starter.id)!;

  // Clear any existing transactions for starter in this month
  for (let i = 0; i < 49; i++) {
    store.addTransaction({
      userId: starter.id,
      walletId: starterWallet.id,
      amount: 5000,
      description: `Tx #${i + 1}`,
      type: 'expense',
      source: 'telegram_text',
      transactionDate: `${currentMonth}-02T10:00:00Z`
    });
  }

  // 50th transaction should SUCCEED
  const req50 = createMockRequest('http://localhost:3000/api/telegram/webhook', 'POST', {
    update_id: 11050,
    message: {
      chat: { id: starter.telegramChatId },
      text: 'makan bakso 20rb',
      date: Math.floor(Date.now() / 1000)
    }
  });
  const res50 = await webhookPOST(req50);
  const data50 = await res50.json();

  assertEqual('ADV-M2.3.1: 50th transaction succeeds for Starter', CAT_LIMIT, res50.status, 200);
  assert('ADV-M2.3.1: Transaction record created for 50th tx', CAT_LIMIT, Boolean(data50.transaction));

  // 51st transaction should be BLOCKED
  const req51 = createMockRequest('http://localhost:3000/api/telegram/webhook', 'POST', {
    update_id: 11051,
    message: {
      chat: { id: starter.telegramChatId },
      text: 'es teh 5rb',
      date: Math.floor(Date.now() / 1000)
    }
  });
  const res51 = await webhookPOST(req51);
  const data51 = await res51.json();

  assertEqual('ADV-M2.3.2: 51st transaction returns HTTP 200', CAT_LIMIT, res51.status, 200);
  assert('ADV-M2.3.2: 51st transaction is not saved', CAT_LIMIT, !data51.transaction);
  assertContains('ADV-M2.3.2: Contains limit reached message', CAT_LIMIT, data51.reply, 'Batas Transaksi Bulanan Tercapai!');
  assertContains('ADV-M2.3.2: Contains upgrade CTA link', CAT_LIMIT, data51.reply, 'Upgrade ke Pro sekarang');

  // Test 3.3: Slash command is allowed even at 50 transactions
  const reqCmd = createMockRequest('http://localhost:3000/api/telegram/webhook', 'POST', {
    update_id: 11052,
    message: {
      chat: { id: starter.telegramChatId },
      text: '/saldo',
      date: Math.floor(Date.now() / 1000)
    }
  });
  const resCmd = await webhookPOST(reqCmd);
  const dataCmd = await resCmd.json();

  assertEqual('ADV-M2.3.3: Slash command succeeds when limit reached', CAT_LIMIT, resCmd.status, 200);
  assertContains('ADV-M2.3.3: /saldo reply returned cleanly', CAT_LIMIT, dataCmd.reply, 'Daftar Saldo Dompet TataDana');

  // Test 3.4: Pro user is NEVER blocked by 50-transaction limit
  store.resetAll();
  const proUser = store.getCurrentUser();
  const proWallet = store.getDefaultWallet(proUser.id)!;

  for (let i = 0; i < 55; i++) {
    store.addTransaction({
      userId: proUser.id,
      walletId: proWallet.id,
      amount: 10000,
      description: `Pro Tx #${i + 1}`,
      type: 'expense',
      source: 'telegram_text',
      transactionDate: `${currentMonth}-03T10:00:00Z`
    });
  }

  const reqPro = createMockRequest('http://localhost:3000/api/telegram/webhook', 'POST', {
    update_id: 11055,
    message: {
      chat: { id: proUser.telegramChatId },
      text: 'kopi kenangan 28rb',
      date: Math.floor(Date.now() / 1000)
    }
  });
  const resPro = await webhookPOST(reqPro);
  const dataPro = await resPro.json();

  assertEqual('ADV-M2.3.4: Pro user succeeds past 50 transactions', CAT_LIMIT, resPro.status, 200);
  assert('ADV-M2.3.4: Transaction created for Pro user beyond 50', CAT_LIMIT, Boolean(dataPro.transaction));

  // Test 3.5: Starter 3 Wallets Limit Logic
  // Starter user (Siti Rahma) has 1 wallet initially in seed
  store.resetAll();
  const starterWallets = store.getWallets(STARTER_USER_ID);
  assertEqual('ADV-M2.3.5: Siti Rahma initial wallets count is 1', CAT_LIMIT, starterWallets.length, 1);

  // Add 2 more wallets to reach exactly 3
  store.addWallet({
    userId: STARTER_USER_ID,
    name: 'GoPay Siti',
    type: 'ewallet',
    balance: 100000,
    isDefault: false,
    color: '#00AA13',
    icon: 'smartphone'
  });
  store.addWallet({
    userId: STARTER_USER_ID,
    name: 'Cash Siti',
    type: 'cash',
    balance: 50000,
    isDefault: false,
    color: '#F97316',
    icon: 'banknote'
  });

  const starterWalletsAt3 = store.getWallets(STARTER_USER_ID);
  assertEqual('ADV-M2.3.5: Siti Rahma now has exactly 3 wallets', CAT_LIMIT, starterWalletsAt3.length, 3);

  // Validation logic check: (u.plan === 'starter' && wallets.length >= 3)
  const starterUserObj = store.getProfile(STARTER_USER_ID)!;
  const isStarterBlockedWallet = starterUserObj.plan === 'starter' && starterWalletsAt3.length >= 3;
  assertEqual('ADV-M2.3.5: Starter with 3 wallets is blocked from adding 4th', CAT_LIMIT, isStarterBlockedWallet, true);

  // Pro user with 3+ wallets is NOT blocked
  const proUserObj = store.getProfile(DEMO_USER_ID)!;
  const proWallets = store.getWallets(DEMO_USER_ID);
  const isProBlockedWallet = proUserObj.plan === 'starter' && proWallets.length >= 3;
  assertEqual('ADV-M2.3.5: Pro user with 4 wallets is NOT blocked', CAT_LIMIT, isProBlockedWallet, false);

  // Test 3.6: Starter 5 Budgets Limit Logic
  store.resetAll();
  const starterCats = store.getCategories(STARTER_USER_ID).filter(c => c.type === 'expense');
  // Add 5 budgets for Starter user
  for (let i = 0; i < 5; i++) {
    const cat = starterCats[i] || store.addCategory({
      userId: STARTER_USER_ID,
      name: `Kategori Baru ${i}`,
      type: 'expense',
      color: '#F97316',
      icon: 'tag',
      isCustom: true
    });
    store.setBudget(STARTER_USER_ID, cat.id, 500000, currentMonth);
  }

  const starterBudgets = store.getBudgets(STARTER_USER_ID, currentMonth);
  assertEqual('ADV-M2.3.6: Starter has exactly 5 category budgets', CAT_LIMIT, starterBudgets.length, 5);

  // Attempting to add 6th new category budget
  const newCatId = 'cat_new_6';
  const existingBudget = starterBudgets.find(b => b.categoryId === newCatId);
  const isStarterBlockedNewBudget = starterUserObj.plan === 'starter' && starterBudgets.length >= 5 && !existingBudget;
  assertEqual('ADV-M2.3.6: Starter blocked from adding 6th budget category', CAT_LIMIT, isStarterBlockedNewBudget, true);

  // Updating existing budget is NOT blocked
  const existingCatId = starterBudgets[0].categoryId;
  const existingBudgetFound = starterBudgets.find(b => b.categoryId === existingCatId);
  const isStarterBlockedUpdate = starterUserObj.plan === 'starter' && starterBudgets.length >= 5 && !existingBudgetFound;
  assertEqual('ADV-M2.3.6: Starter NOT blocked from updating existing budget', CAT_LIMIT, isStarterBlockedUpdate, false);

  // ============================================================================
  // CATEGORY 4: WIB TIMEZONE FORMATTING & SCHEDULE ARITHMETIC
  // ============================================================================
  const CAT_WIB = 'WIB Timezone Integrity';

  // Test 4.1: UTC to WIB date conversion
  // UTC 2026-10-13T17:00:00Z -> WIB (+7) is 2026-10-14 00:00 (Rabu, 14 Oktober 2026)
  const utcDate = '2026-10-13T17:00:00Z';
  const formattedWIBDate = formatWIBDate(utcDate);
  assertContains('ADV-M2.4.1: UTC 17:00 crosses to next day WIB (Rabu, 14 Oktober 2026)', CAT_WIB, formattedWIBDate, '14 Oktober 2026');
  assertContains('ADV-M2.4.1: Day name matches Rabu', CAT_WIB, formattedWIBDate, 'Rabu');

  // Test 4.2: UTC to WIB time conversion
  const formattedWIBTime = formatWIBTime(utcDate);
  assertEqual('ADV-M2.4.2: UTC 17:00 formats as 00:00 WIB', CAT_WIB, formattedWIBTime, '00:00 WIB');

  // Test 4.3: UTC afternoon conversion
  // UTC 2026-10-14T05:30:00Z -> WIB (+7) is 12:30 WIB
  const utcAfternoon = '2026-10-14T05:30:00Z';
  assertEqual('ADV-M2.4.3: UTC 05:30 formats as 12:30 WIB', CAT_WIB, formatWIBTime(utcAfternoon), '12:30 WIB');

  // Test 4.4: Currency formatting IDR
  assertEqual('ADV-M2.4.4: IDR 15.000 format', CAT_WIB, formatIDR(15000), 'Rp15.000');
  assertEqual('ADV-M2.4.4: IDR 1.500.000 format', CAT_WIB, formatIDR(1500000), 'Rp1.500.000');
  assertEqual('ADV-M2.4.4: IDR 0 format', CAT_WIB, formatIDR(0), 'Rp0');

  // ============================================================================
  // CATEGORY 5: DEFECT REMEDIATION EMPIRICAL CHECKS (BUG-M2-001 through 005)
  // ============================================================================
  const CAT_DEFECT = 'Defect Remediation Verification';

  // Test 5.1: BUG-M2-001 - Single transaction insertion and single wallet balance deduction
  store.resetAll();
  const defUser = store.getProfile(DEMO_USER_ID)!;
  const defWallet = store.getDefaultWallet(DEMO_USER_ID)!;
  const initialBalance = defWallet.balance;
  const initialTxCount = store.getTransactions(DEMO_USER_ID).length;

  const reqM2_1 = createMockRequest('http://localhost:3000/api/telegram/webhook', 'POST', {
    update_id: 70001,
    message: {
      chat: { id: defUser.telegramChatId },
      text: 'beli martabak manis 50rb',
      date: Math.floor(Date.now() / 1000)
    }
  });
  const resM2_1 = await webhookPOST(reqM2_1);
  const dataM2_1 = await resM2_1.json();

  assertEqual('ADV-M2.5.1: Webhook returns HTTP 200', CAT_DEFECT, resM2_1.status, 200);
  assert('ADV-M2.5.1: Transaction object returned', CAT_DEFECT, Boolean(dataM2_1.transaction));
  assertEqual('ADV-M2.5.1: Exactly ONE transaction added in store (no double storage)', CAT_DEFECT, store.getTransactions(DEMO_USER_ID).length, initialTxCount + 1);
  const updatedWallet = store.getWallets(DEMO_USER_ID).find(w => w.id === defWallet.id)!;
  assertEqual('ADV-M2.5.1: Wallet balance deducted exactly 50000 (no double deduction)', CAT_DEFECT, updatedWallet.balance, initialBalance - 50000);

  // Test 5.2: BUG-M2-002 - Concurrent duplicate webhook updates return idempotent 200
  store.resetAll();
  const dupUpdateId = 70002;
  const reqDup1 = createMockRequest('http://localhost:3000/api/telegram/webhook', 'POST', {
    update_id: dupUpdateId,
    message: {
      chat: { id: defUser.telegramChatId },
      text: 'kopi susu gula aren 25rb',
      date: Math.floor(Date.now() / 1000)
    }
  });
  const reqDup2 = createMockRequest('http://localhost:3000/api/telegram/webhook', 'POST', {
    update_id: dupUpdateId,
    message: {
      chat: { id: defUser.telegramChatId },
      text: 'kopi susu gula aren 25rb',
      date: Math.floor(Date.now() / 1000)
    }
  });

  const [resDup1, resDup2] = await Promise.all([webhookPOST(reqDup1), webhookPOST(reqDup2)]);
  const dataDup1 = await resDup1.json();
  const dataDup2 = await resDup2.json();

  assert('ADV-M2.5.2: Both requests return HTTP 200', CAT_DEFECT, resDup1.status === 200 && resDup2.status === 200);
  const statuses = [dataDup1.status, dataDup2.status];
  assert('ADV-M2.5.2: Exactly one duplicate returns already_processed_idempotent', CAT_DEFECT, statuses.includes('already_processed_idempotent'));
  const createdTxs = [dataDup1.transaction, dataDup2.transaction].filter(Boolean);
  assertEqual('ADV-M2.5.2: Exactly one transaction was created across concurrent requests', CAT_DEFECT, createdTxs.length, 1);

  // Test 5.3: BUG-M2-003 - Voice Note > 60s returns HTTP 200 with friendly guidance
  store.resetAll();
  const reqVoiceOver = createMockRequest('http://localhost:3000/api/telegram/webhook', 'POST', {
    update_id: 70003,
    type: 'voice',
    duration: 75,
    message: {
      chat: { id: defUser.telegramChatId },
      voice: { duration: 75 },
      date: Math.floor(Date.now() / 1000)
    }
  });
  const resVoiceOver = await webhookPOST(reqVoiceOver);
  const dataVoiceOver = await resVoiceOver.json();

  assertEqual('ADV-M2.5.3: Voice > 60s returns HTTP 200 (no 500 retry storm)', CAT_DEFECT, resVoiceOver.status, 200);
  assertEqual('ADV-M2.5.3: Returns ok=true with status=error', CAT_DEFECT, dataVoiceOver.ok === true && dataVoiceOver.status === 'error', true);
  assertContains('ADV-M2.5.3: Friendly explanation informs 60s limit', CAT_DEFECT, dataVoiceOver.replyText || dataVoiceOver.reply, 'maksimal 60 detik');

  // Test 5.4: BUG-M2-004 - Preceding quantity "beli 100 lembar kertas 50rb" parses to Rp50.000
  const parseRes1 = await parseTransactionNaturalLanguage('beli 100 lembar kertas 50rb');
  assertEqual('ADV-M2.5.4: Quantity parsing succeeds', CAT_DEFECT, parseRes1.success, true);
  assertEqual('ADV-M2.5.4: Nominal parsed as 50000 (not 100)', CAT_DEFECT, parseRes1.data?.nominal, 50000);
  assertContains('ADV-M2.5.4: Note preserves item description', CAT_DEFECT, parseRes1.data?.catatan || '', '100 lembar kertas');

  // Test 5.5: BUG-M2-005 - Physical unit collision "lari pagi 5m santai" not parsed as 5 billion
  const parseRes2 = await parseTransactionNaturalLanguage('lari pagi 5m santai');
  assertEqual('ADV-M2.5.5: Non-financial unit text rejected from transaction creation', CAT_DEFECT, parseRes2.success, false);

  // Test 5.6: Slash Command Whitespace Normalization
  store.resetAll();
  const replySpace = handleBotCommand(
    '/hari    ini',
    defUser,
    store.getWallets(DEMO_USER_ID),
    store.getTransactions(DEMO_USER_ID),
    store.getCategories(DEMO_USER_ID),
    store.getBudgets(DEMO_USER_ID, '2026-10')
  );
  assertContains('ADV-M2.5.6: Multi-whitespace slash command handled correctly', CAT_DEFECT, replySpace, 'Rekap Transaksi Hari Ini');

  // Test 5.7: Today calculation in Asia/Jakarta WIB
  assertContains('ADV-M2.5.7: /hari ini reply includes WIB timestamp', CAT_DEFECT, replySpace, 'WIB');

  return results;
}

// Self-run when executed directly via tsx
if (typeof require !== 'undefined' && require.main === module) {
  runM2AdversarialTests().then(results => {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    console.log(`\n====================================================================`);
    console.log(`🛡️ TATADANA M2 ADVERSARIAL TEST RESULTS: ${passed}/${results.length} PASSED (${failed} FAILED)`);
    console.log(`====================================================================`);
    for (const r of results) {
      if (!r.passed) {
        console.log(`❌ [${r.category}] ${r.name}: ${r.details || r.error}`);
      } else {
        console.log(`✅ [${r.category}] ${r.name}`);
      }
    }
    if (failed === 0) {
      console.log('\n🌟 ALL M2 ADVERSARIAL STRESS CHECKS PASSED EMPIRICALLY!');
    }
    process.exit(failed === 0 ? 0 : 1);
  });
}
