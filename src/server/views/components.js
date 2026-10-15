/**
 * Shared UI Components & Layout Templates for TataDana
 * Modern Orange-White Fintech Theme (#F97316), responsive, accessibility-ready.
 */

const { store, getLocalIpAddresses } = require('../store');

function getHtmlHeader(title) {
  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title || 'TataDana — SaaS Keuangan Pribadi & Telegram Bot'}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
      <style>
        :root {
          --brand-500: #F97316;
          --brand-600: #EA580C;
          --brand-700: #C2410C;
          --slate-900: #0F172A;
          --slate-800: #1E293B;
          --slate-700: #334155;
          --slate-600: #475569;
          --slate-400: #94A3B8;
          --slate-200: #E2E8F0;
          --slate-100: #F1F5F9;
          --slate-50: #F8FAFC;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; }
        body { background-color: #FAFAFA; color: #0F172A; line-height: 1.5; -webkit-font-smoothing: antialiased; }
        
        /* Orange Gradient Accents */
        .orange-grad { background: linear-gradient(135deg, #F97316 0%, #EA580C 100%); }
        .orange-text { background: linear-gradient(135deg, #F97316 0%, #EA580C 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        
        /* Interactive Buttons */
        .btn-primary { background: #F97316; color: #FFF; font-weight: 800; padding: 10px 20px; border-radius: 12px; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: none; cursor: pointer; transition: all 0.15s ease; box-shadow: 0 4px 14px rgba(249,115,22,0.25); }
        .btn-primary:hover { background: #EA580C; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(249,115,22,0.35); }
        .btn-dark { background: #0F172A; color: #FFF; font-weight: 700; padding: 10px 18px; border-radius: 12px; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: none; cursor: pointer; transition: all 0.15s ease; }
        .btn-dark:hover { background: #1E293B; transform: translateY(-1px); }
        .btn-outline { background: transparent; color: #475569; border: 1px solid #CBD5E1; font-weight: 700; padding: 9px 16px; border-radius: 12px; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; transition: all 0.15s ease; }
        .btn-outline:hover { background: #F1F5F9; color: #0F172A; border-color: #94A3B8; }
        .btn-danger { background: #DC2626; color: #FFF; font-weight: 700; padding: 8px 14px; border-radius: 10px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; border: none; cursor: pointer; }
        .btn-danger:hover { background: #B91C1C; }
        .btn-sm { padding: 6px 12px; font-size: 12px; border-radius: 8px; }

        /* Form Inputs & Glow Focus */
        input[type="text"], input[type="email"], input[type="password"], input[type="number"], select, textarea {
          width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid #CBD5E1; background: #FFFFFF; font-size: 14px; color: #0F172A; outline: none; transition: border-color 0.15s, box-shadow 0.15s;
        }
        input:focus, select:focus, textarea:focus {
          border-color: #F97316; box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15);
        }

        /* Fintech Cards & Badges */
        .card { background: #FFFFFF; border-radius: 20px; border: 1px solid #E2E8F0; padding: 24px; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.03); }
        .badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; background: #FFF7ED; color: #C2410C; border: 1px solid #FFEDD5; }
        .badge-green { background: #F0FDF4; color: #166534; border: 1px solid #BBF7D0; }
        .badge-blue { background: #EFF6FF; color: #1E40AF; border: 1px solid #BFDBFE; }
        .badge-purple { background: #FAF5FF; color: #6B21A8; border: 1px solid #E9D5FF; }
        .badge-red { background: #FEF2F2; color: #991B1B; border: 1px solid #FECACA; }
        .badge-amber { background: #FFFBEB; color: #B45309; border: 1px solid #FDE68A; }

        /* Unified Global Hub Bar */
        .hub-bar { background: linear-gradient(90deg, #090D16 0%, #111827 100%); border-bottom: 2px solid #F97316; position: sticky; top: 0; z-index: 9999; box-shadow: 0 4px 25px rgba(0,0,0,0.25); padding: 8px 16px; color: white; }
        .hub-container { max-width: 1400px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .hub-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: white; }
        .hub-logo-box { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #F97316, #FB923C); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 16px; color: white; box-shadow: 0 2px 8px rgba(249,115,22,0.4); }
        .hub-pills-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .hub-pill { font-size: 12px; font-weight: 700; color: #94A3B8; text-decoration: none; padding: 6px 12px; border-radius: 8px; border: 1px solid transparent; transition: all 0.15s; display: inline-flex; align-items: center; gap: 5px; }
        .hub-pill:hover { color: #FFFFFF; background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); }
        .hub-pill-active { color: #FFFFFF !important; background: #F97316 !important; border-color: #EA580C !important; box-shadow: 0 2px 8px rgba(249,115,22,0.35); }
        .pulse-dot { width: 8px; height: 8px; border-radius: 50%; background: #22C55E; display: inline-block; box-shadow: 0 0 8px #22C55E; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.85); } }

        /* Tables & Lists */
        .custom-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
        .custom-table th { background: #F8FAFC; color: #475569; font-weight: 800; text-transform: uppercase; font-size: 11px; padding: 14px 16px; border-bottom: 2px solid #E2E8F0; }
        .custom-table td { padding: 14px 16px; border-bottom: 1px solid #F1F5F9; vertical-align: middle; }
        .custom-table tr:hover td { background: #FFFBF7; }

        /* Modals */
        .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(6px); z-index: 99999; align-items: center; justify-content: center; padding: 20px; }
        .modal-overlay.active { display: flex; }
        .modal-content { background: #FFFFFF; border-radius: 24px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 60px rgba(0,0,0,0.3); border: 1px solid #E2E8F0; padding: 28px; }

        /* Avatar & Profile Components */
        .avatar-hover-wrapper {
          position: relative;
          width: 88px;
          height: 88px;
          border-radius: 50%;
          cursor: pointer;
          flex-shrink: 0;
        }
        .avatar-hover-wrapper img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #F97316;
          display: block;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 14px rgba(249,115,22,0.25);
        }
        .avatar-hover-wrapper:hover img {
          transform: scale(1.02);
          box-shadow: 0 6px 20px rgba(249,115,22,0.35);
        }
        .avatar-hover-overlay {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(15, 23, 42, 0.72);
          color: #FFFFFF;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
          font-size: 11px;
          font-weight: 800;
          text-align: center;
          line-height: 1.2;
          backdrop-filter: blur(2px);
        }
        .avatar-hover-wrapper:hover .avatar-hover-overlay {
          opacity: 1;
        }
        .avatar-camera-badge {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 28px;
          height: 28px;
          background: #F97316;
          color: white;
          border-radius: 50%;
          border: 2px solid #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          pointer-events: none;
        }
        .avatar-preset-card {
          border: 2px solid #E2E8F0;
          border-radius: 14px;
          padding: 10px 8px;
          background: #FFFFFF;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          transition: all 0.15s ease;
          position: relative;
        }
        .avatar-preset-card:hover {
          border-color: #F97316;
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(249,115,22,0.2);
        }
        .avatar-preset-card.selected {
          border-color: #F97316;
          background: #FFF7ED;
          box-shadow: 0 0 0 2px #F97316;
        }
        .avatar-preset-card img {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #CBD5E1;
        }
        .avatar-preset-card.selected img {
          border-color: #F97316;
        }
        .avatar-dropzone {
          border: 2px dashed #CBD5E1;
          border-radius: 16px;
          padding: 28px 20px;
          text-align: center;
          background: #F8FAFC;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .avatar-dropzone:hover, .avatar-dropzone.dragover {
          border-color: #F97316;
          background: #FFF7ED;
        }

        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }

        @media (max-width: 768px) {
          .hub-container { flex-direction: column; align-items: stretch; gap: 8px; }
          .hub-pills-row { display: flex; flex-wrap: nowrap !important; overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 4px; }
          .hub-pill { font-size: 11px; padding: 5px 10px; flex-shrink: 0; white-space: nowrap; }
          .sidebar-responsive { display: none !important; }
          .main-content-responsive { width: 100% !important; margin-left: 0 !important; }
        }
      </style>
    </head>
    <body>
  `;
}

function renderGlobalHubNav(currentPath, authUser) {
  const norm = (currentPath || '/').toLowerCase();
  const isHome = norm === '/' || norm === '/index.html';
  const isPortal = norm === '/portal' || norm === '/hub';
  const isSim = norm.includes('simulator');
  const isDash = norm === '/dashboard';
  const isTrx = norm.includes('transactions');
  const isReports = norm.includes('reports') || norm.includes('laporan');
  const isBudget = norm.includes('budget');
  const isWallet = norm.includes('wallet');
  const isAiChat = norm.includes('ai-chat');
  const isSettings = norm.includes('settings');
  const isAdmin = norm.startsWith('/admin') || norm === '/superadmin';
  const ips = getLocalIpAddresses();
  const localIpStr = ips.length > 0 ? ips[0].address : '127.0.0.1';
  const pendingApprovalsCount = (store && store.users) ? store.users.filter(u => u.status === 'pending_approval').length : 0;

  return `
    <header class="hub-bar">
      <div class="hub-container">
        <!-- Brand & Network Info -->
        <div style="display: flex; align-items: center; gap: 12px;">
          <a href="/" class="hub-brand" title="TataDana SaaS Keuangan Pribadi">
            <div class="hub-logo-box">T</div>
            <div style="line-height: 1.1;">
              <div style="font-weight: 900; font-size: 16px; letter-spacing: -0.4px;">Tata<span style="color: #F97316;">Dana</span></div>
              <div style="font-size: 10px; color: #94A3B8; font-weight: 600;">FINTECH SAAS</div>
            </div>
          </a>
          <button onclick="openNetworkModal()" style="background: rgba(249,115,22,0.15); border: 1px solid rgba(249,115,22,0.4); color: #FB923C; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer;">
            <span class="pulse-dot"></span>
            http://localhost:3000 ⭐
          </button>
        </div>

        <!-- Direct Jump Navigation -->
        <nav class="hub-pills-row">
          <a href="/" class="hub-pill ${isHome ? 'hub-pill-active' : ''}">🌐 Beranda</a>
          <a href="/portal" class="hub-pill ${isPortal ? 'hub-pill-active' : ''}">🎯 Portal Hub</a>
          ${authUser && authUser.role === 'admin' ? `
            <a href="/admin" class="hub-pill ${isAdmin ? 'hub-pill-active' : ''}" style="${isAdmin ? '' : 'color: #FCA5A5;'} display: inline-flex; align-items: center; gap: 6px;" title="${pendingApprovalsCount > 0 ? pendingApprovalsCount + ' pengguna baru menunggu persetujuan' : 'Admin Console'}">
              <span>👑 Admin Console</span>
              ${pendingApprovalsCount > 0 ? `
                <span id="topAdminPendingBadge" style="background: #EF4444; color: white; border-radius: 999px; padding: 2px 7px; font-size: 10px; font-weight: 900; line-height: 1; animation: pulse 1.5s infinite; box-shadow: 0 0 8px rgba(239,68,68,0.8);">
                  ${pendingApprovalsCount} BARU
                </span>
              ` : ''}
            </a>
          ` : `
            <a href="/dashboard" class="hub-pill ${isDash ? 'hub-pill-active' : ''}">📊 Dashboard</a>
            <a href="/dashboard/transactions" class="hub-pill ${isTrx ? 'hub-pill-active' : ''}">💳 Transaksi</a>
            <a href="/dashboard/reports" class="hub-pill ${isReports ? 'hub-pill-active' : ''}">📑 Laporan</a>
            <a href="/dashboard/budget" class="hub-pill ${isBudget ? 'hub-pill-active' : ''}">🎯 Budget</a>
            <a href="/dashboard/wallet" class="hub-pill ${isWallet ? 'hub-pill-active' : ''}">👛 Wallet</a>
            <a href="/dashboard/ai-chat" class="hub-pill ${isAiChat ? 'hub-pill-active' : ''}">🤖 AI Chat</a>
            <a href="/dashboard/settings" class="hub-pill ${isSettings ? 'hub-pill-active' : ''}">⚙️ Settings</a>
          `}
          <a href="/dev/telegram-simulator" class="hub-pill ${isSim ? 'hub-pill-active' : ''}">💬 Bot Simulator</a>
        </nav>

        <!-- Auth Status & Portal -->
        <div style="display: flex; align-items: center; gap: 8px;">
          ${authUser ? `
            <div style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.08); padding: 4px 10px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12);">
              <a href="${authUser.role === 'admin' ? '/admin#admin-profile-sec' : '/dashboard/settings?tab=profil'}" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: inherit;" title="Pengaturan Foto Profil & Akun">
                <img id="topNavAvatar" class="top-nav-avatar" src="${authUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}" alt="${authUser.fullName || 'User'}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80';" style="width: 26px; height: 26px; border-radius: 50%; object-fit: cover; border: 1.5px solid #F97316;">
                <span class="user-display-name" style="font-size: 12px; font-weight: 700; color: #FFF;">
                  ${authUser.role === 'admin' ? '👑' : '👤'} ${(authUser.fullName || 'User').split(' ')[0]}
                </span>
              </a>
              <span class="badge ${authUser.role === 'admin' ? 'badge-red' : 'badge-green'}" style="font-size: 10px; padding: 2px 6px;">
                ${authUser.role === 'admin' ? 'ADMIN' : (authUser.plan ? authUser.plan.toUpperCase() : 'USER')}
              </span>
              ${authUser.role === 'admin' ? `
                <a href="/admin#pending-approvals-sec" class="btn-primary" style="padding: 3px 8px; font-size: 10px; background: ${pendingApprovalsCount > 0 ? '#DC2626' : '#EA580C'}; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;" title="${pendingApprovalsCount} pendaftaran menunggu persetujuan">
                  <span>👑 Admin</span>
                  ${pendingApprovalsCount > 0 ? `<span style="background: white; color: #DC2626; border-radius: 999px; padding: 1px 5px; font-weight: 900; font-size: 9px;">${pendingApprovalsCount}</span>` : ''}
                </a>
              ` : ''}
              <a href="/logout" class="btn-outline" style="padding: 4px 8px; font-size: 11px; color: #EF4444; border-color: rgba(239,68,68,0.4); text-decoration: none;">Keluar</a>
            </div>
          ` : `
            <a href="/login" class="btn-primary btn-sm">🔑 Masuk</a>
            <a href="/register" class="btn-outline btn-sm" style="color: white; border-color: rgba(255,255,255,0.3);">Daftar</a>
          `}
          <a href="/portal" class="btn-dark btn-sm" style="background: #1E293B; border: 1px solid #334155; text-decoration: none;">🎯 Portal</a>
        </div>
      </div>
    </header>

    ${renderNetworkModalHtml()}
  `;
}

function renderNetworkModalHtml() {
  const ips = getLocalIpAddresses();
  return `
    <div id="networkModal" class="modal-overlay" onclick="if(event.target===this) closeNetworkModal()">
      <div class="modal-content" style="max-width: 520px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="font-size: 24px;">📱</div>
            <h3 style="font-size: 18px; font-weight: 900;">Akses Aplikasi dari Perangkat Lain</h3>
          </div>
          <button onclick="closeNetworkModal()" style="border: none; background: #F1F5F9; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-weight: 800;">✕</button>
        </div>
        <p style="font-size: 13px; color: #475569; margin-bottom: 16px; line-height: 1.6;">
          Server TataDana mendengarkan di alamat <code>0.0.0.0:3000</code>. Anda dapat membuka aplikasi ini secara langsung dari smartphone, tablet, atau laptop lain yang terhubung ke <b>jaringan Wi-Fi yang sama</b>:
        </p>
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 16px; margin-bottom: 16px;">
          <div style="font-size: 12px; font-weight: 700; color: #64748B; margin-bottom: 8px;">ALAMAT UTAMA (LOCALHOST TERPADU):</div>
          <div style="display: flex; justify-content: space-between; align-items: center; background: #FFF7ED; padding: 12px 14px; border-radius: 10px; border: 2px solid #F97316; margin-bottom: 12px;">
            <div>
              <span style="font-weight: 900; color: #C2410C; font-size: 15px;">http://localhost:3000</span>
              <span class="badge badge-green" style="font-size: 10px; padding: 2px 6px; margin-left: 6px;">UTAMA</span>
            </div>
            <button onclick="navigator.clipboard.writeText('http://localhost:3000'); alert('URL http://localhost:3000 disalin!')" class="btn-primary btn-sm">Salin Alamat</button>
          </div>
          <div style="font-size: 12px; font-weight: 700; color: #64748B; margin-bottom: 8px;">LINK AKSES PUBLIK (INTERNET GLOBAL / HTTPS):</div>
          <div style="display: flex; justify-content: space-between; align-items: center; background: #EFF6FF; padding: 12px 14px; border-radius: 10px; border: 2px solid #3B82F6; margin-bottom: 12px;">
            <div>
              <a href="https://hamilton-buildings-robust-technique.trycloudflare.com" target="_blank" style="font-weight: 900; color: #1D4ED8; font-size: 13px; text-decoration: none;">https://hamilton-buildings-robust-technique.trycloudflare.com</a>
              <span class="badge badge-blue" style="font-size: 10px; padding: 2px 6px; margin-left: 6px;">PUBLIK LIVE</span>
            </div>
            <button onclick="navigator.clipboard.writeText('https://hamilton-buildings-robust-technique.trycloudflare.com'); alert('Link publik disalin!')" class="btn-dark btn-sm">Salin Link</button>
          </div>
          <div style="font-size: 12px; font-weight: 700; color: #64748B; margin-bottom: 8px;">URL JARINGAN LOKAL (WI-FI / CROSS-DEVICE):</div>
          ${ips.map(ip => `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; background: white; padding: 10px 14px; border-radius: 10px; border: 1px solid #CBD5E1;">
              <div>
                <span style="font-weight: 800; color: #F97316;">http://${ip.address}:3000</span>
                <span style="font-size: 11px; color: #94A3B8; margin-left: 6px;">(${ip.interface})</span>
              </div>
              <button onclick="navigator.clipboard.writeText('http://${ip.address}:3000'); alert('URL disalin!')" class="btn-outline btn-sm">Salin</button>
            </div>
          `).join('')}
        </div>
        <div style="font-size: 12px; color: #64748B; background: #FFF7ED; border: 1px solid #FFEDD5; padding: 12px; border-radius: 10px; margin-bottom: 16px;">
          💡 <b>Tips Pengujian Mobile:</b> Cukup buka browser Chrome atau Safari di smartphone Anda, lalu ketik <code>http://${ips[0]?.address || '192.168.18.27'}:3000</code>.
        </div>
        <button onclick="closeNetworkModal()" class="btn-dark" style="width: 100%;">Tutup</button>
      </div>
    </div>
    <script>
      function openNetworkModal() { document.getElementById('networkModal').classList.add('active'); }
      function closeNetworkModal() { document.getElementById('networkModal').classList.remove('active'); }
    </script>
  `;
}

function renderUserSidebar(currentPath, activeUser, isViewAsMode = false, activeDashboardTab = 'personal') {
  const norm = (currentPath || '/').toLowerCase();
  const qStr = isViewAsMode ? `?viewAs=${activeUser.id}` : '';
  const isAdmin = activeUser && activeUser.role === 'admin';

  const personalNavItems = [
    { label: 'Beranda', icon: '🏠', path: '/dashboard' },
    { label: 'Transaksi', icon: '💳', path: '/dashboard/transactions' },
    { label: 'Laporan', icon: '📊', path: '/dashboard/reports' },
    { label: 'Budget', icon: '🎯', path: '/dashboard/budget' },
    { label: 'Wallet', icon: '👛', path: '/dashboard/wallet' },
    { label: 'AI Financial Chat', icon: '🤖', path: '/dashboard/ai-chat', badge: 'AI' },
    { label: 'Settings', icon: '⚙️', path: '/dashboard/settings' }
  ];

  const pendingApprovalsCount = (store && store.users) ? store.users.filter(u => u.status === 'pending_approval').length : 0;

  const adminNavItems = [
    { label: 'Ringkasan Sistem', icon: '👑', path: '/admin#admin-overview' },
    { label: 'Profil Admin', icon: '👤', path: '/admin#admin-profile-sec' },
    { label: 'Persetujuan User', icon: '📋', path: '/admin#pending-approvals-sec', badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount} Menunggu` : 'Approval' },
    { label: 'Kelola Pengguna', icon: '👥', path: '/admin#user-mgmt' },
    { label: 'Approval Bayar', icon: '💳', path: '/admin#payments-sec' },
    { label: 'Multi-Provider AI', icon: '🤖', path: '/admin#ai-switcher-sec' },
    { label: 'Audit Logs', icon: '🛡️', path: '/admin#audit-sec' },
    { label: 'Ekspor Data', icon: '📑', path: '/admin#reports-export' }
  ];

  const navItems = (isAdmin && activeDashboardTab === 'admin') ? adminNavItems : personalNavItems;

  return `
    <aside class="sidebar-responsive" style="width: 260px; background: #0F172A; color: white; border-right: 1px solid #1E293B; padding: 24px 16px; display: flex; flex-direction: column; justify-content: space-between; min-height: calc(100vh - 54px);">
      <div>
        <!-- Brand -->
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding: 0 8px;">
          <div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #F97316, #EA580C); display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 18px;">T</div>
          <div>
            <span style="font-weight: 900; font-size: 18px; letter-spacing: -0.5px;">Tata<span style="color: #F97316;">Dana</span></span>
            <div style="font-size: 10px; color: #94A3B8; font-weight: 700;">${(isAdmin && activeDashboardTab === 'admin') ? 'PANEL MANAJEMEN ADMIN' : 'KEUANGAN PRIBADI'}</div>
          </div>
        </div>

        ${isAdmin && activeDashboardTab === 'admin' ? `
          <!-- Status Konsol Khusus Admin -->
          <div style="background: rgba(249,115,22,0.1); border: 1px solid rgba(249,115,22,0.3); border-radius: 12px; padding: 10px 12px; margin-bottom: 16px;">
            <div style="font-size: 10px; font-weight: 800; color: #FB923C; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">STATUS KONSOL:</div>
            <div style="font-size: 12px; font-weight: 800; color: #FFFFFF; display: flex; align-items: center; gap: 6px;">
              <span>👑</span> <span>Admin Console Aktif</span>
            </div>
            <div style="font-size: 11px; color: #94A3B8; margin-top: 2px;">Tata kelola sistem & persetujuan</div>
          </div>
        ` : ''}

        <!-- Navigation Links -->
        <div style="display: flex; flex-direction: column; gap: 4px;">
          ${navItems.map(item => {
            const isActive = norm === item.path || (item.path !== '/dashboard' && item.path !== '/admin' && norm.startsWith(item.path));
            return `
              <a href="${item.path}${qStr}" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-radius: 12px; ${isActive ? 'background: #F97316; color: white; font-weight: 800;' : 'color: #CBD5E1; font-weight: 600;'} text-decoration: none; font-size: 13px; transition: all 0.15s;" onmouseover="if(!${isActive}) this.style.background='rgba(255,255,255,0.06)'" onmouseout="if(!${isActive}) this.style.background='transparent'">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span>${item.icon}</span>
                  <span>${item.label}</span>
                </div>
                ${item.badge ? `<span style="font-size: 9px; padding: 2px 6px; border-radius: 6px; background: rgba(255,255,255,0.2); font-weight: 800;">${item.badge}</span>` : ''}
              </a>
            `;
          }).join('')}
        </div>
      </div>

      <!-- User Profile Card & Plan -->
      <div style="border-top: 1px solid #1E293B; padding-top: 16px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding: 0 4px;">
          <a href="${isAdmin && activeDashboardTab === 'admin' ? '/admin#admin-profile-sec' : `/dashboard/settings?tab=profil${qStr}`}" title="Ubah Foto Profil">
            <img id="sidebarAvatar" class="sidebar-avatar" src="${activeUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}" alt="${activeUser.fullName || 'User'}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80';" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 2px solid #F97316;">
          </a>
          <div style="overflow: hidden; flex: 1;">
            <div class="user-full-name-display" style="font-weight: 800; font-size: 13px; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${activeUser.fullName}</div>
            <div style="font-size: 11px; color: #94A3B8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${activeUser.email}</div>
            <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
              <span class="badge ${activeUser.plan === 'pro' ? 'badge-green' : 'badge-amber'}" style="font-size: 9px; padding: 1px 6px;">
                ${activeUser.plan ? activeUser.plan.toUpperCase() : 'USER'} ${activeUser.plan === 'pro' ? '⭐' : ''}
              </span>
              <span style="font-size: 10px; color: #94A3B8;">${activeUser.defaultCurrency || 'IDR'}</span>
            </div>
          </div>
        </div>

        ${activeUser.plan === 'starter' ? `
          <a href="/dashboard/upgrade${qStr}" class="btn-primary" style="width: 100%; font-size: 11px; padding: 8px; margin-bottom: 8px; text-decoration: none;">
            ⭐ Upgrade ke Pro (Rp99rb)
          </a>
        ` : ''}

        <div style="display: flex; gap: 6px;">
          <a href="${isAdmin && activeDashboardTab === 'admin' ? '/admin#admin-profile-sec' : `/dashboard/settings${qStr}`}" class="btn-outline" style="flex: 1; font-size: 11px; padding: 6px; color: #CBD5E1; border-color: #334155; text-decoration: none; text-align: center;">⚙️ Edit Profil</a>
          <a href="/logout" class="btn-outline" style="font-size: 11px; padding: 6px 10px; color: #EF4444; border-color: rgba(239,68,68,0.3); text-decoration: none;">Keluar</a>
        </div>
      </div>
    </aside>
  `;
}

function renderViewAsBanner(activeUser) {
  return `
    <div style="position: sticky; top: 50px; z-index: 9998; background: #0F172A; color: white; border-bottom: 3px solid #F97316; padding: 10px 24px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 20px rgba(0,0,0,0.35); flex-wrap: wrap; gap: 10px;">
      <div style="display: flex; align-items: center; gap: 10px; font-size: 13px;">
        <span>👁️ <b>MODE IMPERSONASI (Mode Tinjau Admin)</b>: Anda sedang melihat dashboard sebagai <b>${activeUser.fullName}</b></span>
        <span style="color: #64748B;">|</span>
        <a href="/admin" class="btn-primary" style="padding: 6px 14px; font-size: 12px; background: #EA580C; text-decoration: none; border-radius: 8px;">
          Kembali ke Admin Console ↩
        </a>
      </div>
      <div style="font-size: 11px; color: #94A3B8;">
        User ID: <code>${activeUser.id}</code> (${activeUser.email}) • Paket: <b>${activeUser.plan ? activeUser.plan.toUpperCase() : 'USER'}</b>
      </div>
    </div>
  `;
}

function renderUnifiedLocalhostBar() {
  return '';
}

function renderUnifiedFrameContainer() {
  return '';
}

function renderUnifiedTabScript() {
  return '';
}

module.exports = {
  getHtmlHeader,
  renderGlobalHubNav,
  renderUserSidebar,
  renderViewAsBanner,
  renderNetworkModalHtml,
  renderUnifiedLocalhostBar,
  renderUnifiedFrameContainer,
  renderUnifiedTabScript
};
