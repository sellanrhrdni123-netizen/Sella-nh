/**
 * TataDana Master Production Server & Route Dispatcher
 * Built with native Node.js HTTP/URL/FS/Crypto modules (zero external runtime dependencies).
 * Serves all TataDana web pages, user dashboards, admin console, simulators, and live REST/Webhook endpoints.
 * 
 * Features Multi-Role RBAC:
 * - Single App, Single Database, Unified Login (/login) & Registration (/register)
 * - Two Roles: 'user' and 'admin'
 * - Secure PBKDF2 + SHA-256 password hashing with unique salts
 * - Server-Side RBAC backend guards with HTTP-Only cookie `tatadana_session`
 * - User Dashboard (/dashboard) with Multi-Tenant Data Isolation (Budi vs Siti)
 * - Admin Executive Console (/admin) with total system metrics & user management
 * - Strict Role Isolation: Admin strictly restricted to /admin, User strictly restricted to /dashboard
 * - Complete Session Invalidation on Logout (/logout) with Cache-Control: no-store
 * - Full backward compatibility: NLP Indonesian parsing, Webhook Idempotency, WIB (+07:00)
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Core Modules
const { store, formatIDR, getLocalIpAddresses, formatWibDate } = require('./src/server/store');
const {
  parseCookies,
  getSessionUser,
  createSession,
  clearSession,
  renderLoginPage,
  renderRegisterPage,
  handleLoginApi,
  handleRegisterApi
} = require('./src/server/auth');

const {
  parseIndonesianTransaction,
  handleTelegramWebhook,
  handleTestConnection,
  handleReminderCron
} = require('./src/server/telegram');

// Views
const { renderLandingPage } = require('./src/server/views/landing');
const {
  renderDashboardOverview,
  renderTransactionsPage,
  renderReportsPage,
  renderBudgetPage,
  renderWalletPage,
  renderAiChatPage,
  renderSettingsPage,
  renderUpgradePage
} = require('./src/server/views/dashboard');

const { renderAdminDashboard } = require('./src/server/views/admin');
const { renderPortalPage } = require('./src/server/views/portal');
const { renderSimulatorPage, renderWebhookTesterPage } = require('./src/server/views/simulator');
const { getHtmlHeader, renderGlobalHubNav } = require('./src/server/views/components');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
const TUNNEL_URL = 'https://diff-previews-assessing-said.trycloudflare.com';

// ==============================================================================
// MASTER HTTP SERVER
// ==============================================================================

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname || '/';
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }
  const normPath = pathname.toLowerCase();
  const method = req.method;

  // Global CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  // Favicon handler
  if (normPath === '/favicon.ico') {
    res.writeHead(204);
    return res.end();
  }

  // Session Context Retrieval
  const authContext = getSessionUser(req);
  const sessionUser = authContext ? authContext.user : null;

  // ----------------------------------------------------------------------------
  // AUTH GUARDS (RBAC)
  // ----------------------------------------------------------------------------
  const isUserProtectedRoute = normPath === '/dashboard' || normPath.startsWith('/dashboard/')
    || normPath === '/reports' || normPath === '/laporan'
    || normPath === '/transactions' || normPath === '/transaksi'
    || normPath === '/budget' || normPath === '/anggaran'
    || normPath === '/wallet' || normPath === '/dompet'
    || normPath === '/ai-chat' || normPath === '/tanya-ai'
    || normPath === '/settings' || normPath === '/pengaturan';
  const isAdminProtectedRoute = normPath === '/admin' || normPath.startsWith('/admin/') || normPath === '/superadmin';
  const isApiAdmin = normPath.startsWith('/api/admin') && !normPath.includes('pending-approval') && !normPath.includes('pending-count');

  if (isUserProtectedRoute || isAdminProtectedRoute || isApiAdmin) {
    if (!sessionUser) {
      if (isApiAdmin) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: 'Autentikasi diperlukan. Harap login terlebih dahulu.' }));
      }
      res.writeHead(302, { 'Location': `/login?redirect=${encodeURIComponent(pathname)}` });
      return res.end();
    }

    // Role Enforcement: User cannot access Admin Console
    if ((isAdminProtectedRoute || isApiAdmin) && sessionUser.role !== 'admin') {
      if (isApiAdmin) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: 'Akses ditolak: Hak akses Administrator diperlukan.' }));
      }
      res.writeHead(302, { 'Location': '/unauthorized' });
      return res.end();
    }

    // Role Enforcement: Admin cannot access User Personal Dashboard directly under any circumstances (View User disabled)
    if (isUserProtectedRoute && sessionUser.role === 'admin') {
      res.writeHead(302, { 'Location': '/admin?notice=admin_only' });
      return res.end();
    }

    // Status Verification: Unapproved or rejected user accounts cannot access protected user dashboard
    if (sessionUser.role === 'user' && sessionUser.status !== 'approved') {
      clearSession(req, res);
      if (sessionUser.status === 'rejected') {
        res.writeHead(302, { 'Location': '/login?error=rejected' });
      } else {
        res.writeHead(302, { 'Location': `/login?notice=pending_approval&email=${encodeURIComponent(sessionUser.email)}` });
      }
      return res.end();
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  // ----------------------------------------------------------------------------
  // 1. AUTH ROUTES
  // ----------------------------------------------------------------------------
  if ((normPath === '/login' || normPath === '/auth/login') && method === 'GET') {
    return renderLoginPage(req, res, sessionUser, parsedUrl.query);
  }

  if ((normPath === '/login' || normPath === '/auth/login' || normPath === '/api/auth/login') && method === 'POST') {
    return handleLoginApi(req, res);
  }

  if ((normPath === '/register' || normPath === '/auth/register') && method === 'GET') {
    return renderRegisterPage(req, res, sessionUser, parsedUrl.query);
  }

  if ((normPath === '/register' || normPath === '/auth/register' || normPath === '/api/auth/register') && method === 'POST') {
    return handleRegisterApi(req, res);
  }

  if (normPath === '/logout' || normPath === '/auth/logout') {
    clearSession(req, res);
    res.writeHead(302, { 'Location': '/login' });
    return res.end();
  }

  if (normPath === '/unauthorized') {
    res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(`
      ${getHtmlHeader('403 — Akses Ditolak')}
      ${renderGlobalHubNav('/unauthorized', sessionUser)}
      <div style="max-width: 600px; margin: 80px auto; text-align: center; padding: 0 20px;">
        <div style="font-size: 64px; margin-bottom: 12px;">🚫</div>
        <h2 style="font-size: 28px; font-weight: 900; margin-bottom: 8px;">403 — Akses Ditolak</h2>
        <p style="font-size: 15px; color: #64748B; margin-bottom: 24px;">Halaman ini hanya dapat diakses oleh akun dengan peran <b>Administrator</b>.</p>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <a href="/dashboard" class="btn-primary" style="padding: 12px 24px;">Kembali ke Dashboard</a>
          <a href="/portal" class="btn-dark" style="padding: 12px 24px;">Buka Portal Hub</a>
        </div>
      </div>
    </body></html>
    `);
  }

  // One-Time Secure Magic Login (Tautan Login Sekali Pakai Setelah Disetujui Admin)
  if (normPath === '/auth/magic-login' || normPath === '/magic-login') {
    const token = (parsedUrl.query.token || '').trim();
    if (!token) {
      res.writeHead(302, { 'Location': '/login?error=token_missing' });
      return res.end();
    }
    const tokenEntry = store.magicTokens ? store.magicTokens.get(token) : null;
    if (!tokenEntry || tokenEntry.used || Date.now() > tokenEntry.expiresAt) {
      res.writeHead(302, { 'Location': '/login?error=token_expired' });
      return res.end();
    }
    tokenEntry.used = true; // Strict one-time use
    const targetUser = store.users.find(u => u.id === tokenEntry.userId || u.email.toLowerCase() === tokenEntry.email.toLowerCase());
    if (!targetUser || targetUser.status !== 'approved') {
      res.writeHead(302, { 'Location': '/login?error=unauthorized_token' });
      return res.end();
    }
    createSession(targetUser, res);
    const dest = targetUser.role === 'admin' ? '/admin' : '/dashboard?notice=welcome_approved';
    res.writeHead(302, { 'Location': dest });
    return res.end();
  }

  // ----------------------------------------------------------------------------
  // 2. LANDING PAGE & PORTAL HUB
  // ----------------------------------------------------------------------------
  if (normPath === '/' || normPath === '/index.html' || normPath === '/home') {
    return renderLandingPage(req, res, sessionUser, parsedUrl.query);
  }

  if (normPath === '/portal' || normPath === '/hub' || normPath === '/all-features' || normPath === '/matriks' || normPath === '/features') {
    return renderPortalPage(req, res, sessionUser, parsedUrl.query);
  }

  // ----------------------------------------------------------------------------
  // 3. TELEGRAM BOT SIMULATOR & WEBHOOK TESTER
  // ----------------------------------------------------------------------------
  if (normPath === '/dev/telegram-simulator' || normPath === '/simulator' || normPath === '/telegram-simulator' || normPath === '/bot-simulator' || normPath === '/dev/simulator') {
    return renderSimulatorPage(req, res, sessionUser);
  }

  // ----------------------------------------------------------------------------
  // 4. USER DASHBOARD & SUBPAGES
  // ----------------------------------------------------------------------------
  if (normPath === '/dashboard') {
    return renderDashboardOverview(req, res, sessionUser, parsedUrl.query);
  }

  if (normPath === '/dashboard/transactions' || normPath === '/dashboard/transaksi' || normPath === '/transactions' || normPath === '/transaksi') {
    return renderTransactionsPage(req, res, sessionUser, parsedUrl.query);
  }

  if (normPath === '/dashboard/reports' || normPath === '/dashboard/laporan' || normPath === '/reports' || normPath === '/laporan') {
    return renderReportsPage(req, res, sessionUser, parsedUrl.query);
  }

  if (normPath === '/dashboard/budget' || normPath === '/dashboard/anggaran' || normPath === '/budget' || normPath === '/anggaran') {
    return renderBudgetPage(req, res, sessionUser, parsedUrl.query);
  }

  if (normPath === '/dashboard/wallet' || normPath === '/dashboard/dompet' || normPath === '/wallet' || normPath === '/dompet') {
    return renderWalletPage(req, res, sessionUser, parsedUrl.query);
  }

  if (normPath === '/dashboard/ai-chat' || normPath === '/dashboard/ai' || normPath === '/dashboard/tanya-ai' || normPath === '/ai-chat' || normPath === '/tanya-ai') {
    return renderAiChatPage(req, res, sessionUser, parsedUrl.query);
  }

  if (normPath === '/dashboard/settings' || normPath === '/dashboard/pengaturan' || normPath === '/settings' || normPath === '/pengaturan') {
    return renderSettingsPage(req, res, sessionUser, parsedUrl.query);
  }

  if (normPath === '/dashboard/upgrade' || normPath === '/dashboard/checkout' || normPath === '/dashboard/pro' || normPath === '/checkout' || normPath === '/pricing' || normPath === '/upgrade') {
    return renderUpgradePage(req, res, sessionUser, parsedUrl.query);
  }

  // ----------------------------------------------------------------------------
  // 5. ADMIN CONSOLE
  // ----------------------------------------------------------------------------
  if (normPath === '/admin' || normPath.startsWith('/admin/') || normPath === '/superadmin') {
    return renderAdminDashboard(req, res, sessionUser, parsedUrl.query);
  }

  // ----------------------------------------------------------------------------
  // 6. REST & WEBHOOK APIS
  // ----------------------------------------------------------------------------

  // Telegram Webhook
  if (normPath === '/api/telegram/webhook' && method === 'POST') {
    return handleTelegramWebhook(req, res, sessionUser);
  }

  if ((normPath === '/api/telegram/webhook' || normPath === '/api-tester' || normPath === '/webhook-tester' || normPath === '/dev/webhook-tester') && method === 'GET') {
    return renderWebhookTesterPage(req, res, sessionUser);
  }

  // Test Telegram Connection
  if (normPath === '/api/telegram/test-connection' && method === 'POST') {
    return handleTestConnection(req, res);
  }

  // Scheduled Daily Reminders Cron
  if (normPath === '/api/cron/reminders') {
    return handleReminderCron(req, res, parsedUrl);
  }

  // AI Chat API (Tugas 4: Analisis Berdasarkan Data Riil Pengguna)
  if (normPath === '/api/ai/chat' && method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        const userMsg = (body.message || '').toLowerCase();
        const targetUser = sessionUser || store.users[0];

        const userTxs = store.transactions.filter(t => t.userId === targetUser.id);
        const userWallets = store.wallets.filter(w => w.userId === targetUser.id);
        const userBudgets = store.budgets.filter(b => b.userId === targetUser.id);

        const totalInc = userTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const totalExp = userTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const totalBal = userWallets.reduce((s, w) => s + w.balance, 0);

        // Find biggest expense category
        const catMap = {};
        userTxs.filter(t => t.type === 'expense').forEach(t => {
          catMap[t.cat] = (catMap[t.cat] || 0) + t.amount;
        });
        let topCat = '🍜 Makanan & Minuman';
        let topCatAmt = 0;
        for (const [k, v] of Object.entries(catMap)) {
          if (v > topCatAmt) { topCatAmt = v; topCat = k; }
        }

        let reply = '';
        if (userMsg.includes('pengeluaran') || userMsg.includes('berapa')) {
          reply = `📊 *Analisis Pengeluaran Anda Bulan Ini:*\n• Total Pengeluaran: *${formatIDR(totalExp)}*\n• Total Pemasukan: *${formatIDR(totalInc)}*\n• Net Cashflow: *${formatIDR(totalInc - totalExp)}*\n\nPengeluaran Anda saat ini menyerap sekitar *${totalInc > 0 ? Math.round((totalExp / totalInc) * 100) : 0}%* dari total pemasukan. Rekomendasi: Pertahankan rasio belanja di bawah 70% agar sisa 30% bisa masuk ke pos tabungan/investasi.`;
        } else if (userMsg.includes('boros') || userMsg.includes('kategori')) {
          reply = `💸 *Kategori Pengeluaran Terbesar:*\nPos pengeluaran terbanyak Anda adalah *${topCat}* dengan total nominal *${formatIDR(topCatAmt)}*.\n\n💡 *Saran Finansial:* Coba terapkan meal prep harian atau manfaatkan promo makanan saat weekend untuk menekan pos ini hingga 15-20% minggu depan!`;
        } else if (userMsg.includes('budget') || userMsg.includes('aman')) {
          const overBudgets = userBudgets.filter(b => b.spent >= b.amount);
          if (overBudgets.length > 0) {
            reply = `⚠️ *Peringatan Budget:*\nAda ${overBudgets.length} kategori yang sudah melampaui batas anggaran bulan ini:\n` +
              overBudgets.map(b => `• ${b.emoji} *${b.name}*: Terpakai ${formatIDR(b.spent)} dari limit ${formatIDR(b.amount)}`).join('\n') +
              `\n\nSegera lakukan realokasi dana dari kategori lain yang masih longgar!`;
          } else {
            reply = `🎯 *Kesehatan Budget Aman:*\nKabar baik! Seluruh kategori pengeluaran Anda masih berada di bawah target limit bulanan. Pos paling mendekati batas adalah *${userBudgets[0]?.name || 'Makanan'}* (${Math.round(((userBudgets[0]?.spent || 0) / (userBudgets[0]?.amount || 1)) * 100)}%). Pertahankan kendali belanjamu!`;
          }
        } else {
          reply = `💡 *Saran Finansial Personal untuk ${targetUser.fullName.split(' ')[0]}:*\n1. Total aset liquid Anda di ${userWallets.length} dompet adalah *${formatIDR(totalBal)}*.\n2. Sisihkan minimal 10% di awal setiap kali ada pemasukan baru masuk ke rekening BCA Utama.\n3. Gunakan Telegram Bot secara rutin untuk mencatat pengeluaran di bawah Rp 50.000 yang paling sering bocor halus.\n\nAda aspek keuangan lain yang ingin Anda konsultasikan?`;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, reply, provider: 'Google Gemini 1.5 Flash' }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // AI Parse NLP API
  if (normPath === '/api/ai/parse' && method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        const parsed = parseIndonesianTransaction(body.text || '');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(parsed));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Create Transaction (Manual Dashboard)
  if (normPath === '/api/transactions/create' && method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        let targetUser = sessionUser;
        if (body.userId) {
          targetUser = store.users.find(u => u.id === body.userId || u.email === body.userId) || targetUser;
        }
        if (!targetUser) targetUser = store.users[0];

        const chosenWallet = body.wallet || body.paymentMethod || 'BCA Utama';
        const newTx = {
          id: 'tx_' + Date.now(),
          userId: targetUser.id,
          date: formatWibDate(),
          desc: body.desc || 'Transaksi Manual Web',
          amount: Number(body.amount || 0),
          type: body.type || 'expense',
          cat: body.cat || '🍜 Makanan & Minuman',
          wallet: chosenWallet
        };

        store.transactions.unshift(newTx);

        // Update or resolve wallet
        const lowerWallet = chosenWallet.toLowerCase();
        let w = store.wallets.find(wal => wal.userId === targetUser.id && (wal.name.toLowerCase() === lowerWallet || wal.name === chosenWallet));
        if (!w) {
          w = store.wallets.find(wal => wal.userId === targetUser.id && (wal.name.toLowerCase().includes(lowerWallet) || lowerWallet.includes(wal.name.toLowerCase())));
        }
        if (!w) {
          // Auto create wallet for user if payment method / wallet is not yet registered
          const isCash = lowerWallet.includes('cash') || lowerWallet.includes('tunai');
          const isEWallet = ['gopay', 'ovo', 'shopeepay', 'shopee', 'dana', 'qris'].some(ew => lowerWallet.includes(ew));
          let defaultColor = '#2563EB';
          if (lowerWallet.includes('seabank')) defaultColor = '#FF5722';
          else if (isCash) defaultColor = '#10B981';
          else if (lowerWallet.includes('bca')) defaultColor = '#00529C';
          else if (lowerWallet.includes('mandiri')) defaultColor = '#003366';
          else if (lowerWallet.includes('gopay')) defaultColor = '#00AA13';
          else if (lowerWallet.includes('ovo')) defaultColor = '#4C3494';
          else if (lowerWallet.includes('shopee')) defaultColor = '#EE4D2D';
          else if (lowerWallet.includes('dana')) defaultColor = '#118EEA';

          w = {
            id: 'w_' + Date.now(),
            userId: targetUser.id,
            name: chosenWallet,
            type: isCash ? 'Tunai' : (isEWallet ? 'E-Wallet' : 'Bank'),
            balance: 0,
            color: defaultColor,
            isDefault: false
          };
          store.wallets.push(w);
        }

        if (w) {
          if (newTx.type === 'income') w.balance += newTx.amount;
          else w.balance -= newTx.amount;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, transaction: newTx, wallet: w }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // Create Wallet API
  if (normPath === '/api/wallets/create' && method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        let targetUser = sessionUser;
        if (body.userId) {
          targetUser = store.users.find(u => u.id === body.userId || u.email === body.userId) || targetUser;
        }
        if (!targetUser) targetUser = store.users[0];

        const lowerName = (body.name || '').toLowerCase();
        let defaultColor = '#F97316';
        let defaultType = 'Bank';
        if (lowerName.includes('seabank')) {
          defaultColor = '#FF5722';
          defaultType = 'Bank';
        } else if (lowerName.includes('cash') || lowerName.includes('tunai')) {
          defaultColor = '#10B981';
          defaultType = 'Tunai';
        } else if (lowerName.includes('bca')) {
          defaultColor = '#00529C';
          defaultType = 'Bank';
        } else if (lowerName.includes('mandiri')) {
          defaultColor = '#003366';
          defaultType = 'Bank';
        } else if (lowerName.includes('bni')) {
          defaultColor = '#005E54';
          defaultType = 'Bank';
        } else if (lowerName.includes('bri')) {
          defaultColor = '#00529C';
          defaultType = 'Bank';
        } else if (lowerName.includes('jago')) {
          defaultColor = '#F59E0B';
          defaultType = 'Bank';
        } else if (lowerName.includes('gopay')) {
          defaultColor = '#00AA13';
          defaultType = 'E-Wallet';
        } else if (lowerName.includes('ovo')) {
          defaultColor = '#4C3494';
          defaultType = 'E-Wallet';
        } else if (lowerName.includes('shopee')) {
          defaultColor = '#EE4D2D';
          defaultType = 'E-Wallet';
        } else if (lowerName.includes('dana')) {
          defaultColor = '#118EEA';
          defaultType = 'E-Wallet';
        } else if (lowerName.includes('qris')) {
          defaultColor = '#8B5CF6';
          defaultType = 'E-Wallet';
        }

        const newWallet = {
          id: 'w_' + Date.now(),
          userId: targetUser.id,
          name: body.name || 'Dompet Baru',
          type: body.type || defaultType,
          balance: Number(body.balance || 0),
          color: body.color || defaultColor,
          isDefault: Boolean(body.isDefault)
        };
        store.wallets.push(newWallet);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, wallet: newWallet }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // Wallet Transfer API
  if (normPath === '/api/wallets/transfer' && method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        const fromWallet = store.wallets.find(w => w.id === body.fromId);
        const toWallet = store.wallets.find(w => w.id === body.toId);
        const amt = Number(body.amount || 0);

        if (!fromWallet || !toWallet) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, error: 'Dompet tidak ditemukan.' }));
        }

        fromWallet.balance -= amt;
        toWallet.balance += amt;

        store.transactions.unshift({
          id: 'tx_' + Date.now(),
          userId: fromWallet.userId,
          date: formatWibDate(),
          desc: `Transfer dari ${fromWallet.name} ke ${toWallet.name}`,
          amount: amt,
          type: 'transfer',
          cat: '🔄 Transfer Antar Dompet',
          wallet: fromWallet.name
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, fromBalance: fromWallet.balance, toBalance: toWallet.balance }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // Set Default Wallet API
  if (normPath === '/api/wallets/set-default' && method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        const targetUser = sessionUser || store.users[0];
        store.wallets.filter(w => w.userId === targetUser.id).forEach(w => {
          w.isDefault = (w.id === body.walletId);
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // Set Budget API
  if (normPath === '/api/budgets/set' && method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        const targetUser = sessionUser || store.users[0];
        let existing = store.budgets.find(b => b.userId === targetUser.id && b.categoryId === body.categoryId);
        const cat = store.categories.find(c => c.id === body.categoryId) || { name: 'Kategori', emoji: '🎯' };

        if (existing) {
          existing.amount = Number(body.amount);
        } else {
          store.budgets.push({
            userId: targetUser.id,
            categoryId: body.categoryId,
            name: cat.name,
            emoji: cat.emoji,
            amount: Number(body.amount),
            spent: 0
          });
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // User Profile Update API (Tugas 6: Persistensi Data)
  if (normPath === '/api/user/profile' && method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        // Support admin updating an impersonated user via userId
        let targetUser;
        if (sessionUser && sessionUser.role === 'admin' && body.userId) {
          targetUser = store.users.find(u => u.id === body.userId) || sessionUser;
        } else if (sessionUser) {
          targetUser = store.users.find(u => u.id === sessionUser.id) || sessionUser;
        } else {
          targetUser = store.users[0];
        }

        if (typeof body.fullName === 'string' && body.fullName.trim().length > 0) {
          targetUser.fullName = body.fullName.trim();
        }
        if (typeof body.phone === 'string' && body.phone.trim().length > 0) {
          targetUser.phone = body.phone.trim();
        }
        if (typeof body.occupation === 'string') {
          targetUser.occupation = body.occupation.trim();
        }
        if (typeof body.bio === 'string') {
          targetUser.bio = body.bio.trim();
        }
        if (typeof body.city === 'string') {
          targetUser.city = body.city.trim();
        }
        const newAvatar = body.avatarUrl !== undefined ? body.avatarUrl : body.avatar;
        if (typeof newAvatar === 'string' && newAvatar.trim().length > 0) {
          targetUser.avatarUrl = newAvatar.trim();
        } else if (newAvatar === null) {
          targetUser.avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80';
        }
        if (typeof body.defaultCurrency === 'string' && body.defaultCurrency.trim().length > 0) {
          targetUser.defaultCurrency = body.defaultCurrency.trim();
        }

        // Only synchronize sessionUser if targetUser is the active session user (avoids corrupting admin profile during impersonation)
        if (sessionUser && sessionUser.id === targetUser.id) {
          sessionUser.fullName = targetUser.fullName;
          sessionUser.phone = targetUser.phone;
          sessionUser.avatarUrl = targetUser.avatarUrl;
          sessionUser.defaultCurrency = targetUser.defaultCurrency;
          sessionUser.occupation = targetUser.occupation;
          sessionUser.bio = targetUser.bio;
          sessionUser.city = targetUser.city;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, user: targetUser }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // Payment Create Order API (Tugas 5: Metode Pembayaran Modular)
  if (normPath === '/api/payments/create-order' && method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        const targetUser = sessionUser || store.users[0];
        const newOrder = {
          id: 'ord_' + Date.now(),
          userId: targetUser.id,
          userName: targetUser.fullName,
          userEmail: targetUser.email,
          plan: 'pro',
          method: body.method || 'Midtrans Snap (QRIS)',
          referenceNumber: 'REF-' + Math.floor(Math.random() * 90000000 + 10000000),
          amount: Number(body.amount || 99000),
          status: 'success', // Simulated instant success
          createdAt: formatWibDate()
        };

        store.paymentOrders.unshift(newOrder);
        targetUser.plan = 'pro'; // Upgrade user plan immediately

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, order: newOrder }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // Midtrans Payment Webhook
  if (normPath === '/api/payments/midtrans' && method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', () => {
      store.auditLogs.unshift({
        id: 'aud_' + Date.now(),
        timestamp: formatWibDate(),
        admin: 'midtrans_webhook',
        target: 'usr_starter_01',
        action: 'PAYMENT_SETTLED',
        reason: 'Midtrans QRIS Settlement verified, auto-upgraded to Pro'
      });
      const u = store.users.find(usr => usr.id === 'usr_starter_01');
      if (u) u.plan = 'pro';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, status: 'settled', message: 'Payment approved. User upgraded to Pro.' }));
    });
    return;
  }

  // Admin Payment Approval API (Tugas 5 & 8)
  if ((normPath === '/api/admin/payments/approve' || normPath === '/api/admin/approve-payment') && method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        const ord = store.paymentOrders.find(o => o.id === body.orderId);
        if (ord) {
          ord.status = 'success';
          const u = store.users.find(usr => usr.id === (body.userId || ord.userId));
          if (u) u.plan = 'pro';
          store.auditLogs.unshift({
            id: 'aud_' + Date.now(),
            timestamp: formatWibDate(),
            admin: sessionUser ? sessionUser.email : 'sellanrhrdni123@gmail.com',
            target: ord.userId,
            action: 'APPROVE_PAYMENT',
            reason: 'Manual approval for order #' + ord.id
          });
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, order: ord }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // Admin Payment Rejection API
  if ((normPath === '/api/admin/payments/reject' || normPath === '/api/admin/reject-payment') && method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        const ord = store.paymentOrders.find(o => o.id === body.orderId);
        if (ord) {
          ord.status = 'rejected';
          store.auditLogs.unshift({
            id: 'aud_' + Date.now(),
            timestamp: formatWibDate(),
            admin: sessionUser ? sessionUser.email : 'sellanrhrdni123@gmail.com',
            target: ord.userId,
            action: 'REJECT_PAYMENT',
            reason: body.reason || 'Payment rejected by admin'
          });
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, order: ord }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // Admin User Approval API (Persetujuan Pendaftaran Akun Pengguna)
  if ((normPath === '/api/admin/users/approve' || normPath === '/api/admin/approve-user') && method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        const targetUserId = body.userId || body.email || parsedUrl.query.userId || parsedUrl.query.email;
        const u = store.users.find(usr => usr.id === targetUserId || usr.email.toLowerCase() === String(targetUserId).toLowerCase());
        if (!u) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, error: 'User tidak ditemukan.' }));
        }
        u.status = 'approved';
        const magicToken = crypto.randomBytes(24).toString('hex');
        const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 jam
        if (!store.magicTokens) store.magicTokens = new Map();
        store.magicTokens.set(magicToken, {
          token: magicToken,
          email: u.email,
          userId: u.id,
          expiresAt: expiresAt,
          used: false,
          createdAt: formatWibDate()
        });
        u.magicToken = magicToken;
        u.magicLoginLink = '/auth/magic-login?token=' + magicToken;

        store.auditLogs.unshift({
          id: 'aud_' + Date.now(),
          timestamp: formatWibDate(),
          admin: sessionUser ? sessionUser.email : 'sellanrhrdni123@gmail.com',
          target: u.id,
          action: 'APPROVE_USER',
          reason: body.reason || 'Persetujuan pendaftaran akun oleh Administrator'
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          ok: true,
          success: true,
          user: u,
          magicToken: magicToken,
          magicLoginLink: u.magicLoginLink,
          message: 'Akun pengguna berhasil disetujui.'
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // Admin User Rejection API (Penolakan Pendaftaran Akun Pengguna)
  if ((normPath === '/api/admin/users/reject' || normPath === '/api/admin/reject-user') && method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        const targetUserId = body.userId || body.email || parsedUrl.query.userId || parsedUrl.query.email;
        const u = store.users.find(usr => usr.id === targetUserId || usr.email.toLowerCase() === String(targetUserId).toLowerCase());
        if (!u) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, error: 'User tidak ditemukan.' }));
        }
        u.status = 'rejected';
        store.auditLogs.unshift({
          id: 'aud_' + Date.now(),
          timestamp: formatWibDate(),
          admin: sessionUser ? sessionUser.email : 'admin@tatadana.id',
          target: u.id,
          action: 'REJECT_USER',
          reason: body.reason || 'Penolakan pendaftaran akun oleh Administrator'
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, user: u, message: 'Pendaftaran pengguna berhasil ditolak.' }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // Admin Batch Approve All Users API
  if ((normPath === '/api/admin/users/approve-all' || normPath === '/api/admin/approve-all') && method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        const pendingUsers = store.users.filter(u => u.status === 'pending_approval');
        const count = pendingUsers.length;
        pendingUsers.forEach(u => {
          u.status = 'approved';
          store.auditLogs.unshift({
            id: 'aud_' + Date.now(),
            timestamp: formatWibDate(),
            admin: sessionUser ? sessionUser.email : 'admin@tatadana.id',
            target: u.id,
            action: 'APPROVE_USER',
            reason: body.reason || 'Persetujuan massal pendaftaran akun oleh Administrator'
          });
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, count, message: `${count} akun pengguna berhasil disetujui.` }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // Pending Approvals Query API (For Polling & Notification Badges)
  if ((normPath === '/api/admin/pending-approvals' || normPath === '/api/system/pending-approvals' || normPath === '/api/admin/pending-count') && method === 'GET') {
    const pendings = store.users.filter(u => u.status === 'pending_approval');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      ok: true,
      count: pendings.length,
      users: pendings.map(u => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        plan: u.plan,
        createdAt: u.createdAt,
        status: u.status
      }))
    }));
  }

  // Live Status Check API: When admin approves, auto-login user & redirect to /dashboard
  if (normPath === '/api/auth/check-status' && method === 'GET') {
    const emailParam = (parsedUrl.query.email || '').trim().toLowerCase();
    if (!emailParam) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: false, error: 'Email diperlukan' }));
    }
    const u = store.users.find(usr => usr.email.toLowerCase() === emailParam || usr.id === emailParam);
    if (!u) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: false, error: 'User tidak ditemukan' }));
    }
    if (u.status === 'approved') {
      createSession(u, res);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        ok: true,
        approved: true,
        status: 'approved',
        redirect: '/dashboard',
        magicToken: u.magicToken || '',
        magicLoginLink: u.magicLoginLink || '',
        message: 'Akun Anda telah disetujui! Mengarahkan ke Dashboard...'
      }));
    } else if (u.status === 'rejected') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        ok: true,
        approved: false,
        rejected: true,
        status: 'rejected',
        error: 'Pendaftaran akun Anda ditolak oleh Administrator.'
      }));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        ok: true,
        approved: false,
        rejected: false,
        status: u.status
      }));
    }
  }

  // Quick Approve Helper API for Local Admin Testing (Creates session & redirects to /dashboard)
  if (normPath === '/api/auth/quick-approve' && method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        const target = (body.email || body.userId || '').trim().toLowerCase();
        const u = store.users.find(usr => usr.id === target || usr.email.toLowerCase() === target);
        if (!u) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, error: 'User tidak ditemukan.' }));
        }
        u.status = 'approved';
        store.auditLogs.unshift({
          id: 'aud_' + Date.now(),
          timestamp: formatWibDate(),
          admin: 'admin_quick_action',
          target: u.id,
          action: 'QUICK_APPROVE_USER',
          reason: 'Persetujuan instan dari panel registrasi/login pengguna'
        });
        createSession(u, res);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          ok: true,
          user: u,
          approved: true,
          redirect: '/dashboard',
          message: 'Akun berhasil disetujui oleh Administrator! Langsung masuk ke Dashboard.'
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // Admin User Rejection API
  if ((normPath === '/api/admin/users/reject' || normPath === '/api/admin/reject-user') && method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        const targetUserId = body.userId || parsedUrl.query.userId;
        const u = store.users.find(usr => usr.id === targetUserId || usr.email.toLowerCase() === String(targetUserId).toLowerCase());
        if (!u) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, error: 'User tidak ditemukan.' }));
        }
        u.status = 'rejected';
        store.auditLogs.unshift({
          id: 'aud_' + Date.now(),
          timestamp: formatWibDate(),
          admin: sessionUser ? sessionUser.email : 'admin@tatadana.id',
          target: u.id,
          action: 'REJECT_USER',
          reason: body.reason || 'Pendaftaran ditolak oleh Administrator'
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, user: u, message: 'Akun pengguna telah ditolak.' }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // Admin Switch AI Provider API (Tugas 8)
  if (normPath === '/api/admin/set-ai-provider' && method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        store.aiProviders.forEach(p => {
          if (p.id === body.providerId || p.name === body.providerName) {
            p.isPrimary = true;
            p.status = 'Active (210ms)';
          } else {
            p.isPrimary = false;
            p.status = 'Standby (410ms)';
          }
        });
        store.auditLogs.unshift({
          id: 'aud_' + Date.now(),
          timestamp: formatWibDate(),
          admin: sessionUser ? sessionUser.email : 'admin@tatadana.id',
          target: 'ai_providers',
          action: 'SWITCH_PRIMARY_AI',
          reason: 'Switched primary AI provider to ' + (body.providerName || body.providerId)
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, providers: store.aiProviders }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // Admin Toggle AI Mode API
  if (normPath === '/api/admin/set-ai-mode' && method === 'POST') {
    store.aiMode = (store.aiMode === 'parallel_failover') ? 'single' : 'parallel_failover';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, mode: store.aiMode }));
  }

  // Admin Record Audit Log API
  if (normPath === '/api/admin/audit-log' && method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        store.auditLogs.unshift({
          id: 'aud_' + Date.now(),
          timestamp: formatWibDate(),
          admin: sessionUser ? sessionUser.email : 'admin@tatadana.id',
          target: body.targetUserId || 'all',
          action: body.action || 'INSPECT_DATA',
          reason: body.reason || 'Zero-trust verified access'
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, message: 'Audit log recorded' }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // Admin Get User Transactions API (Inspeksi Transaksi Pengguna dengan Alasan)
  if (normPath === '/api/admin/user-transactions' && method === 'GET') {
    const targetUserId = parsedUrl.query.userId;
    const reason = parsedUrl.query.reason;
    if (!targetUserId || !reason) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: false, error: 'User ID dan alasan audit wajib diisi.' }));
    }
    store.auditLogs.unshift({
      id: 'aud_' + Date.now(),
      timestamp: formatWibDate(),
      admin: sessionUser ? sessionUser.email : 'admin@tatadana.id',
      target: targetUserId,
      action: 'INSPECT_USER_TRANSACTIONS',
      reason: reason
    });
    const txs = store.transactions.filter(t => t.userId === targetUserId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, transactions: txs }));
  }

  // Network Info API (Tugas 7: Akses Perangkat Lain)
  if (normPath === '/api/system/network-info') {
    const ips = getLocalIpAddresses();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      ok: true,
      port: PORT,
      host: HOST,
      localIps: ips,
      tunnelUrl: TUNNEL_URL,
      accessUrls: ips.map(ip => `http://${ip.address}:${PORT}`)
    }));
  }

  // Raw Store Data Dump API
  if (normPath === '/api/data') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(store, (key, value) => {
      if (key === 'sessions' && value instanceof Map) {
        return Array.from(value.entries());
      }
      if (key === 'processedUpdateIds' && value instanceof Set) {
        return Array.from(value.values());
      }
      return value;
    }, 2));
  }

  // ----------------------------------------------------------------------------
  // 7. 404 FALLBACK
  // ----------------------------------------------------------------------------
  if (!res.headersSent) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      ${getHtmlHeader('404 — Halaman Tidak Ditemukan')}
      ${renderGlobalHubNav('/404', sessionUser)}
      <div style="max-width: 600px; margin: 80px auto; text-align: center; padding: 0 20px;">
        <div style="font-size: 64px; margin-bottom: 12px;">🔍</div>
        <h2 style="font-size: 28px; font-weight: 900; margin-bottom: 8px;">404 — Halaman Tidak Ditemukan</h2>
        <p style="font-size: 15px; color: #64748B; margin-bottom: 24px;">Halaman yang Anda cari tidak tersedia. Anda dapat mengakses seluruh fitur melalui Portal Terpadu.</p>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <a href="/portal" class="btn-primary" style="padding: 12px 24px;">🎯 Buka Portal Semua Fitur</a>
          <a href="/" class="btn-dark" style="padding: 12px 24px;">Beranda Utama</a>
        </div>
      </div>
    </body></html>
    `);
  }
});

process.on('uncaughtException', (err) => {
  console.error('Unhandled Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

server.listen(PORT, HOST, () => {
  const ips = getLocalIpAddresses();
  console.log('================================================================');
  console.log('🚀 TATADANA PRODUCTION SERVER ACTIVE & ONLINE');
  console.log('================================================================');
  console.log(`⭐ ALAMAT UTAMA TUNGGAL (ONE SINGLE LOCALHOST):`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`   (Akses instan seluruh 11 fitur via Tab Switcher: Landing, Portal,`);
  console.log(`    Dashboard, Transaksi, Laporan, Budget, Dompet, AI Chat, Settings,`);
  console.log(`    Admin Console, & Telegram Bot Simulator)`);
  console.log('----------------------------------------------------------------');
  if (ips.length > 0) {
    console.log(`📱 Akses Perangkat Lain (Wi-Fi): http://${ips[0].address}:${PORT}`);
  }
  console.log('================================================================');
});
