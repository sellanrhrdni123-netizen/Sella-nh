// ==============================================================================
// TATADANA SUPABASE DATA MAPPERS (DB Snake_Case <-> App Model CamelCase)
// ==============================================================================

import type { Tables, TablesInsert } from '@/lib/types/database';
import type {
  UserProfile,
  Wallet,
  Category,
  Budget,
  Transaction,
  ReceiptItem,
  ExportRecord,
  AIProviderConfig,
  AILog,
  PaymentRecord,
  AdminAuditLog,
} from '@/lib/types';

// ======================== WALLET MAPPERS ========================
export function mapWalletFromDb(row: Tables<'wallets'>): Wallet {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type,
    balance: Number(row.balance),
    isDefault: row.is_default,
    color: row.color,
    icon: row.icon,
    accountNumber: row.account_number || undefined,
    createdAt: row.created_at,
  };
}

export function mapWalletToDb(w: Wallet): TablesInsert<'wallets'> {
  return {
    id: w.id,
    user_id: w.userId,
    name: w.name,
    type: w.type,
    balance: w.balance,
    is_default: w.isDefault,
    color: w.color,
    icon: w.icon,
    account_number: w.accountNumber || null,
  };
}

// ======================== CATEGORY MAPPERS ========================
export function mapCategoryFromDb(row: Tables<'categories'>): Category {
  return {
    id: row.id,
    userId: row.user_id || '',
    name: row.name,
    type: row.type,
    emoji: row.emoji,
    color: row.color,
    isDefault: !row.is_custom,
    createdAt: row.created_at,
  };
}

export function mapCategoryToDb(c: Category): TablesInsert<'categories'> {
  return {
    id: c.id,
    user_id: c.userId || null,
    name: c.name,
    type: c.type,
    emoji: c.emoji,
    color: c.color,
    is_custom: !c.isDefault,
    is_default: c.isDefault,
  };
}

// ======================== TRANSACTION MAPPERS ========================
export function mapTransactionFromDb(row: Tables<'transactions'>): Transaction {
  let receiptItems: ReceiptItem[] | undefined;
  if (Array.isArray(row.receipt_items)) {
    receiptItems = row.receipt_items as unknown as ReceiptItem[];
  }

  const appSource = (row.source === 'web_manual' ? 'web' : row.source) as Transaction['source'];

  return {
    id: row.id,
    userId: row.user_id,
    walletId: row.wallet_id,
    destinationWalletId: row.destination_wallet_id || undefined,
    categoryId: row.category_id || undefined,
    type: row.type,
    amount: Number(row.amount),
    description: row.notes || row.description || '',
    source: appSource,
    receiptUrl: row.receipt_url || undefined,
    receiptItems,
    merchantName: row.merchant_name || undefined,
    transcriptText: row.transcript_text || undefined,
    transactionDate: row.transaction_date,
    createdAt: row.created_at,
  };
}

export function mapTransactionToDb(t: Transaction): TablesInsert<'transactions'> {
  const dbSource = (t.source === 'web' ? 'web_manual' : t.source) as TablesInsert<'transactions'>['source'];

  return {
    id: t.id,
    user_id: t.userId,
    wallet_id: t.walletId,
    destination_wallet_id: t.destinationWalletId || null,
    category_id: t.categoryId || null,
    type: t.type,
    amount: t.amount,
    notes: t.description,
    description: t.description,
    source: dbSource,
    receipt_url: t.receiptUrl || null,
    receipt_items: (t.receiptItems || []) as any,
    merchant_name: t.merchantName || null,
    transcript_text: t.transcriptText || null,
    is_receipt_parent: Boolean(t.receiptItems && t.receiptItems.length > 0),
    transaction_date: t.transactionDate,
  };
}

// ======================== BUDGET MAPPERS ========================
export function mapBudgetFromDb(row: Tables<'budgets'>): Budget {
  const monthStr = row.month || `${row.period_year}-${String(row.period_month).padStart(2, '0')}`;
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    month: monthStr,
    amount: Number(row.monthly_amount || row.amount),
    alert80Sent: row.alert_80_sent,
    alert100Sent: row.alert_100_sent,
  };
}

export function mapBudgetToDb(b: Budget): TablesInsert<'budgets'> {
  const parts = b.month.split('-');
  const year = parseInt(parts[0], 10) || new Date().getFullYear();
  const month = parseInt(parts[1], 10) || (new Date().getMonth() + 1);

  return {
    id: b.id,
    user_id: b.userId,
    category_id: b.categoryId,
    monthly_amount: b.amount,
    amount: b.amount,
    period_year: year,
    period_month: month,
    month: b.month,
    alert_80_sent: b.alert80Sent || false,
    alert100Sent: b.alert100Sent || false,
  };
}

// ======================== PROFILE MAPPERS ========================
export function mapProfileFromDb(row: Tables<'profiles'>, emailFallback: string = ''): UserProfile {
  return {
    id: row.id,
    email: emailFallback,
    fullName: row.full_name,
    phoneNumber: row.phone_number || row.phone || '',
    avatarUrl: row.avatar_url || undefined,
    currency: row.currency || row.default_currency || 'IDR',
    plan: row.plan,
    role: (row.role === 'superadmin' ? 'admin' : row.role) as UserProfile['role'],
    telegramChatId: row.telegram_chat_id ? Number(row.telegram_chat_id) : undefined,
    telegramUsername: row.telegram_username || undefined,
    telegramBotToken: row.telegram_bot_token || undefined,
    telegramConnected: row.telegram_connected,
    dailyReminderEnabled: row.daily_reminder_enabled,
    reminderFrequency: (row.reminder_frequency === 2 ? 2 : 1),
    reminderTimes: row.reminder_times || ['20:00'],
    onboardingCompleted: row.onboarding_completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ======================== EXPORT RECORD MAPPERS ========================
export function mapExportFromDb(row: Tables<'report_exports'>): ExportRecord {
  const periodLabel = row.period_start && row.period_end
    ? `${row.period_start.slice(0, 7)} - ${row.period_end.slice(0, 7)}`
    : new Date(row.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return {
    id: row.id,
    userId: row.user_id,
    fileName: row.file_name,
    format: row.file_type,
    periodLabel,
    fileSizeBytes: Number(row.file_size_bytes),
    downloadUrl: row.file_url,
    createdAt: row.created_at,
  };
}
