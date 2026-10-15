import { Transaction, UserProfile, Wallet, Category, Budget } from './types';
import { formatIDR, formatTelegramWIBTimestamp, generateProgressBar } from './utils';
import { evaluateFinancialAdvisor } from './ai/advisor';

/**
 * Format reply bot untuk Pengeluaran (Part 4.4)
 */
export function formatExpenseReply(
  tx: Transaction,
  wallet: Wallet,
  category: Category | undefined,
  budget: Budget | undefined,
  categoryTotalExpense: number,
  transcript?: string
): string {
  const timestamp = formatTelegramWIBTimestamp(tx.transactionDate);
  const catEmoji = category ? category.emoji : '💸';
  const catName = category ? category.name : 'Pengeluaran';

  let reply = '';
  if (transcript) {
    reply += `🎙️ Transkrip: "${transcript}"\n\n`;
  }

  reply += `📅 ${timestamp}\n`;
  reply += `💸 Pengeluaran tercatat!\n`;
  reply += `├ Nominal : ${formatIDR(tx.amount)}\n`;
  reply += `├ Kategori : ${catEmoji} ${catName}\n`;
  reply += `├ Dompet : 👛 ${wallet.name}\n`;
  reply += `├ Catatan : ${tx.description}\n`;
  reply += `└ Saldo : ${formatIDR(wallet.balance)}\n`;

  // Budget section
  if (budget && budget.amount > 0) {
    const percentage = Math.min(100, Math.round((categoryTotalExpense / budget.amount) * 100));
    const remaining = Math.max(0, budget.amount - categoryTotalExpense);
    const progressBar = generateProgressBar(percentage, 10);

    reply += `\n📊 Budget ${catName} bulan ini:\n`;
    reply += `[${progressBar}] ${percentage}% — sisa ${formatIDR(remaining)}\n`;

    if (percentage >= 100) {
      reply += `🚨 Peringatan: Budget kategori ini sudah habis! Rem dulu ya.\n`;
    } else if (percentage >= 80) {
      reply += `⚠️ Perhatian: Budget sudah terpakai 80%+. Lebih hemat ya!\n`;
    } else {
      reply += `✨ Pengeluaran masih aman dalam batas budget bulanan.\n`;
    }
  }

  return reply;
}

/**
 * Format reply bot untuk Pemasukan (Part 4.5)
 */
export function formatIncomeReply(
  tx: Transaction,
  wallet: Wallet,
  category: Category | undefined,
  transcript?: string
): string {
  const timestamp = formatTelegramWIBTimestamp(tx.transactionDate);
  const catEmoji = category ? category.emoji : '💰';
  const catName = category ? category.name : 'Pemasukan';

  let reply = '';
  if (transcript) {
    reply += `🎙️ Transkrip: "${transcript}"\n\n`;
  }

  reply += `📅 ${timestamp}\n`;
  reply += `💰 Pemasukan tercatat!\n`;
  reply += `├ Nominal : ${formatIDR(tx.amount)}\n`;
  reply += `├ Kategori : ${catEmoji} ${catName}\n`;
  reply += `├ Dompet : 👛 ${wallet.name}\n`;
  reply += `└ Saldo baru : ${formatIDR(wallet.balance)}\n\n`;
  reply += `💪 Semangat terus! Jangan lupa sisihkan untuk tabungan ya.`;

  return reply;
}

/**
 * Format reply bot untuk Transfer antar wallet
 */
export function formatTransferReply(
  tx: Transaction,
  fromWallet: Wallet,
  toWallet: Wallet
): string {
  const timestamp = formatTelegramWIBTimestamp(tx.transactionDate);
  return (
    `📅 ${timestamp}\n` +
    `🔁 Transfer antar dompet berhasil!\n` +
    `├ Nominal : ${formatIDR(tx.amount)}\n` +
    `├ Dari : 👛 ${fromWallet.name} (${formatIDR(fromWallet.balance)})\n` +
    `├ Ke : 👛 ${toWallet.name} (${formatIDR(toWallet.balance)})\n` +
    `└ Catatan : ${tx.description}`
  );
}

/**
 * Format Daily Reminder (Part 4.8)
 */
