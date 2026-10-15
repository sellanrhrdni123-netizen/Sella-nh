// ==============================================================================
// TATADANA DUAL-STORAGE FACADE SERVICE
// Routes queries to Supabase when configured, or transparently falls back to
// TataDanaStore (in-memory / localStorage) during development and testing.
// ==============================================================================

import { isSupabaseConfigured } from './config';
import { getAdminClient } from './admin';
import { getBrowserClient } from './client';
import { store } from '@/lib/storage';
import type {
  Wallet,
  Category,
  Budget,
  Transaction,
  ExportRecord,
  AIProviderConfig,
  AILog,
} from '@/lib/types';
import {
  mapWalletFromDb,
  mapWalletToDb,
  mapCategoryFromDb,
  mapTransactionFromDb,
  mapTransactionToDb,
  mapBudgetFromDb,
} from './mappers';

export class DualStorageService {
  private getClient() {
    if (typeof window === 'undefined') {
      return getAdminClient();
    }
    return getBrowserClient();
  }

  // ======================== WALLETS ========================
  async getWallets(userId: string): Promise<Wallet[]> {
    if (!isSupabaseConfigured()) {
      return store.getWallets(userId);
    }

    const client = this.getClient();
    if (!client) return store.getWallets(userId);

    try {
      const { data, error } = await client
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });

      if (error || !data || data.length === 0) {
        return store.getWallets(userId);
      }

      return data.map(mapWalletFromDb);
    } catch {
      return store.getWallets(userId);
    }
  }

  async addWallet(wallet: Wallet): Promise<Wallet> {
    if (!isSupabaseConfigured()) {
      return store.addWallet(wallet);
    }

    const client = this.getClient();
    if (!client) return store.addWallet(wallet);

    try {
      const row = mapWalletToDb(wallet);
      const { data, error } = await client.from('wallets').insert(row).select().single();

      if (error || !data) {
        console.warn('Failed to insert wallet into Supabase, fallback to store:', error?.message);
        return store.addWallet(wallet);
      }

      return mapWalletFromDb(data);
    } catch {
      return store.addWallet(wallet);
    }
  }

  // ======================== CATEGORIES ========================
  async getCategories(userId: string): Promise<Category[]> {
    if (!isSupabaseConfigured()) {
      return store.getCategories(userId);
    }

    const client = this.getClient();
    if (!client) return store.getCategories(userId);

    try {
      const { data, error } = await client
        .from('categories')
        .select('*')
        .or(`user_id.eq.${userId},user_id.is.null`);

      if (error || !data || data.length === 0) {
        return store.getCategories(userId);
      }

      return data.map(mapCategoryFromDb);
    } catch {
      return store.getCategories(userId);
    }
  }

  // ======================== TRANSACTIONS ========================
  async getTransactions(userId: string): Promise<Transaction[]> {
    if (!isSupabaseConfigured()) {
      return store.getTransactions(userId);
    }

    const client = this.getClient();
    if (!client) return store.getTransactions(userId);

    try {
      const { data, error } = await client
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false });

      if (error || !data || data.length === 0) {
        return store.getTransactions(userId);
      }

      return data.map(mapTransactionFromDb);
    } catch {
      return store.getTransactions(userId);
    }
  }

  async addTransaction(tx: Transaction): Promise<Transaction> {
    if (!isSupabaseConfigured()) {
      return store.addTransaction(tx);
    }

    const client = this.getClient();
    if (!client) return store.addTransaction(tx);

    try {
      const row = mapTransactionToDb(tx);
      const { data, error } = await client.from('transactions').insert(row).select().single();

      if (error || !data) {
        console.warn('Failed to insert transaction into Supabase, fallback to store:', error?.message);
        return store.addTransaction(tx);
      }

      // If multi-item receipt, persist child rows to transaction_items
      if (tx.receiptItems && tx.receiptItems.length > 0) {
        const itemsToInsert = tx.receiptItems.map(item => ({
          transaction_id: data.id,
          item_name: item.name,
          price: item.price,
          quantity: 1,
        }));
        await client.from('transaction_items').insert(itemsToInsert);
      }

      // Adjust wallet balances
      if (tx.type === 'expense') {
        await this.adjustWalletBalance(tx.walletId, -tx.amount);
      } else if (tx.type === 'income') {
        await this.adjustWalletBalance(tx.walletId, tx.amount);
      } else if (tx.type === 'transfer' && tx.destinationWalletId) {
        await this.adjustWalletBalance(tx.walletId, -tx.amount);
        await this.adjustWalletBalance(tx.destinationWalletId, tx.amount);
      }

      return mapTransactionFromDb(data);
    } catch {
      return store.addTransaction(tx);
    }
  }

  private async adjustWalletBalance(walletId: string, delta: number): Promise<void> {
    const client = this.getClient();
    if (!client) return;

    try {
      const { data: wallet } = await client.from('wallets').select('balance').eq('id', walletId).single();
      if (wallet) {
        const newBalance = Number(wallet.balance) + delta;
        await client.from('wallets').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', walletId);
      }
    } catch {
      // Non-blocking catch
    }
  }

  // ======================== BUDGETS ========================
  async getBudgets(userId: string, monthStr: string): Promise<Budget[]> {
    if (!isSupabaseConfigured()) {
      return store.getBudgets(userId, monthStr);
    }

    const client = this.getClient();
    if (!client) return store.getBudgets(userId, monthStr);

    try {
      const parts = monthStr.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);

      const { data, error } = await client
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('period_year', year)
        .eq('period_month', month);

      if (error || !data || data.length === 0) {
        return store.getBudgets(userId, monthStr);
      }

      return data.map(mapBudgetFromDb);
    } catch {
      return store.getBudgets(userId, monthStr);
    }
  }

  // ======================== TELEGRAM IDEMPOTENCY ========================
  async isTelegramUpdateProcessed(updateId: number): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return store.isTelegramUpdateProcessed(updateId);
    }

    const client = this.getClient();
    if (!client) return store.isTelegramUpdateProcessed(updateId);

    try {
      const { data } = await client
        .from('telegram_updates')
        .select('update_id')
        .eq('update_id', updateId)
        .single();

      return Boolean(data);
    } catch {
      return store.isTelegramUpdateProcessed(updateId);
    }
  }

  async recordTelegramUpdate(record: {
    updateId: number;
    userId?: string;
    chatId?: number;
    messageText?: string;
    status: string;
  }): Promise<void> {
    if (!isSupabaseConfigured()) {
      store.recordTelegramUpdate({
        updateId: record.updateId,
        userId: record.userId,
        chatId: record.chatId,
        messageText: record.messageText,
        status: record.status as any,
        createdAt: new Date().toISOString(),
      });
      return;
    }

    const client = this.getClient();
    if (!client) return;

    try {
      await client.from('telegram_updates').insert({
        update_id: record.updateId,
        user_id: record.userId || null,
        chat_id: record.chatId || null,
        message_text: record.messageText || null,
        status: record.status,
        processed_at: new Date().toISOString(),
      });
    } catch (err: any) {
      console.warn('Failed to record telegram update into Supabase:', err?.message);
    }
  }
}

export const dualStorage = new DualStorageService();
