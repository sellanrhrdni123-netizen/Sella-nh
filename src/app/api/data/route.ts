import { NextResponse } from 'next/server';
import { store } from '@/lib/storage';

export async function GET() {
  const user = store.getCurrentUser();
  const wallets = store.getWallets(user.id);
  const categories = store.getCategories(user.id);
  const transactions = store.getTransactions(user.id);
  const currentMonth = new Date().toISOString().substring(0, 7);
  const budgets = store.getBudgets(user.id, currentMonth);

  return NextResponse.json({
    user,
    wallets,
    categories,
    budgets,
    transactions: transactions.slice(0, 50),
    totalTransactions: transactions.length,
    timestamp: new Date().toISOString(),
    timezone: 'Asia/Jakarta (WIB)'
  }, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
