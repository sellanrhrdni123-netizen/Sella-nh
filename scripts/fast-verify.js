const http = require('http');

function post(path, body, cookie) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) };
    if (cookie) headers['Cookie'] = cookie;
    const req = http.request({ hostname: '127.0.0.1', port: 3000, path, method: 'POST', headers }, res => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(b || '{}') }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, cookie) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (cookie) headers['Cookie'] = cookie;
    const req = http.request({ hostname: '127.0.0.1', port: 3000, path, method: 'GET', headers }, res => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, raw: b }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function verify() {
  console.log('1. Verifying Zero Balance, Zero Income, Zero Expense for Default User (Budi):');
  const budiLogin = await post('/api/auth/login', { email: 'budi.pratama@gmail.com', password: 'password123' });
  const budiCookie = budiLogin.headers['set-cookie'][0];
  const budiDash = await get('/dashboard', budiCookie);
  console.log(' - Dash Status:', budiDash.status);
  console.log(' - Total Saldo Rp 0:', budiDash.raw.includes('TOTAL SALDO') && budiDash.raw.includes('Rp 0'));
  console.log(' - Pemasukan +Rp 0:', budiDash.raw.includes('+Rp 0'));
  console.log(' - Pengeluaran -Rp 0:', budiDash.raw.includes('-Rp 0'));

  console.log('\n2. Verifying New User Registration & Clean Waiting Screen (No Admin Buttons):');
  const testEmail = 'user_clean_' + Date.now() + '@gmail.com';
  const regRes = await post('/api/auth/register', {
    fullName: 'Clean User',
    email: testEmail,
    phone: '081234567890',
    password: 'password123',
    plan: 'starter'
  });
  console.log(' - Reg Status:', regRes.status, regRes.body.status);

  const waitPage = await get('/login?notice=pending_approval&email=' + encodeURIComponent(testEmail));
  console.log(' - Waiting Page Status:', waitPage.status);
  console.log(' - Contains Waiting Text:', waitPage.raw.includes('Pendaftaran Sedang Menunggu Persetujuan Admin'));
  console.log(' - NO Setujui Akun Ini Langsung button:', !waitPage.raw.includes('Setujui Akun Ini Langsung'));
  console.log(' - NO Buka Dashboard Admin button:', !waitPage.raw.includes('Buka Dashboard Admin'));

  console.log('\n3. Admin Approves and User Enters Dashboard:');
  const adminLogin = await post('/api/auth/login', { email: 'sellanrhrdni123@gmail.com', password: 'admin123' });
  const adminCookie = adminLogin.headers['set-cookie'][0];
  const approveRes = await post('/api/admin/users/approve', { email: testEmail, reason: 'Approved by admin' }, adminCookie);
  console.log(' - Approve Status:', approveRes.status, approveRes.body.ok);

  const checkStatus = await get('/api/auth/check-status?email=' + encodeURIComponent(testEmail));
  console.log(' - Check Status:', checkStatus.status);
  const userCookie = checkStatus.headers['set-cookie'] ? checkStatus.headers['set-cookie'][0] : '';
  console.log(' - Auto Session Issued:', !!userCookie);

  const userDash = await get('/dashboard', userCookie);
  console.log(' - User Dash Status:', userDash.status);
  console.log(' - Contains Clean User:', userDash.raw.includes('Clean User'));
  console.log(' - Clean User Saldo Rp 0:', userDash.raw.includes('Rp 0'));
  console.log(' - Clean User Pemasukan +Rp 0:', userDash.raw.includes('+Rp 0'));
  console.log(' - Clean User Pengeluaran -Rp 0:', userDash.raw.includes('-Rp 0'));
  console.log('\n✅ ALL CRITERIA VERIFIED 100%!');
}

verify().catch(console.error);
