-- ==============================================================================
-- TATADANA DATABASE INITIAL SCHEMA
-- PostgreSQL schema for Supabase
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Extends auth.users, linked with phone and telegram)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone_number text unique,
  avatar_url text,
  currency text not null default 'IDR',
  plan text not null default 'starter' check (plan in ('starter', 'pro')),
  role text not null default 'user' check (role in ('user', 'admin')),
  telegram_chat_id bigint unique,
  telegram_username text,
  telegram_bot_token text,
  telegram_connected boolean not null default false,
  daily_reminder_enabled boolean not null default true,
  reminder_frequency int not null default 1 check (reminder_frequency between 1 and 2),
  reminder_times text[] not null default array['20:00'],
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. WALLETS (Cash, BCA, Mandiri, GoPay, OVO, etc.)
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text not null default 'bank' check (type in ('bank', 'ewallet', 'cash', 'credit')),
  balance numeric(15,2) not null default 0,
  is_default boolean not null default false,
  color text not null default '#f97316',
  icon text not null default 'wallet',
  account_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. CATEGORIES (Expense & Income categories with emoji & color)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text not null default 'expense' check (type in ('expense', 'income')),
  emoji text not null default '🏷️',
  color text not null default '#f97316',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- 4. BUDGETS (Monthly category budget with 80% & 100% threshold alerts)
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  month text not null, -- format 'YYYY-MM'
  amount numeric(15,2) not null default 0,
  alert_80_sent boolean not null default false,
  alert_100_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, category_id, month)
);

-- 5. TRANSACTIONS (Income, Expense, Transfer, Multi-item receipts)
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  destination_wallet_id uuid references public.wallets(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  type text not null check (type in ('expense', 'income', 'transfer')),
  amount numeric(15,2) not null,
  description text,
  source text not null default 'web' check (source in ('web', 'telegram_text', 'telegram_photo', 'telegram_voice')),
  receipt_url text,
  receipt_items jsonb not null default '[]'::jsonb, -- array of {name, price, category}
  merchant_name text,
  transaction_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 6. EXPORT HISTORY (PDF & XLSX generated files)
create table if not exists public.export_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  file_name text not null,
  format text not null check (format in ('pdf', 'xlsx')),
  period_label text not null,
  file_path text not null,
  file_size_bytes bigint not null default 0,
  download_url text,
  created_at timestamptz not null default now()
);

-- 7. TELEGRAM UPDATES (Idempotency table for Telegram webhook)
create table if not exists public.telegram_updates (
  update_id bigint primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  chat_id bigint,
  message_text text,
  status text not null default 'processed',
  created_at timestamptz not null default now()
);

-- 8. AI PROVIDER CONFIGURATIONS (Multi-provider settings managed in Admin)
create table if not exists public.ai_provider_configs (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('gemini', 'openai', 'deepseek')),
  name text not null,
  api_key_encrypted text not null,
  model_name text not null,
  is_active boolean not null default true,
  priority int not null default 1,
  mode text not null default 'single' check (mode in ('single', 'parallel_failover')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. AI LOGS (Token monitoring, latency, errors, feature tracking)
create table if not exists public.ai_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  feature text not null, -- 'text_parser', 'receipt_vision', 'voice_stt', 'financial_advisor', 'category_recommender'
  provider text not null,
  model text not null,
  prompt_summary text,
  latency_ms int not null default 0,
  tokens_used int not null default 0,
  status text not null default 'success' check (status in ('success', 'failed', 'fallback')),
  error_message text,
  created_at timestamptz not null default now()
);

-- 10. PAYMENTS (Midtrans & Manual Transfer approvals)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id text unique not null,
  plan text not null default 'pro' check (plan in ('starter', 'pro')),
  amount numeric(15,2) not null,
  payment_method text not null check (payment_method in ('midtrans_qris', 'midtrans_va', 'manual_transfer')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'settled', 'expired')),
  proof_image_url text,
  admin_notes text,
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 11. ADMIN AUDIT LOGS (Privacy protection when admin inspects user data)
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- INDEXES for fast reporting & webhook lookup
create index if not exists idx_transactions_user_date on public.transactions (user_id, transaction_date desc);
create index if not exists idx_transactions_category on public.transactions (category_id);
create index if not exists idx_transactions_wallet on public.transactions (wallet_id);
create index if not exists idx_budgets_user_month on public.budgets (user_id, month);
create index if not exists idx_telegram_updates_time on public.telegram_updates (created_at desc);

-- RLS (Row Level Security) POLICIES
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.categories enable row level security;
alter table public.budgets enable row level security;
alter table public.transactions enable row level security;
alter table public.export_history enable row level security;
alter table public.payments enable row level security;

-- Profiles: user can read/update own profile
create policy "User can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "User can update own profile" on public.profiles for update using (auth.uid() = id);

-- Wallets: user CRUD
create policy "User can CRUD own wallets" on public.wallets for all using (auth.uid() = user_id);

-- Categories: user CRUD
create policy "User can CRUD own categories" on public.categories for all using (auth.uid() = user_id);

-- Budgets: user CRUD
create policy "User can CRUD own budgets" on public.budgets for all using (auth.uid() = user_id);

-- Transactions: user CRUD
create policy "User can CRUD own transactions" on public.transactions for all using (auth.uid() = user_id);

-- Export history: user CRUD
create policy "User can CRUD own exports" on public.export_history for all using (auth.uid() = user_id);

-- Payments: user read own payments
create policy "User can view own payments" on public.payments for select using (auth.uid() = user_id);
create policy "User can create payments" on public.payments for insert with check (auth.uid() = user_id);
