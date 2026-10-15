-- ==============================================================================
-- TATADANA COMPREHENSIVE DATABASE SCHEMA (MILESTONE 1)
-- Migration: 20261014000001_comprehensive_schema.sql
-- Covers all 14 mandatory tables, complete columns, zero-trust RLS policies
-- with public.is_superadmin() bypass, tatadana-exports storage bucket,
-- realtime publications, auth triggers, and master data seeding.
-- ==============================================================================

-- Enable essential extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ==============================================================================
-- 1. SECURITY DEFINER HELPER FUNCTION
-- ==============================================================================

create or replace function public.is_superadmin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'superadmin')
  );
$$;

-- ==============================================================================
-- 2. TABLE DDL SPECIFICATIONS (ALL 14 TABLES)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Table 1: profiles
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone_number text unique,
  phone text,
  phone_verified boolean not null default false,
  avatar_url text,
  default_currency text not null default 'IDR',
  currency text not null default 'IDR',
  plan text not null default 'starter' check (plan in ('starter', 'pro')),
  role text not null default 'user' check (role in ('user', 'admin', 'superadmin')),
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

-- Upgrade check for pre-existing profiles table
do $$
begin
  alter table public.profiles add column if not exists phone text;
  alter table public.profiles add column if not exists phone_verified boolean not null default false;
  alter table public.profiles add column if not exists default_currency text not null default 'IDR';
  alter table public.profiles drop constraint if exists profiles_role_check;
  alter table public.profiles add constraint profiles_role_check check (role in ('user', 'admin', 'superadmin'));
  update public.profiles set phone = phone_number where phone is null and phone_number is not null;
  update public.profiles set default_currency = currency where default_currency is null and currency is not null;
end;
$$;

create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_profiles_phone on public.profiles (phone_number);

-- ------------------------------------------------------------------------------
-- Table 2: wallets
-- ------------------------------------------------------------------------------
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

create index if not exists idx_wallets_user_id on public.wallets (user_id);
create unique index if not exists idx_wallets_user_one_default on public.wallets (user_id) where (is_default = true);

-- ------------------------------------------------------------------------------
-- Table 3: categories
-- ------------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  type text not null default 'expense' check (type in ('expense', 'income')),
  emoji text not null default '🏷️',
  color text not null default '#f97316',
  is_custom boolean not null default true,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

do $$
begin
  alter table public.categories add column if not exists is_custom boolean not null default true;
  alter table public.categories alter column user_id drop not null;
end;
$$;

create index if not exists idx_categories_user_id on public.categories (user_id);
create index if not exists idx_categories_type on public.categories (type);

