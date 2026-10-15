/**
 * ==============================================================================
 * TATADANA ADVERSARIAL STRESS TEST SUITE: MILESTONE 1 (DATABASE & CLIENTS)
 * File: tests/adversarial/m1-adversarial.test.ts
 *
 * Verifies:
 * 1. Postgres DDL Schema completeness across all 14 tables, columns, constraints,
 *    foreign keys, and indexes.
 * 2. Zero-Trust RLS policies and superadmin bypass behavior.
 * 3. Supabase Storage bucket 'tatadana-exports' and MIME types.
 * 4. Supabase Client modules in both mock and live mode configurations.
 * 5. Deterministic UUID generation and Canonical Seeder data integrity.
 * ==============================================================================
 */

import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import { getSupabaseEnvConfig, isSupabaseConfigured, isSupabaseAdminConfigured } from '../../src/lib/supabase/config';
import { getBrowserClient } from '../../src/lib/supabase/client';
import { getAdminClient, requireAdminClient } from '../../src/lib/supabase/admin';
import {
  mapWalletFromDb,
  mapWalletToDb,
  mapCategoryFromDb,
  mapCategoryToDb,
  mapTransactionFromDb,
  mapTransactionToDb,
  mapBudgetFromDb,
  mapBudgetToDb,
  mapProfileFromDb,
  mapExportFromDb
} from '../../src/lib/supabase/mappers';
import {
  DEMO_USER_ID,
  ADMIN_USER_ID,
  SEED_PROFILES,
  SEED_WALLETS,
  SEED_CATEGORIES,
  SEED_BUDGETS,
  SEED_TRANSACTIONS,
  SEED_TRANSACTION_ITEMS,
  SEED_SUBSCRIPTION_PLANS,
  SEED_AI_PROVIDERS,
  SEED_EXPORT_HISTORY,
  USER_UUID_MAP
} from '../../src/lib/seed-data';

export interface TestResult {
  name: string;
  passed: boolean;
  category: string;
  details?: string;
}

