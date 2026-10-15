# TataDana E2E Test Infrastructure Specification

## Overview
The TataDana End-to-End (E2E) Test Suite is an enterprise-grade, deterministic verification framework designed to guarantee the functional correctness, architectural integrity, and edge resilience of the TataDana Indonesian SaaS application.

The test infrastructure enforces a strict **4-Tier Test Architecture** covering:
- **Tier 1 — Feature Coverage**: Comprehensive positive path and interface contract tests (>= 5 tests per core feature).
- **Tier 2 — Boundary & Corner Cases**: Stress and resilience testing against invalid, extreme, and malformed inputs (>= 5 tests per feature).
- **Tier 3 — Cross-Feature Interactions**: Multi-module pairwise pipeline flows spanning Webhook, Database, Wallets, Budgets, and Exports.
- **Tier 4 — Real-World Application Scenarios**: Authentic end-to-end Indonesian user journeys from onboarding through budgeting, payment upgrade, and superadmin audit compliance.

---

## Architecture & Directory Layout

```
tatadana/
├── tests/
│   └── e2e/
│       ├── test-helpers.ts      # Custom lightweight assertion harness & mock request router
│       ├── tier1.test.ts        # Tier 1: 51 Feature Coverage tests across 10 core features
│       ├── tier2.test.ts        # Tier 2: 35 Boundary & Corner Case tests across 7 edge categories
│       ├── tier3.test.ts        # Tier 3: 5 Multi-module cross-feature pipeline flows
│       ├── tier4.test.ts        # Tier 4: 4 Real-World Indonesian user journeys
│       └── run-all.ts           # Unified test orchestrator & executive report generator
├── TEST_INFRA.md                # Infrastructure documentation (this file)
└── TEST_READY.md                # Test execution readiness declaration and test manifest
```

---

## Systematic 4-Tier Test Matrix

| Tier | Suite Name | Scope & Focus | Test Count | Minimum Requirement |
|---|---|---|---|---|
| **Tier 1** | Feature Coverage | Transactions, Wallets, Budgets, Webhook Idempotency, NLP Text Parsing, Receipt OCR, Voice STT, PDF/Excel Export, Admin Protection, Privacy Audit Logs | **51 tests** | >= 5 per feature (50+) |
| **Tier 2** | Boundary & Corner Cases | Empty/whitespace inputs, extreme amounts (100 miliar), negative/invalid syntax, long text & emoji stress, 60s voice cutoff, 50 trx/mo starter limit, duplicate webhook updates | **35 tests** | >= 5 per feature (35+) |
| **Tier 3** | Cross-Feature Interactions | Pipeline chains: Expense -> Wallet -> Budget bar -> Export; Income -> Net cashflow; Inter-wallet transfers; Receipt OCR line items in Excel; Midtrans settlement -> Pro upgrade | **5 flows** | Multi-module pipelines |
| **Tier 4** | Real-World Application Scenarios | Indonesian user onboarding; Monthly salary & expense budgeting cycle; AI Financial Advisor spending spike trigger; Superadmin privacy-compliant support & impersonation | **4 journeys** | Realistic journeys |
| **TOTAL** | **All 4 Tiers** | **Comprehensive Full-Spectrum E2E Verification** | **95 tests** | **100% Pass Required** |

---

## Detailed Test Inventories

### Tier 1: Feature Coverage (51 Tests)
1. **Transactions (6 tests)**:
   - `T1.1.1`: Add expense transaction accurately reduces wallet balance.
   - `T1.1.2`: Add income transaction accurately increases wallet balance.
   - `T1.1.3`: Inter-wallet transfer deducts source and credits destination wallet.
   - `T1.1.4`: Transaction deletion safely reverts wallet balance changes.
   - `T1.1.5`: Transaction query sorts by date descending.
   - `T1.1.6`: Parent receipt transaction preserves child `receiptItems` line items.
2. **Wallets (5 tests)**:
   - `T1.2.1`: Add new wallet creates valid record with generated ID.
   - `T1.2.2`: Setting default wallet automatically clears previous default.
   - `T1.2.3`: Wallet metadata update preserves existing balance and ID.
   - `T1.2.4`: Wallet deletion completely removes wallet from user store.
   - `T1.2.5`: Multi-wallet aggregation sums all user balances correctly.
3. **Budgets (5 tests)**:
   - `T1.3.1`: Setting category monthly budget creates valid record.
   - `T1.3.2`: Updating monthly budget updates amount and resets alert flags.
   - `T1.3.3`: Monthly isolation ensures separate budgets per `YYYY-MM`.
   - `T1.3.4`: Visual progress bar `generateProgressBar` reflects accurate fill ratios (`█` and `░`).
   - `T1.3.5`: Command `/budget` returns status with percentage and remaining budget.