-- ------------------------------------------------------------------------------
-- Table 4: transactions
-- ------------------------------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  destination_wallet_id uuid references public.wallets(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  type text not null check (type in ('expense', 'income', 'transfer')),
  amount numeric(15,2) not null check (amount >= 0),
  notes text,
  description text,
  source text not null default 'web_manual' check (source in ('web', 'web_manual', 'telegram_text', 'telegram_photo', 'telegram_voice')),
  is_receipt_parent boolean not null default false,
  receipt_url text,
  receipt_items jsonb not null default '[]'::jsonb,
  merchant_name text,
  transcript_text text,
  transaction_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

do $$
begin
  alter table public.transactions add column if not exists notes text;
  alter table public.transactions add column if not exists is_receipt_parent boolean not null default false;
  alter table public.transactions add column if not exists transcript_text text;
  alter table public.transactions drop constraint if exists transactions_source_check;
  alter table public.transactions add constraint transactions_source_check check (source in ('web', 'web_manual', 'telegram_text', 'telegram_photo', 'telegram_voice'));
  update public.transactions set notes = description where notes is null and description is not null;
  update public.transactions set description = notes where description is null and notes is not null;
end;
$$;

create index if not exists idx_transactions_user_date on public.transactions (user_id, transaction_date desc);
create index if not exists idx_transactions_category on public.transactions (category_id);
create index if not exists idx_transactions_wallet on public.transactions (wallet_id);
create index if not exists idx_transactions_is_receipt_parent on public.transactions (is_receipt_parent) where is_receipt_parent = true;

-- ------------------------------------------------------------------------------
-- Table 5: transaction_items
-- ------------------------------------------------------------------------------
create table if not exists public.transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  item_name text not null,
  price numeric(15,2) not null default 0,
  quantity numeric(10,2) not null default 1,
  category_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_transaction_items_tx on public.transaction_items (transaction_id);
create index if not exists idx_transaction_items_category on public.transaction_items (category_id);

-- ------------------------------------------------------------------------------
-- Table 6: budgets
-- ------------------------------------------------------------------------------
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  monthly_amount numeric(15,2) not null default 0 check (monthly_amount >= 0),
  amount numeric(15,2) not null default 0 check (amount >= 0),
  period_month int not null default extract(month from now())::int check (period_month between 1 and 12),
  period_year int not null default extract(year from now())::int check (period_year between 2000 and 2100),
  month text,
  alert_80_sent boolean not null default false,
  alert_100_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  alter table public.budgets add column if not exists monthly_amount numeric(15,2) not null default 0 check (monthly_amount >= 0);
  alter table public.budgets add column if not exists period_month int check (period_month between 1 and 12);
  alter table public.budgets add column if not exists period_year int check (period_year between 2000 and 2100);
  
  update public.budgets set monthly_amount = amount where monthly_amount = 0 and amount > 0;
  update public.budgets set amount = monthly_amount where amount = 0 and monthly_amount > 0;
  
  update public.budgets 
  set period_year = split_part(month, '-', 1)::int,
      period_month = split_part(month, '-', 2)::int
  where period_year is null and month is not null and month ~ '^[0-9]{4}-[0-9]{2}$';
end;
$$;

create index if not exists idx_budgets_user_period on public.budgets (user_id, period_year, period_month);

-- ------------------------------------------------------------------------------
-- Table 7: subscription_plans
-- ------------------------------------------------------------------------------
create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug in ('starter', 'pro')),
  name text not null,
  price numeric(15,2) not null default 0,
  billing_type text not null check (billing_type in ('monthly', 'lifetime')),
  features_json jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- Table 8: user_subscriptions
-- ------------------------------------------------------------------------------
create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid references public.subscription_plans(id) on delete restrict,
  status text not null default 'pending' check (status in ('active', 'pending', 'expired', 'rejected')),
  payment_gateway text not null default 'midtrans' check (payment_gateway in ('midtrans', 'manual_transfer', 'system')),
  midtrans_order_id text unique,
  proof_url text,
  amount numeric(15,2),
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  admin_notes text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_subscriptions_user on public.user_subscriptions (user_id);
create index if not exists idx_user_subscriptions_order on public.user_subscriptions (midtrans_order_id);
create index if not exists idx_user_subscriptions_status on public.user_subscriptions (status);

-- ------------------------------------------------------------------------------
-- Table 9: telegram_bot_configs
-- ------------------------------------------------------------------------------
create table if not exists public.telegram_bot_configs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  bot_token_encrypted text,
  telegram_chat_id bigint,
  telegram_username text,
  is_connected boolean not null default false,
  webhook_url text,
  reminder_enabled boolean not null default true,
  reminder_times jsonb not null default '["20:00"]'::jsonb,
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_telegram_bot_configs_chat_id on public.telegram_bot_configs (telegram_chat_id);

-- ------------------------------------------------------------------------------
-- Table 10: telegram_updates
-- ------------------------------------------------------------------------------
create table if not exists public.telegram_updates (
  id uuid primary key default gen_random_uuid(),
  update_id bigint not null unique,
  user_id uuid references public.profiles(id) on delete set null,
  chat_id bigint,
  message_text text,
  processed_at timestamptz not null default now(),
  status text not null default 'processed' check (status in ('processed', 'ignored', 'failed')),
  created_at timestamptz not null default now()
);

