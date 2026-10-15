import {
  UserProfile,
  Wallet,
  Category,
  Budget,
  Transaction,
  ExportRecord,
  AIProviderConfig,
  AILog,
  PaymentRecord,
  AdminAuditLog,
  TelegramUpdate
} from './types';
import {
  DEMO_USER_ID,
  ADMIN_USER_ID,
  STARTER_USER_ID,
  UNVERIFIED_USER_ID,
  SEED_PROFILES,
  SEED_WALLETS,
  SEED_CATEGORIES,
  SEED_BUDGETS,
  SEED_TRANSACTIONS,
  SEED_TRANSACTION_ITEMS,
  SEED_EXPORT_HISTORY,
  SEED_AI_PROVIDERS,
  SEED_AI_LOGS,
  SEED_PAYMENTS,
  SEED_AUDIT_LOGS,
  SEED_TELEGRAM_UPDATES
} from './seed-data';

// ==============================================================================
// SEED DATA RE-EXPORTS (Hydrated from canonical seed-data.ts)
// ==============================================================================

export { DEMO_USER_ID, ADMIN_USER_ID, STARTER_USER_ID, UNVERIFIED_USER_ID };

export const INITIAL_PROFILES: UserProfile[] = SEED_PROFILES;
export const INITIAL_WALLETS: Wallet[] = SEED_WALLETS;
export const INITIAL_CATEGORIES: Category[] = SEED_CATEGORIES;
export const INITIAL_BUDGETS: Budget[] = SEED_BUDGETS;
export const INITIAL_TRANSACTIONS: Transaction[] = SEED_TRANSACTIONS;
export const INITIAL_EXPORT_HISTORY: ExportRecord[] = SEED_EXPORT_HISTORY;
export const INITIAL_AI_CONFIGS: AIProviderConfig[] = SEED_AI_PROVIDERS;
export const INITIAL_AI_LOGS: AILog[] = SEED_AI_LOGS;
export const INITIAL_PAYMENTS: PaymentRecord[] = SEED_PAYMENTS;
export const INITIAL_AUDIT_LOGS: AdminAuditLog[] = SEED_AUDIT_LOGS;
export { SEED_TRANSACTION_ITEMS };

// ==============================================================================
// STORAGE REPOSITORY CLASS (Supports In-Memory + LocalStorage + Supabase sync)
// ==============================================================================

class TataDanaStore {
  private profiles: UserProfile[] = [...INITIAL_PROFILES];
  private wallets: Wallet[] = [...INITIAL_WALLETS];
  private categories: Category[] = [...INITIAL_CATEGORIES];
  private budgets: Budget[] = [...INITIAL_BUDGETS];
  private transactions: Transaction[] = [...INITIAL_TRANSACTIONS];
  private exportHistory: ExportRecord[] = [...INITIAL_EXPORT_HISTORY];
  private aiConfigs: AIProviderConfig[] = [...INITIAL_AI_CONFIGS];
  private aiLogs: AILog[] = [...INITIAL_AI_LOGS];
  private payments: PaymentRecord[] = [...INITIAL_PAYMENTS];
  private auditLogs: AdminAuditLog[] = [...INITIAL_AUDIT_LOGS];
  private telegramUpdates: Map<number, TelegramUpdate> = new Map();
  private currentUserId: string = DEMO_USER_ID;
  private impersonatingUserId: string | null = null;
  private isClientInitialized: boolean = false;

  constructor() {
    SEED_TELEGRAM_UPDATES.forEach(u => this.telegramUpdates.set(u.updateId, u));
    this.initFromLocalStorage();
  }