4. **Telegram Webhook Idempotency (5 tests)**:
   - `T1.4.1`: New `update_id` is marked as processed in registry.
   - `T1.4.2`: Duplicate `update_id` returns HTTP 200 `{ ok: true, status: 'already_processed_idempotent' }`.
   - `T1.4.3`: Duplicate `update_id` does NOT create duplicate transaction.
   - `T1.4.4`: Duplicate `update_id` does NOT deduct wallet balance twice.
   - `T1.4.5`: Distinct `update_id`s are each processed without conflict.
5. **NLP Text Parsing (5 tests)**:
   - `T1.5.1`: Parses Indonesian thousand format: "15rb", "500k", "25 ribu".
   - `T1.5.2`: Parses Indonesian million format: "1.5jt", "1,5juta", "7jt".
   - `T1.5.3`: Parses Indonesian billion format: "2.5m", "100 miliar".
   - `T1.5.4`: Automatically classifies income vs expense vs transfer.
   - `T1.5.5`: Extracts explicit wallet keywords ("pakai gopay", "via bca", "tunai").
6. **Receipt Items & OCR Vision (5 tests)**:
   - `T1.6.1`: Pro user photo input parses merchant, total, and line items.
   - `T1.6.2`: Item prices sum exactly to total receipt amount.
   - `T1.6.3`: Webhook response transaction contains child `receiptItems`.
   - `T1.6.4`: Starter plan user is blocked with upgrade CTA for photo receipts.
   - `T1.6.5`: Handles generic restaurant receipts with correct category suggestion.
7. **Voice Note STT (5 tests)**:
   - `T1.7.1`: Audio duration <= 60 seconds transcribes successfully.
   - `T1.7.2`: Webhook reply includes microphone transcript banner `🎙️ Transkrip: "..."`.
   - `T1.7.3`: Transcribed transaction saved with source `telegram_voice`.
   - `T1.7.4`: Voice note hint extraction parses spoken text accurately.
   - `T1.7.5`: Persists `transcriptText` in database transaction record.
8. **PDF & Excel Export (5 tests)**:
   - `T1.8.1`: `calculateReportSummary` accurately aggregates income, expense, net cashflow, and top categories.
   - `T1.8.2`: `generatePDFReport` returns valid jsPDF instance with non-zero size.
   - `T1.8.3`: `generateExcelReport` generates workbook with 'Daftar Transaksi' and 'Ringkasan Keuangan' sheets.
   - `T1.8.4`: Excel export transaction row count matches actual user transactions.
   - `T1.8.5`: Receipt line items are formatted in Excel 'Item Struk' column.
9. **Admin Protection & Impersonation (5 tests)**:
   - `T1.9.1`: Retrieves superadmin profile with role `admin`.
   - `T1.9.2`: Impersonation switches active user context.
   - `T1.9.3`: Impersonated user view filters wallets and transactions to target user.
   - `T1.9.4`: Clearing impersonation reverts back to original user.
   - `T1.9.5`: AI Multi-Provider config updates (toggling single vs parallel failover).
10. **Audit Logs (5 tests)**:
    - `T1.10.1`: Superadmin transaction inspection records audit log entry.
    - `T1.10.2`: Audit log preserves admin email, target user ID, reason, and WIB timestamp.
    - `T1.10.3`: Query audit logs returns newest entries first.
    - `T1.10.4`: Tracks AI query logs with latency, tokens, provider, and model.
    - `T1.10.5`: Payment verification records admin ID and approval notes.

---

### Tier 2: Boundary & Corner Cases (35 Tests)
1. **Empty & Whitespace Inputs (5 tests)**:
   - Empty input string guidance prompt.
   - Whitespace-only string rejection.
   - Telegram webhook empty text validation.
   - Standalone amount without description falls back to category name.
   - Phone search handles unformatted and empty inputs safely.
2. **Extreme Amounts & Precision (5 tests)**:
   - 100 miliar (Rp100.000.000.000) parsed without integer overflow.
   - Single minimum unit (1 Rupiah).
   - Decimal dot fraction ("1.75jt" = 1,750,000).
   - Decimal comma fraction ("2,5jt" = 2,500,000).
   - `formatIDR` precision for zero, negative, and extreme values.