do $$
begin
  alter table public.telegram_updates add column if not exists id uuid default gen_random_uuid();
  alter table public.telegram_updates add column if not exists processed_at timestamptz not null default now();
end;
$$;

create index if not exists idx_telegram_updates_update_id on public.telegram_updates (update_id);
create index if not exists idx_telegram_updates_processed_at on public.telegram_updates (processed_at desc);

-- ------------------------------------------------------------------------------
-- Table 11: ai_providers
-- ------------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'ai_provider_configs' and table_type = 'BASE TABLE')
     and not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'ai_providers') then
    alter table public.ai_provider_configs rename to ai_providers;
    alter table public.ai_providers rename column provider to provider_name;
    alter table public.ai_providers rename column priority to failover_order;
    alter table public.ai_providers add column if not exists is_primary boolean not null default false;
  end if;
end;
$$;

create table if not exists public.ai_providers (
  id uuid primary key default gen_random_uuid(),
  provider_name text not null check (provider_name in ('gemini', 'openai', 'deepseek')),
  name text,
  api_key_encrypted text not null,
  model_name text not null default '',
  is_active boolean not null default true,
  is_primary boolean not null default false,
  failover_order int not null default 1,
  mode text not null default 'parallel_failover' check (mode in ('single', 'parallel_failover')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_providers_order on public.ai_providers (failover_order);
create unique index if not exists idx_ai_providers_one_primary on public.ai_providers (is_primary) where (is_primary = true);

-- ------------------------------------------------------------------------------
-- Table 12: ai_logs
-- ------------------------------------------------------------------------------
create table if not exists public.ai_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  provider text not null,
  prompt_tokens int not null default 0,
  response_tokens int not null default 0,
  tokens_used int not null default 0,
  latency_ms int not null default 0,
  status text not null default 'success' check (status in ('success', 'failed', 'fallback')),
  task_type text not null default 'text_parsing' check (task_type in ('text_parsing', 'receipt_ocr', 'voice_stt', 'financial_advisor', 'category_recommender')),
  feature text,
  model text,
  prompt_summary text,
  error_message text,
  created_at timestamptz not null default now()
);

do $$
begin
  alter table public.ai_logs add column if not exists prompt_tokens int not null default 0;
  alter table public.ai_logs add column if not exists response_tokens int not null default 0;
  alter table public.ai_logs add column if not exists task_type text default 'text_parsing';
  update public.ai_logs set task_type = feature where task_type is null and feature is not null;
end;
$$;

create index if not exists idx_ai_logs_user_id on public.ai_logs (user_id);
create index if not exists idx_ai_logs_created_at on public.ai_logs (created_at desc);
create index if not exists idx_ai_logs_task_type on public.ai_logs (task_type);

-- ------------------------------------------------------------------------------
-- Table 13: audit_logs
-- ------------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'admin_audit_logs' and table_type = 'BASE TABLE')
     and not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'audit_logs') then
    alter table public.admin_audit_logs rename to audit_logs;
    alter table public.audit_logs rename column admin_id to admin_user_id;
    alter table public.audit_logs add column if not exists ip_address text;
    alter table public.audit_logs add column if not exists reason text;
  end if;
end;
$$;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.profiles(id) on delete cascade,
  target_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  ip_address text,
  reason text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_admin on public.audit_logs (admin_user_id);
create index if not exists idx_audit_logs_target on public.audit_logs (target_user_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at desc);

-- ------------------------------------------------------------------------------
-- Table 14: report_exports
-- ------------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'export_history' and table_type = 'BASE TABLE')
     and not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'report_exports') then
    alter table public.export_history rename to report_exports;
    alter table public.report_exports rename column format to file_type;
    alter table public.report_exports rename column download_url to file_url;
    alter table public.report_exports add column if not exists period_start timestamptz;
    alter table public.report_exports add column if not exists period_end timestamptz;
  end if;
end;
$$;

create table if not exists public.report_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text not null check (file_type in ('pdf', 'xlsx')),
  period_start timestamptz,
  period_end timestamptz,
  file_size_bytes bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_report_exports_user on public.report_exports (user_id);
