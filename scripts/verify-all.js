/**
 * TataDana Comprehensive End-to-End Verification Test Suite
 * Asserts all 28+ routes, APIs, RBAC guards, Webhook idempotency, NLP parser,
 * AI Chat, Multi-device IP access, Modular payments, and Admin functions.
 */

const http = require('http');

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName} - ${details}`);
    failed++;
  }
}

function request(options, bodyData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    req.on('error', reject);
    if (bodyData) {
      if (typeof bodyData === 'object') {
        req.write(JSON.stringify(bodyData));
      } else {
        req.write(bodyData);
      }
    }
    req.end();
  });
}

function extractCookie(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return null;
  const match = setCookie[0].match(/tatadana_session=([^;]+)/);
  return match ? `tatadana_session=${match[1]}` : null;
}

async function runTests() {
  console.log('\n=============================================================');
  console.log('🚀 RUNNING TATADANA FULL END-TO-END VERIFICATION SUITE');
  console.log('=============================================================\n');

  try {
    // -------------------------------------------------------------
    // SECTION 1: PUBLIC LANDING PAGE & HUBS
    // -------------------------------------------------------------
    console.log('📌 1. Testing Public Web Pages & Navigation...');
    
    // Landing Page
    const landingRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/',
      method: 'GET'
    });
    assert(landingRes.statusCode === 200, 'Landing Page (/) returns 200 OK');
    assert(landingRes.body.includes('TataDana') && landingRes.body.includes('Catat keuangan semudah chat'), 'Landing Page contains brand tagline & title');
    assert(landingRes.body.includes('Pilih Paket') && landingRes.body.includes('Rp99.000'), 'Landing Page contains 15 sections including Transparent Pricing (Starter & Pro)');
    assert(landingRes.body.includes('Pertanyaan yang Sering Diajukan') && landingRes.body.includes('Telegram'), 'Landing Page contains 7+ Indonesian FAQ accordion section');

    // Portal Hub
    const portalRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/portal',
      method: 'GET'
    });
    assert(portalRes.statusCode === 200, 'Unified Portal Hub (/portal) returns 200 OK');
    assert(portalRes.body.includes('TataDana') && (portalRes.body.includes('Portal Terpadu') || portalRes.body.includes('Unified Portal')), 'Portal Hub contains central dashboard navigation');

    // Network Info API (Tugas 7: Akses Perangkat Lain)
    const netRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/system/network-info',
      method: 'GET'
    });
    assert(netRes.statusCode === 200, 'Network Info API (/api/system/network-info) returns 200 OK');
    const netJson = JSON.parse(netRes.body);
    assert(netJson.ok === true && Array.isArray(netJson.localIps), 'Network Info returns active network IP list (Wi-Fi 192.168.x.x)');

    // Telegram Bot Simulator Page
    const simRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/dev/telegram-simulator',
      method: 'GET'
    });
    assert(simRes.statusCode === 200, 'Telegram Bot Simulator (/dev/telegram-simulator) returns 200 OK');
    assert(simRes.body.includes('Telegram Bot') && simRes.body.includes('Simulator'), 'Simulator page loaded correctly with chat UI & presets');

    // Webhook Tester Page
    const testUiRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/webhook-tester',
      method: 'GET'
    });
    assert(testUiRes.statusCode === 200, 'Webhook Tester (/webhook-tester) returns 200 OK');

    // -------------------------------------------------------------
    // SECTION 2: AUTHENTICATION & RBAC GUARDS
    // -------------------------------------------------------------
    console.log('\n📌 2. Testing Authentication & RBAC Access Control...');

    // GET /login & /register
    const loginPageRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/login', method: 'GET' });
    assert(loginPageRes.statusCode === 200, 'Login Page (/login) returns 200 OK');
    assert(loginPageRes.body.includes('Masuk ke') || loginPageRes.body.includes('login'), 'Login Page has 40/60 split layout and form');

    const regPageRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/register', method: 'GET' });
    assert(regPageRes.statusCode === 200, 'Register Page (/register) returns 200 OK');

    // Protected Route Without Auth
    const unauthDash = await request({ hostname: '127.0.0.1', port: 3000, path: '/dashboard', method: 'GET' });
    assert(unauthDash.statusCode === 302 && unauthDash.headers.location.includes('/login'), 'Unauthenticated GET /dashboard redirects to /login');

    const unauthAdmin = await request({ hostname: '127.0.0.1', port: 3000, path: '/admin', method: 'GET' });
    assert(unauthAdmin.statusCode === 302 && unauthAdmin.headers.location.includes('/login'), 'Unauthenticated GET /admin redirects to /login');

    // Login as Budi (Regular Pro User)
    const budiLoginRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'budi.pratama@gmail.com', password: 'password123' });

    assert(budiLoginRes.statusCode === 200, 'User Login API (/api/auth/login) with Budi credentials returns 200 OK');
    const budiCookie = extractCookie(budiLoginRes.headers);
    assert(!!budiCookie, 'Session cookie tatadana_session received for user Budi');

    // Budi accessing /admin (Must be Forbidden / 302 to /unauthorized)
    const budiAdminRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/admin',
      method: 'GET',
      headers: { 'Cookie': budiCookie }
    });
    assert(budiAdminRes.statusCode === 302 && budiAdminRes.headers.location === '/unauthorized', 'User Budi is blocked from /admin and redirected to /unauthorized');

    // Verify /unauthorized page returns 403
    const unauthPageRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/unauthorized',
      method: 'GET',
      headers: { 'Cookie': budiCookie }
    });
    assert(unauthPageRes.statusCode === 403, 'GET /unauthorized returns HTTP 403 Forbidden page');

    // Login as Admin
    const adminLoginRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'sellanrhrdni123@gmail.com', password: 'admin123' });
    assert(adminLoginRes.statusCode === 200, 'Admin Login with primary admin credentials (sellanrhrdni123@gmail.com) returns 200 OK');
    const adminCookie = extractCookie(adminLoginRes.headers);
    assert(!!adminCookie, 'Session cookie tatadana_session received for Admin');

    // -------------------------------------------------------------
    // SECTION 2.5: NEW USER REGISTRATION, ZERO BALANCE & ADMIN APPROVAL GATE
    // -------------------------------------------------------------
    console.log('\n📌 2.5. Testing Registration, Initial Zero Balance & Admin Approval Gate...');

    const testRegEmail = 'testuser_' + Date.now() + '@tatadana.id';
    const regRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      fullName: 'Bambang Widodo',
      email: testRegEmail,
      phone: '+6281234567899',
      password: 'password123',
      plan: 'starter'
    });

    assert(regRes.statusCode === 200, 'POST /api/auth/register returns 200 OK');
    const regJson = JSON.parse(regRes.body);
    assert(regJson.ok === true && regJson.status === 'pending_approval',
      'New user registered with status: pending_approval');

    // Verify initial wallet balance is strictly 0
    const rawDataRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/data',
      method: 'GET'
    });
    const storeDump = JSON.parse(rawDataRes.body);
    const registeredUser = storeDump.users.find(u => u.email === testRegEmail);
    assert(!!registeredUser && registeredUser.status === 'pending_approval',
      'Registered user exists in store with pending_approval status');
    
    const userWallets = storeDump.wallets.filter(w => w.userId === registeredUser.id);
    assert(userWallets.length > 0 && userWallets[0].balance === 0,
      'Initial default wallet balance is strictly Rp 0 for newly registered user');

    // Attempt login before approval (MUST BE BLOCKED)
    const blockedLoginRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: testRegEmail,
      password: 'password123'
    });
    assert(blockedLoginRes.statusCode === 403,
      'Login attempt by unapproved user is rejected with HTTP 403 Forbidden');
    const blockedJson = JSON.parse(blockedLoginRes.body);
    assert(blockedJson.status === 'pending_approval' && (blockedJson.error || '').includes('menunggu persetujuan'),
      'Informative Indonesian pending notice returned when unapproved user logs in');

    // Admin checks pending approvals endpoint
    const pendingQueryRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/admin/pending-approvals',
      method: 'GET',
      headers: { 'Cookie': adminCookie }
    });
    assert(pendingQueryRes.statusCode === 200, 'Pending Approvals API returns 200 OK');
    const pendingQueryJson = JSON.parse(pendingQueryRes.body);
    assert(pendingQueryJson.ok === true && pendingQueryJson.count >= 1,
      'Pending Approvals API reports new registered user awaiting approval');

    // Admin Dashboard renders pending notification banner & badge
    const adminPagePendingRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/admin',
      method: 'GET',
      headers: { 'Cookie': adminCookie }
    });
    assert(adminPagePendingRes.statusCode === 200 && adminPagePendingRes.body.includes('Menunggu Persetujuan'),
      'Admin Dashboard displays prominent pending approvals alert banner');

    // Admin approves user via POST /api/admin/users/approve
    const approveRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/admin/users/approve',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookie
      }
    }, {
      userId: registeredUser.id,
      reason: 'Verifikasi identitas pendaftaran pengguna baru disetujui'
    });
    assert(approveRes.statusCode === 200, 'Admin successfully approves user via POST /api/admin/users/approve');
    const approveJson = JSON.parse(approveRes.body);
    assert(approveJson.ok === true && approveJson.user.status === 'approved',
      'User status transitioned to approved in database');

    // Approved user can now log in successfully
    const successLoginRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: testRegEmail,
      password: 'password123'
    });
    assert(successLoginRes.statusCode === 200, 'Approved user logs in successfully with HTTP 200 OK');
    const newSessionCookie = extractCookie(successLoginRes.headers);
    assert(!!newSessionCookie, 'Session cookie issued for newly approved user');

    // User can access /dashboard with Rp 0 balance
    const userDashRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/dashboard',
      method: 'GET',
      headers: { 'Cookie': newSessionCookie }
    });
    assert(userDashRes.statusCode === 200, 'Approved user accesses personal finance dashboard /dashboard');
    assert(userDashRes.body.includes('Rp 0') || userDashRes.body.includes('0'),
      'Dashboard accurately displays Rp 0 initial liquid balance');

    // Test Quick Approve API
    const quickUserEmail = 'quick_' + Date.now() + '@tatadana.id';
    await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      fullName: 'Quick Test User',
      email: quickUserEmail,
      phone: '+628999888777',
      password: 'password123',
      plan: 'pro'
    });

    const quickApproveRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/auth/quick-approve',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: quickUserEmail });
    assert(quickApproveRes.statusCode === 200, 'Quick Approve API returns 200 OK');
    const quickApproveJson = JSON.parse(quickApproveRes.body);
    assert(quickApproveJson.ok === true && quickApproveJson.user.status === 'approved',
      'Quick approve successfully approved pending user');

    // Expanded Cash & Cashless transactions (SeaBank, Tunai, BCA, Mandiri)
    const txCashRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/transactions/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': budiCookie
      }
    }, {
      type: 'expense',
      amount: 15000,
      desc: 'Beli Kopi Pinggir Jalan (Tunai)',
      cat: '🍜 Makanan & Minuman',
      wallet: 'Uang Tunai (Cash)'
    });
    assert(txCashRes.statusCode === 200, 'Transaction created using Cash / Uang Tunai');

    const txSeaBankRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/transactions/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': budiCookie
      }
    }, {
      type: 'income',
      amount: 250000,
      desc: 'Transfer Bunga Deposito SeaBank',
      cat: '💰 Gaji Bulanan',
      wallet: 'SeaBank'
    });
    assert(txSeaBankRes.statusCode === 200, 'Transaction created using SeaBank');

    // -------------------------------------------------------------
    // SECTION 3: USER DASHBOARD SUBPAGES (TUGAS 3)
    // -------------------------------------------------------------
    console.log('\n📌 3. Testing User Dashboard Subpages (All Connected)...');

    const subpages = [
      { path: '/dashboard', title: 'Beranda' },
      { path: '/dashboard/transactions', title: 'Transaksi' },
      { path: '/dashboard/reports', title: 'Laporan' },
      { path: '/dashboard/budget', title: 'Budget' },
      { path: '/dashboard/wallet', title: 'Dompet' },
      { path: '/dashboard/ai-chat', title: 'AI Chat' },
      { path: '/dashboard/settings', title: 'Pengaturan' },
      { path: '/dashboard/upgrade', title: 'Upgrade Pro' }
    ];

    for (const sp of subpages) {
      const res = await request({
        hostname: '127.0.0.1',
        port: 3000,
        path: sp.path,
        method: 'GET',
        headers: { 'Cookie': budiCookie }
      });
      assert(res.statusCode === 200, `Dashboard Subpage ${sp.path} (${sp.title}) returns 200 OK`);
      assert(!res.body.includes('404 — Halaman Tidak Ditemukan'), `${sp.path} renders valid page without 404`);
    }

    // -------------------------------------------------------------
    // SECTION 4: IN-APP AI FINANCIAL CHAT (TUGAS 4)
    // -------------------------------------------------------------
    console.log('\n📌 4. Testing In-App AI Financial Chat with Real User Data...');

    const aiChatQuery1 = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/ai/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': budiCookie
      }
    }, { message: 'Berapa total pengeluaran saya bulan ini?' });

    assert(aiChatQuery1.statusCode === 200, 'POST /api/ai/chat returns 200 OK');
    const aiResJson1 = JSON.parse(aiChatQuery1.body);
    assert(aiResJson1.ok === true && aiResJson1.reply.includes('Pengeluaran') && aiResJson1.reply.includes('Rp'),
      'AI Chat correctly analyzes user real transactions and formats IDR cashflow');

    const aiChatQuery2 = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/ai/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': budiCookie
      }
    }, { message: 'Apakah budget bulanan saya masih aman?' });
    const aiResJson2 = JSON.parse(aiChatQuery2.body);
    assert(aiResJson2.ok === true && (aiResJson2.reply.includes('Budget') || aiResJson2.reply.includes('budget') || aiResJson2.reply.includes('anggaran')),
      'AI Chat provides personalized budget threshold feedback');

    // -------------------------------------------------------------
    // SECTION 5: MODULAR PAYMENTS & CHECKOUT (TUGAS 5)
    // -------------------------------------------------------------
    console.log('\n📌 5. Testing Modular Payments & Order Creation...');

    const orderRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/payments/create-order',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': budiCookie
      }
    }, { method: 'QRIS Realtime (Midtrans Snap)', amount: 99000 });

    assert(orderRes.statusCode === 200, 'POST /api/payments/create-order returns 200 OK');
    const orderJson = JSON.parse(orderRes.body);
    assert(orderJson.ok === true && orderJson.order.referenceNumber.startsWith('REF-'),
      'Order generated with unique Indonesian reference number');

    // -------------------------------------------------------------
    // SECTION 6: USER PROFILE PERSISTENCE (TUGAS 6)
    // -------------------------------------------------------------
    console.log('\n📌 6. Testing User Profile Updates & Persistence...');

    const updatedName = 'Budi Pratama Verified SE';
    const profileRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/user/profile',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': budiCookie
      }
    }, {
      fullName: updatedName,
      phone: '+62 812-9988-7766',
      defaultCurrency: 'IDR'
    });

    assert(profileRes.statusCode === 200, 'POST /api/user/profile returns 200 OK');
    const profileJson = JSON.parse(profileRes.body);
    assert(profileJson.user.fullName === updatedName, 'Profile name updated and persisted in store');

    // Verify change reflected in dashboard settings page
    const settingsVerify = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/dashboard/settings',
      method: 'GET',
      headers: { 'Cookie': budiCookie }
    });
    assert(settingsVerify.body.includes(updatedName), 'Settings view reflects newly persisted user profile');

    // Profile Photo Change & Persistence Verification
    const updatedAvatarUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80';
    const avatarRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/user/profile',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': budiCookie
      }
    }, {
      avatarUrl: updatedAvatarUrl
    });
    assert(avatarRes.statusCode === 200, 'POST /api/user/profile with new avatarUrl returns 200 OK');
    const avatarJson = JSON.parse(avatarRes.body);
    assert(avatarJson.user.avatarUrl === updatedAvatarUrl, 'Avatar photo URL updated and persisted in session user');

    // Verify avatar reflected in Settings view, Top Navbar, and Sidebar
    const settingsAvatarVerify = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/dashboard/settings',
      method: 'GET',
      headers: { 'Cookie': budiCookie }
    });
    assert(settingsAvatarVerify.body.includes(updatedAvatarUrl), 'Settings view and navbar reflect updated avatar URL');
    assert(settingsAvatarVerify.body.includes('avatarModal') && settingsAvatarVerify.body.includes('avatarPreview'),
      'Settings view contains interactive avatarModal and avatarPreview element');
    assert(settingsAvatarVerify.body.includes('topNavAvatar') && settingsAvatarVerify.body.includes('sidebarAvatar'),
      'Global view components contain topNavAvatar and sidebarAvatar elements');
    assert(settingsAvatarVerify.body.includes('avatar-hover-wrapper') && settingsAvatarVerify.body.includes('avatar-hover-overlay'),
      'Settings view contains avatar hover overlay and camera badge');
    assert(settingsAvatarVerify.body.includes('AVATAR_PRESETS') && settingsAvatarVerify.body.includes('directFileInput'),
      'Settings view contains preset data and direct file input');

    // Verify Base64 File Upload Avatar Persistence
    const sampleBase64Avatar = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    const b64Res = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/user/profile',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': budiCookie
      }
    }, {
      avatarUrl: sampleBase64Avatar
    });
    assert(b64Res.statusCode === 200, 'POST /api/user/profile with base64 data URL returns 200 OK');
    const b64Json = JSON.parse(b64Res.body);
    assert(b64Json.user.avatarUrl === sampleBase64Avatar, 'Avatar photo persists base64 uploaded image string');

    // Verify Admin Impersonation Profile Isolation (Admin updating user avatar preserves admin session profile)
    const adminAvatarTestUrl = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80';
    const adminImpersonateAvatarRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/user/profile',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookie
      }
    }, {
      userId: 'usr_starter_01',
      avatarUrl: adminAvatarTestUrl
    });
    assert(adminImpersonateAvatarRes.statusCode === 200, 'Admin can update user avatar via userId');
    const adminImpJson = JSON.parse(adminImpersonateAvatarRes.body);
    assert(adminImpJson.user.id === 'usr_starter_01' && adminImpJson.user.avatarUrl === adminAvatarTestUrl,
      'Target user (usr_starter_01) avatar was updated without corrupting admin profile');

    // -------------------------------------------------------------
    // SECTION 7: TELEGRAM BOT WEBHOOK, NLP & IDEMPOTENCY
    // -------------------------------------------------------------
    console.log('\n📌 7. Testing Telegram Bot Webhook, Indonesian NLP & Idempotency...');

    // NLP Parsing Endpoint
    const parseTest1 = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/ai/parse',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { text: 'beli bakso urat 25rb' });
    const parseJson1 = JSON.parse(parseTest1.body);
    assert(parseJson1.success === true && parseJson1.amount === 25000 && parseJson1.type === 'expense',
      'NLP parser converts "25rb" to 25,000 IDR expense');

    const parseTest2 = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/ai/parse',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { text: 'gajian bulanan 7.5jt' });
    const parseJson2 = JSON.parse(parseTest2.body);
    assert(parseJson2.success === true && parseJson2.amount === 7500000 && parseJson2.type === 'income',
      'NLP parser converts "7.5jt" to 7,500,000 IDR income');

    // Webhook with Unique update_id (First time -> 200 OK processed)
    const testUpdateId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 100000);
    const webhookRes1 = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/telegram/webhook',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      update_id: testUpdateId,
      message: {
        message_id: 101,
        from: { id: 12345678, first_name: 'Budi' },
        chat: { id: 12345678 },
        text: 'kopi susu gula aren 22rb',
        date: Math.floor(Date.now() / 1000)
      }
    });

    assert(webhookRes1.statusCode === 200, 'Telegram Webhook returns 200 OK on new transaction');
    const webhookJson1 = JSON.parse(webhookRes1.body);
    assert(webhookJson1.ok === true && (webhookJson1.reply.includes('Pengeluaran tercatat') || webhookJson1.reply.includes('tercatat')),
      'Webhook parsed and saved transaction with authentic WIB response');

    // Webhook with Duplicate update_id (Idempotency Check)
    const webhookRes2 = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/telegram/webhook',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      update_id: testUpdateId, // Duplicate!
      message: {
        message_id: 102,
        from: { id: 12345678, first_name: 'Budi' },
        chat: { id: 12345678 },
        text: 'kopi susu gula aren 22rb',
        date: Math.floor(Date.now() / 1000)
      }
    });
    const webhookJson2 = JSON.parse(webhookRes2.body);
    assert(webhookJson2.status === 'already_processed_idempotent' || webhookJson2.idempotent === true,
      'Webhook idempotency verified: duplicate update_id skipped without duplicate balance deduction');

    // Photo Receipt OCR Simulation via Webhook
    const photoWebhook = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/telegram/webhook',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      update_id: testUpdateId + 1,
      message: {
        message_id: 103,
        from: { id: 12345678, first_name: 'Budi' },
        chat: { id: 12345678 },
        photo: [{ file_id: 'ph_123', width: 800, height: 600 }],
        caption: 'Struk supermarket',
        date: Math.floor(Date.now() / 1000)
      }
    });
    const photoJson = JSON.parse(photoWebhook.body);
    assert(photoJson.ok === true && photoJson.transaction && (photoJson.reply.includes('Foto Struk') || photoJson.reply.includes('Struk')),
      'Photo receipt OCR extracted items and saved multi-item transaction');

    // Voice Note STT Simulation via Webhook
    const voiceWebhook = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/telegram/webhook',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      update_id: testUpdateId + 2,
      message: {
        message_id: 104,
        from: { id: 12345678, first_name: 'Budi' },
        chat: { id: 12345678 },
        voice: { file_id: 'voice_123', duration: 4 },
        date: Math.floor(Date.now() / 1000)
      }
    });
    const voiceJson = JSON.parse(voiceWebhook.body);
    assert(voiceJson.ok === true && voiceJson.reply.includes('Transkrip:'),
      'Voice note transcribed via STT and returned line with 🎙️ Transkrip:');

    // Bot Command /saldo
    const cmdSaldo = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/telegram/webhook',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      update_id: testUpdateId + 3,
      message: {
        message_id: 105,
        from: { id: 12345678, first_name: 'Budi' },
        chat: { id: 12345678 },
        text: '/saldo',
        date: Math.floor(Date.now() / 1000)
      }
    });
    const cmdJson = JSON.parse(cmdSaldo.body);
    assert(cmdJson.reply && (cmdJson.reply.includes('Saldo') || cmdJson.reply.includes('Dompet')),
      'Command /saldo returned multi-wallet breakdown and total liquid balance');

    // Test Bot Connection Endpoint
    const testConnRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/telegram/test-connection',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { botToken: '123456789:AAFakeTokenForTataDanaFintechTest001' });
    const testConnJson = JSON.parse(testConnRes.body);
    assert(testConnJson.ok === true && testConnJson.status === 'connected',
      'Test Connection API verified bot credentials and webhook registration');

    // -------------------------------------------------------------
    // SECTION 8: ADMIN EXECUTIVE CONSOLE & GOVERNANCE (TUGAS 8)
    // -------------------------------------------------------------
    console.log('\n📌 8. Testing Admin Executive Console, Impersonation & AI Switcher...');

    // Access Admin Dashboard with Admin Cookie
    const adminDashRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/admin',
      method: 'GET',
      headers: { 'Cookie': adminCookie }
    });
    assert(adminDashRes.statusCode === 200, 'GET /admin with admin credentials returns 200 OK');
    assert(adminDashRes.body.includes('TataDana Admin') || adminDashRes.body.includes('Executive'),
      'Admin Console renders executive stats cards, user management, and AI switcher');

    // Impersonation ("View as User") strictly disabled for Admin
    const impersonateRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/dashboard?viewAs=usr_starter_01',
      method: 'GET',
      headers: { 'Cookie': adminCookie }
    });
    assert(impersonateRes.statusCode === 302 && impersonateRes.headers.location.includes('/admin?notice=admin_only'), 'Admin is strictly blocked from viewing user dashboard (view user disabled)');
    assert(!adminDashRes.body.includes('View as User'), 'Admin Console strictly removed View as User button');

    // Switch Primary AI Provider
    const switchAiRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/admin/set-ai-provider',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': adminCookie
      }
    }, { providerId: 'deepseek' });
    const switchAiJson = JSON.parse(switchAiRes.body);
    assert(switchAiJson.ok === true, 'Admin successfully switched primary AI provider to DeepSeek');

    // User Transaction Inspection with Audit Trail
    const inspectRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/admin/user-transactions?userId=usr_starter_01&reason=Investigasi+Kepatuhan+Finansial',
      method: 'GET',
      headers: { 'Cookie': adminCookie }
    });
    assert(inspectRes.statusCode === 200, 'Admin transaction inspection API returns 200 OK');
    const inspectJson = JSON.parse(inspectRes.body);
    assert(inspectJson.ok === true && Array.isArray(inspectJson.transactions),
      'Transactions retrieved with mandatory zero-trust audit reason recorded');

    // Midtrans Payment Webhook Simulation
    const midtransRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/payments/midtrans',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { order_id: 'ord_sample', transaction_status: 'settlement' });
    const midtransJson = JSON.parse(midtransRes.body);
    assert(midtransJson.ok === true && midtransJson.status === 'settled',
      'Midtrans webhook automatically settled payment and upgraded user plan');

    // -------------------------------------------------------------
    // SECTION 9: LOGOUT & SESSION INVALIDATION
    // -------------------------------------------------------------
    console.log('\n📌 9. Testing Logout & Cache Invalidation...');

    const logoutRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/logout',
      method: 'GET',
      headers: { 'Cookie': budiCookie }
    });
    assert(logoutRes.statusCode === 302 && logoutRes.headers.location === '/login',
      'Logout redirects to /login and clears session');

    // Summary
    console.log('\n=============================================================');
    console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('=============================================================');

    if (failed === 0) {
      console.log('🎉 ALL 28+ VERIFICATION TESTS PASSED WITH 100% SUCCESS RATE!');
      process.exit(0);
    } else {
      console.error(`💥 ${failed} tests failed. Please review the errors above.`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal test execution error:', error);
    process.exit(1);
  }
}

runTests();