3. **Negative Values & Invalid Syntax (5 tests)**:
   - Unparseable gibberish returns failure with guidance examples.
   - Unrecognized bot commands fall back to `/bantuan`.
   - Non-numeric symbols return null parser result.
   - Negative amount phrasing handled safely.
   - Unknown `order_id` in Midtrans callback returns graceful HTTP 200.
4. **Long Text & Unicode/Emoji Stress (5 tests)**:
   - 500+ character descriptions parsed without truncation failure.
   - Indonesian food emojis and slang parsed cleanly.
   - All-caps mixed Indonesian casing parsed consistently.
   - Special characters and quotes preserved in notes.
   - Extremely long merchant names handled gracefully.
5. **Audio / Voice Cutoff Enforcement (5 tests)**:
   - Audio duration of exactly 60 seconds succeeds.
   - Audio duration of 61 seconds throws cutoff exception.
   - Extreme duration (120 seconds) throws cutoff exception.
   - Webhook returns friendly error for voice exceeding 60 seconds.
   - 1-second audio clip transcribes cleanly.
6. **Tier Limit Enforcement (50 Trx/Mo Limit) (5 tests)**:
   - Starter user under 50 transactions records transaction normally.
   - Starter user at 50 transactions is blocked on 51st transaction with upgrade prompt.
   - Pro user can exceed 50 transactions without limit block.
   - Slash commands (`/saldo`, `/budget`) remain accessible when limit is reached.
   - Transactions in previous months do not count against current month limit.
7. **Duplicate Webhook Updates (5 tests)**:
   - Concurrent/rapid duplicate updates return idempotent responses.
   - Duplicate photo updates do not create duplicate transactions.
   - Duplicate voice updates do not create duplicate transactions.
   - Simulator payloads (`simulation: true`) bypass idempotency for local testing.
   - Idempotency registry maintains unique processed status.

---

### Tier 3: Cross-Feature Interactions (5 Multi-Module Flows)
1. **Flow A**: Telegram expense text -> Wallet deduction -> Budget progress bar update -> Report export calculation.
2. **Flow B**: Telegram income text -> Wallet increment -> Net cashflow update in summary and exports.
3. **Flow C**: Inter-wallet transfer -> Source deduction & destination increment -> Total net worth conservation.
4. **Flow D**: Pro photo receipt OCR -> Child line items -> Category budget update -> Excel line items breakdown.
5. **Flow E**: Midtrans payment callback -> User upgraded to Pro -> Photo receipt gate unlocked immediately.

---

### Tier 4: Real-World Indonesian User Scenarios (4 End-to-End Journeys)
1. **Journey 1**: New user registration -> Set BCA -> Connect Telegram -> First expense "makan bakso 25rb" -> `/saldo` & `/budget` verification.
2. **Journey 2**: Full monthly Indonesian cycle: Salary ("gajian 15.5jt") -> Rent ("bayar kost 2.2jt") -> Groceries (Indomaret OCR) -> Coffee (VN) -> Monthly recap (`/bulan ini`) -> PDF/Excel export.
3. **Journey 3**: AI Financial Advisor triggers on category spending spike (>20% single expense) with advice banner in Telegram reply.
4. **Journey 4**: Superadmin customer support workflow: Mandatory reason prompt -> Audit trail logged -> User impersonation -> Dashboard view as user -> Safe return to admin console.

---

## How to Run the Tests

The test suite is fully self-contained and does not require external servers, running Next.js dev server, or live Telegram/Supabase connections.

### Option 1: Via tsx (Recommended)
```bash
npx tsx tests/e2e/run-all.ts
```

### Option 2: Via npm script
```bash
npm run test:e2e
```

### Option 3: Individual Suite Execution
```bash
npx tsx -e "import('./tests/e2e/tier1.test').then(m => m.runTier1Tests().then(console.log))"
npx tsx -e "import('./tests/e2e/tier2.test').then(m => m.runTier2Tests().then(console.log))"
npx tsx -e "import('./tests/e2e/tier3.test').then(m => m.runTier3Tests().then(console.log))"
npx tsx -e "import('./tests/e2e/tier4.test').then(m => m.runTier4Tests().then(console.log))"
```

---

## Test Determinism & Isolation
1. **Isolated State**: Every test resets the storage repository to its known seed baseline using `resetTestStore()`.
2. **No External Network Dependencies**: Webhook routes, Telegram API calls, and Midtrans endpoints use simulated local handlers with safe abort signals.
3. **Mock Request Dispatch**: Custom `createMockRequest` simulates Next.js App Router `NextRequest` objects with full JSON and header emulation.
4. **Timezone Awareness**: All timestamps conform to Western Indonesia Time (WIB / UTC+7).