create index if not exists idx_report_exports_created_at on public.report_exports (created_at desc);

-- ==============================================================================
-- 3. ROW LEVEL SECURITY (RLS) & SUPERADMIN BYPASS POLICIES
-- ==============================================================================

-- Enable RLS on all 14 tables without exception
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_items enable row level security;
alter table public.budgets enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.telegram_bot_configs enable row level security;
alter table public.telegram_updates enable row level security;
alter table public.ai_providers enable row level security;
alter table public.ai_logs enable row level security;
alter table public.audit_logs enable row level security;
alter table public.report_exports enable row level security;

-- 1. PROFILES
drop policy if exists "Profiles SELECT policy" on public.profiles;
create policy "Profiles SELECT policy" on public.profiles
  for select using (auth.uid() = id or public.is_superadmin());

drop policy if exists "Profiles UPDATE policy" on public.profiles;
create policy "Profiles UPDATE policy" on public.profiles
  for update using (auth.uid() = id or public.is_superadmin())
  with check (auth.uid() = id or public.is_superadmin());

drop policy if exists "Profiles INSERT policy" on public.profiles;
create policy "Profiles INSERT policy" on public.profiles
  for insert with check (auth.uid() = id or public.is_superadmin());

-- 2. WALLETS
drop policy if exists "Wallets ALL policy" on public.wallets;
create policy "Wallets ALL policy" on public.wallets
  for all using (auth.uid() = user_id or public.is_superadmin())
  with check (auth.uid() = user_id or public.is_superadmin());

-- 3. CATEGORIES
drop policy if exists "Categories SELECT policy" on public.categories;
create policy "Categories SELECT policy" on public.categories
  for select using (auth.uid() = user_id or user_id is null or public.is_superadmin());

drop policy if exists "Categories MUTATE policy" on public.categories;
create policy "Categories MUTATE policy" on public.categories
  for all using (auth.uid() = user_id or public.is_superadmin())
  with check (auth.uid() = user_id or public.is_superadmin());

-- 4. TRANSACTIONS
drop policy if exists "Transactions ALL policy" on public.transactions;
create policy "Transactions ALL policy" on public.transactions
  for all using (auth.uid() = user_id or public.is_superadmin())
  with check (auth.uid() = user_id or public.is_superadmin());

-- 5. TRANSACTION_ITEMS
drop policy if exists "Transaction Items ALL policy" on public.transaction_items;
create policy "Transaction Items ALL policy" on public.transaction_items
  for all using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_items.transaction_id
        and (t.user_id = auth.uid() or public.is_superadmin())
    )
  )
  with check (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_items.transaction_id
        and (t.user_id = auth.uid() or public.is_superadmin())
    )
  );

-- 6. BUDGETS
drop policy if exists "Budgets ALL policy" on public.budgets;
create policy "Budgets ALL policy" on public.budgets
  for all using (auth.uid() = user_id or public.is_superadmin())
  with check (auth.uid() = user_id or public.is_superadmin());

-- 7. SUBSCRIPTION_PLANS
drop policy if exists "Subscription Plans SELECT policy" on public.subscription_plans;
create policy "Subscription Plans SELECT policy" on public.subscription_plans
  for select using (true);

drop policy if exists "Subscription Plans ADMIN policy" on public.subscription_plans;
create policy "Subscription Plans ADMIN policy" on public.subscription_plans
  for all using (public.is_superadmin())
  with check (public.is_superadmin());

-- 8. USER_SUBSCRIPTIONS
drop policy if exists "User Subscriptions SELECT policy" on public.user_subscriptions;
create policy "User Subscriptions SELECT policy" on public.user_subscriptions
  for select using (auth.uid() = user_id or public.is_superadmin());

drop policy if exists "User Subscriptions INSERT policy" on public.user_subscriptions;
create policy "User Subscriptions INSERT policy" on public.user_subscriptions
  for insert with check (auth.uid() = user_id or public.is_superadmin());

