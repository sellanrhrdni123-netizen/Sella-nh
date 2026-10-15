const http = require('http');

function req(opts, data) {
  return new Promise((resolve, reject) => {
    const r = http.request(opts, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ status: res.statusCode, body: b, headers: res.headers }));
    });
    r.on('error', reject);
    if (data) r.write(typeof data === 'string' ? data : JSON.stringify(data));
    r.end();
  });
}

async function run() {
  console.log('🧪 VERIFYING COMPLETE PROFILE EDITING FUNCTIONALITY...');

  // 1. User Login (Budi)
  const loginRes = await req({
    hostname: '127.0.0.1', port: 3000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'budi.pratama@gmail.com', password: 'password123' });
  
  const cookie = loginRes.headers['set-cookie'][0].split(';')[0];
  console.log('✅ User login successful, session established.');

  // 2. Update Profile Fields (Name, Photo, Phone, Occupation, City, Bio, Currency)
  const newAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80';
  const updateRes = await req({
    hostname: '127.0.0.1', port: 3000, path: '/api/user/profile', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie }
  }, {
    fullName: 'Budi Pratama S.Kom',
    phone: '+6281299998888',
    occupation: 'Lead Fintech Engineer',
    city: 'Jakarta Selatan',
    bio: 'Menabung dan berinvestasi 50% setiap bulan untuk kemandirian finansial.',
    defaultCurrency: 'IDR',
    avatarUrl: newAvatar
  });

  const updateJson = JSON.parse(updateRes.body);
  console.log('✅ POST /api/user/profile response ok:', updateJson.ok);
  if (updateJson.user.fullName !== 'Budi Pratama S.Kom') throw new Error('fullName not updated');
  if (updateJson.user.phone !== '+6281299998888') throw new Error('phone not updated');
  if (updateJson.user.occupation !== 'Lead Fintech Engineer') throw new Error('occupation not updated');
  if (updateJson.user.city !== 'Jakarta Selatan') throw new Error('city not updated');
  if (updateJson.user.bio !== 'Menabung dan berinvestasi 50% setiap bulan untuk kemandirian finansial.') throw new Error('bio not updated');
  if (updateJson.user.avatarUrl !== newAvatar) throw new Error('avatarUrl not updated');

  // 3. Verify GET /dashboard/settings?tab=profil renders all updated values
  const settingsRes = await req({
    hostname: '127.0.0.1', port: 3000, path: '/dashboard/settings?tab=profil', method: 'GET',
    headers: { 'Cookie': cookie }
  });

  if (settingsRes.status !== 200) throw new Error('Settings returned ' + settingsRes.status);
  const body = settingsRes.body;
  if (!body.includes('Budi Pratama S.Kom')) throw new Error('Settings HTML missing updated fullName');
  if (!body.includes('+6281299998888')) throw new Error('Settings HTML missing updated phone');
  if (!body.includes('Lead Fintech Engineer')) throw new Error('Settings HTML missing updated occupation');
  if (!body.includes('Jakarta Selatan')) throw new Error('Settings HTML missing updated city');
  if (!body.includes('kemandirian finansial')) throw new Error('Settings HTML missing updated bio');
  if (!body.includes(newAvatar)) throw new Error('Settings HTML missing updated avatar');
  console.log('✅ Settings view (/dashboard/settings?tab=profil) renders all updated fields accurately.');

  // 4. Admin Profile Test (Sella)
  const adminLoginRes = await req({
    hostname: '127.0.0.1', port: 3000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'sellanrhrdni123@gmail.com', password: 'admin123' });
  const adminCookie = adminLoginRes.headers['set-cookie'][0].split(';')[0];
  console.log('✅ Admin login successful.');

  const adminUpdateRes = await req({
    hostname: '127.0.0.1', port: 3000, path: '/api/user/profile', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie }
  }, {
    fullName: 'Sella Nurhardiani M.M.',
    phone: '+6281199991111',
    occupation: 'Chief Executive Administrator',
    city: 'Jakarta Selatan',
    bio: 'Tata kelola keuangan transparan dan akuntabel se-Indonesia.',
    defaultCurrency: 'IDR',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80'
  });
  const adminUpdateJson = JSON.parse(adminUpdateRes.body);
  if (!adminUpdateJson.ok || adminUpdateJson.user.fullName !== 'Sella Nurhardiani M.M.') {
    throw new Error('Admin profile update failed');
  }
  console.log('✅ Admin profile updated and persisted.');

  // Verify Admin dashboard includes admin profile card
  const adminDashRes = await req({
    hostname: '127.0.0.1', port: 3000, path: '/admin', method: 'GET',
    headers: { 'Cookie': adminCookie }
  });
  if (!adminDashRes.body.includes('admin-profile-sec') || !adminDashRes.body.includes('Sella Nurhardiani M.M.')) {
    throw new Error('Admin console missing admin-profile-sec or updated admin name');
  }
  console.log('✅ Admin dashboard renders admin-profile-sec with updated profile data.');

  console.log('\n🎉 ALL PROFILE EDITING CAPABILITIES VERIFIED 100% SUCCESSFULLY!\n');
}

run().catch(err => {
  console.error('❌ Error during profile test:', err);
  process.exit(1);
});