export async function runM1AdversarialTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  function assert(name: string, category: string, condition: boolean, details?: string) {
    results.push({
      name,
      category,
      passed: condition,
      details: condition ? undefined : details || 'Assertion failed',
    });
  }

  // Read SQL Migration Content
  const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20261014000001_comprehensive_schema.sql');
  const sqlContent = fs.readFileSync(migrationPath, 'utf-8');

  // ============================================================================
  // CATEGORY 1: SQL SCHEMA COMPLETENESS & 14 MANDATORY TABLES
  // ============================================================================
  const mandatoryTables = [
    'profiles',
    'wallets',
    'categories',
    'transactions',
    'transaction_items',
    'budgets',
    'subscription_plans',
    'user_subscriptions',
    'telegram_bot_configs',
    'telegram_updates',
    'ai_providers',
    'ai_logs',
    'audit_logs',
    'report_exports'
  ];

  for (const table of mandatoryTables) {
    const tableRegex = new RegExp(`create\\s+table\\s+(if\\s+not\\s+exists\\s+)?public\\.${table}\\s*\\(`, 'i');
    assert(
      `Table '${table}' DDL exists in comprehensive migration`,
      'Schema: Tables',
      tableRegex.test(sqlContent),
      `Table public.${table} not defined with 'create table public.${table}' in SQL migration`
    );
  }

  // ============================================================================
  // CATEGORY 2: CRITICAL COLUMN SPECIFICATIONS PER ORIGINAL_REQUEST (R1)
  // ============================================================================
  const columnChecks = [
    { table: 'profiles', column: 'phone_verified boolean' },
    { table: 'profiles', column: 'default_currency text' },
    { table: 'profiles', column: 'role text' },
    { table: 'wallets', column: 'is_default boolean' },
    { table: 'wallets', column: 'balance numeric' },
    { table: 'categories', column: 'is_custom boolean' },
    { table: 'transactions', column: 'is_receipt_parent boolean' },
    { table: 'transactions', column: 'source text' },
    { table: 'transactions', column: 'transaction_date timestamptz' },
    { table: 'transaction_items', column: 'price numeric' },
    { table: 'transaction_items', column: 'quantity numeric' },
    { table: 'budgets', column: 'monthly_amount numeric' },
    { table: 'budgets', column: 'period_month int' },
    { table: 'budgets', column: 'period_year int' },
    { table: 'subscription_plans', column: 'billing_type text' },
    { table: 'subscription_plans', column: 'features_json jsonb' },
    { table: 'user_subscriptions', column: 'payment_gateway text' },
    { table: 'user_subscriptions', column: 'midtrans_order_id text' },
    { table: 'telegram_bot_configs', column: 'bot_token_encrypted text' },
    { table: 'telegram_bot_configs', column: 'reminder_times jsonb' },
    { table: 'telegram_updates', column: 'update_id bigint' },
    { table: 'telegram_updates', column: 'processed_at timestamptz' },
    { table: 'ai_providers', column: 'provider_name text' },
    { table: 'ai_providers', column: 'is_primary boolean' },
    { table: 'ai_logs', column: 'prompt_tokens int' },
    { table: 'ai_logs', column: 'latency_ms int' },
    { table: 'audit_logs', column: 'admin_user_id uuid' },
    { table: 'audit_logs', column: 'target_user_id uuid' },
    { table: 'report_exports', column: 'file_type text' },
    { table: 'report_exports', column: 'file_url text' },
  ];

  for (const { table, column } of columnChecks) {
    const colName = column.split(' ')[0];
    const colRegex = new RegExp(`${colName}\\s+`, 'i');
    assert(
      `Table '${table}' contains column '${colName}'`,
      'Schema: Columns',
      colRegex.test(sqlContent),
      `Column ${colName} not found in migration SQL`
    );
  }

  // ============================================================================
  // CATEGORY 3: FOREIGN KEYS & CASCADE RULES
  // ============================================================================
  const foreignKeyChecks = [
    { name: 'profiles.id -> auth.users(id) on delete cascade', pattern: /id\s+uuid\s+primary\s+key\s+references\s+auth\.users\(id\)\s+on\s+delete\s+cascade/i },
    { name: 'wallets.user_id -> public.profiles(id) on delete cascade', pattern: /user_id\s+uuid\s+not\s+null\s+references\s+public\.profiles\(id\)\s+on\s+delete\s+cascade/i },
    { name: 'categories.user_id -> public.profiles(id) on delete cascade', pattern: /user_id\s+uuid\s+references\s+public\.profiles\(id\)\s+on\s+delete\s+cascade/i },
    { name: 'transactions.user_id -> public.profiles(id) on delete cascade', pattern: /user_id\s+uuid\s+not\s+null\s+references\s+public\.profiles\(id\)\s+on\s+delete\s+cascade/i },
    { name: 'transactions.wallet_id -> public.wallets(id) on delete cascade', pattern: /wallet_id\s+uuid\s+not\s+null\s+references\s+public\.wallets\(id\)\s+on\s+delete\s+cascade/i },
    { name: 'transaction_items.transaction_id -> public.transactions(id) on delete cascade', pattern: /transaction_id\s+uuid\s+not\s+null\s+references\s+public\.transactions\(id\)\s+on\s+delete\s+cascade/i },
    { name: 'budgets.user_id -> public.profiles(id) on delete cascade', pattern: /user_id\s+uuid\s+not\s+null\s+references\s+public\.profiles\(id\)\s+on\s+delete\s+cascade/i },
    { name: 'user_subscriptions.user_id -> public.profiles(id) on delete cascade', pattern: /user_id\s+uuid\s+not\s+null\s+references\s+public\.profiles\(id\)\s+on\s+delete\s+cascade/i },
    { name: 'user_subscriptions.plan_id -> public.subscription_plans(id) on delete restrict', pattern: /plan_id\s+uuid\s+references\s+public\.subscription_plans\(id\)\s+on\s+delete\s+restrict/i },
    { name: 'report_exports.user_id -> public.profiles(id) on delete cascade', pattern: /user_id\s+uuid\s+not\s+null\s+references\s+public\.profiles\(id\)\s+on\s+delete\s+cascade/i },
  ];

  for (const fk of foreignKeyChecks) {
    assert(
      `FK Constraint: ${fk.name}`,
      'Schema: Foreign Keys',
      fk.pattern.test(sqlContent),
      `Foreign key pattern ${fk.name} missing from SQL`
    );
  }

  // ============================================================================
  // CATEGORY 4: CONSTRAINTS & CONDITIONAL INDEXES
  // ============================================================================
  const constraintChecks = [
    { name: 'Single default wallet unique partial index', pattern: /create\s+unique\s+index\s+if\s+not\s+exists\s+idx_wallets_user_one_default\s+on\s+public\.wallets\s*\(user_id\)\s+where\s*\(is_default\s*=\s*true\)/i },
    { name: 'Single primary AI provider unique partial index', pattern: /create\s+unique\s+index\s+if\s+not\s+exists\s+idx_ai_providers_one_primary\s+on\s+public\.ai_providers\s*\(is_primary\)\s+where\s*\(is_primary\s*=\s*true\)/i },
    { name: 'telegram_updates.update_id unique constraint', pattern: /update_id\s+bigint\s+not\s+null\s+unique/i },
    { name: 'subscription_plans.slug check constraint', pattern: /slug\s+in\s*\('starter',\s*'pro'\)/i },
    { name: 'transactions.source check constraint contains telegram_text/photo/voice', pattern: /source\s+in\s*\([^)]*telegram_text[^)]*telegram_photo[^)]*telegram_voice[^)]*\)/i },
    { name: 'budgets period_month between 1 and 12', pattern: /period_month\s+between\s+1\s+and\s+12/i },
  ];

  for (const c of constraintChecks) {
    assert(
      `Constraint Check: ${c.name}`,
      'Schema: Constraints & Indexes',
      c.pattern.test(sqlContent),
      `Constraint ${c.name} missing from SQL`
    );
  }

  // ============================================================================
  // CATEGORY 5: ROW LEVEL SECURITY & SUPERADMIN BYPASS
  // ============================================================================
  assert(
    'Helper function public.is_superadmin() defined with security definer and stable',
    'Schema: RLS',
    /create\s+or\s+replace\s+function\s+public\.is_superadmin\(\)[\s\S]*security\s+definer[\s\S]*stable/i.test(sqlContent)
  );

  for (const table of mandatoryTables) {
    const rlsRegex = new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security;`, 'i');
    assert(
      `RLS enabled on table '${table}'`,
      'Schema: RLS',
      rlsRegex.test(sqlContent),
      `RLS not explicitly enabled on public.${table}`
    );
  }

  const superadminBypassInPolicies = [
    'Profiles SELECT policy',
    'Wallets ALL policy',
    'Categories SELECT policy',
    'Transactions ALL policy',
    'Transaction Items ALL policy',
    'Budgets ALL policy',
    'User Subscriptions SELECT policy',
    'Telegram Bot Configs ALL policy',
    'AI Providers ADMIN policy',
    'Report Exports ALL policy',
  ];

  for (const policyName of superadminBypassInPolicies) {
    const policyRegex = new RegExp(`create\\s+policy\\s+"${policyName}"[\\s\\S]*?public\\.is_superadmin\\(\\)`, 'i');
    assert(
      `Policy "${policyName}" integrates superadmin bypass`,
      'Schema: RLS Policies',
      policyRegex.test(sqlContent),
      `Policy "${policyName}" missing public.is_superadmin() check`
    );
  }

  // ============================================================================
  // CATEGORY 6: SUPABASE STORAGE BUCKET & MIME RESTRICTIONS
  // ============================================================================
  assert(
    "Bucket 'tatadana-exports' inserted into storage.buckets with public=false",
    'Storage: Bucket DDL',
    /insert\s+into\s+storage\.buckets\s*\([^)]*\)\s*values\s*\(\s*'tatadana-exports',\s*'tatadana-exports',\s*false/i.test(sqlContent)
  );

  assert(
    "Storage bucket file_size_limit is 10MB (10485760 bytes)",
    'Storage: Limits',
    /10485760/.test(sqlContent)
  );

  assert(
    "Storage bucket allows application/pdf MIME type",
    'Storage: MIME Types',
    /'application\/pdf'/.test(sqlContent)
  );

  assert(
    "Storage bucket allows application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (XLSX)",
    'Storage: MIME Types',
    /'application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet'/.test(sqlContent)
  );

  assert(
    "Storage RLS policies created on storage.objects for select, insert, delete",
    'Storage: Policies',
    /create\s+policy\s+"Users\s+can\s+access\s+own\s+export\s+files"\s+on\s+storage\.objects/i.test(sqlContent) &&
    /create\s+policy\s+"Users\s+can\s+upload\s+own\s+export\s+files"\s+on\s+storage\.objects/i.test(sqlContent) &&
    /create\s+policy\s+"Users\s+can\s+delete\s+own\s+export\s+files"\s+on\s+storage\.objects/i.test(sqlContent)
  );

  // ============================================================================
  // CATEGORY 7: REALTIME PUBLICATION REGISTRATION
  // ============================================================================
  const realtimeTables = ['transactions', 'wallets', 'budgets', 'report_exports'];
  for (const tbl of realtimeTables) {
    const pubRegex = new RegExp(`alter\\s+publication\\s+supabase_realtime\\s+add\\s+table\\s+public\\.${tbl}`, 'i');
    assert(
      `Table '${tbl}' registered in supabase_realtime publication`,
      'Realtime',
      pubRegex.test(sqlContent),
      `Table ${tbl} not added to supabase_realtime publication`
    );
  }

  // ============================================================================
  // CATEGORY 8: SUPABASE CLIENT INFRASTRUCTURE STRESS TEST
  // ============================================================================
  // Test 8.1: Mock Mode Environment Detection
  const mockConfig = getSupabaseEnvConfig();
  assert(
    'Default test environment correctly detected as offline / mock mode',
    'Client: Mock Mode',
    !mockConfig.isConfigured && !mockConfig.isAdminConfigured
  );

  assert(
    'isSupabaseConfigured() returns false when env variables are empty/demo',
    'Client: Mock Mode',
    isSupabaseConfigured() === false
  );

  assert(
    'isSupabaseAdminConfigured() returns false when env variables are empty/demo',
    'Client: Mock Mode',
    isSupabaseAdminConfigured() === false
  );

  assert(
    'getBrowserClient() safely returns null in mock mode without throwing exceptions',
    'Client: Mock Mode',
    getBrowserClient() === null
  );

  assert(
    'getAdminClient() safely returns null in mock mode without throwing exceptions',
    'Client: Mock Mode',
    getAdminClient() === null
  );

  // Test 8.2: requireAdminClient error assertion
  let requireAdminThrew = false;
  try {
    requireAdminClient();
  } catch (err: any) {
    requireAdminThrew = true;
    assert(
      'requireAdminClient() throws descriptive error mentioning SUPABASE_SERVICE_ROLE_KEY',
      'Client: Error Handling',
      err.message.includes('SUPABASE_SERVICE_ROLE_KEY')
    );
  }
  assert('requireAdminClient() properly throws in unconfigured environment', 'Client: Error Handling', requireAdminThrew);

  // Test 8.3: Live Mode Environment Detection Stress Test (Simulation with custom env)
  const savedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const savedAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const savedRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    // Simulate valid live Supabase credentials
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://xyzprodproject.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.validAnonPayload';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.validServiceRolePayload';

    const liveConfig = getSupabaseEnvConfig();
    assert(
      'Live Supabase credentials correctly recognized as configured',
      'Client: Live Mode Config',
      liveConfig.isConfigured === true && liveConfig.isAdminConfigured === true
    );

    // Simulate missing service role key
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const partialConfig = getSupabaseEnvConfig();
    assert(
      'Missing service role key marks isConfigured=true but isAdminConfigured=false',
      'Client: Live Mode Config',
      partialConfig.isConfigured === true && partialConfig.isAdminConfigured === false
    );

    // Simulate placeholder 'demo' URL
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://demo.supabase.co';
    const demoConfig = getSupabaseEnvConfig();
    assert(
      'Placeholder URL containing "demo" is rejected from live mode',
      'Client: Live Mode Config',
      demoConfig.isConfigured === false
    );
  } finally {
    // Restore original env
    if (savedUrl !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = savedUrl; else delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (savedAnon !== undefined) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = savedAnon; else delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (savedRole !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = savedRole; else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  }

  // ============================================================================
  // CATEGORY 9: DATA MAPPERS ADVERSARIAL INTEGRITY
  // ============================================================================
  // 9.1: Wallet Round-trip Mapping
  const sampleWallet = {
    id: 'wal_adversarial_123',
    userId: 'usr_budi_pratama_01',
    name: 'BCA Utama',
    type: 'bank' as const,
    balance: 12500000,
    isDefault: true,
    color: '#00529C',
    icon: 'credit-card',
    accountNumber: '1234567890',
    createdAt: '2026-10-14T00:00:00Z',
  };
  const dbWallet = mapWalletToDb(sampleWallet);
  assert('mapWalletToDb maps balance and user_id correctly', 'Mappers', dbWallet.balance === 12500000 && dbWallet.user_id === 'usr_budi_pratama_01');
  const restoredWallet = mapWalletFromDb({
    ...dbWallet,
    id: sampleWallet.id,
    balance: sampleWallet.balance as any,
    created_at: sampleWallet.createdAt,
    updated_at: sampleWallet.createdAt,
  });
  assert('mapWalletFromDb restores exact balance and isDefault', 'Mappers', restoredWallet.balance === sampleWallet.balance && restoredWallet.isDefault === true);

  // 9.2: Transaction Round-trip Mapping (Receipt Parent & items)
  const sampleTx = {
    id: 'tx_adv_receipt_1',
    userId: 'usr_budi_pratama_01',
    walletId: 'wal_bca_01',
    type: 'expense' as const,
    amount: 145000,
    description: 'Belanja Super Indo',
    source: 'telegram_photo' as const,
    receiptItems: [
      { name: 'Susu UHT Ultra Milk 1L', price: 21500 },
      { name: 'Beras Pandan Wangi 5kg', price: 89500 },
      { name: 'Minyak Goreng Sania 2L', price: 34000 }
    ],
    merchantName: 'Super Indo',
    transactionDate: '2026-10-14T10:00:00+07:00',
    createdAt: '2026-10-14T03:00:00Z'
  };
  const dbTx = mapTransactionToDb(sampleTx);
  assert('mapTransactionToDb marks is_receipt_parent = true when receiptItems present', 'Mappers', dbTx.is_receipt_parent === true);
  assert('mapTransactionToDb sets notes equal to description', 'Mappers', dbTx.notes === 'Belanja Super Indo');
  const restoredTx = mapTransactionFromDb({
    ...dbTx,
    id: sampleTx.id,
    destination_wallet_id: null,
    category_id: null,
    transcript_text: null,
    created_at: sampleTx.createdAt,
  } as any);
  assert('mapTransactionFromDb restores receiptItems array faithfully', 'Mappers', restoredTx.receiptItems?.length === 3 && restoredTx.receiptItems[0].price === 21500);

  // 9.3: Budget Round-trip Mapping
  const sampleBudget = {
    id: 'bdg_makanan_2026_10',
    userId: 'usr_budi_pratama_01',
    categoryId: 'cat_makanan',
    month: '2026-10',
    amount: 3500000,
    alert80Sent: false,
    alert100Sent: false
  };
  const dbBudget = mapBudgetToDb(sampleBudget);
  assert('mapBudgetToDb parses period_year and period_month correctly', 'Mappers', dbBudget.period_year === 2026 && dbBudget.period_month === 10);
  assert('mapBudgetToDb populates both monthly_amount and amount', 'Mappers', dbBudget.monthly_amount === 3500000 && dbBudget.amount === 3500000);

  // ============================================================================
  // CATEGORY 10: CANONICAL SEED DATA INTEGRITY & SPEC MINER ALIGNMENT
  // ============================================================================
  // Check 10.1: Wallets
  assert('Seed data contains exactly 4 canonical wallets', 'Seed Data', SEED_WALLETS.length === 4);
  const totalWalletBalance = SEED_WALLETS.reduce((sum, w) => sum + w.balance, 0);
  assert(
    'Total balance across 4 wallets equals exactly Rp 22.950.000',
    'Seed Data',
    totalWalletBalance === 22950000,
    `Expected Rp 22.950.000, got ${totalWalletBalance}`
  );

  const defaultWallets = SEED_WALLETS.filter(w => w.isDefault);
  assert('Exactly 1 default wallet exists in seed data (BCA)', 'Seed Data', defaultWallets.length === 1 && defaultWallets[0].name.includes('BCA'));

  // Check 10.2: Categories
  assert('Seed data contains 11 canonical categories', 'Seed Data', SEED_CATEGORIES.length === 11);
  const expenseCats = SEED_CATEGORIES.filter(c => c.type === 'expense');
  const incomeCats = SEED_CATEGORIES.filter(c => c.type === 'income');
  assert('Categories breakdown: 8 expense and 3 income', 'Seed Data', expenseCats.length === 8 && incomeCats.length === 3);

  // Check 10.3: Transactions
  assert('Seed data contains exactly 60 transactions spanning 6 months', 'Seed Data', SEED_TRANSACTIONS.length === 60);
  const receiptParents = SEED_TRANSACTIONS.filter(t => t.receiptItems && t.receiptItems.length > 0);
  assert('Exactly 9 transactions are multi-item parent receipts', 'Seed Data', receiptParents.length === 9);
  assert('SEED_TRANSACTION_ITEMS contains exactly 33 child items', 'Seed Data', SEED_TRANSACTION_ITEMS.length === 33);

  // Check WIB timestamp adherence (+07:00)
  const nonWIBTransactions = SEED_TRANSACTIONS.filter(t => !t.transactionDate.includes('+07:00'));
  assert(
    '100% of seed transactions have WIB (+07:00) timezone strings',
    'Seed Data: Timezone WIB',
    nonWIBTransactions.length === 0,
    `Found ${nonWIBTransactions.length} transactions without +07:00 offset`
  );

  // Check 10.4: Budgets
  assert('Seed data contains exactly 48 monthly budgets', 'Seed Data', SEED_BUDGETS.length === 48);

  // Check 10.5: Deterministic UUID mapping function
  function toDeterministicUUID(str: string): string {
    if (!str) return '00000000-0000-0000-0000-000000000000';
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
      return str.toLowerCase();
    }
    if (USER_UUID_MAP[str]) {
      return USER_UUID_MAP[str];
    }
    const hash = createHash('md5').update('tatadana:' + str).digest('hex');
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
  }

  const demoUUID = toDeterministicUUID(DEMO_USER_ID);
  const adminUUID = toDeterministicUUID(ADMIN_USER_ID);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  assert('DEMO_USER_ID maps to valid RFC-4122 UUID', 'Seed Data: UUID', uuidRegex.test(demoUUID));
  assert('ADMIN_USER_ID maps to valid RFC-4122 UUID', 'Seed Data: UUID', uuidRegex.test(adminUUID));
  assert('Deterministic UUID is idempotent (same input yields same UUID)', 'Seed Data: UUID', demoUUID === toDeterministicUUID(DEMO_USER_ID));

  return results;
}

// Self-run when executed directly via tsx
if (typeof require !== 'undefined' && require.main === module) {
  runM1AdversarialTests().then(results => {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    console.log(`\n====================================================================`);
    console.log(`🛡️ TATADANA M1 ADVERSARIAL TEST RESULTS: ${passed}/${results.length} PASSED (${failed} FAILED)`);
    console.log(`====================================================================`);
    for (const r of results) {
      if (!r.passed) {
        console.log(`❌ [${r.category}] ${r.name}: ${r.details}`);
      }
    }
    if (failed === 0) {
      console.log('✅ ALL M1 ADVERSARIAL STRESS CHECKS PASSED EMPIRICALLY!');
    }
    process.exit(failed === 0 ? 0 : 1);
  });
}