  private initFromLocalStorage() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('tatadana_state_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.profiles) this.profiles = parsed.profiles;
        if (parsed.wallets) this.wallets = parsed.wallets;
        if (parsed.categories) this.categories = parsed.categories;
        if (parsed.budgets) this.budgets = parsed.budgets;
        if (parsed.transactions) this.transactions = parsed.transactions;
        if (parsed.exportHistory) this.exportHistory = parsed.exportHistory;
        if (parsed.aiConfigs) this.aiConfigs = parsed.aiConfigs;
        if (parsed.aiLogs) this.aiLogs = parsed.aiLogs;
        if (parsed.payments) this.payments = parsed.payments;
        if (parsed.auditLogs) this.auditLogs = parsed.auditLogs;
        if (parsed.impersonatingUserId) this.impersonatingUserId = parsed.impersonatingUserId;
      }
      this.isClientInitialized = true;
    } catch (e) {
      console.warn('Failed to hydrate state from localStorage', e);
    }
  }

  private persist() {
    if (typeof window === 'undefined') return;
    try {
      const state = {
        profiles: this.profiles,
        wallets: this.wallets,
        categories: this.categories,
        budgets: this.budgets,
        transactions: this.transactions,
        exportHistory: this.exportHistory,
        aiConfigs: this.aiConfigs,
        aiLogs: this.aiLogs,
        payments: this.payments,
        auditLogs: this.auditLogs,
        impersonatingUserId: this.impersonatingUserId
      };
      localStorage.setItem('tatadana_state_v1', JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to persist state to localStorage', e);
    }
  }

  // Active User Access
  getActiveUserId(): string {
    return this.impersonatingUserId || this.currentUserId;
  }

  getCurrentUser(): UserProfile {
    const id = this.getActiveUserId();
    const user = this.profiles.find(p => p.id === id);
    return user || this.profiles[0];
  }

  getAdminUser(): UserProfile {
    return this.profiles.find(p => p.role === 'admin') || this.profiles[1];
  }

  setImpersonation(userId: string | null) {
    this.impersonatingUserId = userId;
    this.persist();
  }

  getImpersonatingUserId(): string | null {
    return this.impersonatingUserId;
  }

  // Profile methods
  getProfiles(): UserProfile[] {
    return [...this.profiles];
  }

  updateProfile(id: string, updates: Partial<UserProfile>): UserProfile {
    const idx = this.profiles.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.profiles[idx] = { ...this.profiles[idx], ...updates, updatedAt: new Date().toISOString() };
      this.persist();
      return this.profiles[idx];
    }
    throw new Error('Profile not found');
  }

  findProfileByPhone(phone: string): UserProfile | undefined {
    const cleanPhone = phone.replace(/\D/g, '');
    return this.profiles.find(p => p.phoneNumber.replace(/\D/g, '').endsWith(cleanPhone.slice(-9)));
  }

  findProfileByTelegramChatId(chatId: number): UserProfile | undefined {
    return this.profiles.find(p => p.telegramChatId === chatId);
  }

  // Wallets
  getWallets(userId?: string): Wallet[] {
    const targetUid = userId || this.getActiveUserId();
    return this.wallets.filter(w => w.userId === targetUid);
  }

  getDefaultWallet(userId?: string): Wallet | undefined {
    const wallets = this.getWallets(userId);
    return wallets.find(w => w.isDefault) || wallets[0];
  }

  addWallet(wallet: Omit<Wallet, 'id' | 'createdAt'>): Wallet {
    const newWallet: Wallet = {
      ...wallet,
      id: `wal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    if (newWallet.isDefault) {
      this.wallets.forEach(w => {
        if (w.userId === newWallet.userId) w.isDefault = false;
      });
    }
    this.wallets.push(newWallet);
    this.persist();
    return newWallet;
  }

  updateWallet(id: string, updates: Partial<Wallet>): Wallet {
    const idx = this.wallets.findIndex(w => w.id === id);
    if (idx !== -1) {
      if (updates.isDefault) {
        const uId = this.wallets[idx].userId;
        this.wallets.forEach(w => {
          if (w.userId === uId) w.isDefault = false;
        });
      }
      this.wallets[idx] = { ...this.wallets[idx], ...updates };
      this.persist();
      return this.wallets[idx];
    }
    throw new Error('Wallet not found');
  }

  deleteWallet(id: string) {
    this.wallets = this.wallets.filter(w => w.id !== id);
    this.persist();
  }

  // Categories
  getCategories(userId?: string): Category[] {
    const targetUid = userId || this.getActiveUserId();
    return this.categories.filter(c => c.userId === targetUid);
  }

  addCategory(category: Omit<Category, 'id' | 'createdAt'>): Category {
    const newCat: Category = {
      ...category,
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    this.categories.push(newCat);
    this.persist();
    return newCat;
  }

  updateCategory(id: string, updates: Partial<Category>): Category {
    const idx = this.categories.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.categories[idx] = { ...this.categories[idx], ...updates };
      this.persist();
      return this.categories[idx];
    }
    throw new Error('Category not found');
  }

  deleteCategory(id: string) {
    this.categories = this.categories.filter(c => c.id !== id);
    this.persist();
  }

  // Budgets
  getBudgets(userId?: string, month?: string): Budget[] {
    const targetUid = userId || this.getActiveUserId();
    const currentMonth = month || new Date().toISOString().substring(0, 7);
    return this.budgets.filter(b => b.userId === targetUid && (!month || b.month === currentMonth));
  }

  setBudget(userId: string, categoryId: string, amount: number, month?: string): Budget {
    const m = month || new Date().toISOString().substring(0, 7);
    const existingIdx = this.budgets.findIndex(b => b.userId === userId && b.categoryId === categoryId && b.month === m);
    if (existingIdx !== -1) {
      this.budgets[existingIdx].amount = amount;
      this.budgets[existingIdx].alert80Sent = false;
      this.budgets[existingIdx].alert100Sent = false;
      this.persist();
      return this.budgets[existingIdx];
    } else {
      const newBudget: Budget = {
        id: `bdg_${Date.now()}`,
        userId,
        categoryId,
        month: m,
        amount,
        alert80Sent: false,
        alert100Sent: false
      };
      this.budgets.push(newBudget);
      this.persist();
      return newBudget;
    }
  }

  // Transactions
  getTransactions(userId?: string): Transaction[] {
    const targetUid = userId || this.getActiveUserId();
    return this.transactions
      .filter(t => t.userId === targetUid)
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  }

  getAllTransactions(): Transaction[] {
    return [...this.transactions];
  }

  addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
    const newTx: Transaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };

    // Update wallet balances
    const wallet = this.wallets.find(w => w.id === newTx.walletId);
    if (wallet) {
      if (newTx.type === 'expense') {
        wallet.balance -= newTx.amount;
      } else if (newTx.type === 'income') {
        wallet.balance += newTx.amount;
      } else if (newTx.type === 'transfer' && newTx.destinationWalletId) {
        wallet.balance -= newTx.amount;
        const destWallet = this.wallets.find(w => w.id === newTx.destinationWalletId);
        if (destWallet) {
          destWallet.balance += newTx.amount;
        }
      }
    }

    this.transactions.unshift(newTx);
    this.persist();
    return newTx;
  }

  deleteTransaction(id: string) {
    const tx = this.transactions.find(t => t.id === id);
    if (tx) {
      // Revert wallet balance
      const wallet = this.wallets.find(w => w.id === tx.walletId);
      if (wallet) {
        if (tx.type === 'expense') wallet.balance += tx.amount;
        else if (tx.type === 'income') wallet.balance -= tx.amount;
        else if (tx.type === 'transfer' && tx.destinationWalletId) {
          wallet.balance += tx.amount;
          const dest = this.wallets.find(w => w.id === tx.destinationWalletId);
          if (dest) dest.balance -= tx.amount;
        }
      }
      this.transactions = this.transactions.filter(t => t.id !== id);
      this.persist();
    }
  }

  // Export History
  getExportHistory(userId?: string): ExportRecord[] {
    const targetUid = userId || this.getActiveUserId();
    return this.exportHistory.filter(e => e.userId === targetUid);
  }

  addExportRecord(record: Omit<ExportRecord, 'id' | 'createdAt'>): ExportRecord {
    const newRecord: ExportRecord = {
      ...record,
      id: `exp_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.exportHistory.unshift(newRecord);
    this.persist();
    return newRecord;
  }

  // Telegram Updates (Idempotency)
  isTelegramUpdateProcessed(updateId: number): boolean {
    return this.telegramUpdates.has(updateId);
  }

  recordTelegramUpdate(update: TelegramUpdate) {
    this.telegramUpdates.set(update.updateId, update);
  }

  // AI Configurations
  getAIConfigs(): AIProviderConfig[] {
    return [...this.aiConfigs];
  }

  updateAIConfig(id: string, updates: Partial<AIProviderConfig>): AIProviderConfig {
    const idx = this.aiConfigs.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.aiConfigs[idx] = { ...this.aiConfigs[idx], ...updates };
      this.persist();
      return this.aiConfigs[idx];
    }
    throw new Error('AI Config not found');
  }

  addAIConfig(config: Omit<AIProviderConfig, 'id' | 'createdAt'>): AIProviderConfig {
    const newConfig: AIProviderConfig = {
      ...config,
      id: `cfg_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.aiConfigs.push(newConfig);
    this.persist();
    return newConfig;
  }

  deleteAIConfig(id: string) {
    this.aiConfigs = this.aiConfigs.filter(c => c.id !== id);
    this.persist();
  }

  // AI Logs
  getAILogs(): AILog[] {
    return [...this.aiLogs];
  }

  addAILog(log: Omit<AILog, 'id' | 'createdAt'>): AILog {
    const newLog: AILog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    this.aiLogs.unshift(newLog);
    this.persist();
    return newLog;
  }

  // Payments
  getPayments(): PaymentRecord[] {
    return [...this.payments];
  }

  updatePaymentStatus(id: string, status: PaymentRecord['status'], adminNotes?: string, adminId?: string): PaymentRecord {
    const idx = this.payments.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.payments[idx].status = status;
      if (adminNotes) this.payments[idx].adminNotes = adminNotes;
      if (adminId) this.payments[idx].approvedBy = adminId;

      // If approved, upgrade target user plan to 'pro'
      if (status === 'approved' || status === 'settled') {
        const uIdx = this.profiles.findIndex(u => u.id === this.payments[idx].userId);
        if (uIdx !== -1) {
          this.profiles[uIdx].plan = 'pro';
        }
      }

      this.persist();
      return this.payments[idx];
    }
    throw new Error('Payment not found');
  }

  addPayment(payment: Omit<PaymentRecord, 'id' | 'createdAt'>): PaymentRecord {
    const newPayment: PaymentRecord = {
      ...payment,
      id: `pay_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.payments.unshift(newPayment);
    this.persist();
    return newPayment;
  }

  // Admin Audit Logs
  getAuditLogs(): AdminAuditLog[] {
    return [...this.auditLogs];
  }

  addAuditLog(log: Omit<AdminAuditLog, 'id' | 'createdAt'>): AdminAuditLog {
    const newAudit: AdminAuditLog = {
      ...log,
      id: `audit_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.auditLogs.unshift(newAudit);
    this.persist();
    return newAudit;
  }

  // Reset demo state
  resetAll() {
    this.profiles = [...INITIAL_PROFILES];
    this.wallets = [...INITIAL_WALLETS];
    this.categories = [...INITIAL_CATEGORIES];
    this.budgets = [...INITIAL_BUDGETS];
    this.transactions = [...INITIAL_TRANSACTIONS];
    this.exportHistory = [...INITIAL_EXPORT_HISTORY];
    this.aiConfigs = [...INITIAL_AI_CONFIGS];
    this.aiLogs = [...INITIAL_AI_LOGS];
    this.payments = [...INITIAL_PAYMENTS];
    this.auditLogs = [...INITIAL_AUDIT_LOGS];
    this.telegramUpdates.clear();
    SEED_TELEGRAM_UPDATES.forEach(u => this.telegramUpdates.set(u.updateId, u));
    this.impersonatingUserId = null;
    this.persist();
  }
}

// Global Singleton Store Instance
const globalForStore = globalThis as unknown as { tatadanaStore: TataDanaStore | undefined };
export const store = globalForStore.tatadanaStore ?? new TataDanaStore();
if (process.env.NODE_ENV !== 'production') globalForStore.tatadanaStore = store;
