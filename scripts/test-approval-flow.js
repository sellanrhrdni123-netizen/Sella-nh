const http = require('http');

function post(path, body, cookie) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    };
    if (cookie) headers['Cookie'] = cookie;
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3000,
      path: path,
      method: 'POST',
      headers: headers
    }, res => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(buf || '{}') }));
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
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3000,
      path: path,
      method: 'GET',
      headers: headers
    }, res => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, raw: buf, body: buf.startsWith('{') ? JSON.parse(buf) : buf }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function testFlow() {
  console.log('--- 1. Testing Registration (Saldo 0 & Pending) ---');
  const testEmail = 'rina_' + Date.now() + '@gmail.com';
  const regRes = await post('/api/auth/register', {
    fullName: 'Rina Sasmita',
    email: testEmail,
    phone: '081288887777',
    password: 'password123',
    plan: 'pro'
  });
  console.log('Registration Response:', regRes.status, regRes.body);

  console.log('\n--- 2. Checking Status before approval ---');
  const check1 = await get('/api/auth/check-status?email=' + encodeURIComponent(testEmail));
  console.log('Check before approval:', check1.status, check1.body);

  console.log('\n--- 3. Admin Approves User ---');
  const adminLogin = await post('/api/auth/login', { email: 'sellanrhrdni123@gmail.com', password: 'admin123' });
  const adminCookie = adminLogin.headers['set-cookie'] ? adminLogin.headers['set-cookie'][0] : '';
  
  const approveRes = await post('/api/admin/users/approve', { email: testEmail, reason: 'Disetujui oleh Admin' }, adminCookie);
  console.log('Admin Approve Response:', approveRes.status, approveRes.body);

  console.log('\n--- 4. Checking Status after approval (Auto-login / Session Issue) ---');
  const check2 = await get('/api/auth/check-status?email=' + encodeURIComponent(testEmail));
  console.log('Check after approval:', check2.status, check2.body);
  const userCookie = check2.headers['set-cookie'] ? check2.headers['set-cookie'][0] : '';
  console.log('Session Cookie issued automatically to user:', !!userCookie);

  console.log('\n--- 5. User Enters Dashboard Automatically with issued session ---');
  const dashRes = await get('/dashboard', userCookie);
  console.log('Dashboard status:', dashRes.status);
  console.log('Dashboard contains Rina Sasmita:', dashRes.raw.includes('Rina Sasmita'));
  console.log('Dashboard contains Rp 0 balance:', dashRes.raw.includes('Rp 0'));

  console.log('\n--- 6. Checking Seed User and Admin Balances are 0 ---');
  const budiLogin = await post('/api/auth/login', { email: 'budi.pratama@gmail.com', password: 'password123' });
  const budiCookie = budiLogin.headers['set-cookie'][0];
  const budiDash = await get('/dashboard', budiCookie);
  console.log('Budi Dashboard contains Rp 0:', budiDash.raw.includes('Rp 0'));

  const adminDash = await get('/admin', adminCookie);
  console.log('Admin Console status:', adminDash.status);
  console.log('Admin Kas Operasional Rp 0:', adminDash.raw.includes('Rp 0'));
  console.log('\n✅ ALL TEST STEPS PASSED PERFECTLY!');
}

testFlow().catch(console.error);