drop policy if exists "User Subscriptions UPDATE policy" on public.user_subscriptions;
create policy "User Subscriptions UPDATE policy" on public.user_subscriptions
  for update using (public.is_superadmin())
  with check (public.is_superadmin());

-- 9. TELEGRAM_BOT_CONFIGS
drop policy if exists "Telegram Bot Configs ALL policy" on public.telegram_bot_configs;
create policy "Telegram Bot Configs ALL policy" on public.telegram_bot_configs
  for all using (auth.uid() = user_id or public.is_superadmin())
  with check (auth.uid() = user_id or public.is_superadmin());

-- 10. TELEGRAM_UPDATES
drop policy if exists "Telegram Updates ADMIN policy" on public.telegram_updates;
create policy "Telegram Updates ADMIN policy" on public.telegram_updates
  for all using (public.is_superadmin())
  with check (public.is_superadmin());

-- 11. AI_PROVIDERS
drop policy if exists "AI Providers ADMIN policy" on public.ai_providers;
create policy "AI Providers ADMIN policy" on public.ai_providers
  for all using (public.is_superadmin())
  with check (public.is_superadmin());

-- 12. AI_LOGS
drop policy if exists "AI Logs SELECT policy" on public.ai_logs;
create policy "AI Logs SELECT policy" on public.ai_logs
  for select using (auth.uid() = user_id or public.is_superadmin());

drop policy if exists "AI Logs INSERT policy" on public.ai_logs;
create policy "AI Logs INSERT policy" on public.ai_logs
  for insert with check (auth.uid() = user_id or public.is_superadmin());

-- 13. AUDIT_LOGS
drop policy if exists "Audit Logs ADMIN policy" on public.audit_logs;
create policy "Audit Logs ADMIN policy" on public.audit_logs
  for all using (public.is_superadmin())
  with check (public.is_superadmin());

-- 14. REPORT_EXPORTS
drop policy if exists "Report Exports ALL policy" on public.report_exports;
create policy "Report Exports ALL policy" on public.report_exports
  for all using (auth.uid() = user_id or public.is_superadmin())
  with check (auth.uid() = user_id or public.is_superadmin());

-- ==============================================================================
-- 4. SUPABASE STORAGE BUCKET (tatadana-exports) & STORAGE RLS
-- ==============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tatadana-exports',
  'tatadana-exports',
  false,
  10485760,
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];

drop policy if exists "Users can access own export files" on storage.objects;
create policy "Users can access own export files"
on storage.objects for select
using (
  bucket_id = 'tatadana-exports'
  and (
    auth.uid()::text = split_part(name, '/', 2)
    or auth.uid()::text = split_part(name, '/', 1)
    or public.is_superadmin()
  )
);

drop policy if exists "Users can upload own export files" on storage.objects;
create policy "Users can upload own export files"
on storage.objects for insert
with check (
  bucket_id = 'tatadana-exports'
  and (
    auth.uid()::text = split_part(name, '/', 2)
    or auth.uid()::text = split_part(name, '/', 1)
    or public.is_superadmin()
  )
);

drop policy if exists "Users can delete own export files" on storage.objects;
create policy "Users can delete own export files"
on storage.objects for delete
using (
  bucket_id = 'tatadana-exports'
  and (
    auth.uid()::text = split_part(name, '/', 2)
    or auth.uid()::text = split_part(name, '/', 1)
    or public.is_superadmin()
  )
);