export function formatDailyReminder(): string {
  return (
    `⏰ *Reminder Keuangan TataDana!*\n\n` +
    `Jangan lupa catat pengeluaran hari ini ya 📝\n` +
    `Pencatatan rutin = keuangan lebih terkontrol 💪\n\n` +
    `Ketik transaksimu sekarang (contoh: *beli bakso 15rb*)!`
  );
}

/**
 * Handle Telegram bot slash commands (Part 4.6)
 */
export function handleBotCommand(
  command: string,
  user: UserProfile,
  wallets: Wallet[],
  transactions: Transaction[],
  categories: Category[],
  budgets: Budget[]
): string {
  const cleanCmd = command.trim().toLowerCase().replace(/@\w+/g, '').replace(/\s+/g, ' ');

  switch (cleanCmd) {
    case '/saldo': {
      const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);
      let res = `👛 *Daftar Saldo Dompet TataDana*\n\n`;
      wallets.forEach(w => {
        const star = w.isDefault ? ' ⭐ (Default)' : '';
        res += `• ${w.name}: *${formatIDR(w.balance)}*${star}\n`;
      });
      res += `\n━━━━━━━━━━━━━━━\n💰 *Total Seluruh Saldo:* *${formatIDR(totalBalance)}*`;
      return res;
    }

    case '/hari':
    case '/hari_ini':
    case '/hari ini': {
      // Calculate today's date in Asia/Jakarta (WIB, UTC+7) timezone
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const wibNow = new Date(utc + (3600000 * 7));
      const todayYear = wibNow.getFullYear();
      const todayMonth = String(wibNow.getMonth() + 1).padStart(2, '0');
      const todayDay = String(wibNow.getDate()).padStart(2, '0');
      const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;

      const getTxWIBDate = (txDate: string) => {
        try {
          const d = new Date(txDate);
          const u = d.getTime() + (d.getTimezoneOffset() * 60000);
          const w = new Date(u + (3600000 * 7));
          return `${w.getFullYear()}-${String(w.getMonth() + 1).padStart(2, '0')}-${String(w.getDate()).padStart(2, '0')}`;
        } catch {
          return txDate.substring(0, 10);
        }
      };

      const todayTx = transactions.filter(t => t.userId === user.id && (getTxWIBDate(t.transactionDate) === todayStr || t.transactionDate.startsWith(todayStr)));
      const totalIn = todayTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const totalOut = todayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

      let res = `📅 *Rekap Transaksi Hari Ini*\n(${formatTelegramWIBTimestamp()})\n\n`;
      res += `💰 Pemasukan : ${formatIDR(totalIn)}\n`;
      res += `💸 Pengeluaran: ${formatIDR(totalOut)}\n`;
      res += `⚖️ Net Cashflow: ${formatIDR(totalIn - totalOut)}\n\n`;

      if (todayTx.length === 0) {
        res += `_Belum ada transaksi tercatat hari ini. Yuk ketik transaksimu!_`;
      } else {
        res += `*Detail Transaksi:*\n`;
        todayTx.forEach((t, i) => {
          const sign = t.type === 'income' ? '🟢 +' : '🔴 -';
          res += `${i + 1}. ${sign} ${formatIDR(t.amount)} — ${t.description}\n`;
        });
      }
      return res;
    }

    case '/minggu':
    case '/minggu_ini':
    case '/minggu ini': {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const weekTx = transactions.filter(t => t.userId === user.id && new Date(t.transactionDate) >= sevenDaysAgo);
      const totalIn = weekTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const totalOut = weekTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

      let res = `📊 *Rekap 7 Hari Terakhir*\n\n`;
      res += `💰 Total Masuk : ${formatIDR(totalIn)}\n`;
      res += `💸 Total Keluar : ${formatIDR(totalOut)}\n`;
      res += `⚖️ Selisih     : ${formatIDR(totalIn - totalOut)}\n`;
      res += `📝 Jumlah Transaksi: ${weekTx.length}\n`;
      return res;
    }

    case '/bulan':
    case '/bulan_ini':
    case '/bulan ini': {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const wibNow = new Date(utc + (3600000 * 7));
      const currentMonth = `${wibNow.getFullYear()}-${String(wibNow.getMonth() + 1).padStart(2, '0')}`;
      const monthTx = transactions.filter(t => t.userId === user.id && t.transactionDate.startsWith(currentMonth));
      const totalIn = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const totalOut = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

      let res = `📈 *Rekap Keuangan Bulan Ini (${currentMonth})*\n\n`;
      res += `💰 Total Pemasukan : ${formatIDR(totalIn)}\n`;
      res += `💸 Total Pengeluaran: ${formatIDR(totalOut)}\n`;
      res += `⚖️ Net Cashflow    : ${formatIDR(totalIn - totalOut)}\n\n`;
      res += `*Top Pengeluaran per Kategori:*\n`;

      // Group by category
      const catTotals: { [key: string]: number } = {};
      monthTx.filter(t => t.type === 'expense').forEach(t => {
        const cat = categories.find(c => c.id === t.categoryId);
        const name = cat ? `${cat.emoji} ${cat.name}` : 'Lain-lain';
        catTotals[name] = (catTotals[name] || 0) + t.amount;
      });

      const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 5);
      if (sorted.length === 0) {
        res += `_Belum ada pengeluaran bulan ini._\n`;
      } else {
        sorted.forEach(([cat, val], idx) => {
          res += `${idx + 1}. ${cat}: ${formatIDR(val)}\n`;
        });
      }

      return res;
    }

    case '/budget': {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const wibNow = new Date(utc + (3600000 * 7));
      const currentMonth = `${wibNow.getFullYear()}-${String(wibNow.getMonth() + 1).padStart(2, '0')}`;
      const monthBudgets = budgets.filter(b => b.userId === user.id && b.month === currentMonth);
      const monthTx = transactions.filter(t => t.userId === user.id && t.transactionDate.startsWith(currentMonth) && t.type === 'expense');

      let res = `🎯 *Status Budget Bulan Ini*\n\n`;
      if (monthBudgets.length === 0) {
        res += `_Belum ada budget yang diatur. Silakan atur budget di web TataDana._`;
      } else {
        monthBudgets.forEach(b => {
          const cat = categories.find(c => c.id === b.categoryId);
          const catName = cat ? `${cat.emoji} ${cat.name}` : 'Kategori';
          const used = monthTx.filter(t => t.categoryId === b.categoryId).reduce((s, t) => s + t.amount, 0);
          const pct = Math.min(100, Math.round((used / b.amount) * 100));
          const bar = generateProgressBar(pct, 8);
          const remaining = Math.max(0, b.amount - used);

          res += `${catName}\n`;
          res += `[${bar}] ${pct}% | Sisa: ${formatIDR(remaining)} / ${formatIDR(b.amount)}\n\n`;
        });
      }
      return res;
    }

    case '/sheet': {
      return (
        `📑 *Akses Data Transaksi TataDana*\n\n` +
        `Data kamu tersinkronisasi 100% secara real-time di Supabase Database dan dapat di-export langsung ke PDF & Excel kapan saja lewat Dashboard Web TataDana:\n\n` +
        `🔗 *Buka Dashboard Laporan:* https://tatadana.id/dashboard/laporan\n\n` +
        `_Untuk pengguna Pro, file export PDF & Excel dapat diunduh tanpa batasan!_`
      );
    }

    case '/bantuan':
    case '/start':
    default: {
      return (
        `✨ *Selamat Datang di TataDana Bot!* ✨\n` +
        `_Catat keuangan semudah chat langsung dari Telegram kamu_\n\n` +
        `📝 *Cara Mencatat Transaksi:*\n` +
        `Cukup ketik kalimat santai, AI kami otomatis mencatatnya:\n` +
        `• "beli bakso 15rb"\n` +
        `• "kopi susu 22k gopay"\n` +
        `• "isi bensin pertamax 50rb"\n` +
        `• "gajian 7.5jt"\n` +
        `• Atau kirim *Voice Note* (VN) / *Foto Struk* 📸\n\n` +
        `⚡ *Daftar Perintah Cepat:*\n` +
        `• /saldo — Cek saldo semua dompet\n` +
        `• /hari ini — Rekap transaksi hari ini\n` +
        `• /minggu ini — Rekap 7 hari terakhir\n` +
        `• /bulan ini — Rekap bulan berjalan & top kategori\n` +
        `• /budget — Status budget & progress bar\n` +
        `• /sheet — Link laporan keuangan dashboard\n` +
        `• /bantuan — Tampilkan pesan panduan ini`
      );
    }
  }
}
