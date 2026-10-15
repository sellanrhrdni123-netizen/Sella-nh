// ==============================================================================
// TATADANA TYPE DEFINITIONS
// ==============================================================================

export type PlanType = 'starter' | 'pro';
export type UserRole = 'user' | 'admin';
export type TransactionType = 'expense' | 'income' | 'transfer';
export type TransactionSource = 'web' | 'telegram_text' | 'telegram_photo' | 'telegram_voice';
export type WalletType = 'bank' | 'ewallet' | 'cash' | 'credit';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string; // Used for OTP and linking Telegram bot
  avatarUrl?: string;
  currency: string; // 'IDR'
  plan: PlanType;
  role: UserRole;
  telegramChatId?: number;
  telegramUsername?: string;
  telegramBotToken?: string;
  telegramConnected: boolean;
  dailyReminderEnabled: boolean;
  reminderFrequency: 1 | 2; // max 2x daily
  reminderTimes: string[]; // e.g. ['12:30', '20:00'] WIB
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  name: string;
  type: WalletType;
  balance: number;
  isDefault: boolean; // default wallet for Telegram transactions
  color: string;
  icon: string;
  accountNumber?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: 'expense' | 'income';
  emoji: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  month: string; // 'YYYY-MM'
  amount: number;
  alert80Sent?: boolean;
  alert100Sent?: boolean;
}

export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  categoryName?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  destinationWalletId?: string; // for transfer
  categoryId?: string;
  type: TransactionType;
  amount: number;
  description: string;
  source: TransactionSource;
  receiptUrl?: string;
  receiptItems?: ReceiptItem[]; // itemized receipt breakdown
  merchantName?: string;
  transcriptText?: string; // for voice notes
  transactionDate: string; // ISO string in WIB
  createdAt: string;
}

export interface ExportRecord {
  id: string;
  userId: string;
  fileName: string;
  format: 'pdf' | 'xlsx';
  periodLabel: string;
  fileSizeBytes: number;
  downloadUrl?: string;
  createdAt: string;
}

export interface TelegramUpdate {
  updateId: number;
  userId?: string;
  chatId?: number;
  messageText?: string;
  status: 'processed' | 'ignored';
  createdAt: string;
}

export type AIProvider = 'gemini' | 'openai' | 'deepseek';

export interface AIProviderConfig {
  id: string;
  provider: AIProvider;
  name: string;
  apiKeyEncrypted: string;
  modelName: string;
  isActive: boolean;
  priority: number;
  mode: 'single' | 'parallel_failover';
  createdAt: string;
}

export interface AILog {
  id: string;
  userId?: string;
  feature: 'text_parser' | 'receipt_vision' | 'voice_stt' | 'financial_advisor' | 'category_recommender';
  provider: AIProvider;
  model: string;
  promptSummary: string;
  latencyMs: number;
  tokensUsed: number;
  status: 'success' | 'failed' | 'fallback';
  errorMessage?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  orderId: string;
  plan: PlanType;
  amount: number;
  paymentMethod: 'midtrans_qris' | 'midtrans_va' | 'manual_transfer';
  status: 'pending' | 'approved' | 'rejected' | 'settled' | 'expired';
  proofImageUrl?: string;
  adminNotes?: string;
  approvedBy?: string;
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  targetUserId?: string;
  action: string;
  details: Record<string, any>;
  createdAt: string;
}

export interface ParsedTransactionResult {
  jenis: 'pengeluaran' | 'pemasukan' | 'transfer';
  nominal: number;
  kategori: string;
  catatan: string;
  merchant?: string;
  dompet?: string;
  destinationDompet?: string;
  confidence?: number;
  receiptItems?: ReceiptItem[];
  transcript?: string;
}