-- ==============================================================================
-- 5. REALTIME PUBLICATION REGISTRATION
-- ==============================================================================

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  if not exists (
    select 1 from pg_publication_rel pr
    join pg_publication p on p.oid = pr.prpubid
    join pg_class c on c.oid = pr.prrelid
    where p.pubname = 'supabase_realtime' and c.relname = 'transactions'
  ) then
    alter publication supabase_realtime add table public.transactions;
  end if;

  if not exists (
    select 1 from pg_publication_rel pr
    join pg_publication p on p.oid = pr.prpubid
    join pg_class c on c.oid = pr.prrelid
    where p.pubname = 'supabase_realtime' and c.relname = 'wallets'
  ) then
    alter publication supabase_realtime add table public.wallets;
  end if;

  if not exists (
    select 1 from pg_publication_rel pr
    join pg_publication p on p.oid = pr.prpubid
    join pg_class c on c.oid = pr.prrelid
    where p.pubname = 'supabase_realtime' and c.relname = 'budgets'
  ) then
    alter publication supabase_realtime add table public.budgets;
  end if;

  if not exists (
    select 1 from pg_publication_rel pr
    join pg_publication p on p.oid = pr.prpubid
    join pg_class c on c.oid = pr.prrelid
    where p.pubname = 'supabase_realtime' and c.relname = 'report_exports'
  ) then
    alter publication supabase_realtime add table public.report_exports;
  end if;
end;
$$;

-- ==============================================================================
-- 6. TRIGGERS & STORED PROCEDURES
-- ==============================================================================

-- 6.1. Auth New User Trigger (Provisioning profiles & telegram_bot_configs)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_phone text;
  user_full_name text;
begin
  user_phone := coalesce(new.raw_user_meta_data->>'phone', new.phone, '');
  user_full_name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));

  insert into public.profiles (
    id,
    full_name,
    phone_number,
    phone,
    phone_verified,
    default_currency,
    currency,
    plan,
    role,
    created_at,
    updated_at
  )
  values (
    new.id,
    user_full_name,
    nullif(user_phone, ''),
    nullif(user_phone, ''),
    coalesce((new.raw_user_meta_data->>'phone_verified')::boolean, new.phone_confirmed_at is not null, false),
    'IDR',
    'IDR',
    coalesce(new.raw_user_meta_data->>'plan', 'starter'),
    case when new.email = 'admin@tatadana.id' or new.raw_user_meta_data->>'role' in ('admin', 'superadmin') then 'superadmin' else 'user' end,
    now(),
    now()
  )
  on conflict (id) do update set
    phone = excluded.phone,
    phone_verified = excluded.phone_verified,
    updated_at = now();

  insert into public.telegram_bot_configs (user_id, reminder_enabled, reminder_times)
  values (new.id, true, '["20:00"]'::jsonb)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6.2. Automatic updated_at Timestamps
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles for each row execute function public.handle_updated_at();

drop trigger if exists trg_wallets_updated_at on public.wallets;
create trigger trg_wallets_updated_at before update on public.wallets for each row execute function public.handle_updated_at();

drop trigger if exists trg_budgets_updated_at on public.budgets;
create trigger trg_budgets_updated_at before update on public.budgets for each row execute function public.handle_updated_at();

drop trigger if exists trg_subscription_plans_updated_at on public.subscription_plans;
create trigger trg_subscription_plans_updated_at before update on public.subscription_plans for each row execute function public.handle_updated_at();

drop trigger if exists trg_user_subscriptions_updated_at on public.user_subscriptions;
create trigger trg_user_subscriptions_updated_at before update on public.user_subscriptions for each row execute function public.handle_updated_at();

drop trigger if exists trg_telegram_bot_configs_updated_at on public.telegram_bot_configs;
create trigger trg_telegram_bot_configs_updated_at before update on public.telegram_bot_configs for each row execute function public.handle_updated_at();

drop trigger if exists trg_ai_providers_updated_at on public.ai_providers;
create trigger trg_ai_providers_updated_at before update on public.ai_providers for each row execute function public.handle_updated_at();

-- 6.3. Backward-Compatibility Column Sync Triggers
-- Sync notes <-> description on transactions
create or replace function public.handle_transaction_notes_sync()
returns trigger
language plpgsql
as $$
begin
  if new.notes is null and new.description is not null then
    new.notes := new.description;
  elsif new.description is null and new.notes is not null then
    new.description := new.notes;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_transactions_notes_sync on public.transactions;
create trigger trg_transactions_notes_sync
  before insert or update on public.transactions
  for each row execute function public.handle_transaction_notes_sync();

