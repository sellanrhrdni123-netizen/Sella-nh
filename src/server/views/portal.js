/**
 * Unified Portal Hub for TataDana
 * Serves as the central navigation, telemetry, credentials matrix, and network introspection hub.
 */

const { store, formatIDR, getLocalIpAddresses } = require('../store');
const {
  getHtmlHeader,
  renderGlobalHubNav
} = require('./components');

const TUNNEL_URL = 'https://hamilton-buildings-robust-technique.trycloudflare.com';
const PORT = process.env.PORT || 3000;

function renderPortalPage(req, res, sessionUser, query = {}) {
  const totalBalanceAll = store.wallets.reduce((s, w) => s + w.balance, 0);
  const localIps = getLocalIpAddresses();

  const html = `
    ${getHtmlHeader('TataDana — Portal Terpadu (All-in-One Hub)')}
    ${renderGlobalHubNav('/portal', sessionUser)}

    <main style="max-width: 1200px; margin: 36px auto; padding: 0 20px;">
      <!-- HERO BANNER -->
      <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: white; border-radius: 24px; padding: 40px; margin-bottom: 32px; border: 1px solid #334155; position: relative; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.12);">
        <div style="position: absolute; right: -40px; top: -40px; width: 220px; height: 220px; border-radius: 50%; background: radial-gradient(circle, rgba(249,115,22,0.25) 0%, transparent 70%);"></div>
        <div class="badge" style="background: rgba(249,115,22,0.18); color: #FB923C; border: 1px solid rgba(249,115,22,0.35); margin-bottom: 16px;">
          ✨ SATU SISTEM MULTI-ROLE TERPADU TATADANA
        </div>
        <h1 style="font-size: 38px; font-weight: 900; line-height: 1.2; letter-spacing: -1px; margin-bottom: 12px;">
          TataDana Unified Portal <span class="orange-text">& Multi-Role Hub</span>
        </h1>
        <p style="font-size: 16px; color: #94A3B8; max-width: 780px; line-height: 1.6; margin-bottom: 24px;">
          Satu aplikasi, satu database, sistem autentikasi PBKDF2 salt terenkripsi dengan dua role: <b>User</b> (Dashboard Keuangan Pribadi) dan <b>Admin</b> (Executive Console & View as User).
        </p>

        <!-- System Status Bar -->
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 10px 16px; font-size: 12px;">
            <span style="color: #94A3B8;">Server Status:</span> <b style="color: #4ADE80;">🟢 100% Online (0.0.0.0:${PORT})</b>
          </div>
          <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 10px 16px; font-size: 12px;">
            <span style="color: #94A3B8;">Alamat Utama:</span> <b style="color: #FB923C;">http://localhost:${PORT} ⭐</b>
          </div>
          <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 10px 16px; font-size: 12px;">
            <span style="color: #94A3B8;">IP Lokal:</span> <b style="color: #FBBF24;">${localIps.map(i => i.address).join(', ') || '192.168.18.27'}:${PORT}</b>
          </div>
          <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 10px 16px; font-size: 12px;">
            <span style="color: #94A3B8;">Cloudflare Tunnel:</span> <b style="color: #60A5FA;">Connected Live</b>
          </div>
          <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 10px 16px; font-size: 12px;">
            <span style="color: #94A3B8;">Session Aktif:</span> <b style="color: #FB923C;">${sessionUser ? `${sessionUser.fullName} (${sessionUser.role.toUpperCase()})` : 'Belum Login'}</b>
          </div>
          <div style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 10px 16px; font-size: 12px;">
            <span style="color: #94A3B8;">Total Saldo Sistem:</span> <b style="color: #4ADE80;">${formatIDR(totalBalanceAll)}</b>
          </div>
        </div>
      </div>

      <!-- DEMO ACCOUNTS QUICK LOGIN CARDS -->
      <h2 style="font-size: 20px; font-weight: 900; margin-bottom: 16px; letter-spacing: -0.4px;">
        🔑 Akun Demo Siap Pakai (PBKDF2 Cryptographic Salt)
      </h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 32px;">
        <!-- Budi Pratama -->
        <div class="card" style="border-left: 4px solid #16A34A; position: relative;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <div>
              <span class="badge badge-green" style="font-size: 11px;">PRO TIER USER</span>
              <h3 style="font-size: 17px; font-weight: 900; margin-top: 6px;">Budi Pratama</h3>
            </div>
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
          </div>
          <div style="font-size: 12px; color: #64748B; margin-bottom: 12px;">
            Email: <code>budi.pratama@gmail.com</code><br>
            Password: <code>password123</code>
          </div>
          <button onclick="autologin('budi.pratama@gmail.com', 'password123')" class="btn-dark" style="width: 100%; font-size: 12px; padding: 8px;">
            Masuk sebagai Budi (Pro) 🚀
          </button>
        </div>

        <!-- Siti Rahma -->
        <div class="card" style="border-left: 4px solid #3B82F6; position: relative;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <div>
              <span class="badge badge-blue" style="font-size: 11px;">STARTER TIER USER</span>
              <h3 style="font-size: 17px; font-weight: 900; margin-top: 6px;">Siti Rahma</h3>
            </div>
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&q=80" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
          </div>
          <div style="font-size: 12px; color: #64748B; margin-bottom: 12px;">
            Email: <code>siti.rahma@gmail.com</code><br>
            Password: <code>password123</code>
          </div>
          <button onclick="autologin('siti.rahma@gmail.com', 'password123')" class="btn-dark" style="width: 100%; font-size: 12px; padding: 8px;">
            Masuk sebagai Siti (Starter) 🚀
          </button>
        </div>

        <!-- Admin Utama -->
        <div class="card" style="border-left: 4px solid #EA580C; position: relative;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <div>
              <span class="badge badge-red" style="font-size: 11px;">ADMIN UTAMA</span>
              <h3 style="font-size: 17px; font-weight: 900; margin-top: 6px;">Sella Nurhardiani</h3>
            </div>
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
          </div>
          <div style="font-size: 12px; color: #64748B; margin-bottom: 12px;">
            Email: <code>sellanrhrdni123@gmail.com</code><br>
            Password: <code>admin123</code>
          </div>
          <button onclick="autologin('sellanrhrdni123@gmail.com', 'admin123')" class="btn-primary" style="width: 100%; font-size: 12px; padding: 8px; background: #EA580C;">
            Masuk sebagai Admin Utama 👑
          </button>
        </div>
      </div>

      <!-- CROSS-DEVICE ACCESS (Tugas 7) -->
      <div class="card" style="background: #FFF7ED; border: 1px solid #FFEDD5; margin-bottom: 32px;">
        <div style="display: flex; align-items: flex-start; gap: 14px;">
          <div style="font-size: 28px;">📱</div>
          <div>
            <h3 style="font-size: 16px; font-weight: 900; color: #C2410C; margin-bottom: 4px;">Akses TataDana dari HP / Tablet / Perangkat Lain (Tugas 7)</h3>
            <p style="font-size: 13px; color: #9A3412; line-height: 1.5; margin-bottom: 8px;">
              Server telah dikonfigurasi untuk listen di <code>0.0.0.0:3000</code>. Anda dapat membuka TataDana langsung dari komputer ini atau dari browser ponsel / laptop lain:
            </p>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <code style="background: white; padding: 6px 12px; border-radius: 8px; border: 2px solid #F97316; font-weight: 900; color: #EA580C;">
                http://localhost:3000 (Utama)
              </code>
              <code style="background: white; padding: 6px 12px; border-radius: 8px; border: 1px solid #FDBA74; font-weight: 800; color: #C2410C;">
                http://${localIps[0] ? localIps[0].address : '192.168.18.27'}:${PORT}
              </code>
              <code style="background: white; padding: 6px 12px; border-radius: 8px; border: 1px solid #FDBA74; font-weight: 800; color: #2563EB;">
                ${TUNNEL_URL}
              </code>
            </div>
          </div>
        </div>
      </div>

      <!-- FEATURE MATRIX -->
      <h2 style="font-size: 20px; font-weight: 900; margin-bottom: 16px; letter-spacing: -0.4px;">
        🚀 Matriks Seluruh Fitur Terpadu
      </h2>

      <div class="card" style="margin-bottom: 32px; overflow-x: auto; padding: 0;">
        <table class="custom-table">
          <thead>
            <tr>
              <th style="width: 40px;">No</th>
              <th style="width: 220px;">Fitur & Ikon</th>
              <th>Endpoint / URL</th>
              <th>Deskripsi & Kemampuan</th>
              <th style="width: 120px;">Guard RBAC</th>
              <th style="width: 150px; text-align: right;">Aksi Langsung</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b style="color: #F97316;">1</b></td>
              <td>
                <div style="font-weight: 800; color: #0F172A;">🌐 Landing Page</div>
                <div style="font-size: 11px; color: #64748B;">Fintech 15 Sections</div>
              </td>
              <td><code>/</code></td>
              <td>Halaman promosi premium, demo kalkulator, pricing starter vs pro, testimonial masonry, dan FAQ accordion.</td>
              <td><span class="badge badge-green">Publik</span></td>
              <td style="text-align: right;"><a href="/" class="btn-primary btn-sm">Buka Beranda →</a></td>
            </tr>

            <tr>
              <td><b style="color: #F97316;">2</b></td>
              <td>
                <div style="font-weight: 800; color: #0F172A;">💬 Bot Telegram Simulator</div>
                <div style="font-size: 11px; color: #64748B;">NLP, OCR Struk & STT</div>
              </td>
              <td><code>/dev/telegram-simulator</code></td>
              <td>Simulasi bot chat Telegram WIB ("15rb", "500k", "5jt"), AI OCR struk belanja multi-item, voice STT, dan perintah /saldo.</td>
              <td><span class="badge badge-green">Publik / Demo</span></td>
              <td style="text-align: right;"><a href="/dev/telegram-simulator" class="btn-primary btn-sm">Coba Bot ⚡</a></td>
            </tr>

            <tr>
              <td><b style="color: #F97316;">3</b></td>
              <td>
                <div style="font-weight: 800; color: #0F172A;">🔐 Login & Register</div>
                <div style="font-size: 11px; color: #64748B;">Split 40/60 & PBKDF2</div>
              </td>
              <td><code>/login</code> & <code>/register</code></td>
              <td>Autentikasi aman password hash PBKDF2 salt unik, phone OTP testing, serta auto-seed dompet default.</td>
              <td><span class="badge badge-green">Publik</span></td>
              <td style="text-align: right;"><a href="/login" class="btn-dark btn-sm">Halaman Login 🔑</a></td>
            </tr>

            <tr>
              <td><b style="color: #F97316;">4</b></td>
              <td>
                <div style="font-weight: 800; color: #0F172A;">📊 Dashboard Beranda</div>
                <div style="font-size: 11px; color: #64748B;">Multi-Tenant Isolated</div>
              </td>
              <td><code>/dashboard</code></td>
              <td>4 stats cards, grafik bar 6 bulan, diagram donat kategori, 10 transaksi terkini, dan onboarding checklist.</td>
              <td><span class="badge badge-blue">User & Admin</span></td>
              <td style="text-align: right;"><a href="/dashboard" class="btn-primary btn-sm">Dashboard 📊</a></td>
            </tr>

            <tr>
              <td><b style="color: #F97316;">5</b></td>
              <td>
                <div style="font-weight: 800; color: #0F172A;">💳 Transaksi & Struk</div>
                <div style="font-size: 11px; color: #64748B;">Accordion Multi-Item</div>
              </td>
              <td><code>/dashboard/transaksi</code></td>
              <td>Riwayat transaksi lengkap dengan rincian belanja belanjaan struk OCR yang dapat di-expand secara interaktif.</td>
              <td><span class="badge badge-blue">User & Admin</span></td>
              <td style="text-align: right;"><a href="/dashboard/transaksi" class="btn-primary btn-sm">Transaksi 💳</a></td>
            </tr>

            <tr>
              <td><b style="color: #F97316;">6</b></td>
              <td>
                <div style="font-weight: 800; color: #0F172A;">📑 Laporan & Ekspor</div>
                <div style="font-size: 11px; color: #64748B;">PDF & Excel On-Demand</div>
              </td>
              <td><code>/dashboard/reports</code></td>
              <td>Pencarian multi-filter, ringkasan net cashflow, dan ekspor instan ke format CSV/Excel dan PDF print view.</td>
              <td><span class="badge badge-blue">User & Admin</span></td>
              <td style="text-align: right;"><a href="/dashboard/reports" class="btn-primary btn-sm">Laporan 📑</a></td>
            </tr>

            <tr>
              <td><b style="color: #F97316;">7</b></td>
              <td>
                <div style="font-weight: 800; color: #0F172A;">👛 Dompet Multi-Wallet</div>
                <div style="font-size: 11px; color: #64748B;">BCA, Mandiri, GoPay, Tunai</div>
              </td>
              <td><code>/dashboard/wallet</code></td>
              <td>Manajemen saldo dompet multi-rekening dan modal transfer saldo instan antar-dompet dengan audit mutasi.</td>
              <td><span class="badge badge-blue">User & Admin</span></td>
              <td style="text-align: right;"><a href="/dashboard/wallet" class="btn-primary btn-sm">Dompet 👛</a></td>
            </tr>

            <tr>
              <td><b style="color: #F97316;">8</b></td>
              <td>
                <div style="font-weight: 800; color: #0F172A;">🎯 Anggaran & Alert</div>
                <div style="font-size: 11px; color: #64748B;">Progress Bar 80%/100%</div>
              </td>
              <td><code>/dashboard/budget</code></td>
              <td>Visual progress bar per kategori dengan peringatan dini waspada 80% dan bahaya 100% over-budget.</td>
              <td><span class="badge badge-blue">User & Admin</span></td>
              <td style="text-align: right;"><a href="/dashboard/budget" class="btn-primary btn-sm">Budget 🎯</a></td>
            </tr>

            <tr>
              <td><b style="color: #F97316;">9</b></td>
              <td>
                <div style="font-weight: 800; color: #0F172A;">🤖 Tanya AI Financial</div>
                <div style="font-size: 11px; color: #64748B;">In-App Data-Driven Chat</div>
              </td>
              <td><code>/dashboard/ai-chat</code></td>
              <td>Konsultasi keuangan pribadi cerdas yang menganalisis langsung database transaksi nyata pengguna secara privat.</td>
              <td><span class="badge badge-blue">User & Admin</span></td>
              <td style="text-align: right;"><a href="/dashboard/ai-chat" class="btn-primary btn-sm">Tanya AI 🤖</a></td>
            </tr>

            <tr>
              <td><b style="color: #F97316;">10</b></td>
              <td>
                <div style="font-weight: 800; color: #0F172A;">⚙️ Pengaturan & Profil</div>
                <div style="font-size: 11px; color: #64748B;">Persistensi & BotFather</div>
              </td>
              <td><code>/dashboard/settings</code></td>
              <td>Edit foto profil/nama permanen, hubungkan token bot Telegram & test koneksi, setting reminder WIB harian.</td>
              <td><span class="badge badge-blue">User & Admin</span></td>
              <td style="text-align: right;"><a href="/dashboard/settings" class="btn-primary btn-sm">Pengaturan ⚙️</a></td>
            </tr>

            <tr>
              <td><b style="color: #F97316;">11</b></td>
              <td>
                <div style="font-weight: 800; color: #0F172A;">⭐ Upgrade Paket Pro</div>
                <div style="font-size: 11px; color: #64748B;">Pembayaran Modular Rp99rb</div>
              </td>
              <td><code>/dashboard/upgrade</code></td>
              <td>Metode pembayaran modular: Midtrans Snap QRIS, BCA Virtual Account, Mandiri Bill, & Transfer Bank Manual.</td>
              <td><span class="badge badge-blue">User & Admin</span></td>
              <td style="text-align: right;"><a href="/dashboard/upgrade" class="btn-primary btn-sm">Upgrade ⭐</a></td>
            </tr>

            <tr>
              <td><b style="color: #F97316;">12</b></td>
              <td>
                <div style="font-weight: 800; color: #0F172A;">👑 Admin Executive Console</div>
                <div style="font-size: 11px; color: #64748B;">Impersonation & AI Switcher</div>
              </td>
              <td><code>/admin</code></td>
              <td>Pusat kendali ekosistem: Total user, mutasi transparan, "View as User" impersonation, audit logs, payment approval.</td>
              <td><span class="badge badge-red">Admin Only</span></td>
              <td style="text-align: right;"><a href="/admin" class="btn-primary btn-sm" style="background: #DC2626;">Admin 👑</a></td>
            </tr>

            <tr>
              <td><b style="color: #F97316;">13</b></td>
              <td>
                <div style="font-weight: 800; color: #0F172A;">⚡ Webhook Tester & REST</div>
                <div style="font-size: 11px; color: #64748B;">GUI Idempoten & Raw Store</div>
              </td>
              <td><code>/api/telegram/webhook</code></td>
              <td>GUI interactive Webhook tester (simulasi payload Telegram, uji idempoten dedup) dan live JSON database di <code>/api/data</code>.</td>
              <td><span class="badge badge-green">Publik</span></td>
              <td style="text-align: right;"><a href="/api/telegram/webhook" class="btn-primary btn-sm">Uji API ⚡</a></td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <script>
      function autologin(email, password) {
        fetch('/api/auth/login', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ email, password })
        })
        .then(r => r.json())
        .then(d => {
          if (d.ok) {
            window.location.href = d.redirect || '/dashboard';
          } else {
            alert('Gagal login: ' + (d.error || 'Autentikasi ditolak'));
          }
        });
      }
    </script>
  `;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

module.exports = {
  renderPortalPage
};
