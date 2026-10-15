# Project: TataDana

## Architecture
TataDana is an enterprise-grade Indonesian personal finance SaaS built on Next.js 14/15 App Router, TypeScript, Tailwind CSS (#F97316 orange-white fintech theme), Lucide Icons, and Supabase (Postgres, Auth, Storage, Realtime), integrated with Telegram Bot, Multi-Provider AI (Gemini Flash default with OpenAI/DeepSeek parallel failover), and Midtrans payment gateway.

### Data Flow & Module Boundaries
```
[Telegram User] ──(Webhook / Simulator)──> [/api/telegram/webhook]
                                                     │
                                                     ├──> [Idempotency: telegram_updates]
                                                     ├──> [AI Multi-Provider: Gemini / Failover]
                                                     │         ├── Text Parsing (Indonesian nominals)
                                                     │         ├── Vision OCR (Receipt photo -> transaction_items)
                                                     │         └── Audio STT (Voice note -> text transcript)
                                                     ├──> [Persistence: Supabase / Store]
                                                     └──> [WIB Formatter & Visual Budget Bars]
                                                               │
[Web User / Admin] ───────────────────────────────────────────┘
       │
       ├──> [/auth/login, /auth/register, Dev OTP Simulator]
       ├──> [/dashboard] ── Multi-Wallet, Budget Bars, 8-Category AI Wizard, Stats Cards, Charts
       ├──> [/dashboard/reports] ── Filter, Sort, Receipt Accordion, PDF/Excel -> Supabase Storage (Signed URLs)
       └──> [/admin] ── Protected Superadmin, Impersonation, Audit Logs, AI Multi-Provider Switcher, Midtrans
```

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Database Schema & Tables | 14 mandatory tables with Postgres DDL, indexes, and relations | M1 | R1 |
| 2 | Row Level Security (RLS) | Granular user policies + superadmin bypass for all tables | M1 | R1 |
| 3 | Supabase Client Infrastructure | Client, SSR server client, admin service-role client, cookie auth | M1 | R1 |
| 4 | Supabase Storage Bucket DDL | Bucket `tatadana-exports` for PDF & Excel report files | M1 | R1 |
| 5 | Supabase Realtime Setup | Realtime publication for transactions, budgets, wallets | M1 | R1 |
| 6 | Automated Seeder Script | `npm run seed` creating admin, pro user, 4 wallets, 6-mo 50+ transactions | M1 | R6 |
| 7 | Webhook Idempotency | Skip processed `update_id` against `telegram_updates` table | M2 | R2 |
| 8 | Indonesian NLP Text Parser | Parse "15rb", "1.5jt", "500k", category matching, income/expense classification | M2 | R2 |
| 9 | Multi-Item Receipt Photo OCR | Pro-gated vision OCR extracting merchant, total, child `transaction_items` | M2 | R2 |
| 10 | Voice Note STT Transcription | Transcribe audio <=60s with `🎙️ Transkrip: "..."` reply | M2 | R2 |
| 11 | Telegram Reply Formatter | WIB timestamp, nominal, category, wallet, visual budget bar `[████████░░]`, advice | M2 | R2 |
| 12 | Telegram Bot Commands | `/saldo`, `/hari ini`, `/minggu ini`, `/bulan ini`, `/budget`, `/sheet`, `/bantuan` | M2 | R2 |
| 13 | AI Financial Advisor | Automatic triggers on expense spike >50%, >80% income, >20% budget | M2 | R2 |
| 14 | Daily Reminder Scheduler | Scheduled reminder messages max 2x/day WIB via `/api/cron/reminders` | M2 | R2 |
| 15 | Tier Limit Enforcement | Starter limit 50 trx/mo, 3 wallets, 5 budget categories; Pro upsell | M2 | R2 |
| 16 | Dev Telegram Simulator Route | Dedicated `/dev/telegram-simulator` standalone route & testing helper | M2 | R6 |
| 17 | AI Multi-Provider Engine | Gemini Flash primary, OpenAI & DeepSeek failover with parallel mode | M3 | R4 |
| 18 | AI Usage Logging & Instrumentation | Log prompt_tokens, response_tokens, latency_ms, status to `ai_logs` | M3 | R1, R4 |
| 19 | Web Dashboard Overview | 4 stats cards, pie chart, 6-month bar chart, sparkline, 10 recent trx | M4 | R3 |
| 20 | Multi-Wallet Management | Wallet cards, add/edit balance, transfer modal, default telegram wallet | M4 | R3 |
| 21 | AI Category Onboarding Wizard | 8-category recommendation wizard from registration questionnaire | M4 | R3 |
| 22 | Monthly Budget Bars | Dynamic progress bars per category with 80% & 100% danger thresholds | M4 | R3 |
| 23 | Manual Transaction Entry | Modal for income, expense, and inter-wallet transfer | M4 | R3 |
| 24 | Native Reports & Accordion | `/dashboard/reports` route with sorting, filtering, and receipt item accordion | M4 | R3 |
| 25 | Export PDF & Excel with Signed URLs | On-demand export uploaded to Supabase Storage with signed download URLs | M4 | R3 |
| 26 | Settings Page | Profile, Telegram token & BotFather guide & test connection, Reminders, Categories | M4 | R3 |
| 27 | Route Aliases & Redirects | `/dashboard/reports` -> `/dashboard/laporan`, `/auth/login`, `/auth/register` | M4 | R3, R5 |
| 28 | Admin Dashboard & Protection | Superadmin route guard & Next.js middleware for `/admin/*` | M5 | R4 |
| 29 | User Impersonation | Admin view as user with active banner and safe return | M5 | R4 |
| 30 | Privacy Audit Logs | Mandatory reason prompt before admin accesses user transactions, logged to `audit_logs` | M5 | R4 |
| 31 | AI Multi-Provider Admin UI | Configure API keys, toggle single vs parallel failover, set primary | M5 | R4 |
| 32 | Midtrans & Bank Transfer Approval | Monitor Midtrans orders and manual transfer proof approval/rejection | M5 | R4 |
| 33 | Landing Page Fintech Polish | 15 R5 sections, orange-white fintech theme (#F97316), responsive 375px/1280px | M5 | R5 |
| 34 | Auth Flow & Dev OTP Simulator | Split 40/60 layout, email/password, phone OTP with dev simulator banner | M5 | R5 |
| 35 | E2E Acceptance Verification | Pass 100% of E2E test suite published in TEST_READY.md | M6 | Acceptance |
| 36 | Adversarial Coverage Hardening | Tier 5 challenger edge-case coverage and bug fixing | M6 | Acceptance |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Database Schema, Supabase Client & Seeder | Postgres migrations for 14 tables, RLS, storage bucket, SSR/Admin client, and `npm run seed` with 50+ 6-mo trx | none | DONE |
| M2 | Telegram Bot Engine, Idempotency & Dev Tooling | Persistent idempotency via `telegram_updates`, Indonesian NLP parsing, Receipt OCR, Voice STT, formatting, commands, reminder cron, limit enforcement, `/dev/telegram-simulator` | M1 | DONE |
| M3 | AI Multi-Provider Engine & Instrumentation | Gemini Flash multimodal primary, OpenAI/DeepSeek parallel failover, `ai_logs` instrumentation, AI financial advisor | M1 | DONE |
| M4 | Web Dashboard, Reports Native & Supabase Storage | Route aliases (`/dashboard/reports`), 8-category onboarding wizard, multi-wallet, budget bars, receipt accordion, PDF/Excel export via Supabase Storage signed URLs | M1 | DONE |
| M5 | Admin Dashboard Security, Payments & Landing/Auth Polish | Admin middleware protection, user impersonation, privacy audit logs, Midtrans payment approval, landing page 15 sections verification, dev OTP simulator | M1, M4 | DONE |
| M6 | Final Milestone: E2E Verification & Adversarial Hardening | Phase 1: Pass 100% of E2E test suite (Tiers 1-4). Phase 2: Adversarial coverage hardening (Tier 5) with Challenger loop | M1, M2, M3, M4, M5, TEST_READY.md | DONE |

---

## Interface Contracts

### 1. Database & Storage Models (`src/lib/types/database.ts` or `src/lib/types.ts`)
- `profiles`: `{ id: string, phone: string, phone_verified: boolean, default_currency: string, role: 'user' | 'superadmin', plan: 'starter' | 'pro', created_at: string }`
- `wallets`: `{ id: string, user_id: string, name: string, balance: number, is_default: boolean, color: string, icon: string }`
- `categories`: `{ id: string, user_id: string, name: string, emoji: string, color: string, type: 'expense' | 'income', is_custom: boolean }`
- `transactions`: `{ id: string, user_id: string, wallet_id: string, category_id: string, type: 'expense' | 'income' | 'transfer', amount: number, notes: string, transaction_date: string, source: 'telegram_text' | 'telegram_photo' | 'telegram_voice' | 'web_manual', is_receipt_parent: boolean }`
- `transaction_items`: `{ id: string, transaction_id: string, item_name: string, price: number, quantity: number, category_id?: string }`
- `budgets`: `{ id: string, user_id: string, category_id: string, monthly_amount: number, period_month: number, period_year: number }`
- `telegram_bot_configs`: `{ id: string, user_id: string, bot_token_encrypted: string, telegram_chat_id: string, telegram_username?: string, is_connected: boolean, webhook_url: string, reminder_enabled: boolean, reminder_times: string[], last_active_at: string }`
- `telegram_updates`: `{ id: string, update_id: number, user_id?: string, processed_at: string, status: string }`
- `ai_providers`: `{ id: string, provider_name: 'gemini' | 'openai' | 'deepseek', api_key_encrypted: string, is_active: boolean, is_primary: boolean, failover_order: number, mode: 'single' | 'parallel_failover' }`
- `ai_logs`: `{ id: string, user_id?: string, provider: string, prompt_tokens: number, response_tokens: number, latency_ms: number, status: string, task_type: 'text_parsing' | 'receipt_ocr' | 'voice_stt' | 'financial_advisor', created_at: string }`
- `audit_logs`: `{ id: string, admin_user_id: string, target_user_id: string, action: string, ip_address?: string, reason?: string, created_at: string }`
- `report_exports`: `{ id: string, user_id: string, file_name: string, file_url: string, file_type: 'pdf' | 'xlsx', period_start: string, period_end: string, created_at: string }`

### 2. Telegram Webhook Contract (`/api/telegram/webhook`)
- Input: Telegram `Update` JSON object (`update_id`, `message`: `{ chat, from, text, photo, voice, date }`)
- Idempotency: Query `telegram_updates` for `update_id`. If exists, return HTTP 200 `{ ok: true, status: 'already_processed_idempotent' }`.
- Output: HTTP 200 `{ ok: true, status: 'success', replyText: string }`.

### 3. AI Multi-Provider Contract (`src/lib/ai/provider.ts`)
- Function: `executeAITask<T>(task: AITask): Promise<AITaskResult<T>>`
- Automatic failover: Tries primary (Gemini), on error or timeout falls back to next provider according to `failover_order`.
- Logs every execution to `ai_logs`.

### 4. Storage & Export Contract (`src/lib/export.ts` & Supabase Storage)
- PDF and Excel generators upload buffer to Supabase Storage bucket `tatadana-exports` under `exports/${userId}/${fileName}`.
- Generates signed download URL valid for 24 hours.
- Inserts record into `report_exports`.

---

## Code Layout
```
tatadana/
├── .agents/teamwork/              # Agent coordination metadata only
├── supabase/
│   └── migrations/                # Postgres DDL, RLS, triggers, indexes
├── scripts/
│   └── seed.ts                    # Standalone database seeder script (npm run seed)
├── src/
│   ├── app/
│   │   ├── (auth)/ or /login, /register, /auth/login, /auth/register
│   │   ├── (dashboard)/ or /dashboard, /dashboard/reports, /dashboard/laporan, /dashboard/wallet, etc.
│   │   ├── admin/                 # Superadmin routes protected by middleware
│   │   ├── dev/
│   │   │   └── telegram-simulator/ # Dedicated developer testing route
│   │   ├── api/
│   │   │   ├── telegram/
│   │   │   │   ├── webhook/route.ts
│   │   │   │   └── test-connection/route.ts
│   │   │   ├── cron/
│   │   │   │   └── reminders/route.ts
│   │   │   ├── ai/
│   │   │   ├── payments/
│   │   │   └── exports/
│   │   └── page.tsx               # 15-section landing page
│   ├── components/                # Reusable UI, charts, modals, simulator
│   ├── lib/
│   │   ├── supabase/              # Client, server, admin, middleware clients
│   │   ├── ai/                    # Gemini, OpenAI, DeepSeek, parser, advisor
│   │   ├── telegram.ts            # Command handlers, reply formatters, WIB utils
│   │   ├── storage.ts             # In-memory repository fallback
│   │   ├── export.ts              # PDF & Excel generator with Supabase Storage
│   │   └── utils.ts
│   └── middleware.ts              # Route protection for /admin and auth redirects
├── tests/
│   ├── e2e/                       # E2E test suite (Tiers 1-4)
│   └── adversarial/               # Tier 5 stress & edge case tests
└── package.json
```