-- Sync budget month <-> period_year / period_month
create or replace function public.handle_budget_period_sync()
returns trigger
language plpgsql
as $$
begin
  if new.month is null and new.period_year is not null and new.period_month is not null then
    new.month := lpad(new.period_year::text, 4, '0') || '-' || lpad(new.period_month::text, 2, '0');
  elsif new.month is not null and (new.period_year is null or new.period_month is null) then
    new.period_year := split_part(new.month, '-', 1)::int;
    new.period_month := split_part(new.month, '-', 2)::int;
  end if;
  if new.monthly_amount = 0 and new.amount > 0 then
    new.monthly_amount := new.amount;
  elsif new.amount = 0 and new.monthly_amount > 0 then
    new.amount := new.monthly_amount;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_budgets_period_sync on public.budgets;
create trigger trg_budgets_period_sync
  before insert or update on public.budgets
  for each row execute function public.handle_budget_period_sync();

-- ==============================================================================
-- 7. MASTER DATA SEEDING
-- ==============================================================================

-- 7.1. Subscription Plans Master
insert into public.subscription_plans (slug, name, price, billing_type, features_json, is_active)
values
  ('starter', 'Starter Plan', 49000, 'monthly', jsonb_build_object(
    'max_wallets', 3,
    'max_categories', 5,
    'max_transactions_monthly', 50,
    'receipt_ocr', false,
    'voice_stt', false,
    'financial_advisor', false,
    'export_formats', jsonb_build_array('pdf')
  ), true),
  ('pro', 'Pro Lifetime', 99000, 'lifetime', jsonb_build_object(
    'max_wallets', 999,
    'max_categories', 999,
    'max_transactions_monthly', 999999,
    'receipt_ocr', true,
    'voice_stt', true,
    'financial_advisor', true,
    'export_formats', jsonb_build_array('pdf', 'xlsx')
  ), true)
on conflict (slug) do update set
  name = excluded.name,
  price = excluded.price,
  billing_type = excluded.billing_type,
  features_json = excluded.features_json,
  updated_at = now();

-- 7.2. AI Providers Master
insert into public.ai_providers (provider_name, name, api_key_encrypted, model_name, is_active, is_primary, failover_order, mode)
values
  ('gemini', 'Google Gemini 1.5 Flash', 'enc_gemini_primary_key', 'gemini-1.5-flash', true, true, 1, 'parallel_failover'),
  ('openai', 'OpenAI GPT-4o Mini', 'enc_openai_backup_key', 'gpt-4o-mini', true, false, 2, 'parallel_failover'),
  ('deepseek', 'DeepSeek Chat V3', 'enc_deepseek_backup_key', 'deepseek-chat', true, false, 3, 'parallel_failover')
on conflict (is_primary) where (is_primary = true) do nothing;

-- ==============================================================================
-- 8. BACKWARD-COMPATIBILITY VIEWS
-- ==============================================================================

create or replace view public.export_history as
  select
    id,
    user_id,
    file_name,
    file_type as format,
    coalesce(to_char(period_start, 'YYYY-MM'), to_char(created_at, 'YYYY-MM')) as period_label,
    file_url as file_path,
    file_size_bytes,
    file_url as download_url,
    created_at
  from public.report_exports;

create or replace view public.admin_audit_logs as
  select
    id,
    admin_user_id as admin_id,
    target_user_id,
    action,
    details,
    created_at
  from public.audit_logs;

create or replace view public.ai_provider_configs as
  select
    id,
    provider_name as provider,
    coalesce(name, provider_name) as name,
    api_key_encrypted,
    model_name,
    is_active,
    failover_order as priority,
    mode,
    created_at,
    updated_at
  from public.ai_providers;

create or replace view public.payments as
  select
    id,
    user_id,
    midtrans_order_id as order_id,
    'pro' as plan,
    coalesce(amount, 99000) as amount,
    case when payment_gateway = 'manual_transfer' then 'manual_transfer' else 'midtrans_qris' end as payment_method,
    status,
    proof_url as proof_image_url,
    admin_notes,
    approved_by,
    created_at,
    updated_at
  from public.user_subscriptions;
