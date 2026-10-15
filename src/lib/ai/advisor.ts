import { Transaction, Budget, UserProfile } from '../types';
import { formatIDR } from '../utils';

export interface AdvisorAlert {
  triggered: boolean;
  message?: string;
  triggerType?: 'spike_category' | 'high_ratio' | 'single_big_expense';
}

/**
 * Evaluates whether an automated AI Financial Advisor message should trigger for Pro users
 */
export function evaluateFinancialAdvisor(
  user: UserProfile,
  newTx: Transaction,
  allTransactions: Transaction[],
  budgets: Budget[]
): AdvisorAlert {
  // Only available on Pro plan
  if (user.plan !== 'pro') {
    return { triggered: false };
  }

  // Only triggers on expenses
  if (newTx.type !== 'expense') {
    return { triggered: false };
  }

  const currentMonth = newTx.transactionDate.substring(0, 7);
  const monthTransactions = allTransactions.filter(
    t => t.userId === user.id && t.transactionDate.startsWith(currentMonth)
  );

  // 1. Trigger: Single large expense (>20% of category budget in one go)
  const categoryBudget = budgets.find(b => b.categoryId === newTx.categoryId && b.month === currentMonth);
  if (categoryBudget && categoryBudget.amount > 0) {
    const expenseRatio = newTx.amount / categoryBudget.amount;
    if (expenseRatio >= 0.20) {
      const pct = Math.round(expenseRatio * 100);
      return {
        triggered: true,
        triggerType: 'single_big_expense',
        message: `🤖 *Financial Advisor*\nHei ${user.fullName.split(' ')[0]}! Transaksi ${newTx.description} (${formatIDR(newTx.amount)}) menghabiskan ${pct}% dari seluruh budget kategori ini dalam satu kali bayar.\n\n💡 *Saran:* Pertimbangkan untuk membatasi pengeluaran non-primer di sisa bulan ini agar tidak defisit sebelum tanggal gajian!`
      };
    }
  }

  // 2. Trigger: Total expense > 80% of total income this month
  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0) + newTx.amount;

  if (totalIncome > 0) {
    const ratio = totalExpense / totalIncome;
    if (ratio >= 0.80) {
      const pct = Math.round(ratio * 100);
      return {
        triggered: true,
        triggerType: 'high_ratio',
        message: `🤖 *Financial Advisor*\nHei ${user.fullName.split(' ')[0]}! Total pengeluaranmu bulan ini sudah mencapai ${pct}% dari total pemasukan (${formatIDR(totalExpense)} dari ${formatIDR(totalIncome)}).\n\n💡 *Saran:* Sisihkan sisa dana untuk kebutuhan darurat, dan tahan pengeluaran impulsif sampai akhir bulan.`
      };
    }
  }

  // 3. Trigger: Category spending spike > 50% vs last 7 days
  const now = new Date(newTx.transactionDate).getTime();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;

  const thisWeekCategoryExpense = allTransactions
    .filter(t => t.userId === user.id && t.categoryId === newTx.categoryId && t.type === 'expense' && new Date(t.transactionDate).getTime() >= sevenDaysAgo)
    .reduce((sum, t) => sum + t.amount, 0) + newTx.amount;

  const lastWeekCategoryExpense = allTransactions
    .filter(t => t.userId === user.id && t.categoryId === newTx.categoryId && t.type === 'expense' && new Date(t.transactionDate).getTime() >= fourteenDaysAgo && new Date(t.transactionDate).getTime() < sevenDaysAgo)
    .reduce((sum, t) => sum + t.amount, 0);

  if (lastWeekCategoryExpense > 0 && thisWeekCategoryExpense >= lastWeekCategoryExpense * 1.5) {
    return {
      triggered: true,
      triggerType: 'spike_category',
      message: `🤖 *Financial Advisor*\nHei ${user.fullName.split(' ')[0]}! Pengeluaran pada kategori ini naik lebih dari 50% dibanding minggu lalu (${formatIDR(thisWeekCategoryExpense)} vs ${formatIDR(lastWeekCategoryExpense)}).\n\n💡 *Saran:* Coba evaluasi kebiasaan nongkrong atau belanja mingguanmu agar cashflow tetap positif!`
    };
  }

  return { triggered: false };
}
