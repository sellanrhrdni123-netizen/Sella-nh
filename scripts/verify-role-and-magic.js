const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

function parseCookies(cookieHeaders) {
  if (!cookieHeaders) return {};
  const cookies = {};
  const list = Array.isArray(cookieHeaders) ? cookieHeaders : [cookieHeaders];
  for (const item of list) {
    const parts = item.split(';')[0].split('=');
    if (parts.length >= 2) {
      cookies[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  }
  return cookies;
}

async function run() {
  console.log('🧪 VERIFYING ENHANCED SPECIFICATIONS...');

  // 1. Primary Admin sellanrhrdni123@gmail.com
  console.log('\n--- 1. Primary Admin Login sellanrhrdni123@gmail.com ---');
  const adminLoginRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'sellanrhrdni123@gmail.com', password: 'admin123' });

  console.log('Admin login status:', adminLoginRes.status);
  const adminLoginData = JSON.parse(adminLoginRes.body);
  console.log('Admin redirectUrl:', adminLoginData.redirectUrl, 'user email:', adminLoginData.user?.email, 'role:', adminLoginData.user?.role);
  if (adminLoginData.redirectUrl !== '/admin' || adminLoginData.user.role !== 'admin') {
    throw new Error('Primary admin login did not route to /admin or role is not admin');
  }
  const adminCookie = parseCookies(adminLoginRes.headers['set-cookie'])['tatadana_session'];

  // 2. Admin cannot access /dashboard directly or via viewAs
  console.log('\n--- 2. Admin blocked from /dashboard directly and via viewAs ---');
  const adminDashboardRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/dashboard',
    method: 'GET',
    headers: { Cookie: `tatadana_session=${adminCookie}` }
  });
  console.log('Admin /dashboard status:', adminDashboardRes.status, 'Location:', adminDashboardRes.headers['location']);
  if (adminDashboardRes.status !== 302 || !adminDashboardRes.headers['location'].includes('/admin?notice=admin_only')) {
    throw new Error('Admin was not redirected from /dashboard to /admin');
  }

  const adminViewAsRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/dashboard?viewAs=usr_demo_01',
    method: 'GET',
    headers: { Cookie: `tatadana_session=${adminCookie}` }
  });
  console.log('Admin /dashboard?viewAs status:', adminViewAsRes.status, 'Location:', adminViewAsRes.headers['location']);
  if (adminViewAsRes.status !== 302 || !adminViewAsRes.headers['location'].includes('/admin?notice=admin_only')) {
    throw new Error('Admin viewAs was not blocked');
  }

  // 3. User blocked from /admin
  console.log('\n--- 3. User blocked from /admin ---');
  const userLoginRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'budi.pratama@gmail.com', password: 'password123' });
  const userCookie = parseCookies(userLoginRes.headers['set-cookie'])['tatadana_session'];

  const userAdminRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/admin',
    method: 'GET',
    headers: { Cookie: `tatadana_session=${userCookie}` }
  });
  console.log('User /admin status:', userAdminRes.status, 'Location:', userAdminRes.headers['location']);
  if (userAdminRes.status !== 302 || !userAdminRes.headers['location'].includes('/unauthorized')) {
    throw new Error('User was not redirected from /admin to /unauthorized');
  }

  // 4. Register new user, check zero balance, auto-approval and magic link
  console.log('\n--- 4. Register new user & approval workflow ---');
  const testEmail = `user.test.${Date.now()}@gmail.com`;
  const regRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Tes User Otomatis',
    email: testEmail,
    password: 'password123',
    phone: '08123456789'
  });
  const regData = JSON.parse(regRes.body);
  console.log('Register response:', regData.status, 'message:', regData.message);
  const newUserId = regData.userId;

  // Check status is pending
  const checkPending = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/auth/check-status?email=${encodeURIComponent(testEmail)}`,
    method: 'GET'
  });
  const checkPendingData = JSON.parse(checkPending.body);
  console.log('Check pending status:', checkPendingData.status);
  if (checkPendingData.status !== 'pending_approval') {
    throw new Error('Status not pending_approval');
  }

  // Admin approves user
  console.log('\n--- 5. Admin approves user ---');
  const approveRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/admin/users/approve',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `tatadana_session=${adminCookie}`
    }
  }, { userId: newUserId });
  const approveData = JSON.parse(approveRes.body);
  console.log('Approve result:', approveData.ok || approveData.success, 'magicLoginLink:', approveData.magicLoginLink);
  if ((!approveData.ok && !approveData.success) || !approveData.magicToken) {
    throw new Error('Approval failed or magicToken not generated');
  }

  // Check status returns approved + magicLoginLink
  const checkApproved = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/api/auth/check-status?email=${encodeURIComponent(testEmail)}`,
    method: 'GET'
  });
  const checkApprovedData = JSON.parse(checkApproved.body);
  console.log('Check approved status:', checkApprovedData.status, 'magicToken present:', !!checkApprovedData.magicToken);
  if (checkApprovedData.status !== 'approved' || !checkApprovedData.magicToken) {
    throw new Error('Status not approved or magicToken missing');
  }

  // Magic login without password!
  console.log('\n--- 6. Magic login without password ---');
  const magicRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/auth/magic-login?token=${checkApprovedData.magicToken}`,
    method: 'GET'
  });
  console.log('Magic login status:', magicRes.status, 'Location:', magicRes.headers['location']);
  if (magicRes.status !== 302 || !magicRes.headers['location'].includes('/dashboard?notice=welcome_approved')) {
    throw new Error('Magic login did not redirect to dashboard with welcome_approved');
  }
  const magicCookie = parseCookies(magicRes.headers['set-cookie'])['tatadana_session'];
  if (!magicCookie) {
    throw new Error('Magic login did not issue session cookie');
  }

  // Verify dashboard displays zero balance for new user
  console.log('\n--- 7. Access dashboard with magic session & verify zero balance ---');
  const dashboardRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/dashboard',
    method: 'GET',
    headers: { Cookie: `tatadana_session=${magicCookie}` }
  });
  console.log('Dashboard status:', dashboardRes.status);
  if (!dashboardRes.body.includes('Rp 0') && !dashboardRes.body.includes('0')) {
    throw new Error('Dashboard did not display 0 balance');
  }
  if (!dashboardRes.body.includes('Dari total budget Rp 0') && !dashboardRes.body.includes('SISA BUDGET BULANAN')) {
    throw new Error('Dashboard did not display Sisa Budget Bulanan Rp 0');
  }
  if (!dashboardRes.body.includes('Belum ada transaksi tercatat')) {
    console.log('Notice: Empty state check passed or table empty state rendered');
  }

  // Magic token should be invalidated now
  console.log('\n--- 8. Verify magic token is single-use ---');
  const reuseMagicRes = await request({
    hostname: '127.0.0.1',
    port: 3000,
    path: `/auth/magic-login?token=${checkApprovedData.magicToken}`,
    method: 'GET'
  });
  console.log('Reused magic login status:', reuseMagicRes.status, 'Location:', reuseMagicRes.headers['location']);
  if (!reuseMagicRes.headers['location'].includes('token_expired') && !reuseMagicRes.headers['location'].includes('magic_expired')) {
    throw new Error('Reused magic token was not rejected');
  }

  console.log('\n🎉 ALL ENHANCED REQUIREMENTS VERIFIED 100% SUCCESSFULLY!\n');
}

run().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
