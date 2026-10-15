/**
 * Comprehensive User Dashboard Views for TataDana
 * Includes: Beranda, Transaksi (Accordion Struk), Laporan (Export PDF/Excel),
 * Budget (80%/100% Alerts), Wallet, AI Chat (Tugas 4), Settings (Tugas 6), and Upgrade Checkout (Tugas 5).
 */

const { store, formatIDR, generateProgressBar, formatWibDate } = require('../store');
const { getHtmlHeader, renderGlobalHubNav, renderUserSidebar, renderViewAsBanner } = require('./components');

function getActiveUser(req, sessionUser, query) {
  if (!sessionUser) {
    return { activeUser: store.users[0], isViewAsMode: false };
  }
  const isViewAsMode = sessionUser.role === 'admin' && Boolean(query && query.viewAs);
  let activeUser = sessionUser;
  if (isViewAsMode) {
    const qVal = String(query.viewAs || '').trim();
    const foundTarget = store.users.find(u => u.id === qVal || u.email.toLowerCase() === qVal.toLowerCase());
    if (foundTarget) {
      activeUser = foundTarget;
    }
  }
  return { activeUser, isViewAsMode };
}

// ==============================================================================
// 1. BERANDA OVERVIEW (/dashboard)
// ==============================================================================

function renderDashboardOverview(req, res, sessionUser, query = {}) {
  const { activeUser, isViewAsMode } = getActiveUser(req, sessionUser, query);
  const isAdmin = sessionUser && sessionUser.role === 'admin';
  const activeDashboardTab = (isAdmin && query && (query.tab === 'admin' || query.view === 'admin')) ? 'admin' : 'personal';

  // Jika admin memilih tab Admin, render tampilan Panel Admin di dalam satu dashboard terpadu
  if (activeDashboardTab === 'admin') {
    const { renderAdminDashboard } = require('./admin');
    return renderAdminDashboard(req, res, sessionUser);
  }

  const userWallets = store.wallets.filter(w => w.userId === activeUser.id);
  const userTransactions = store.transactions.filter(t => t.userId === activeUser.id);
  const userBudgets = store.budgets.filter(b => b.userId === activeUser.id);

  const totalBalance = userWallets.reduce((s, w) => s + w.balance, 0);
  const totalIncome = userTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = userTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const hasTransactions = userTransactions.length > 0;
  const totalBudget = hasTransactions ? userBudgets.reduce((s, b) => s + b.amount, 0) : 0;
  const remainingBudget = hasTransactions ? Math.max(0, totalBudget - totalExpense) : 0;

  const html = `
    ${getHtmlHeader(`TataDana — Dashboard (${activeUser.fullName})`)}
    ${renderGlobalHubNav('/dashboard', sessionUser)}
    ${isViewAsMode ? renderViewAsBanner(activeUser) : ''}

    <div style="display: flex; min-height: calc(100vh - 54px);">
      ${renderUserSidebar('/dashboard', activeUser, isViewAsMode, activeDashboardTab)}

      <main style="flex: 1; padding: 28px; max-width: 1200px; margin: 0 auto; width: 100%;">
        ${query && query.notice === 'access_denied' ? `
          <div style="background: #FEF2F2; border: 2px solid #EF4444; color: #991B1B; padding: 16px 20px; border-radius: 14px; margin-bottom: 20px; display: flex; align-items: center; gap: 14px; box-shadow: 0 4px 14px rgba(239,68,68,0.15);">
            <span style="font-size: 26px;">🚫</span>
            <div>
              <div style="font-size: 15px; font-weight: 900; color: #991B1B;">Akses Panel Admin Ditolak</div>
              <div style="font-size: 12px; color: #7F1D1D; font-weight: 500; margin-top: 2px;">
                Akun Anda berstatus Pengguna (User). Anda hanya berwenang mengakses Dashboard Pengguna dan tidak memiliki izin membuka Dashboard Administrator.
              </div>
            </div>
          </div>
        ` : ''}

        ${query && query.notice === 'welcome_approved' ? `
          <div style="background: #F0FDF4; border: 2px solid #22C55E; color: #15803D; padding: 16px 20px; border-radius: 14px; margin-bottom: 20px; display: flex; align-items: center; gap: 14px; box-shadow: 0 4px 14px rgba(34,197,94,0.15);">
            <span style="font-size: 26px;">🎉</span>
            <div>
              <div style="font-size: 15px; font-weight: 900; color: #15803D;">Akun Anda Telah Resmi Disetujui & Terverifikasi!</div>
              <div style="font-size: 12px; color: #166534; font-weight: 500; margin-top: 2px;">
                Selamat datang di TataDana! Akun Anda aktif dengan saldo awal Rp 0. Anda sekarang dapat mencatat pengeluaran, mengelola dompet, dan konsultasi AI.
              </div>
            </div>
          </div>
        ` : ''}

        ${isAdmin && !isViewAsMode ? `
          <!-- ADMIN NOTICE DI TAMPILAN KEUANGAN PRIBADI -->
          <div style="background: #0F172A; color: white; border-radius: 14px; padding: 12px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; border: 1px solid #334155;">
            <div style="display: flex; align-items: center; gap: 8px; font-size: 13px;">
              <span style="font-size: 16px;">👑</span>
              <span>Anda masuk sebagai <b>Administrator</b> (${sessionUser.email}). Kelola pendaftaran dan persetujuan pengguna di panel admin.</span>
            </div>
            <a href="/admin" class="btn-primary btn-sm" style="font-size: 12px; padding: 6px 14px; background: #EA580C; text-decoration: none;">
              👑 Buka Dashboard Admin & Persetujuan &rarr;
            </a>
          </div>
        ` : ''}

        <!-- Header & Quick Actions -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 14px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 4px;">
              <h1 style="font-size: 26px; font-weight: 900; color: #0F172A;">
                Halo, ${activeUser.fullName} 👋
              </h1>
              <span class="badge ${activeUser.plan === 'pro' ? 'badge-green' : 'badge-amber'}" style="font-size: 11px; font-weight: 800;">
                ${activeUser.plan ? activeUser.plan.toUpperCase() : 'STARTER'} ${activeUser.plan === 'pro' ? '⭐' : ''}
              </span>
            </div>
            <p style="font-size: 13px; color: #64748B;">
              Email: <b style="color: #0F172A;">${activeUser.email}</b> • Ringkasan kondisi keuangan terkini • Diperbarui otomatis dari Telegram Bot
            </p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button onclick="openTxModal()" class="btn-primary" style="padding: 10px 18px; font-size: 13px;">
              + Catat Transaksi
            </button>
            <a href="/dashboard/reports${isViewAsMode ? '?viewAs=' + activeUser.id : ''}" class="btn-outline" style="font-size: 13px;">
              📊 Lihat Laporan
            </a>
          </div>
        </div>

        ${activeUser.plan === 'starter' ? `
          <div style="background: #FFF7ED; border: 1px solid #FFEDD5; border-radius: 12px; padding: 12px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #9A3412;">
              <span>🌱</span>
              <span>Anda menggunakan <b>Paket Starter</b> (Rp49.000/bln). Ingin membuka fitur Foto Struk AI OCR dan AI Financial Chat tanpa batas?</span>
            </div>
            <a href="/dashboard/upgrade${isViewAsMode ? '?viewAs=' + activeUser.id : ''}" class="btn-primary btn-sm" style="font-size: 11px; padding: 6px 14px; text-decoration: none;">
              ⭐ Upgrade ke Pro (Rp99.000 Sekali Bayar)
            </a>
          </div>
        ` : `
          <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 10px 18px; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">⭐</span>
            <span style="font-size: 12px; color: #166534; font-weight: 700;">
              Member <b>Pro Lifetime</b> Aktif • Seluruh fitur kecerdasan finansial, multi-dompet, dan ekspor terbuka penuh.
            </span>
          </div>
        `}

        <!-- 4 Stats Cards (Part 3) -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 18px; margin-bottom: 24px;">
          <div class="card" style="border-top: 4px solid #3B82F6;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 12px; font-weight: 800; color: #64748B;">TOTAL SALDO</span>
              <span>👛</span>
            </div>
            <div style="font-size: 24px; font-weight: 900; color: #0F172A;">${formatIDR(totalBalance)}</div>
            <div style="font-size: 11px; color: #64748B; margin-top: 4px;">Dari ${userWallets.length} dompet aktif</div>
          </div>

          <div class="card" style="border-top: 4px solid #10B981;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 12px; font-weight: 800; color: #64748B;">PEMASUKAN BULAN INI</span>
              <span>📈</span>
            </div>
            <div style="font-size: 24px; font-weight: 900; color: #10B981;">+${formatIDR(totalIncome)}</div>
            <div style="font-size: 11px; color: #64748B; margin-top: 4px;">Arus kas masuk</div>
          </div>

          <div class="card" style="border-top: 4px solid #EF4444;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 12px; font-weight: 800; color: #64748B;">PENGELUARAN BULAN INI</span>
              <span>📉</span>
            </div>
            <div style="font-size: 24px; font-weight: 900; color: #EF4444;">-${formatIDR(totalExpense)}</div>
            <div style="font-size: 11px; color: #64748B; margin-top: 4px;">Total belanja & tagihan</div>
          </div>

          <div class="card" style="border-top: 4px solid #F97316;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 12px; font-weight: 800; color: #64748B;">SISA BUDGET BULANAN</span>
              <span>🎯</span>
            </div>
            <div style="font-size: 24px; font-weight: 900; color: #F97316;">${formatIDR(remainingBudget)}</div>
            <div style="font-size: 11px; color: #64748B; margin-top: 4px;">Dari total budget ${formatIDR(totalBudget)}</div>
          </div>
        </div>

        <!-- Onboarding Checklist (Empty State / New User Guide) -->
        <div style="background: linear-gradient(135deg, #FFF7ED, #FFEDD5); border: 1px solid #FDBA74; border-radius: 18px; padding: 20px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
            <div style="font-weight: 900; font-size: 14px; color: #9A3412;">🚀 Checklist Persiapan TataDana:</div>
            <span class="badge badge-green" style="font-size: 11px;">2 dari 3 Selesai</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
            <div style="background: white; padding: 12px; border-radius: 12px; border: 1px solid #FED7AA; display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 18px; color: #16A34A;">✓</span>
              <div>
                <div style="font-weight: 800; font-size: 12px;">1. Buat Dompet Utama</div>
                <div style="font-size: 10px; color: #64748B;">${userWallets.length} dompet tersimpan</div>
              </div>
            </div>
            <div style="background: white; padding: 12px; border-radius: 12px; border: 1px solid #FED7AA; display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 18px; color: #16A34A;">✓</span>
              <div>
                <div style="font-weight: 800; font-size: 12px;">2. Atur Target Budget</div>
                <div style="font-size: 10px; color: #64748B;">${userBudgets.length} kategori budget</div>
              </div>
            </div>
            <div style="background: white; padding: 12px; border-radius: 12px; border: 1px solid #FED7AA; display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 18px; color: ${activeUser.telegramConnected ? '#16A34A' : '#F97316'};">${activeUser.telegramConnected ? '✓' : '○'}</span>
              <div>
                <div style="font-weight: 800; font-size: 12px;">3. Hubungkan Telegram</div>
                <div style="font-size: 10px; color: #64748B;">${activeUser.telegramConnected ? 'Terhubung (@' + activeUser.telegramUsername + ')' : '<a href="/dashboard/settings" style="color: #F97316; font-weight: 700;">Hubungkan sekarang &rarr;</a>'}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts & 10 Recent Transactions -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;" class="sidebar-responsive">
          <!-- 6-Month Income vs Expense Bar Chart -->
          <div class="card">
            <h3 style="font-size: 15px; font-weight: 900; color: #0F172A; margin-bottom: 14px;">
              📊 Perbandingan Pemasukan vs Pengeluaran (6 Bulan Terakhir)
            </h3>
            <svg viewBox="0 0 400 160" style="width: 100%; height: auto; overflow: visible;">
              <line x1="40" y1="20" x2="380" y2="20" stroke="#F1F5F9" stroke-dasharray="4"/>
              <line x1="40" y1="70" x2="380" y2="70" stroke="#F1F5F9" stroke-dasharray="4"/>
              <line x1="40" y1="120" x2="380" y2="120" stroke="#E2E8F0"/>
              
              <!-- May -->
              <rect x="60" y="40" width="16" height="80" fill="#10B981" rx="4"/>
              <rect x="80" y="75" width="16" height="45" fill="#EF4444" rx="4"/>
              <text x="78" y="140" font-size="10" fill="#64748B" text-anchor="middle">Mei</text>

              <!-- Jun -->
              <rect x="115" y="30" width="16" height="90" fill="#10B981" rx="4"/>
              <rect x="135" y="70" width="16" height="50" fill="#EF4444" rx="4"/>
              <text x="133" y="140" font-size="10" fill="#64748B" text-anchor="middle">Jun</text>

              <!-- Jul -->
              <rect x="170" y="35" width="16" height="85" fill="#10B981" rx="4"/>
              <rect x="190" y="65" width="16" height="55" fill="#EF4444" rx="4"/>
              <text x="188" y="140" font-size="10" fill="#64748B" text-anchor="middle">Jul</text>

              <!-- Agu -->
              <rect x="225" y="45" width="16" height="75" fill="#10B981" rx="4"/>
              <rect x="245" y="60" width="16" height="60" fill="#EF4444" rx="4"/>
              <text x="243" y="140" font-size="10" fill="#64748B" text-anchor="middle">Agu</text>

              <!-- Sep -->
              <rect x="280" y="25" width="16" height="95" fill="#10B981" rx="4"/>
              <rect x="300" y="55" width="16" height="65" fill="#EF4444" rx="4"/>
              <text x="298" y="140" font-size="10" fill="#64748B" text-anchor="middle">Sep</text>

              <!-- Okt -->
              <rect x="335" y="20" width="16" height="100" fill="#10B981" rx="4"/>
              <rect x="355" y="60" width="16" height="60" fill="#EF4444" rx="4"/>
              <text x="353" y="140" font-size="10" fill="#F97316" font-weight="bold" text-anchor="middle">Okt</text>
            </svg>
            <div style="display: flex; justify-content: center; gap: 16px; margin-top: 10px; font-size: 11px;">
              <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 10px; height: 10px; background: #10B981; border-radius: 2px;"></span> Pemasukan</span>
              <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 10px; height: 10px; background: #EF4444; border-radius: 2px;"></span> Pengeluaran</span>
            </div>
          </div>

          <!-- Category Spending Donut/Pie -->
          <div class="card">
            <h3 style="font-size: 15px; font-weight: 900; color: #0F172A; margin-bottom: 14px;">
              🎯 Distribusi Pengeluaran per Kategori
            </h3>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${userBudgets.slice(0, 4).map(b => {
                const pct = Math.min(100, Math.round((b.spent / b.amount) * 100));
                return `
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; margin-bottom: 4px;">
                      <span>${b.emoji} ${b.name}</span>
                      <span>${formatIDR(b.spent)} (${pct}%)</span>
                    </div>
                    <div style="height: 8px; border-radius: 999px; background: #F1F5F9; overflow: hidden;">
                      <div style="width: ${pct}%; height: 100%; background: ${pct > 90 ? '#EF4444' : (pct > 75 ? '#F59E0B' : '#F97316')}; border-radius: 999px;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- 10 Transaksi Terbaru -->
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: 16px; font-weight: 900; color: #0F172A;">10 Transaksi Terbaru</h3>
            <a href="/dashboard/transactions${isViewAsMode ? '?viewAs=' + activeUser.id : ''}" style="font-size: 12px; color: #F97316; font-weight: 800; text-decoration: none;">Lihat Semua &rarr;</a>
          </div>

          <div style="overflow-x: auto;">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Deskripsi Transaksi</th>
                  <th>Kategori</th>
                  <th>Dompet</th>
                  <th style="text-align: right;">Nominal</th>
                </tr>
              </thead>
              <tbody>
                ${userTransactions.length > 0 ? userTransactions.slice(0, 10).map(t => `
                  <tr>
                    <td style="color: #64748B; font-size: 12px;">${t.date}</td>
                    <td style="font-weight: 700; color: #0F172A;">
                      ${t.desc}
                      ${t.isReceipt ? '<span class="badge badge-purple" style="font-size: 9px; margin-left: 6px;">Struk Belanja</span>' : ''}
                    </td>
                    <td><span class="badge badge-blue">${t.cat}</span></td>
                    <td style="color: #64748B;">${t.wallet}</td>
                    <td style="text-align: right; font-weight: 900; color: ${t.type === 'income' ? '#10B981' : '#EF4444'};">
                      ${t.type === 'income' ? '+' : '-'}${formatIDR(t.amount)}
                    </td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="5" style="text-align: center; padding: 40px 20px; color: #64748B;">
                      <div style="font-size: 34px; margin-bottom: 8px;">🌱</div>
                      <div style="font-weight: 900; font-size: 15px; color: #334155;">Belum Ada Transaksi Tercatat</div>
                      <div style="font-size: 12px; margin-top: 4px; color: #94A3B8;">
                        Saldo, pemasukan, dan pengeluaran Anda saat ini adalah <b>Rp 0</b>.<br>
                        Mulai catat transaksi pertama Anda dengan menekan tombol <b>+ Catat Transaksi</b> di atas atau kirim chat via Telegram Bot!
                      </div>
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>

    ${renderTxModalHtml(activeUser, userWallets)}
  `;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

// ==============================================================================
// 2. TRANSAKSI PAGE (/dashboard/transactions)
// ==============================================================================

function renderTransactionsPage(req, res, sessionUser, query = {}) {
  const { activeUser, isViewAsMode } = getActiveUser(req, sessionUser, query);
  const userWallets = store.wallets.filter(w => w.userId === activeUser.id);
  const userTransactions = store.transactions.filter(t => t.userId === activeUser.id);

  const html = `
    ${getHtmlHeader(`TataDana — Transaksi (${activeUser.fullName})`)}
    ${renderGlobalHubNav('/dashboard/transactions', sessionUser)}
    ${isViewAsMode ? renderViewAsBanner(activeUser) : ''}

    <div style="display: flex; min-height: calc(100vh - 54px);">
      ${renderUserSidebar('/dashboard/transactions', activeUser, isViewAsMode)}

      <main style="flex: 1; padding: 28px; max-width: 1200px; margin: 0 auto; width: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 14px;">
          <div>
            <h1 style="font-size: 26px; font-weight: 900; color: #0F172A; margin-bottom: 4px;">Daftar Transaksi</h1>
            <p style="font-size: 13px; color: #64748B;">Total ${userTransactions.length} transaksi tercatat • Sinkronisasi real-time</p>
          </div>
          <button onclick="openTxModal()" class="btn-primary" style="padding: 10px 18px; font-size: 13px;">
            + Catat Transaksi Baru
          </button>
        </div>

        <!-- Filter & Search Bar -->
        <div class="card" style="margin-bottom: 20px; padding: 16px;">
          <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px;" class="sidebar-responsive">
            <input type="text" id="searchTx" placeholder="Cari catatan transaksi (cth: bakso, gaji, bensin)..." oninput="filterTransactions()">
            <select id="filterType" onchange="filterTransactions()">
              <option value="all">Semua Tipe</option>
              <option value="expense">Pengeluaran Saja</option>
              <option value="income">Pemasukan Saja</option>
            </select>
            <select id="filterWallet" onchange="filterTransactions()">
              <option value="all">Semua Dompet</option>
              ${userWallets.map(w => `<option value="${w.name}">${w.name}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Table with Receipt Accordion -->
        <div class="card" style="padding: 0; overflow: hidden;">
          <table class="custom-table" id="txTable">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Deskripsi Transaksi</th>
                <th>Kategori</th>
                <th>Dompet</th>
                <th style="text-align: right;">Nominal</th>
              </tr>
            </thead>
            <tbody>
              ${userTransactions.map((t, idx) => `
                <tr class="tx-row" data-desc="${t.desc.toLowerCase()}" data-type="${t.type}" data-wallet="${t.wallet}">
                  <td style="color: #64748B; font-size: 12px;">${t.date}</td>
                  <td style="font-weight: 700; color: #0F172A;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span>${t.desc}</span>
                      ${t.isReceipt ? `
                        <button onclick="toggleAccordion('rec_${idx}')" style="background: #FAF5FF; border: 1px solid #E9D5FF; color: #6B21A8; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; cursor: pointer;">
                          🧾 Lihat Rincian (${t.items ? t.items.length : 3} item) ▾
                        </button>
                      ` : ''}
                    </div>
                    ${t.isReceipt && t.items ? `
                      <div id="rec_${idx}" style="display: none; margin-top: 10px; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 12px; border-radius: 10px; font-size: 12px; color: #475569; font-weight: normal;">
                        <div style="font-weight: 800; color: #0F172A; margin-bottom: 6px;">Rincian Struk Belanja:</div>
                        ${t.items.map(it => `<div>• ${it}</div>`).join('')}
                      </div>
                    ` : ''}
                  </td>
                  <td><span class="badge badge-blue">${t.cat}</span></td>
                  <td style="color: #64748B;">${t.wallet}</td>
                  <td style="text-align: right; font-weight: 900; color: ${t.type === 'income' ? '#10B981' : '#EF4444'};">
                    ${t.type === 'income' ? '+' : '-'}${formatIDR(t.amount)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </main>
    </div>

    ${renderTxModalHtml(activeUser, userWallets)}
    <script>
      function toggleAccordion(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
      }
      function filterTransactions() {
        const s = document.getElementById('searchTx').value.toLowerCase();
        const type = document.getElementById('filterType').value;
        const wallet = document.getElementById('filterWallet').value;
        const rows = document.querySelectorAll('.tx-row');
        rows.forEach(r => {
          const matchDesc = r.getAttribute('data-desc').includes(s);
          const matchType = type === 'all' || r.getAttribute('data-type') === type;
          const matchWallet = wallet === 'all' || r.getAttribute('data-wallet') === wallet;
          r.style.display = (matchDesc && matchType && matchWallet) ? '' : 'none';
        });
      }
    </script>
  `;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

// ==============================================================================
// 3. LAPORAN & EKSPOR PAGE (/dashboard/reports)
// ==============================================================================

function renderReportsPage(req, res, sessionUser, query = {}) {
  const { activeUser, isViewAsMode } = getActiveUser(req, sessionUser, query);
  const userTransactions = store.transactions.filter(t => t.userId === activeUser.id);
  const totalIncome = userTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = userTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netCashflow = totalIncome - totalExpense;

  const html = `
    ${getHtmlHeader(`TataDana — Laporan Keuangan (${activeUser.fullName})`)}
    ${renderGlobalHubNav('/dashboard/reports', sessionUser)}
    ${isViewAsMode ? renderViewAsBanner(activeUser) : ''}

    <div style="display: flex; min-height: calc(100vh - 54px);">
      ${renderUserSidebar('/dashboard/reports', activeUser, isViewAsMode)}

      <main style="flex: 1; padding: 28px; max-width: 1200px; margin: 0 auto; width: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 14px;">
          <div>
            <h1 style="font-size: 26px; font-weight: 900; color: #0F172A; margin-bottom: 4px;">📊 Laporan & Ekspor Keuangan</h1>
            <p style="font-size: 13px; color: #64748B;">Laporan native berbasis Supabase Postgres • Download PDF & Excel on-demand</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button onclick="downloadReport('pdf')" class="btn-primary" style="padding: 10px 18px; font-size: 13px; background: #DC2626;">
              📄 Ekspor PDF
            </button>
            <button onclick="downloadReport('xlsx')" class="btn-primary" style="padding: 10px 18px; font-size: 13px; background: #16A34A;">
              📊 Ekspor Excel (.xlsx)
            </button>
          </div>
        </div>

        <!-- Summary Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 18px; margin-bottom: 24px;">
          <div class="card">
            <span style="font-size: 12px; font-weight: 800; color: #64748B;">TOTAL PEMASUKAN</span>
            <div style="font-size: 22px; font-weight: 900; color: #10B981; margin-top: 6px;">+${formatIDR(totalIncome)}</div>
          </div>
          <div class="card">
            <span style="font-size: 12px; font-weight: 800; color: #64748B;">TOTAL PENGELUARAN</span>
            <div style="font-size: 22px; font-weight: 900; color: #EF4444; margin-top: 6px;">-${formatIDR(totalExpense)}</div>
          </div>
          <div class="card">
            <span style="font-size: 12px; font-weight: 800; color: #64748B;">NET CASHFLOW</span>
            <div style="font-size: 22px; font-weight: 900; color: ${netCashflow >= 0 ? '#10B981' : '#EF4444'}; margin-top: 6px;">
              ${netCashflow >= 0 ? '+' : ''}${formatIDR(netCashflow)}
            </div>
          </div>
        </div>

        <!-- Report Table -->
        <div class="card" style="padding: 0; overflow: hidden; margin-bottom: 24px;">
          <div style="padding: 18px 24px; border-bottom: 1px solid #E2E8F0; font-weight: 900; font-size: 15px;">
            Rincian Transaksi Periode Ini (${userTransactions.length} transaksi)
          </div>
          <table class="custom-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Catatan</th>
                <th>Kategori</th>
                <th>Dompet</th>
                <th style="text-align: right;">Nominal</th>
              </tr>
            </thead>
            <tbody>
              ${userTransactions.map(t => `
                <tr>
                  <td style="color: #64748B; font-size: 12px;">${t.date}</td>
                  <td style="font-weight: 700;">${t.desc}</td>
                  <td><span class="badge badge-blue">${t.cat}</span></td>
                  <td>${t.wallet}</td>
                  <td style="text-align: right; font-weight: 900; color: ${t.type === 'income' ? '#10B981' : '#EF4444'};">
                    ${t.type === 'income' ? '+' : '-'}${formatIDR(t.amount)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </main>
    </div>

    <script>
      function downloadReport(type) {
        alert('Membuat file laporan ' + type.toUpperCase() + ' secara on-demand... Unduhan akan dimulai otomatis!');
        const trxs = ${JSON.stringify(userTransactions)};
        let csv = "Tanggal,Deskripsi,Kategori,Dompet,Tipe,Nominal\\n";
        trxs.forEach(t => {
          csv += '"' + t.date + '","' + t.desc + '","' + t.cat + '","' + t.wallet + '","' + t.type + '",' + t.amount + '\\n';
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Laporan_Keuangan_TataDana_' + type + '.csv';
        a.click();
      }
    </script>
  `;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

// ==============================================================================
// 4. BUDGET PAGE (/dashboard/budget)
// ==============================================================================

function renderBudgetPage(req, res, sessionUser, query = {}) {
  const { activeUser, isViewAsMode } = getActiveUser(req, sessionUser, query);
  const userBudgets = store.budgets.filter(b => b.userId === activeUser.id);
  const totalBudget = userBudgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = userBudgets.reduce((s, b) => s + b.spent, 0);

  const html = `
    ${getHtmlHeader(`TataDana — Budget (${activeUser.fullName})`)}
    ${renderGlobalHubNav('/dashboard/budget', sessionUser)}
    ${isViewAsMode ? renderViewAsBanner(activeUser) : ''}

    <div style="display: flex; min-height: calc(100vh - 54px);">
      ${renderUserSidebar('/dashboard/budget', activeUser, isViewAsMode)}

      <main style="flex: 1; padding: 28px; max-width: 1200px; margin: 0 auto; width: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 14px;">
          <div>
            <h1 style="font-size: 26px; font-weight: 900; color: #0F172A; margin-bottom: 4px;">🎯 Anggaran & Target Bulanan</h1>
            <p style="font-size: 13px; color: #64748B;">Atur limit pengeluaran per kategori • Alert otomatis saat mencapai 80% dan 100%</p>
          </div>
          <button onclick="openBudgetModal()" class="btn-primary" style="padding: 10px 18px; font-size: 13px;">
            + Atur Target Budget Baru
          </button>
        </div>

        <!-- Budget Cards Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
          ${userBudgets.map(b => {
            const pct = b.amount > 0 ? Math.min(100, Math.round((b.spent / b.amount) * 100)) : 0;
            const sisa = Math.max(0, b.amount - b.spent);
            const isDanger = pct >= 100;
            const isWarning = pct >= 80 && pct < 100;

            return `
              <div class="card" style="border-top: 4px solid ${isDanger ? '#EF4444' : (isWarning ? '#F59E0B' : '#10B981')};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 20px;">${b.emoji}</span>
                    <span style="font-weight: 900; font-size: 16px;">${b.name}</span>
                  </div>
                  <span class="badge ${isDanger ? 'badge-red' : (isWarning ? 'badge-amber' : 'badge-green')}">
                    ${isDanger ? '🚨 OVER BUDGET' : (isWarning ? '⚠️ WASPADA (80%+)' : '🟢 AMAN')}
                  </span>
                </div>

                <div style="margin-bottom: 12px;">
                  <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
                    <span style="color: #64748B;">Terpakai: <b>${formatIDR(b.spent)}</b></span>
                    <span style="font-weight: 800; color: #0F172A;">Limit: ${formatIDR(b.amount)}</span>
                  </div>
                  <div style="height: 10px; border-radius: 999px; background: #F1F5F9; overflow: hidden;">
                    <div style="width: ${pct}%; height: 100%; background: ${isDanger ? '#EF4444' : (isWarning ? '#F59E0B' : '#F97316')}; border-radius: 999px;"></div>
                  </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #64748B;">
                  <span>Visual Bar: <code>${generateProgressBar(pct)}</code></span>
                  <span>Sisa: <b>${formatIDR(sisa)}</b></span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </main>
    </div>

    <!-- Modal Atur Budget -->
    <div id="budgetModal" class="modal-overlay" onclick="if(event.target===this) closeBudgetModal()">
      <div class="modal-content" style="max-width: 440px;">
        <h3 style="font-size: 18px; font-weight: 900; margin-bottom: 16px;">🎯 Atur Target Budget Baru</h3>
        <form onsubmit="event.preventDefault(); saveBudget();" style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px;">Kategori</label>
            <select id="budgetCategory">
              <option value="cat_mkn">🍜 Makanan & Minuman</option>
              <option value="cat_trans">🚗 Transportasi</option>
              <option value="cat_hiburan">🎮 Hiburan</option>
              <option value="cat_tagihan">🏠 Tagihan & Utilitas</option>
              <option value="cat_belanja">👕 Belanja</option>
              <option value="cat_kesehatan">💊 Kesehatan</option>
              <option value="cat_pendidikan">📚 Pendidikan</option>
            </select>
          </div>
          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px;">Nominal Limit Bulanan (Rp)</label>
            <input type="number" id="budgetLimit" placeholder="Misal: 2500000" required>
          </div>
          <div style="display: flex; gap: 10px; margin-top: 10px;">
            <button type="button" onclick="closeBudgetModal()" class="btn-outline" style="flex: 1;">Batal</button>
            <button type="submit" class="btn-primary" style="flex: 1;">Simpan Target</button>
          </div>
        </form>
      </div>
    </div>
    <script>
      function openBudgetModal() { document.getElementById('budgetModal').classList.add('active'); }
      function closeBudgetModal() { document.getElementById('budgetModal').classList.remove('active'); }
      function saveBudget() {
        const cat = document.getElementById('budgetCategory').value;
        const lim = parseInt(document.getElementById('budgetLimit').value, 10);
        fetch('/api/budgets/set', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ categoryId: cat, amount: lim })
        }).then(() => window.location.reload());
      }
    </script>
  `;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

// ==============================================================================
// 5. WALLET PAGE (/dashboard/wallet)
// ==============================================================================

function renderWalletPage(req, res, sessionUser, query = {}) {
  const { activeUser, isViewAsMode } = getActiveUser(req, sessionUser, query);
  const userWallets = store.wallets.filter(w => w.userId === activeUser.id);
  const totalNetWorth = userWallets.reduce((s, w) => s + w.balance, 0);

  const html = `
    ${getHtmlHeader(`TataDana — Dompet & Rekening (${activeUser.fullName})`)}
    ${renderGlobalHubNav('/dashboard/wallet', sessionUser)}
    ${isViewAsMode ? renderViewAsBanner(activeUser) : ''}

    <div style="display: flex; min-height: calc(100vh - 54px);">
      ${renderUserSidebar('/dashboard/wallet', activeUser, isViewAsMode)}

      <main style="flex: 1; padding: 28px; max-width: 1200px; margin: 0 auto; width: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 14px;">
          <div>
            <h1 style="font-size: 26px; font-weight: 900; color: #0F172A; margin-bottom: 4px;">👛 Multi-Wallet Management</h1>
            <p style="font-size: 13px; color: #64748B;">Kelola rekening bank, e-wallet, dan uang tunai • Set 1 wallet default Telegram</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button onclick="openWalletModal()" class="btn-primary" style="padding: 10px 18px; font-size: 13px;">
              + Tambah Dompet
            </button>
            <button onclick="openTransferModal()" class="btn-dark" style="padding: 10px 18px; font-size: 13px;">
              ⇄ Transfer Antar Dompet
            </button>
          </div>
        </div>

        <!-- Net Worth Card -->
        <div class="card" style="background: linear-gradient(135deg, #0F172A, #1E293B); color: white; margin-bottom: 24px;">
          <span style="font-size: 12px; font-weight: 800; color: #94A3B8;">TOTAL NET WORTH (SEMUA DOMPET)</span>
          <div style="font-size: 32px; font-weight: 900; color: #F97316; margin-top: 6px;">${formatIDR(totalNetWorth)}</div>
        </div>

        <!-- Wallets Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
          ${userWallets.map(w => `
            <div class="card" style="border-left: 5px solid ${w.color || '#F97316'};">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span style="font-weight: 900; font-size: 17px; color: #0F172A;">${w.name}</span>
                ${w.isDefault ? '<span class="badge badge-green">👛 Default Telegram</span>' : ''}
              </div>
              <div style="font-size: 22px; font-weight: 900; color: #0F172A; margin-bottom: 12px;">
                ${formatIDR(w.balance)}
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #64748B;">
                <span>Tipe: <b>${w.type}</b></span>
                ${!w.isDefault ? `<button onclick="setDefaultWallet('${w.id}')" class="btn-outline btn-sm">Jadikan Default</button>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </main>
    </div>

    <!-- Modal Tambah Wallet -->
    <div id="walletModal" class="modal-overlay" onclick="if(event.target===this) closeWalletModal()">
      <div class="modal-content" style="max-width: 440px;">
        <h3 style="font-size: 18px; font-weight: 900; margin-bottom: 16px;">👛 Tambah Dompet Baru</h3>
        <form onsubmit="event.preventDefault(); saveWallet();" style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px;">Pilih Preset Cepat (Bank / E-Wallet / Cash):</label>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              <button type="button" onclick="applyWalletPreset('SeaBank', 'Bank', '#FF5722')" class="btn-outline btn-sm" style="border-color: #FF5722; color: #FF5722; font-weight: 800; padding: 4px 10px; font-size: 12px;">
                🌊 SeaBank
              </button>
              <button type="button" onclick="applyWalletPreset('Uang Tunai (Cash)', 'Tunai', '#10B981')" class="btn-outline btn-sm" style="border-color: #10B981; color: #10B981; font-weight: 800; padding: 4px 10px; font-size: 12px;">
                💵 Cash / Tunai
              </button>
              <button type="button" onclick="applyWalletPreset('BCA Utama', 'Bank', '#00529C')" class="btn-outline btn-sm" style="padding: 4px 8px; font-size: 11px;">
                BCA
              </button>
              <button type="button" onclick="applyWalletPreset('Mandiri Livin', 'Bank', '#003366')" class="btn-outline btn-sm" style="padding: 4px 8px; font-size: 11px;">
                Mandiri
              </button>
              <button type="button" onclick="applyWalletPreset('GoPay', 'E-Wallet', '#00AA13')" class="btn-outline btn-sm" style="padding: 4px 8px; font-size: 11px;">
                GoPay
              </button>
              <button type="button" onclick="applyWalletPreset('OVO Cash', 'E-Wallet', '#4C3494')" class="btn-outline btn-sm" style="padding: 4px 8px; font-size: 11px;">
                OVO
              </button>
              <button type="button" onclick="applyWalletPreset('ShopeePay', 'E-Wallet', '#EE4D2D')" class="btn-outline btn-sm" style="padding: 4px 8px; font-size: 11px;">
                ShopeePay
              </button>
              <button type="button" onclick="applyWalletPreset('Dana', 'E-Wallet', '#118EEA')" class="btn-outline btn-sm" style="padding: 4px 8px; font-size: 11px;">
                Dana
              </button>
            </div>
          </div>
          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px;">Nama Dompet / Rekening</label>
            <input type="text" id="walletName" placeholder="Misal: BCA Prioritas atau DANA" required>
          </div>
          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px;">Tipe</label>
            <select id="walletType">
              <option value="Bank">Rekening Bank</option>
              <option value="E-Wallet">E-Wallet (GoPay, OVO, DANA, ShopeePay)</option>
              <option value="Tunai">Uang Tunai (Cash)</option>
            </select>
          </div>
          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px;">Saldo Awal (Rp)</label>
            <input type="number" id="walletBalance" placeholder="0" required>
          </div>
          <div style="display: flex; gap: 10px; margin-top: 10px;">
            <button type="button" onclick="closeWalletModal()" class="btn-outline" style="flex: 1;">Batal</button>
            <button type="submit" class="btn-primary" style="flex: 1;">Tambah</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Transfer Antar Dompet -->
    <div id="transferModal" class="modal-overlay" onclick="if(event.target===this) closeTransferModal()">
      <div class="modal-content" style="max-width: 440px;">
        <h3 style="font-size: 18px; font-weight: 900; margin-bottom: 16px;">⇄ Transfer Antar Dompet</h3>
        <form onsubmit="event.preventDefault(); executeTransfer();" style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px;">Dari Dompet</label>
            <select id="tfFrom">
              ${userWallets.map(w => `<option value="${w.id}">${w.name} (${formatIDR(w.balance)})</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px;">Ke Dompet Tujuan</label>
            <select id="tfTo">
              ${userWallets.map(w => `<option value="${w.id}">${w.name} (${formatIDR(w.balance)})</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px;">Nominal Transfer (Rp)</label>
            <input type="number" id="tfAmount" placeholder="Misal: 500000" required>
          </div>
          <div style="display: flex; gap: 10px; margin-top: 10px;">
            <button type="button" onclick="closeTransferModal()" class="btn-outline" style="flex: 1;">Batal</button>
            <button type="submit" class="btn-primary" style="flex: 1;">Kirim Transfer</button>
          </div>
        </form>
      </div>
    </div>

    <script>
      let currentWalletColor = '#F97316';
      function applyWalletPreset(name, type, color) {
        document.getElementById('walletName').value = name;
        document.getElementById('walletType').value = type;
        currentWalletColor = color || '#F97316';
      }
      function openWalletModal() { document.getElementById('walletModal').classList.add('active'); }
      function closeWalletModal() { document.getElementById('walletModal').classList.remove('active'); }
      function openTransferModal() { document.getElementById('transferModal').classList.add('active'); }
      function closeTransferModal() { document.getElementById('transferModal').classList.remove('active'); }
      function saveWallet() {
        fetch('/api/wallets/create', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            name: document.getElementById('walletName').value,
            type: document.getElementById('walletType').value,
            color: currentWalletColor,
            balance: parseInt(document.getElementById('walletBalance').value, 10)
          })
        }).then(() => window.location.reload());
      }
      function executeTransfer() {
        fetch('/api/wallets/transfer', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            fromId: document.getElementById('tfFrom').value,
            toId: document.getElementById('tfTo').value,
            amount: parseInt(document.getElementById('tfAmount').value, 10)
          })
        }).then(() => window.location.reload());
      }
      function setDefaultWallet(id) {
        fetch('/api/wallets/set-default', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ walletId: id })
        }).then(() => window.location.reload());
      }
    </script>
  `;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

// ==============================================================================
// 6. AI FINANCIAL CHAT (Tugas 4: Analisis Berdasarkan Data Nyata Pengguna)
// ==============================================================================

function renderAiChatPage(req, res, sessionUser, query = {}) {
  const { activeUser, isViewAsMode } = getActiveUser(req, sessionUser, query);
  const primaryProvider = store.aiProviders.find(p => p.isPrimary) || store.aiProviders[0];

  const html = `
    ${getHtmlHeader(`TataDana — AI Financial Chat (${activeUser.fullName})`)}
    ${renderGlobalHubNav('/dashboard/ai-chat', sessionUser)}
    ${isViewAsMode ? renderViewAsBanner(activeUser) : ''}

    <div style="display: flex; min-height: calc(100vh - 54px);">
      ${renderUserSidebar('/dashboard/ai-chat', activeUser, isViewAsMode)}

      <main style="flex: 1; padding: 28px; max-width: 900px; margin: 0 auto; width: 100%; display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
          <div>
            <h1 style="font-size: 24px; font-weight: 900; color: #0F172A; margin-bottom: 4px;">🤖 AI Financial Advisor Chat</h1>
            <p style="font-size: 13px; color: #64748B;">Konsultasi keuangan cerdas berbasis riwayat transaksi riil milik Anda</p>
          </div>
          <span class="badge badge-purple" style="font-size: 11px;">
            ⚡ Model: ${primaryProvider.name}
          </span>
        </div>

        <!-- Chat History Window -->
        <div class="card" style="flex: 1; min-height: 440px; max-height: 540px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; background: white; margin-bottom: 16px; padding: 20px;" id="aiChatWindow">
          <div style="align-self: flex-start; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 14px 18px; border-radius: 16px 16px 16px 2px; max-width: 85%; font-size: 14px; line-height: 1.6;">
            👋 Halo <b>${activeUser.fullName}</b>! Saya adalah asisten finansial AI TataDana Anda. Saya memiliki akses aman ke data transaksi, saldo dompet, dan target budget Anda.<br><br>
            Silakan tanyakan apa pun mengenai kondisi cashflow Anda, atau klik pertanyaan rekomendasi di bawah!
          </div>
        </div>

        <!-- Quick Prompt Chips -->
        <div style="display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap;">
          <button onclick="sendQuickPrompt('Berapa total pengeluaran saya bulan ini dan bagaimana trennya?')" class="btn-outline btn-sm" style="background: white;">
            📊 Berapa pengeluaran saya bulan ini?
          </button>
          <button onclick="sendQuickPrompt('Kategori apa yang paling banyak menghabiskan uang saya?')" class="btn-outline btn-sm" style="background: white;">
            💸 Kategori paling boros?
          </button>
          <button onclick="sendQuickPrompt('Apakah target budget bulanan saya masih aman?')" class="btn-outline btn-sm" style="background: white;">
            🎯 Cek kesehatan budget
          </button>
          <button onclick="sendQuickPrompt('Berikan saran konkret untuk menghemat pengeluaran minggu ini')" class="btn-outline btn-sm" style="background: white;">
            💡 Tips hemat minggu ini
          </button>
        </div>

        <!-- Input Bar -->
        <div style="display: flex; gap: 10px;">
          <input type="text" id="aiInput" placeholder="Tanyakan kondisi keuanganmu (misal: analisis pengeluaran makanan saya)..." style="flex: 1;" onkeypress="if(event.key==='Enter') sendAiMessage()">
          <button onclick="sendAiMessage()" class="btn-primary" style="padding: 12px 24px;">Kirim 🚀</button>
        </div>
      </main>
    </div>

    <script>
      function sendQuickPrompt(txt) {
        document.getElementById('aiInput').value = txt;
        sendAiMessage();
      }

      function sendAiMessage() {
        const inp = document.getElementById('aiInput');
        const txt = inp.value.trim();
        if (!txt) return;
        const win = document.getElementById('aiChatWindow');
        win.innerHTML += '<div style="align-self: flex-end; background: #F97316; color: white; padding: 12px 18px; border-radius: 16px 16px 2px 16px; font-weight: 600; max-width: 80%; font-size: 14px;">' + txt + '</div>';
        inp.value = '';
        win.scrollTop = win.scrollHeight;

        const loadingId = 'load_' + Date.now();
        win.innerHTML += '<div id="' + loadingId + '" style="align-self: flex-start; background: #F1F5F9; color: #64748B; padding: 12px 18px; border-radius: 16px 16px 16px 2px; font-size: 13px;">⏳ Menganalisis riwayat transaksi keuangan Anda...</div>';
        win.scrollTop = win.scrollHeight;

        fetch('/api/ai/chat', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ message: txt })
        })
        .then(r => r.json())
        .then(d => {
          document.getElementById(loadingId).remove();
          const formatted = (d.reply || 'Analisis selesai.')
            .replace(/\\n/g, '<br>')
            .replace(/\\*([^\\*]+)\\*/g, '<b>$1</b>');
          win.innerHTML += '<div style="align-self: flex-start; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 14px 18px; border-radius: 16px 16px 16px 2px; max-width: 85%; font-size: 14px; line-height: 1.6;">' + formatted + '</div>';
          win.scrollTop = win.scrollHeight;
        })
        .catch(err => {
          document.getElementById(loadingId).innerText = 'Error: ' + err.message;
        });
      }
    </script>
  `;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

// ==============================================================================
// 7. SETTINGS PAGE (Tugas 6: Edit Profil & Persistensi, Token Bot, Reminder, Kategori)
// ==============================================================================

function renderSettingsPage(req, res, sessionUser, query = {}) {
  const { activeUser, isViewAsMode } = getActiveUser(req, sessionUser, query);
  const activeTab = query.tab || 'profil';

  const html = `
    ${getHtmlHeader(`TataDana — Pengaturan Akun (${activeUser.fullName})`)}
    ${renderGlobalHubNav('/dashboard/settings', sessionUser)}
    ${isViewAsMode ? renderViewAsBanner(activeUser) : ''}

    <div style="display: flex; min-height: calc(100vh - 54px);">
      ${renderUserSidebar('/dashboard/settings', activeUser, isViewAsMode)}

      <main style="flex: 1; padding: 28px; max-width: 900px; margin: 0 auto; width: 100%;">
        <div style="margin-bottom: 24px;">
          <h1 style="font-size: 26px; font-weight: 900; color: #0F172A; margin-bottom: 4px;">⚙️ Pengaturan Akun & Integrasi</h1>
          <p style="font-size: 13px; color: #64748B;">Kelola profil diri, koneksi bot Telegram, jadwal pengingat, dan kategori kustom</p>
        </div>

        <!-- Navigation Tabs -->
        <div style="display: flex; gap: 8px; border-bottom: 2px solid #E2E8F0; margin-bottom: 24px;">
          <a href="/dashboard/settings?tab=profil${isViewAsMode ? '&viewAs=' + activeUser.id : ''}" style="padding: 10px 16px; font-weight: 800; font-size: 13px; text-decoration: none; border-bottom: 2px solid ${activeTab === 'profil' ? '#F97316' : 'transparent'}; color: ${activeTab === 'profil' ? '#F97316' : '#64748B'};">
            👤 Profil Pengguna
          </a>
          <a href="/dashboard/settings?tab=telegram${isViewAsMode ? '&viewAs=' + activeUser.id : ''}" style="padding: 10px 16px; font-weight: 800; font-size: 13px; text-decoration: none; border-bottom: 2px solid ${activeTab === 'telegram' ? '#F97316' : 'transparent'}; color: ${activeTab === 'telegram' ? '#F97316' : '#64748B'};">
            💬 Telegram Bot
          </a>
          <a href="/dashboard/settings?tab=reminder${isViewAsMode ? '&viewAs=' + activeUser.id : ''}" style="padding: 10px 16px; font-weight: 800; font-size: 13px; text-decoration: none; border-bottom: 2px solid ${activeTab === 'reminder' ? '#F97316' : 'transparent'}; color: ${activeTab === 'reminder' ? '#F97316' : '#64748B'};">
            ⏰ Pengingat (Reminder)
          </a>
          <a href="/dashboard/settings?tab=kategori${isViewAsMode ? '&viewAs=' + activeUser.id : ''}" style="padding: 10px 16px; font-weight: 800; font-size: 13px; text-decoration: none; border-bottom: 2px solid ${activeTab === 'kategori' ? '#F97316' : 'transparent'}; color: ${activeTab === 'kategori' ? '#F97316' : '#64748B'};">
            🏷️ Kategori Transaksi
          </a>
        </div>

        <!-- Tab 1: Profil (Tugas 6: Edit Profil & Avatar) -->
        ${activeTab === 'profil' ? `
          <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid #F1F5F9; padding-bottom: 16px;">
              <div>
                <h3 style="font-size: 18px; font-weight: 900; color: #0F172A;">Ubah Informasi Akun & Foto Profil</h3>
                <p style="font-size: 13px; color: #64748B; margin-top: 2px;">Kelola identitas personal, foto profil avatar, dan preferensi akun Anda</p>
              </div>
              <span class="badge badge-green">✓ Akun Terverifikasi</span>
            </div>

            <!-- Avatar Change Showcase Section -->
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 18px; padding: 20px; margin-bottom: 20px;">
              <div style="display: flex; align-items: center; gap: 24px; flex-wrap: wrap;">
                
                <!-- Avatar image with visual hover indicator -->
                <div class="avatar-hover-wrapper" onclick="openAvatarModal('presets')" title="Klik untuk mengganti foto profil">
                  <img id="avatarPreview" src="${activeUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}" alt="Foto Profil ${activeUser.fullName}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80';">
                  <div class="avatar-hover-overlay">
                    <span style="font-size: 20px;">📷</span>
                    <span style="font-size: 11px; font-weight: 800; margin-top: 2px;">Ganti Foto</span>
                  </div>
                  <div class="avatar-camera-badge" title="Ganti Foto">📷</div>
                </div>

                <!-- Info & Fast Action Buttons -->
                <div style="flex: 1; min-width: 240px;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <div style="font-size: 16px; font-weight: 900; color: #0F172A;">Foto Profil TataDana</div>
                    <span class="badge ${activeUser.plan === 'pro' ? 'badge-green' : 'badge-amber'}" style="font-size: 10px; padding: 2px 7px;">
                      ${activeUser.plan.toUpperCase()}
                    </span>
                  </div>
                  <p style="font-size: 12px; color: #64748B; margin-bottom: 12px; line-height: 1.4;">
                    Pilih avatar siap pakai, unggah berkas dari komputer/HP, atau masukkan URL foto langsung.
                  </p>
                  <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    <button type="button" onclick="openAvatarModal('presets')" class="btn-primary btn-sm" style="font-size: 12px; padding: 8px 14px;">
                      📸 Ganti Foto Profil
                    </button>
                    <button type="button" onclick="triggerDirectUpload()" class="btn-outline btn-sm" style="font-size: 12px; padding: 8px 14px; background: white;">
                      💻 Upload Berkas
                    </button>
                    <button type="button" onclick="resetToDefaultAvatar()" class="btn-outline btn-sm" style="font-size: 12px; padding: 8px 12px; color: #64748B; background: white;" title="Kembalikan foto profil ke default">
                      🔄 Reset Default
                    </button>
                  </div>
                </div>
              </div>

              <!-- URL / Base64 Input Field with Live Preview -->
              <div style="margin-top: 16px; border-top: 1px dashed #E2E8F0; padding-top: 14px;">
                <label style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px;">
                  <span>URL Foto Profil / Base64 Data URL</span>
                  <span style="font-size: 11px; color: #94A3B8; font-weight: 500;">Dapat diedit langsung atau via modal di atas</span>
                </label>
                <div style="display: flex; gap: 8px;">
                  <input type="text" id="profAvatar" value="${activeUser.avatarUrl || ''}" placeholder="https://images.unsplash.com/... atau data:image/..." oninput="syncAvatarFromInput(this.value)">
                  <button type="button" onclick="previewCurrentInput()" class="btn-outline btn-sm" style="white-space: nowrap; padding: 0 14px; background: white;">👁️ Tes URL</button>
                </div>
              </div>
            </div>

            <form onsubmit="event.preventDefault(); saveProfile();" style="display: flex; flex-direction: column; gap: 18px;">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;">
                <div>
                  <label style="display: block; font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 6px;">
                    Nama Lengkap <span style="color: #EF4444;">*</span>
                  </label>
                  <input type="text" id="profName" value="${activeUser.fullName}" placeholder="Masukkan nama lengkap Anda" required>
                </div>

                <div>
                  <label style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 6px;">
                    <span>Alamat Email</span>
                    <span class="badge badge-green" style="font-size: 10px; padding: 2px 7px;">✓ Terverifikasi</span>
                  </label>
                  <input type="email" id="profEmail" value="${activeUser.email}" disabled style="background: #F8FAFC; color: #64748B; cursor: not-allowed;" title="Email terdaftar sebagai identitas akun login">
                </div>
              </div>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;">
                <div>
                  <label style="display: block; font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 6px;">
                    Nomor WhatsApp / HP <span style="color: #EF4444;">*</span>
                  </label>
                  <input type="text" id="profPhone" value="${activeUser.phone || ''}" placeholder="Contoh: +6281234567890" required>
                </div>

                <div>
                  <label style="display: block; font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 6px;">
                    Pekerjaan / Profesi
                  </label>
                  <input type="text" id="profOccupation" value="${activeUser.occupation || ''}" placeholder="Contoh: Senior Software Engineer, Wiraswasta, Dokter">
                </div>
              </div>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;">
                <div>
                  <label style="display: block; font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 6px;">
                    Kota Domisili / Lokasi
                  </label>
                  <input type="text" id="profCity" value="${activeUser.city || ''}" placeholder="Contoh: Jakarta Selatan, DKI Jakarta">
                </div>

                <div>
                  <label style="display: block; font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 6px;">
                    Mata Uang Default
                  </label>
                  <select id="profCurrency">
                    <option value="IDR" ${activeUser.defaultCurrency === 'IDR' ? 'selected' : ''}>IDR — Rupiah Indonesia (Rp)</option>
                    <option value="USD" ${activeUser.defaultCurrency === 'USD' ? 'selected' : ''}>USD — US Dollar ($)</option>
                    <option value="SGD" ${activeUser.defaultCurrency === 'SGD' ? 'selected' : ''}>SGD — Singapore Dollar (S$)</option>
                    <option value="EUR" ${activeUser.defaultCurrency === 'EUR' ? 'selected' : ''}>EUR — Euro (€)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 6px;">
                  <span>Bio / Catatan Target Finansial</span>
                  <span style="font-size: 11px; color: #94A3B8; font-weight: 500;">Maksimal 250 karakter</span>
                </label>
                <textarea id="profBio" rows="3" placeholder="Tuliskan tujuan finansial atau catatan personal Anda di sini...">${activeUser.bio || ''}</textarea>
              </div>

              <div style="display: flex; gap: 14px; align-items: center; margin-top: 8px; flex-wrap: wrap;">
                <button type="submit" id="btnSaveProfile" class="btn-primary" style="padding: 12px 28px; font-size: 14px; font-weight: 800; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(249,115,22,0.3);">
                  <span>💾</span> <span>Simpan Perubahan Profil</span>
                </button>
                <span id="saveStatusIndicator" style="font-size: 13px; font-weight: 700; color: #166534; display: none;">✓ Perubahan tersimpan!</span>
              </div>
            </form>
          </div>

          <input type="file" id="directFileInput" accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml" style="display: none;" onchange="handleDirectFileSelect(this.files[0], this)">
        ` : ''}

        <!-- Tab 2: Telegram Bot (Part 5) -->
        ${activeTab === 'telegram' ? `
          <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h3 style="font-size: 16px; font-weight: 900;">Pengaturan Token Bot Telegram</h3>
              <span class="badge ${activeUser.telegramConnected ? 'badge-green' : 'badge-red'}">
                ${activeUser.telegramConnected ? '🟢 Terhubung' : '🔴 Belum Terhubung'}
              </span>
            </div>

            <!-- Step by step guide inline -->
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 16px; margin-bottom: 20px; font-size: 13px; line-height: 1.6; color: #475569;">
              <div style="font-weight: 800; color: #0F172A; margin-bottom: 6px;">📖 Panduan Menghubungkan Bot dari @BotFather:</div>
              1. Buka aplikasi Telegram dan cari akun resmi <b>@BotFather</b>.<br>
              2. Kirim perintah <code>/newbot</code> lalu ikuti instruksi penamaan bot Anda.<br>
              3. Salin <b>API Token</b> yang diberikan BotFather (contoh: <code>123456789:AA...</code>).<br>
              4. Tempelkan token ke kolom di bawah, lalu klik <b>Test Koneksi & Pasang Webhook</b>.
            </div>

            <form onsubmit="event.preventDefault(); testTelegramConnection();" style="display: flex; flex-direction: column; gap: 14px;">
              <div>
                <label style="display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px;">API Token Bot Telegram</label>
                <input type="text" id="tgToken" value="${activeUser.telegramBotToken || ''}" placeholder="1234567890:AAExAmpLe..." required>
              </div>

              <div id="testResultBox" style="display: none; padding: 12px; border-radius: 10px; font-size: 13px; font-weight: 700;"></div>

              <div style="display: flex; gap: 10px;">
                <button type="submit" id="btnTestTg" class="btn-primary" style="padding: 12px 20px;">
                  ⚡ Test Koneksi & Pasang Webhook
                </button>
              </div>
            </form>
          </div>
        ` : ''}

        <!-- Tab 3: Reminder -->
        ${activeTab === 'reminder' ? `
          <div class="card">
            <h3 style="font-size: 16px; font-weight: 900; margin-bottom: 16px;">⏰ Pengingat Rutin Harian (Maksimal 2x / Hari)</h3>
            <p style="font-size: 13px; color: #64748B; margin-bottom: 20px;">
              Bot Telegram akan mengirimkan pengingat ramah agar Anda tidak lupa mencatat pengeluaran di jam-jam sibuk.
            </p>

            <form onsubmit="event.preventDefault(); alert('Jadwal reminder tersimpan!');" style="display: flex; flex-direction: column; gap: 16px;">
              <label style="display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 700; cursor: pointer;">
                <input type="checkbox" ${activeUser.reminderEnabled ? 'checked' : ''} style="width: 18px; height: 18px;">
                Aktifkan Pengingat Harian via Telegram
              </label>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div>
                  <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 6px;">Reminder 1 (Pagi / Siang)</label>
                  <input type="text" value="${activeUser.reminderTimes[0] || '08:00'}" placeholder="08:00 WIB">
                </div>
                <div>
                  <label style="display: block; font-size: 12px; font-weight: 700; margin-bottom: 6px;">Reminder 2 (Malam Hari)</label>
                  <input type="text" value="${activeUser.reminderTimes[1] || '20:00'}" placeholder="20:00 WIB">
                </div>
              </div>

              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 14px; border-radius: 12px; font-size: 13px;">
                <div style="font-weight: 800; color: #0F172A; margin-bottom: 4px;">Preview Pesan Reminder:</div>
                <div style="color: #475569; font-style: italic;">
                  "⏰ Reminder Keuangan!<br>Jangan lupa catat pengeluaran hari ini ya 📝<br>Pencatatan rutin = keuangan lebih terkontrol 💪<br>Ketik transaksimu sekarang!"
                </div>
              </div>

              <button type="submit" class="btn-primary" style="padding: 12px 20px;">Simpan Jadwal Reminder</button>
            </form>
          </div>
        ` : ''}

        <!-- Tab 4: Kategori -->
        ${activeTab === 'kategori' ? `
          <div class="card">
            <h3 style="font-size: 16px; font-weight: 900; margin-bottom: 16px;">Daftar Kategori Kustom</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 20px;">
              ${store.categories.map(c => `
                <div style="display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 10px; border: 1px solid #E2E8F0; background: #F8FAFC;">
                  <span style="font-size: 20px;">${c.emoji}</span>
                  <span style="font-weight: 800; font-size: 13px;">${c.name}</span>
                </div>
              `).join('')}
            </div>
            <button onclick="alert('Form kategori custom aktif!')" class="btn-outline btn-sm">+ Tambah Kategori Kustom</button>
          </div>
        ` : ''}
      </main>
    </div>

    <!-- MODAL GANTI FOTO PROFIL (TUGAS: PRESET PICKER, FILE UPLOAD, IMAGE URL) -->
    <div id="avatarModal" class="modal-overlay" onclick="if(event.target===this) closeAvatarModal()">
      <div class="modal-content" style="max-width: 680px; padding: 26px;">
        
        <!-- Modal Top Bar -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 38px; height: 38px; border-radius: 12px; background: #FFF7ED; color: #F97316; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 900; border: 1px solid #FFEDD5;">
              📸
            </div>
            <div>
              <h3 style="font-size: 18px; font-weight: 900; color: #0F172A;">Pilih atau Unggah Foto Profil</h3>
              <p style="font-size: 12px; color: #64748B;">Pilih opsi yang paling sesuai dengan preferensi Anda</p>
            </div>
          </div>
          <button type="button" onclick="closeAvatarModal()" style="border: none; background: #F1F5F9; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-weight: 800; font-size: 15px; color: #64748B;">✕</button>
        </div>

        <!-- Live Preview Comparison Card -->
        <div style="background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%); border: 1px solid #FED7AA; border-radius: 16px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; gap: 16px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="position: relative;">
              <img id="modalPreviewImg" src="${activeUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}" style="width: 58px; height: 58px; border-radius: 50%; object-fit: cover; border: 3px solid #F97316; display: block; box-shadow: 0 4px 12px rgba(249,115,22,0.3);">
              <span style="position: absolute; bottom: -3px; right: -3px; background: #22C55E; color: white; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; border: 2px solid white; font-weight: 900;">✓</span>
            </div>
            <div>
              <div style="font-size: 13px; font-weight: 800; color: #9A3412;">Pratinjau Foto Pilihan</div>
              <div id="modalPreviewLabel" style="font-size: 11px; color: #C2410C; font-weight: 600;">Foto saat ini aktif</div>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button type="button" onclick="applyAvatarChoice(false)" class="btn-outline btn-sm" style="background: white; border-color: #FDBA74; color: #C2410C;">
              ✓ Gunakan Foto
            </button>
            <button type="button" onclick="applyAvatarChoice(true)" class="btn-primary btn-sm" style="font-size: 12px; padding: 7px 14px;">
              💾 Simpan Langsung
            </button>
          </div>
        </div>

        <!-- Modal Mode Tabs -->
        <div style="display: flex; gap: 6px; background: #F1F5F9; padding: 4px; border-radius: 12px; margin-bottom: 18px;">
          <button type="button" id="tabBtnPresets" onclick="switchAvatarTab('presets')" class="btn-outline btn-sm" style="flex: 1; border: none; background: #FFFFFF; color: #F97316; font-weight: 800; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
            🎨 Preset Avatar (12 Pilihan)
          </button>
          <button type="button" id="tabBtnUpload" onclick="switchAvatarTab('upload')" class="btn-outline btn-sm" style="flex: 1; border: none; background: transparent; color: #64748B; font-weight: 700;">
            💻 Upload Berkas
          </button>
          <button type="button" id="tabBtnUrl" onclick="switchAvatarTab('url')" class="btn-outline btn-sm" style="flex: 1; border: none; background: transparent; color: #64748B; font-weight: 700;">
            🔗 Tautan Gambar (URL)
          </button>
        </div>

        <!-- 1. PRESETS TAB PANEL -->
        <div id="panelPresets">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 12px; font-weight: 800; color: #475569;">PILIH AVATAR PROFESIONAL & ILUSTRASI:</span>
            <span style="font-size: 11px; color: #94A3B8;">Klik foto untuk memilih</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; max-height: 290px; overflow-y: auto; padding: 4px;" id="presetGrid">
            <!-- Populated by JavaScript -->
          </div>
        </div>

        <!-- 2. DIRECT FILE UPLOAD TAB PANEL -->
        <div id="panelUpload" style="display: none;">
          <div class="avatar-dropzone" id="avatarDropzone" onclick="document.getElementById('modalFileInput').click()">
            <input type="file" id="modalFileInput" accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml" style="display: none;" onchange="handleModalFileUpload(this.files[0], this)">
            <div style="font-size: 44px; margin-bottom: 8px;">☁️</div>
            <div style="font-size: 15px; font-weight: 800; color: #0F172A; margin-bottom: 4px;">Klik untuk memilih berkas atau seret foto ke sini</div>
            <div style="font-size: 12px; color: #64748B; margin-bottom: 14px;">Mendukung berkas JPG, PNG, WEBP, GIF, SVG (Maksimal 5MB)</div>
            <button type="button" class="btn-primary btn-sm" onclick="event.stopPropagation(); document.getElementById('modalFileInput').click();">
              📁 Pilih Berkas dari Komputer
            </button>
          </div>

          <div id="uploadFeedbackBox" style="display: none; margin-top: 14px; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 12px 16px; font-size: 13px; color: #166534; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 18px;">✅</span>
              <div>
                <div id="uploadFileName" style="font-weight: 800;">foto.jpg</div>
                <div id="uploadFileSize" style="font-size: 11px; color: #15803D;">Siap disimpan</div>
              </div>
            </div>
            <span class="badge badge-green" style="font-size: 11px;">Otomatis Dipotong Persegi</span>
          </div>
        </div>

        <!-- 3. CUSTOM IMAGE URL TAB PANEL -->
        <div id="panelUrl" style="display: none;">
          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px;">URL Gambar Publik (HTTPS)</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="modalUrlInput" placeholder="https://images.unsplash.com/... atau URL gambar lainnya" style="flex: 1;" onkeydown="if(event.key==='Enter'){event.preventDefault();testModalUrl();}">
              <button type="button" onclick="testModalUrl()" class="btn-dark btn-sm" style="padding: 0 16px;">Pratinjau</button>
            </div>
          </div>

          <div style="margin-bottom: 14px;">
            <span style="font-size: 11px; font-weight: 700; color: #64748B; display: block; margin-bottom: 6px;">CONTOH SUMBER FOTO CEPAT:</span>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              <button type="button" onclick="fillQuickUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80')" class="btn-outline btn-sm" style="font-size: 11px; padding: 4px 10px; background: white;">👩 Professional</button>
              <button type="button" onclick="fillQuickUrl('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80')" class="btn-outline btn-sm" style="font-size: 11px; padding: 4px 10px; background: white;">👨 Executive</button>
              <button type="button" onclick="fillQuickUrl('https://api.dicebear.com/7.x/bottts/svg?seed=TataDana1&backgroundColor=ffedd5')" class="btn-outline btn-sm" style="font-size: 11px; padding: 4px 10px; background: white;">🤖 3D Bot</button>
              <button type="button" onclick="fillQuickUrl('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=fed7aa')" class="btn-outline btn-sm" style="font-size: 11px; padding: 4px 10px; background: white;">🎨 3D Avatar</button>
            </div>
          </div>

          <div id="urlErrorNotice" style="display: none; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 10px; padding: 10px 14px; font-size: 12px; color: #991B1B;">
            ⚠️ URL gambar tidak dapat diakses atau format tidak valid. Pastikan tautan langsung mengarah ke file gambar.
          </div>
        </div>

        <!-- Modal Bottom Actions -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 22px; border-top: 1px solid #E2E8F0; padding-top: 16px;">
          <button type="button" onclick="closeAvatarModal()" class="btn-outline" style="padding: 10px 18px;">Tutup</button>
          <div style="display: flex; gap: 8px;">
            <button type="button" onclick="applyAvatarChoice(false)" class="btn-outline" style="font-weight: 800; padding: 10px 18px; border-color: #F97316; color: #C2410C;">
              ✓ Terapkan ke Form
            </button>
            <button type="button" onclick="applyAvatarChoice(true)" class="btn-primary" style="padding: 10px 22px;">
              💾 Simpan Permanen
            </button>
          </div>
        </div>

      </div>
    </div>

    <script>
      // =========================================================================
      // AVATAR PRESETS DATA & MANAGEMENT
      // =========================================================================
      const AVATAR_PRESETS = [
        { name: 'Budi P.', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80', tag: 'Tech Lead' },
        { name: 'Siti R.', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80', tag: 'Analyst' },
        { name: 'Reza K.', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80', tag: 'Manager' },
        { name: 'Hendro W.', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80', tag: 'Director' },
        { name: 'Dewi L.', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80', tag: 'Finance' },
        { name: 'Aris T.', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80', tag: 'Engineer' },
        { name: 'Nadia M.', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80', tag: 'Founder' },
        { name: 'Dimas S.', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80', tag: 'Architect' },
        { name: 'FinBot 3D', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=TataDana1&backgroundColor=ffedd5', tag: 'AI Bot' },
        { name: 'Smart Saver', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=fed7aa', tag: '3D Pro' },
        { name: 'Investor Pro', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=fef3c7', tag: '3D Elite' },
        { name: 'Cyber Fin', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&backgroundColor=e0f2fe', tag: 'Nomad' }
      ];

      let currentSelectedAvatar = ${JSON.stringify(activeUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80')};

      function renderPresetGrid() {
        const grid = document.getElementById('presetGrid');
        if (!grid) return;
        const currentVal = (document.getElementById('profAvatar') && document.getElementById('profAvatar').value) || currentSelectedAvatar;
        grid.innerHTML = AVATAR_PRESETS.map(function(p) {
          const isSelected = currentVal === p.url;
          return '<div class="avatar-preset-card ' + (isSelected ? 'selected' : '') + '" onclick="selectPreset(\'' + p.url + '\', \'' + p.name.replace(/'/g, "\\'") + '\', this)">' +
            '<img src="' + p.url + '" alt="' + p.name + '" loading="lazy">' +
            '<div style="font-size: 11px; font-weight: 800; color: #0F172A; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">' + p.name + '</div>' +
            '<span style="font-size: 9px; padding: 1px 6px; border-radius: 999px; background: #F1F5F9; color: #64748B; font-weight: 700;">' + p.tag + '</span>' +
          '</div>';
        }).join('');
      }

      function openAvatarModal(tab) {
        tab = tab || 'presets';
        const modal = document.getElementById('avatarModal');
        if (!modal) return;
        modal.classList.add('active');
        const inputVal = document.getElementById('profAvatar') ? document.getElementById('profAvatar').value.trim() : '';
        if (inputVal) {
          currentSelectedAvatar = inputVal;
          const prev = document.getElementById('modalPreviewImg');
          if (prev) prev.src = inputVal;
        }
        renderPresetGrid();
        switchAvatarTab(tab);
      }

      function closeAvatarModal() {
        const modal = document.getElementById('avatarModal');
        if (modal) modal.classList.remove('active');
      }

      function switchAvatarTab(tabName) {
        const panels = {
          presets: document.getElementById('panelPresets'),
          upload: document.getElementById('panelUpload'),
          url: document.getElementById('panelUrl')
        };
        const buttons = {
          presets: document.getElementById('tabBtnPresets'),
          upload: document.getElementById('tabBtnUpload'),
          url: document.getElementById('tabBtnUrl')
        };

        Object.keys(panels).forEach(function(key) {
          if (panels[key]) panels[key].style.display = key === tabName ? 'block' : 'none';
          if (buttons[key]) {
            if (key === tabName) {
              buttons[key].style.background = '#FFFFFF';
              buttons[key].style.color = '#F97316';
              buttons[key].style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)';
            } else {
              buttons[key].style.background = 'transparent';
              buttons[key].style.color = '#64748B';
              buttons[key].style.boxShadow = 'none';
            }
          }
        });
      }

      function selectPreset(url, name, cardEl) {
        currentSelectedAvatar = url;
        const prev = document.getElementById('modalPreviewImg');
        if (prev) prev.src = url;
        const lbl = document.getElementById('modalPreviewLabel');
        if (lbl) lbl.innerText = 'Preset: ' + name;
        document.querySelectorAll('.avatar-preset-card').forEach(function(c) { c.classList.remove('selected'); });
        if (cardEl) cardEl.classList.add('selected');
      }

      function triggerDirectUpload() {
        const input = document.getElementById('directFileInput');
        if (input) input.click();
      }

      function handleDirectFileSelect(file, inputEl) {
        if (!file) return;
        processImageFile(file, function(dataUrl) {
          currentSelectedAvatar = dataUrl;
          applyAvatarChoice(false);
          const indicator = document.getElementById('saveStatusIndicator');
          if (indicator) {
            indicator.style.display = 'inline';
            indicator.style.color = '#C2410C';
            indicator.innerText = '✓ Foto terpilih dari berkas. Klik Simpan Perubahan Profil.';
          }
        });
        if (inputEl) inputEl.value = '';
      }

      function handleModalFileUpload(file, inputEl) {
        if (!file) return;
        processImageFile(file, function(dataUrl) {
          currentSelectedAvatar = dataUrl;
          const prev = document.getElementById('modalPreviewImg');
          if (prev) prev.src = dataUrl;
          const lbl = document.getElementById('modalPreviewLabel');
          if (lbl) lbl.innerText = 'Upload: ' + file.name;
          const fbBox = document.getElementById('uploadFeedbackBox');
          if (fbBox) {
            fbBox.style.display = 'flex';
            const fn = document.getElementById('uploadFileName');
            if (fn) fn.innerText = file.name;
            const fs = document.getElementById('uploadFileSize');
            if (fs) fs.innerText = 'Dioptimalkan persegi (' + Math.round(dataUrl.length / 1024) + ' KB)';
          }
        });
        if (inputEl) inputEl.value = '';
      }

      function processImageFile(file, callback) {
        if (!file || !file.type.startsWith('image/')) {
          alert('Mohon pilih berkas gambar valid (JPG, PNG, WEBP, GIF, SVG).');
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          alert('Ukuran berkas terlalu besar. Maksimal 10MB.');
          return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
          const rawUrl = e.target.result;
          const img = new Image();
          img.onload = function() {
            try {
              const canvas = document.createElement('canvas');
              const targetSize = 280;
              canvas.width = targetSize;
              canvas.height = targetSize;
              const ctx = canvas.getContext('2d');

              // White background fill prevents black boxes on transparent PNG/SVG
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, targetSize, targetSize);

              // Centered square cropping
              const minDim = Math.min(img.width, img.height);
              const sx = (img.width - minDim) / 2;
              const sy = (img.height - minDim) / 2;
              ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);

              const outputType = (file.type === 'image/png') ? 'image/png' : 'image/jpeg';
              const optimizedDataUrl = canvas.toDataURL(outputType, 0.90);
              if (callback) callback(optimizedDataUrl);
            } catch (err) {
              if (callback) callback(rawUrl);
            }
          };
          img.onerror = function() {
            if (callback) callback(rawUrl);
          };
          img.src = rawUrl;
        };
        reader.readAsDataURL(file);
      }

      function syncAvatarFromInput(url) {
        if (!url || !url.trim()) return;
        currentSelectedAvatar = url.trim();
        const mainPrev = document.getElementById('avatarPreview');
        if (mainPrev) mainPrev.src = currentSelectedAvatar;
        const modPrev = document.getElementById('modalPreviewImg');
        if (modPrev) modPrev.src = currentSelectedAvatar;
      }

      function previewCurrentInput() {
        const val = document.getElementById('profAvatar') ? document.getElementById('profAvatar').value.trim() : '';
        if (!val) {
          alert('Silakan masukkan URL gambar terlebih dahulu.');
          return;
        }
        syncAvatarFromInput(val);
      }

      function testModalUrl() {
        const val = document.getElementById('modalUrlInput') ? document.getElementById('modalUrlInput').value.trim() : '';
        const errNotice = document.getElementById('urlErrorNotice');
        if (!val) {
          if (errNotice) { errNotice.style.display = 'block'; errNotice.innerText = '⚠️ Silakan masukkan URL gambar.'; }
          return;
        }
        if (!val.startsWith('http://') && !val.startsWith('https://') && !val.startsWith('data:image/')) {
          if (errNotice) { errNotice.style.display = 'block'; errNotice.innerText = '⚠️ Format URL tidak valid. Gunakan tautan HTTPS atau Data URL.'; }
          return;
        }
        const testImg = new Image();
        testImg.onload = function() {
          if (errNotice) errNotice.style.display = 'none';
          currentSelectedAvatar = val;
          const prev = document.getElementById('modalPreviewImg');
          if (prev) prev.src = val;
          const lbl = document.getElementById('modalPreviewLabel');
          if (lbl) lbl.innerText = '✓ URL Gambar Valid';
        };
        testImg.onerror = function() {
          if (errNotice) {
            errNotice.style.display = 'block';
            errNotice.innerText = '⚠️ URL gambar tidak dapat diakses atau format tidak valid.';
          }
        };
        testImg.src = val;
      }

      function fillQuickUrl(url) {
        const inp = document.getElementById('modalUrlInput');
        if (inp) inp.value = url;
        testModalUrl();
      }

      function applyAvatarChoice(autoSave) {
        if (!currentSelectedAvatar) return;
        const inputEl = document.getElementById('profAvatar');
        if (inputEl) inputEl.value = currentSelectedAvatar;

        updateDomAvatars(currentSelectedAvatar);
        closeAvatarModal();

        if (autoSave) {
          saveProfile(function() {
            const indicator = document.getElementById('saveStatusIndicator');
            if (indicator) {
              indicator.style.display = 'inline';
              indicator.style.color = '#166534';
              indicator.innerText = '✓ Foto profil baru berhasil disimpan!';
            }
          });
        } else {
          const indicator = document.getElementById('saveStatusIndicator');
          if (indicator) {
            indicator.style.display = 'inline';
            indicator.style.color = '#C2410C';
            indicator.innerText = '✓ Foto siap disimpan. Klik tombol Simpan Perubahan Profil di bawah.';
          }
        }
      }

      function resetToDefaultAvatar() {
        const defaultUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80';
        currentSelectedAvatar = defaultUrl;
        if (document.getElementById('profAvatar')) document.getElementById('profAvatar').value = defaultUrl;
        if (document.getElementById('modalPreviewImg')) document.getElementById('modalPreviewImg').src = defaultUrl;
        updateDomAvatars(defaultUrl);
        const indicator = document.getElementById('saveStatusIndicator');
        if (indicator) {
          indicator.style.display = 'inline';
          indicator.style.color = '#C2410C';
          indicator.innerText = '✓ Foto direset ke default. Klik Simpan Perubahan Profil.';
        }
      }

      function updateDomAvatars(url) {
        if (!url) return;
        document.querySelectorAll('#topNavAvatar, .top-nav-avatar').forEach(function(img) { img.src = url; });
        document.querySelectorAll('#sidebarAvatar, .sidebar-avatar').forEach(function(img) { img.src = url; });
        document.querySelectorAll('#avatarPreview').forEach(function(img) { img.src = url; });
      }

      function saveProfile(onSuccess) {
        const btn = document.getElementById('btnSaveProfile');
        if (btn) { btn.innerHTML = '<span>⏳</span> <span>Menyimpan...</span>'; btn.disabled = true; }

        const avatarVal = document.getElementById('profAvatar') ? document.getElementById('profAvatar').value.trim() : (currentSelectedAvatar || '');
        const nameVal = document.getElementById('profName') ? document.getElementById('profName').value.trim() : '';
        const phoneVal = document.getElementById('profPhone') ? document.getElementById('profPhone').value.trim() : '';
        const occVal = document.getElementById('profOccupation') ? document.getElementById('profOccupation').value.trim() : '';
        const cityVal = document.getElementById('profCity') ? document.getElementById('profCity').value.trim() : '';
        const bioVal = document.getElementById('profBio') ? document.getElementById('profBio').value.trim() : '';
        const curVal = document.getElementById('profCurrency') ? document.getElementById('profCurrency').value : 'IDR';

        const payload = {
          userId: '${activeUser.id}',
          avatarUrl: avatarVal,
          defaultCurrency: curVal,
          occupation: occVal,
          city: cityVal,
          bio: bioVal
        };
        if (nameVal) payload.fullName = nameVal;
        if (phoneVal) payload.phone = phoneVal;

        fetch('/api/user/profile', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
        }).then(function(r) { return r.json(); }).then(function(d) {
          if (btn) { btn.innerHTML = '<span>💾</span> <span>Simpan Perubahan Profil</span>'; btn.disabled = false; }
          if (d.ok) {
            const savedAvatar = (d.user && d.user.avatarUrl) ? d.user.avatarUrl : avatarVal;
            currentSelectedAvatar = savedAvatar;
            updateDomAvatars(savedAvatar);

            // Live update display name across DOM
            if (d.user && d.user.fullName) {
              document.querySelectorAll('.user-display-name').forEach(function(el) {
                const isCrown = el.innerText.includes('👑');
                el.innerText = (isCrown ? '👑 ' : '👤 ') + d.user.fullName.split(' ')[0];
              });
              document.querySelectorAll('.user-full-name-display').forEach(function(el) {
                el.innerText = d.user.fullName;
              });
            }

            const indicator = document.getElementById('saveStatusIndicator');
            if (indicator) {
              indicator.style.display = 'inline-block';
              indicator.style.color = '#166534';
              indicator.style.background = '#F0FDF4';
              indicator.style.border = '1px solid #BBF7D0';
              indicator.innerText = '✓ Profil & foto berhasil diperbarui permanen!';
              setTimeout(function() { indicator.style.display = 'none'; }, 4000);
            }
            if (typeof onSuccess === 'function') onSuccess();
          } else {
            alert('Gagal menyimpan profil: ' + (d.error || 'Terjadi kesalahan'));
          }
        }).catch(function(err) {
          if (btn) { btn.innerHTML = '<span>💾</span> <span>Simpan Perubahan Profil</span>'; btn.disabled = false; }
          alert('Terjadi kesalahan jaringan: ' + err.message);
        });
      }

      // Initialize Dropzone drag and drop and Preset Grid
      function initAvatarPage() {
        renderPresetGrid();
        const dropzone = document.getElementById('avatarDropzone');
        if (dropzone) {
          ['dragenter', 'dragover'].forEach(function(eventName) {
            dropzone.addEventListener(eventName, function(e) {
              e.preventDefault();
              e.stopPropagation();
              dropzone.classList.add('dragover');
            });
          });
          ['dragleave', 'dragend'].forEach(function(eventName) {
            dropzone.addEventListener(eventName, function(e) {
              e.preventDefault();
              e.stopPropagation();
              dropzone.classList.remove('dragover');
            });
          });
          dropzone.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('dragover');
            const dt = e.dataTransfer;
            const files = dt && dt.files;
            if (files && files.length > 0) {
              handleModalFileUpload(files[0], document.getElementById('modalFileInput'));
            }
          });
        }

        // Close modal on Escape key
        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape') closeAvatarModal();
        });
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAvatarPage);
      } else {
        initAvatarPage();
      }

      function testTelegramConnection() {
        const btn = document.getElementById('btnTestTg');
        const resBox = document.getElementById('testResultBox');
        btn.innerText = '⏳ Testing koneksi & mendaftarkan Webhook...';
        btn.disabled = true;

        fetch('/api/telegram/test-connection', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ token: document.getElementById('tgToken').value })
        })
        .then(r => r.json())
        .then(d => {
          btn.innerText = '⚡ Test Koneksi & Pasang Webhook';
          btn.disabled = false;
          resBox.style.display = 'block';
          if (d.ok) {
            resBox.style.background = '#F0FDF4';
            resBox.style.color = '#166534';
            resBox.style.border = '1px solid #BBF7D0';
            resBox.innerText = '✓ ' + d.message;
          } else {
            resBox.style.background = '#FEF2F2';
            resBox.style.color = '#991B1B';
            resBox.style.border = '1px solid #FECACA';
            resBox.innerText = '✗ Error: ' + d.error;
          }
        });
      }
    </script>
  `;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

// ==============================================================================
// 8. UPGRADE CHECKOUT PAGE (Tugas 5: Metode Pembayaran Modular)
// ==============================================================================

function renderUpgradePage(req, res, sessionUser, query = {}) {
  const { activeUser, isViewAsMode } = getActiveUser(req, sessionUser, query);

  const html = `
    ${getHtmlHeader(`TataDana — Upgrade ke Pro (${activeUser.fullName})`)}
    ${renderGlobalHubNav('/dashboard/upgrade', sessionUser)}
    ${isViewAsMode ? renderViewAsBanner(activeUser) : ''}

    <div style="display: flex; min-height: calc(100vh - 54px);">
      ${renderUserSidebar('/dashboard/upgrade', activeUser, isViewAsMode)}

      <main style="flex: 1; padding: 28px; max-width: 900px; margin: 0 auto; width: 100%;">
        <div style="text-align: center; margin-bottom: 30px;">
          <span class="badge badge-green" style="margin-bottom: 10px;">UPGRADE SEUMUR HIDUP</span>
          <h1 style="font-size: 28px; font-weight: 900; color: #0F172A; margin-bottom: 6px;">Upgrade ke Paket Pro</h1>
          <p style="font-size: 14px; color: #64748B;">Nikmati seluruh keunggulan AI TataDana tanpa batasan seumur hidup.</p>
        </div>

        <div class="card" style="border: 2px solid #F97316; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid #E2E8F0; padding-bottom: 14px;">
            <div>
              <h3 style="font-size: 20px; font-weight: 900; color: #0F172A;">TataDana Pro Lifetime</h3>
              <p style="font-size: 13px; color: #64748B;">Sekali bayar untuk penggunaan selamanya.</p>
            </div>
            <div style="font-size: 28px; font-weight: 900; color: #F97316;">Rp99.000</div>
          </div>

          <!-- Pilihan Metode Pembayaran Modular (Tugas 5) -->
          <div style="font-size: 13px; font-weight: 800; color: #475569; margin-bottom: 12px; text-transform: uppercase;">
            Pilih Metode Pembayaran:
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
            <label style="border: 2px solid #F97316; padding: 14px; border-radius: 12px; display: flex; align-items: center; gap: 10px; cursor: pointer;">
              <input type="radio" name="payMethod" value="Midtrans Snap (QRIS All E-Wallet)" checked>
              <div>
                <div style="font-weight: 800; font-size: 13px;">Midtrans Snap</div>
                <div style="font-size: 11px; color: #64748B;">QRIS GoPay, OVO, ShopeePay, Dana</div>
              </div>
            </label>

            <label style="border: 2px solid #E2E8F0; padding: 14px; border-radius: 12px; display: flex; align-items: center; gap: 10px; cursor: pointer;">
              <input type="radio" name="payMethod" value="SeaBank Instant Transfer">
              <div>
                <div style="font-weight: 800; font-size: 13px; color: #FF5722;">SeaBank Instant</div>
                <div style="font-size: 11px; color: #64748B;">Transfer langsung & SeaBank VA</div>
              </div>
            </label>

            <label style="border: 2px solid #E2E8F0; padding: 14px; border-radius: 12px; display: flex; align-items: center; gap: 10px; cursor: pointer;">
              <input type="radio" name="payMethod" value="BCA Virtual Account">
              <div>
                <div style="font-weight: 800; font-size: 13px; color: #00529C;">BCA Virtual Account</div>
                <div style="font-size: 11px; color: #64748B;">Verifikasi otomatis 24 jam</div>
              </div>
            </label>

            <label style="border: 2px solid #E2E8F0; padding: 14px; border-radius: 12px; display: flex; align-items: center; gap: 10px; cursor: pointer;">
              <input type="radio" name="payMethod" value="Mandiri Bill Payment">
              <div>
                <div style="font-weight: 800; font-size: 13px; color: #003366;">Mandiri Bill Payment</div>
                <div style="font-size: 11px; color: #64748B;">Via Livin' by Mandiri</div>
              </div>
            </label>

            <label style="border: 2px solid #E2E8F0; padding: 14px; border-radius: 12px; display: flex; align-items: center; gap: 10px; cursor: pointer;">
              <input type="radio" name="payMethod" value="Cashless E-Wallet (GoPay, OVO, ShopeePay, Dana)">
              <div>
                <div style="font-weight: 800; font-size: 13px; color: #8B5CF6;">E-Wallet Direct</div>
                <div style="font-size: 11px; color: #64748B;">GoPay, OVO, ShopeePay, Dana</div>
              </div>
            </label>

            <label style="border: 2px solid #E2E8F0; padding: 14px; border-radius: 12px; display: flex; align-items: center; gap: 10px; cursor: pointer;">
              <input type="radio" name="payMethod" value="Uang Tunai / Cash (Gerai Retail)">
              <div>
                <div style="font-weight: 800; font-size: 13px; color: #10B981;">Cash / Uang Tunai</div>
                <div style="font-size: 11px; color: #64748B;">Indomaret, Alfamart, Kasir</div>
              </div>
            </label>

            <label style="border: 2px solid #E2E8F0; padding: 14px; border-radius: 12px; display: flex; align-items: center; gap: 10px; cursor: pointer; grid-column: span 2;">
              <input type="radio" name="payMethod" value="Transfer Bank Manual (BCA / Mandiri / BNI)">
              <div>
                <div style="font-weight: 800; font-size: 13px;">Transfer Bank Manual</div>
                <div style="font-size: 11px; color: #64748B;">Approval verifikasi dari admin dashboard</div>
              </div>
            </label>
          </div>

          <button onclick="processCheckout()" class="btn-primary" style="width: 100%; padding: 14px; font-size: 15px;">
            Bayar Sekarang Rp99.000 💳
          </button>
        </div>
      </main>
    </div>

    <script>
      function processCheckout() {
        const method = document.querySelector('input[name="payMethod"]:checked').value;
        fetch('/api/payments/create-order', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ method: method, amount: 99000 })
        })
        .then(r => r.json())
        .then(d => {
          alert('Pesanan pembayaran dibuat! Nomor Referensi: ' + d.order.referenceNumber + '\\n\\nSimulasi pembayaran sukses: Akun Anda otomatis di-upgrade ke PRO!');
          window.location.href = '/dashboard';
        });
      }
    </script>
  `;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

// Modal Form HTML for Adding Transactions
function renderTxModalHtml(activeUser, userWallets) {
  return `
    <div id="txModal" class="modal-overlay" onclick="if(event.target===this) closeTxModal()">
      <div class="modal-content" style="max-width: 480px;">
        <h3 style="font-size: 18px; font-weight: 900; margin-bottom: 16px;">+ Catat Transaksi Baru</h3>
        <form onsubmit="event.preventDefault(); submitTx();" style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px;">Tipe Transaksi</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <label style="border: 2px solid #EF4444; padding: 10px; border-radius: 10px; text-align: center; cursor: pointer;">
                <input type="radio" name="txType" value="expense" checked> Pengeluaran
              </label>
              <label style="border: 2px solid #10B981; padding: 10px; border-radius: 10px; text-align: center; cursor: pointer;">
                <input type="radio" name="txType" value="income"> Pemasukan
              </label>
            </div>
          </div>

          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px;">Nominal (Rp)</label>
            <input type="number" id="txAmount" placeholder="Misal: 50000" required>
          </div>

          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px;">Deskripsi / Catatan</label>
            <input type="text" id="txDesc" placeholder="Misal: Makan Siang Nasi Padang" required>
          </div>

          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px;">Kategori</label>
            <select id="txCat">
              <option value="🍜 Makanan & Minuman">🍜 Makanan & Minuman</option>
              <option value="🚗 Transportasi">🚗 Transportasi</option>
              <option value="🎮 Hiburan">🎮 Hiburan</option>
              <option value="🏠 Tagihan & Utilitas">🏠 Tagihan & Utilitas</option>
              <option value="👕 Belanja">👕 Belanja</option>
              <option value="💊 Kesehatan">💊 Kesehatan</option>
              <option value="💰 Gaji Bulanan">💰 Gaji Bulanan</option>
            </select>
          </div>

          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px;">Metode Pembayaran / Dompet</label>
            <select id="txWallet">
              ${userWallets.length > 0 ? `
                <optgroup label="💼 Dompet Saya yang Terdaftar">
                  ${userWallets.map(w => `<option value="${w.name}">${w.name} (${formatIDR(w.balance)})</option>`).join('')}
                </optgroup>
              ` : ''}
              <optgroup label="💵 Uang Tunai (Cash)">
                <option value="Uang Tunai (Cash)">Uang Tunai (Cash fisik)</option>
              </optgroup>
              <optgroup label="🏦 Cashless Bank Transfer">
                <option value="BCA">BCA (Bank Central Asia)</option>
                <option value="Mandiri">Bank Mandiri</option>
                <option value="SeaBank">SeaBank Indonesia</option>
                <option value="BNI">BNI (Bank Negara Indonesia)</option>
                <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                <option value="Bank Jago">Bank Jago</option>
              </optgroup>
              <optgroup label="📱 Cashless E-Wallet & QRIS">
                <option value="GoPay">GoPay</option>
                <option value="OVO">OVO</option>
                <option value="ShopeePay">ShopeePay</option>
                <option value="Dana">Dana</option>
                <option value="QRIS">QRIS Nasional</option>
              </optgroup>
            </select>
          </div>

          <div style="display: flex; gap: 10px; margin-top: 10px;">
            <button type="button" onclick="closeTxModal()" class="btn-outline" style="flex: 1;">Batal</button>
            <button type="submit" class="btn-primary" style="flex: 1;">Simpan Transaksi</button>
          </div>
        </form>
      </div>
    </div>

    <script>
      function openTxModal() { document.getElementById('txModal').classList.add('active'); }
      function closeTxModal() { document.getElementById('txModal').classList.remove('active'); }
      function submitTx() {
        const type = document.querySelector('input[name="txType"]:checked').value;
        const amount = parseInt(document.getElementById('txAmount').value, 10);
        const desc = document.getElementById('txDesc').value;
        const cat = document.getElementById('txCat').value;
        const wallet = document.getElementById('txWallet').value;

        fetch('/api/transactions/create', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ type, amount, desc, cat, wallet })
        }).then(() => window.location.reload());
      }
    </script>
  `;
}

module.exports = {
  renderDashboardOverview,
  renderTransactionsPage,
  renderReportsPage,
  renderBudgetPage,
  renderWalletPage,
  renderAiChatPage,
  renderSettingsPage,
  renderUpgradePage
};
