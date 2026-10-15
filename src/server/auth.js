/**
 * Authentication Module for TataDana
 * Handles Sessions, PBKDF2 Password Verification, Login & Register Views (Split Layout 40/60).
 */

const crypto = require('crypto');
const { store, hashPassword, verifyPassword, formatWibDate } = require('./store');
const { getHtmlHeader, renderGlobalHubNav } = require('./views/components');

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      if (parts.length >= 2) {
        list[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('=').trim());
      }
    });
  }
  return list;
}

function getSessionUser(req) {
  const cookies = parseCookies(req);
  const sid = cookies.tatadana_session;
  if (!sid) return null;
  const sess = store.sessions.get(sid);
  if (!sess) return null;
  if (sess.expiresAt && Date.now() > sess.expiresAt) {
    store.sessions.delete(sid);
    return null;
  }
  const user = store.users.find(u => u.id === sess.userId);
  if (!user) return null;
  return { session: sess, user };
}

function createSession(user, res) {
  const sid = 'sess_' + crypto.randomBytes(24).toString('hex');
  const session = {
    sessionId: sid,
    userId: user.id,
    role: user.role,
    email: user.email,
    fullName: user.fullName,
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  };
  store.sessions.set(sid, session);
  res.setHeader('Set-Cookie', `tatadana_session=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);
  return session;
}

function clearSession(req, res) {
  const cookies = parseCookies(req);
  const sid = cookies.tatadana_session;
  if (sid) {
    store.sessions.delete(sid);
  }
  res.setHeader('Set-Cookie', 'tatadana_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
}

function renderLoginPage(req, res, sessionUser, query = {}) {
  if (sessionUser) {
    const target = sessionUser.role === 'admin' ? '/admin' : '/dashboard';
    res.writeHead(302, { 'Location': target });
    return res.end();
  }

  const hasError = query.error === 'invalid_credentials';
  const isPending = query.error === 'pending_approval' || query.notice === 'pending_approval';
  const isRejected = query.error === 'rejected';
  const redirectParam = query.redirect ? encodeURIComponent(query.redirect) : '';

  const html = `
    ${getHtmlHeader('Masuk ke TataDana — Keuanganmu. Terkontrol.')}
    ${renderGlobalHubNav('/login', sessionUser)}

    <div style="min-height: calc(100vh - 54px); display: flex; align-items: stretch; background: white;">
      <!-- Kiri: Branding Panel (40% Desktop, Sembunyi di Mobile) -->
      <div style="flex: 4; background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: white; padding: 60px 40px; display: flex; flex-direction: column; justify-content: space-between; border-right: 1px solid #334155;" class="sidebar-responsive">
        <div>
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 40px;">
            <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #F97316, #EA580C); display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 900; color: white;">T</div>
            <span style="font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">Tata<span style="color: #F97316;">Dana</span></span>
          </div>
          <h2 style="font-size: 36px; font-weight: 900; line-height: 1.2; margin-bottom: 16px;">
            Keuanganmu.<br><span style="color: #F97316;">Terkontrol.</span>
          </h2>
          <p style="font-size: 15px; color: #94A3B8; line-height: 1.6; margin-bottom: 30px;">
            Catat pengeluaran semudah kirim chat di Telegram. Dilengkapi AI OCR struk belanja, audio voice note, dan laporan real-time.
          </p>
          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div style="display: flex; align-items: center; gap: 12px; font-size: 14px; color: #E2E8F0;">
              <span style="color: #F97316;">✓</span> 100% Bahasa Indonesia & Format Nominal Rupiah
            </div>
            <div style="display: flex; align-items: center; gap: 12px; font-size: 14px; color: #E2E8F0;">
              <span style="color: #F97316;">✓</span> Pilihan Paket Fleksibel: Starter & Pro Lifetime
            </div>
            <div style="display: flex; align-items: center; gap: 12px; font-size: 14px; color: #E2E8F0;">
              <span style="color: #F97316;">✓</span> Saldo Awal Rp 0 & Persetujuan Admin Terjamin
            </div>
          </div>
        </div>

        <div style="font-size: 12px; color: #64748B;">
          &copy; 2026 PT TataDana Nusantara. Hak cipta dilindungi.
        </div>
      </div>

      <!-- Kanan: Form Login (60% Desktop, 100% Mobile) -->
      <div style="flex: 6; padding: 40px 30px; display: flex; flex-direction: column; justify-content: center; max-width: 580px; margin: 0 auto; width: 100%;">
        <div style="margin-bottom: 24px;">
          <h1 style="font-size: 28px; font-weight: 900; color: #0F172A; margin-bottom: 8px;">Masuk ke Akun Anda</h1>
          <p style="font-size: 14px; color: #64748B;">
            Belum punya akun? <a href="/register" style="color: #F97316; font-weight: 800; text-decoration: none;">Daftar akun baru & pilih paket &rarr;</a>
          </p>
        </div>

        ${isPending ? `
          <div id="pendingNoticeCard" style="background: #FFFBEB; border: 2px solid #F59E0B; color: #92400E; padding: 22px 24px; border-radius: 16px; margin-bottom: 24px; box-shadow: 0 4px 18px rgba(245,158,11,0.12);">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
              <span style="font-size: 26px;">⏳</span>
              <div>
                <div style="font-size: 16px; font-weight: 900; color: #92400E;">Pendaftaran Sedang Menunggu Persetujuan Admin</div>
                <div style="font-size: 12px; color: #B45309; font-weight: 600;">Status Akun: Menunggu Konfirmasi Administrator</div>
              </div>
            </div>
            <p style="font-size: 13px; color: #78350F; line-height: 1.6; margin: 10px 0 14px 0; font-weight: 500;">
              Terima kasih telah mendaftar di <b>TataDana</b>${query.email ? ` dengan email <b style="color: #92400E;">${query.email}</b>` : ''}. Akun baru Anda telah dibuat dengan saldo, pemasukan, dan pengeluaran awal sebesar <b>Rp 0</b>.
            </p>
            <div style="background: white; border: 1px solid #FDE68A; border-radius: 12px; padding: 14px 16px; display: flex; align-items: center; gap: 12px;">
              <div style="width: 14px; height: 14px; border-radius: 50%; background: #F59E0B; box-shadow: 0 0 0 4px rgba(245,158,11,0.2); flex-shrink: 0;"></div>
              <div style="font-size: 12px; color: #92400E; font-weight: 700; line-height: 1.4;">
                Layar ini sedang memantau persetujuan admin secara real-time. Begitu disetujui, Anda akan langsung dialihkan ke Dashboard tanpa perlu login ulang.
              </div>
            </div>
          </div>
        ` : ''}

        ${isRejected ? `
          <div style="background: #FEF2F2; border: 1px solid #FECACA; color: #991B1B; padding: 14px 18px; border-radius: 12px; font-size: 13px; font-weight: 700; margin-bottom: 20px;">
            ❌ Pendaftaran akun Anda telah ditolak oleh Administrator.
          </div>
        ` : ''}

        ${hasError ? `
          <div style="background: #FEF2F2; border: 1px solid #FECACA; color: #991B1B; padding: 14px 18px; border-radius: 12px; font-size: 13px; font-weight: 700; margin-bottom: 20px;">
            ❌ Email atau password yang Anda masukkan salah.
          </div>
        ` : ''}

        <!-- SINGLE UNIFIED LUXURY LOGIN CARD (UNTUK ADMIN DAN USER) -->
        <div style="background: white; border: 1px solid #E2E8F0; border-radius: 20px; padding: 28px 26px; margin-bottom: 20px; box-shadow: 0 10px 30px -5px rgba(0,0,0,0.05);">
          <div style="margin-bottom: 20px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <span class="badge badge-amber" style="font-size: 11px;">🛡️ PORTAL AKSES RESMI</span>
              <span style="font-size: 11px; color: #94A3B8; font-weight: 700;">ENKRIPSI 256-BIT</span>
            </div>
            <h2 style="font-size: 20px; font-weight: 900; color: #0F172A; letter-spacing: -0.4px;">Masuk ke Portal TataDana</h2>
            <p style="font-size: 13px; color: #64748B; margin-top: 4px; line-height: 1.5;">
              Satu form masuk untuk <b>Administrator</b> dan <b>Pengguna</b>. Tampilan dan hak akses disesuaikan otomatis setelah berhasil login.
            </p>
          </div>

          <form action="/login" method="POST" style="display: flex; flex-direction: column; gap: 16px;">
            <div>
              <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px;">Alamat Email</label>
              <div style="position: relative;">
                <input type="text" id="loginEmail" name="email" value="${(query.email || '').replace(/"/g, '&quot;')}" placeholder="contoh: sellanrhrdni123@gmail.com atau nama@email.com" required autofocus style="padding: 13px 16px; border-radius: 12px; font-size: 14px; border: 1.5px solid #CBD5E1;">
              </div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label style="font-size: 13px; font-weight: 700; color: #334155;">Kata Sandi</label>
                <a href="javascript:alert('Password demo: admin123 (untuk admin) / password123 (untuk user)')" style="font-size: 12px; color: #F97316; font-weight: 700; text-decoration: none;">Bantuan login?</a>
              </div>
              <div style="position: relative;">
                <input type="password" id="loginPassword" name="password" placeholder="••••••••" required style="padding: 13px 16px; border-radius: 12px; font-size: 14px; border: 1.5px solid #CBD5E1;">
              </div>
            </div>

            <button type="submit" class="btn-primary" style="padding: 14px; font-size: 15px; font-weight: 800; border-radius: 14px; background: linear-gradient(135deg, #F97316 0%, #EA580C 100%); width: 100%; box-shadow: 0 4px 14px rgba(249,115,22,0.3); justify-content: center; margin-top: 4px;">
              Masuk ke Akun Anda 🚀
            </button>
          </form>

          <!-- PILIH CEPAT PRESET AKUN (DEMO & PENGUJIAN) -->
          <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #F1F5F9;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
              <span style="font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">⚡ Akses Cepat Pengujian:</span>
              <span style="font-size: 11px; color: #94A3B8;">1-Klik Isi Form</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
              <button type="button" onclick="fillLogin('sellanrhrdni123@gmail.com', 'admin123')" class="btn-outline" style="padding: 10px 6px; font-size: 11px; border-radius: 10px; background: #FFF7ED; border-color: #FDBA74; color: #C2410C; justify-content: center; font-weight: 800; flex-direction: column; gap: 2px;" title="Login sebagai Admin Utama">
                <span>👑 Admin Utama</span>
                <span style="font-size: 9px; opacity: 0.8; font-weight: 600;">→ /admin</span>
              </button>
              <button type="button" onclick="fillLogin('budi.pratama@gmail.com', 'password123')" class="btn-outline" style="padding: 10px 6px; font-size: 11px; border-radius: 10px; background: #F8FAFC; border-color: #CBD5E1; color: #0F172A; justify-content: center; font-weight: 700; flex-direction: column; gap: 2px;" title="Login sebagai User Pro">
                <span>⭐ Budi (Pro)</span>
                <span style="font-size: 9px; color: #64748B;">→ /dashboard</span>
              </button>
              <button type="button" onclick="fillLogin('siti.rahma@gmail.com', 'password123')" class="btn-outline" style="padding: 10px 6px; font-size: 11px; border-radius: 10px; background: #F8FAFC; border-color: #CBD5E1; color: #0F172A; justify-content: center; font-weight: 700; flex-direction: column; gap: 2px;" title="Login sebagai User Starter">
                <span>🌱 Siti (Starter)</span>
                <span style="font-size: 9px; color: #64748B;">→ /dashboard</span>
              </button>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 12px; margin: 20px 0 16px 0;">
            <div style="flex: 1; height: 1px; background: #E2E8F0;"></div>
            <span style="font-size: 11px; color: #94A3B8; font-weight: 700;">ATAU OPSI LAIN</span>
            <div style="flex: 1; height: 1px; background: #E2E8F0;"></div>
          </div>

          <div style="display: flex; gap: 10px;">
            <button type="button" onclick="fillLogin('budi.pratama@gmail.com', 'password123')" class="btn-outline" style="flex: 1; font-size: 12px; padding: 10px; justify-content: center;">
              <svg style="width: 15px; height: 15px;" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/><path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"/><path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/></svg>
              Google Login
            </button>
            <button type="button" onclick="alert('Verifikasi OTP Nomor HP terintegrasi ke Bot Telegram!'); fillLogin('budi.pratama@gmail.com', 'password123')" class="btn-outline" style="flex: 1; font-size: 12px; padding: 10px; justify-content: center;">
              📱 OTP Nomor HP
            </button>
          </div>
        </div>
      </div>
    </div>

    <script>
      function fillLogin(em, pw) {
        document.getElementById('loginEmail').value = em;
        document.getElementById('loginPassword').value = pw;
        document.querySelector('form').submit();
      }

      function quickApprove(email) {
        if (!email) return;
        fetch('/api/auth/quick-approve', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ email: email })
        })
        .then(function(r) { return r.json(); })
        .then(function(d) {
          if (d.ok) {
            var card = document.getElementById('pendingNoticeCard');
            if (card) {
              card.style.background = '#F0FDF4';
              card.style.borderColor = '#22C55E';
              card.style.color = '#15803D';
              card.innerHTML = '🎉 <b>Sukses! Akun Anda (' + email + ') telah disetujui.</b><br>Mengarahkan langsung ke Dashboard Keuangan Anda... 🚀';
            }
            setTimeout(function() {
              window.location.href = d.redirect || '/dashboard';
            }, 500);
          } else {
            alert('Gagal menyetujui akun: ' + (d.error || 'Terjadi kesalahan'));
          }
        })
        .catch(function(err) {
          alert('Error: ' + err.message);
        });
      }

      // Live Auto-Poll Approval Status: Ketika admin menyetujui, user langsung otomatis masuk dashboard!
      (function() {
        var emailInput = document.getElementById('loginEmail');
        var targetPendingEmail = '${(query.email || '').replace(/'/g, "\\'")}' || (emailInput ? emailInput.value.trim() : '');
        
        var pollTimer = setInterval(function() {
          var em = targetPendingEmail || (emailInput ? emailInput.value.trim() : '');
          if (!em) return;
          fetch('/api/auth/check-status?email=' + encodeURIComponent(em))
            .then(function(r) { return r.json(); })
            .then(function(d) {
              if (d && d.approved) {
                clearInterval(pollTimer);
                var card = document.getElementById('pendingNoticeCard');
                if (card) {
                  card.style.background = '#F0FDF4';
                  card.style.borderColor = '#22C55E';
                  card.style.color = '#15803D';
                  card.innerHTML = '<div style="font-size: 18px; font-weight: 900; margin-bottom: 6px;">🎉 Akun Berhasil Diverifikasi!</div>' +
                    '<div style="font-size: 13px; color: #166534; margin-bottom: 12px;">Pendaftaran akun Anda telah disetujui oleh Administrator. Akses ke Dashboard Keuangan Anda kini aktif.</div>' +
                    '<a href="' + (d.redirect || '/dashboard') + '" class="btn-primary" style="display: inline-block; padding: 12px 24px; font-size: 14px; text-decoration: none; background: #16A34A;">Masuk ke Dashboard 🚀</a>' +
                    '<div style="font-size: 11px; color: #15803D; margin-top: 8px;">Mengalihkan secara otomatis ke dashboard...</div>';
                }
                setTimeout(function() {
                  window.location.href = d.redirect || '/dashboard';
                }, 1200);
              } else if (d && d.rejected) {
                clearInterval(pollTimer);
                var card = document.getElementById('pendingNoticeCard');
                if (card) {
                  card.style.background = '#FEF2F2';
                  card.style.borderColor = '#EF4444';
                  card.style.color = '#991B1B';
                  card.innerHTML = '<div style="font-size: 16px; font-weight: 900; margin-bottom: 6px;">❌ Pendaftaran Ditolak</div>' +
                    '<div style="font-size: 13px; color: #7F1D1D;">Pendaftaran akun Anda tidak disetujui oleh Administrator. Silakan hubungi admin jika terdapat kekeliruan data.</div>';
                }
              }
            })
            .catch(function() {});
        }, 1500);
      })();
    </script>
    </body>
    </html>
  `;
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function renderRegisterPage(req, res, sessionUser, query = {}) {
  if (sessionUser) {
    res.writeHead(302, { 'Location': '/dashboard' });
    return res.end();
  }

  const isPro = query && String(query.plan).toLowerCase() === 'pro';

  const html = `
    ${getHtmlHeader('Daftar Akun Baru — TataDana')}
    ${renderGlobalHubNav('/register', sessionUser)}

    <div style="min-height: calc(100vh - 54px); display: flex; align-items: stretch; background: white;">
      <!-- Kiri: Branding Panel (40%) -->
      <div style="flex: 4; background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: white; padding: 60px 40px; display: flex; flex-direction: column; justify-content: space-between; border-right: 1px solid #334155;" class="sidebar-responsive">
        <div>
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 40px;">
            <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #F97316, #EA580C); display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 900; color: white;">T</div>
            <span style="font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">Tata<span style="color: #F97316;">Dana</span></span>
          </div>
          <h2 style="font-size: 34px; font-weight: 900; line-height: 1.2; margin-bottom: 16px;">
            Mulai Kendalikan<br><span style="color: #F97316;">Keuanganmu Hari Ini.</span>
          </h2>
          <p style="font-size: 15px; color: #94A3B8; line-height: 1.6; margin-bottom: 24px;">
            Daftar dengan email Anda sendiri dan pilih paket sesuai kebutuhan (Starter atau Pro). Catat pengeluaran semudah kirim chat di Telegram.
          </p>
          <div style="background: rgba(249,115,22,0.1); border: 1px solid rgba(249,115,22,0.3); padding: 18px; border-radius: 16px; margin-bottom: 16px;">
            <div style="font-weight: 800; font-size: 14px; color: #F97316; margin-bottom: 6px;">✨ Otomatisasi Saat Mendaftar:</div>
            <div style="font-size: 13px; color: #E2E8F0; line-height: 1.5;">
              Akun Anda langsung disiapkan dengan dompet default bersaldo <b>Rp 0</b>, kategori pengeluaran siap pakai, dan diajukan ke Admin untuk persetujuan cepat.
            </div>
          </div>
          <div style="background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3); padding: 16px; border-radius: 16px;">
            <div style="font-weight: 800; font-size: 13px; color: #60A5FA; margin-bottom: 4px;">🛡️ Persetujuan Admin (Admin Approval):</div>
            <div style="font-size: 12px; color: #CBD5E1; line-height: 1.5;">
              Demi keamanan ekosistem, setiap akun baru akan diverifikasi oleh Administrator sebelum dapat login ke dashboard aplikasi.
            </div>
          </div>
        </div>

        <div style="font-size: 12px; color: #64748B;">
          Dengan mendaftar, Anda menyetujui Ketentuan Layanan & Kebijakan Privasi TataDana.
        </div>
      </div>

      <!-- Kanan: Form Registrasi (60%) -->
      <div style="flex: 6; padding: 40px 30px; display: flex; flex-direction: column; justify-content: center; max-width: 580px; margin: 0 auto; width: 100%;">
        <div style="margin-bottom: 24px;">
          <h1 style="font-size: 28px; font-weight: 900; color: #0F172A; margin-bottom: 8px;">Daftar Akun TataDana</h1>
          <p style="font-size: 14px; color: #64748B;">
            Sudah punya akun? <a href="/login" style="color: #F97316; font-weight: 800; text-decoration: none;">Masuk di sini &rarr;</a>
          </p>
        </div>

        <form action="/register" method="POST" style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px;">Nama Lengkap</label>
            <input type="text" name="fullName" placeholder="Misal: Ahmad Fauzi" required>
          </div>

          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px;">Alamat Email Pengguna (Email Anda)</label>
            <input type="email" name="email" placeholder="nama@email.com" required>
          </div>

          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px;">Nomor HP (WhatsApp / Telegram)</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" name="phone" id="regPhone" placeholder="081234567890" style="flex: 1;" required>
              <button type="button" onclick="simulateOtp()" class="btn-outline btn-sm" id="btnOtp">Kirim OTP</button>
            </div>
            <div id="otpNotice" style="display: none; font-size: 11px; color: #16A34A; margin-top: 4px; font-weight: 700;">
              ✓ Kode OTP terverifikasi otomatis (Dev Simulator)
            </div>
          </div>

          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px;">Password</label>
            <input type="password" name="password" placeholder="Minimal 6 karakter" required>
          </div>

          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px;">Pilih Paket Langganan</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <label id="labelStarter" style="display: flex; align-items: flex-start; gap: 10px; border: 2px solid ${!isPro ? '#F97316' : '#E2E8F0'}; background: ${!isPro ? '#FFF7ED' : '#FFFFFF'}; padding: 12px; border-radius: 12px; cursor: pointer;" onclick="selectPlan('starter')">
                <input type="radio" id="planStarter" name="plan" value="starter" ${!isPro ? 'checked' : ''} style="margin-top: 3px;">
                <div>
                  <div style="font-weight: 800; font-size: 13px; color: #0F172A;">Starter</div>
                  <div style="font-size: 11px; font-weight: 800; color: #F97316; margin: 2px 0;">Rp49.000 / bln</div>
                  <div style="font-size: 10px; color: #64748B;">Maks 50 trx/bln, catat via teks/VN Telegram</div>
                </div>
              </label>

              <label id="labelPro" style="display: flex; align-items: flex-start; gap: 10px; border: 2px solid ${isPro ? '#F97316' : '#E2E8F0'}; background: ${isPro ? '#FFF7ED' : '#FFFFFF'}; padding: 12px; border-radius: 12px; cursor: pointer; position: relative;" onclick="selectPlan('pro')">
                <div style="position: absolute; top: -10px; right: 10px; background: #F97316; color: white; font-size: 9px; font-weight: 900; padding: 2px 8px; border-radius: 999px;">
                  POPULER ⭐
                </div>
                <input type="radio" id="planPro" name="plan" value="pro" ${isPro ? 'checked' : ''} style="margin-top: 3px;">
                <div>
                  <div style="font-weight: 800; font-size: 13px; color: #F97316;">Pro Lifetime ⭐</div>
                  <div style="font-size: 11px; font-weight: 800; color: #16A34A; margin: 2px 0;">Rp99.000 Sekali Bayar</div>
                  <div style="font-size: 10px; color: #64748B;">Unlimited trx, AI OCR foto struk & AI advisor</div>
                </div>
              </label>
            </div>
          </div>

          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 12px 14px; border-radius: 10px; font-size: 11px; color: #64748B; line-height: 1.5;">
            ℹ️ <b>Informasi:</b> Saldo awal akun Anda adalah <b>Rp 0</b>. Pendaftaran Anda akan diteruskan ke Dashboard Admin untuk persetujuan sebelum Anda dapat login.
          </div>

          <button type="submit" class="btn-primary" style="padding: 14px; font-size: 15px; margin-top: 4px;">
            Daftar Sekarang & Ajukan Persetujuan 🚀
          </button>
        </form>
      </div>
    </div>

    <script>
      function selectPlan(p) {
        const isP = (p === 'pro');
        document.getElementById('planStarter').checked = !isP;
        document.getElementById('planPro').checked = isP;
        document.getElementById('labelStarter').style.borderColor = !isP ? '#F97316' : '#E2E8F0';
        document.getElementById('labelStarter').style.background = !isP ? '#FFF7ED' : '#FFFFFF';
        document.getElementById('labelPro').style.borderColor = isP ? '#F97316' : '#E2E8F0';
        document.getElementById('labelPro').style.background = isP ? '#FFF7ED' : '#FFFFFF';
      }

      function simulateOtp() {
        const ph = document.getElementById('regPhone').value;
        if (!ph) { alert('Masukkan nomor HP terlebih dahulu'); return; }
        document.getElementById('btnOtp').innerText = '✓ Terverifikasi';
        document.getElementById('btnOtp').style.background = '#F0FDF4';
        document.getElementById('btnOtp').style.color = '#166534';
        document.getElementById('otpNotice').style.display = 'block';
      }
    </script>
    </body>
    </html>
  `;
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function handleLoginApi(req, res) {
  let bodyStr = '';
  req.on('data', chunk => { bodyStr += chunk; });
  req.on('end', () => {
    let email = '';
    let password = '';
    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('application/json')) {
      try {
        const body = JSON.parse(bodyStr || '{}');
        email = (body.email || '').trim().toLowerCase();
        password = body.password || '';
      } catch (e) {}
    } else {
      const qs = new URLSearchParams(bodyStr);
      email = (qs.get('email') || '').trim().toLowerCase();
      password = qs.get('password') || '';
    }

    const user = store.users.find(u => 
      u.email.toLowerCase() === email || 
      (email === 'budi@tatadana.id' && u.email.toLowerCase() === 'budi.pratama@gmail.com') ||
      (email === 'siti@tatadana.id' && u.email.toLowerCase() === 'siti.rahma@gmail.com') ||
      (u.phone && u.phone.includes(email))
    );
    if (!user || !verifyPassword(password, user.salt, user.passwordHash)) {
      if (contentType.includes('application/json')) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: 'Email atau password salah.' }));
      }
      res.writeHead(302, { 'Location': '/login?error=invalid_credentials' });
      return res.end();
    }

    if (user.status === 'pending_approval') {
      if (contentType.includes('application/json')) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          ok: false,
          error: 'Akun Anda sedang menunggu persetujuan Administrator.',
          status: 'pending_approval'
        }));
      }
      res.writeHead(302, { 'Location': `/login?error=pending_approval&email=${encodeURIComponent(user.email)}` });
      return res.end();
    }

    if (user.status === 'rejected') {
      if (contentType.includes('application/json')) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          ok: false,
          error: 'Pendaftaran akun Anda ditolak oleh Administrator.',
          status: 'rejected'
        }));
      }
      res.writeHead(302, { 'Location': '/login?error=rejected' });
      return res.end();
    }

    createSession(user, res);
    const redirectUrl = user.role === 'admin' ? '/admin' : '/dashboard';

    if (contentType.includes('application/json')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        ok: true,
        role: user.role,
        redirect: redirectUrl,
        redirectUrl: redirectUrl,
        user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role, plan: user.plan }
      }));
    }

    res.writeHead(302, { 'Location': redirectUrl });
    return res.end();
  });
}

function handleRegisterApi(req, res) {
  let bodyStr = '';
  req.on('data', chunk => { bodyStr += chunk; });
  req.on('end', () => {
    let fullName = '';
    let email = '';
    let phone = '';
    let password = '';
    let plan = 'starter';
    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('application/json')) {
      try {
        const body = JSON.parse(bodyStr || '{}');
        fullName = body.fullName || '';
        email = (body.email || '').trim().toLowerCase();
        phone = body.phone || '';
        password = body.password || 'password123';
        plan = (body.plan || '').toLowerCase() === 'pro' ? 'pro' : 'starter';
      } catch (e) {}
    } else {
      const qs = new URLSearchParams(bodyStr);
      fullName = qs.get('fullName') || 'User Baru';
      email = (qs.get('email') || '').trim().toLowerCase();
      phone = qs.get('phone') || '+628120000000';
      password = qs.get('password') || 'password123';
      plan = (qs.get('plan') || '').toLowerCase() === 'pro' ? 'pro' : 'starter';
    }

    if (!email) {
      email = 'user_' + Date.now() + '@tatadana.id';
    }

    const newUserId = 'usr_' + Date.now();
    const cred = hashPassword(password);
    const newUser = {
      id: newUserId,
      fullName: fullName || 'Pengguna Baru',
      email: email,
      phone: phone,
      phoneVerified: true,
      defaultCurrency: 'IDR',
      occupation: '',
      bio: '',
      city: '',
      plan: plan,
      role: 'user',
      status: 'pending_approval',
      salt: cred.salt,
      passwordHash: cred.hash,
      telegramConnected: false,
      telegramUsername: '',
      telegramBotToken: '',
      reminderEnabled: true,
      reminderFrequency: 1,
      reminderTimes: ['20:00'],
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
      createdAt: formatWibDate()
    };

    store.users.push(newUser);

    // Otomatis siapkan struktur data awal (Wallet default & Budget awal)
    // Saldo awal wajib 0 untuk pengguna baru
    const newWallet = {
      id: 'w_' + Date.now(),
      userId: newUserId,
      name: 'Dompet Utama (BCA / Tunai)',
      balance: 0,
      isDefault: true,
      color: '#00529C',
      type: 'Bank'
    };
    store.wallets.push(newWallet);

    const initialBudget = {
      userId: newUserId,
      categoryId: 'cat_mkn',
      name: 'Makanan & Minuman',
      emoji: '🍜',
      amount: 0,
      spent: 0
    };
    store.budgets.push(initialBudget);

    store.auditLogs.unshift({
      id: 'aud_' + Date.now(),
      timestamp: formatWibDate(),
      admin: 'system_registration',
      target: newUserId,
      action: 'USER_REGISTERED_PENDING',
      reason: `Pendaftaran pengguna baru (${email}) paket ${plan.toUpperCase()}, saldo awal Rp 0, menunggu persetujuan Administrator.`
    });

    // Pendaftaran baru memerlukan persetujuan Administrator (pending_approval)
    if (contentType.includes('application/json')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        ok: true,
        userId: newUserId,
        status: 'pending_approval',
        message: 'Pendaftaran berhasil. Akun Anda sedang menunggu persetujuan Administrator sebelum dapat login.',
        redirect: `/login?notice=pending_approval&email=${encodeURIComponent(email)}`,
        user: newUser
      }));
    }

    res.writeHead(302, { 'Location': `/login?notice=pending_approval&email=${encodeURIComponent(email)}` });
    return res.end();
  });
}

module.exports = {
  parseCookies,
  getSessionUser,
  createSession,
  clearSession,
  renderLoginPage,
  renderRegisterPage,
  handleLoginApi,
  handleRegisterApi
};
