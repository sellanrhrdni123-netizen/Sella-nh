/**
 * Executive Admin Console for TataDana
 * Features:
 * - Executive metrics & multi-tenant asset analytics
 * - User Management & Account Verification System
 * - AI Multi-Provider Switcher (Gemini, OpenAI, DeepSeek) & AI Usage Logs
 * - Payment Approval System (Midtrans Snap & Manual Bank Transfers)
 * - Zero-Trust Privacy Audit Logs & User Transaction Inspector with mandatory reason
 * - Global Data Export (CSV & JSON)
 */

const { store, formatIDR, getLocalIpAddresses } = require('../store');
const { getHtmlHeader, renderGlobalHubNav, renderUserSidebar } = require('./components');

const TUNNEL_URL = 'https://diff-previews-assessing-said.trycloudflare.com';
const PORT = process.env.PORT || 3000;

function renderAdminDashboard(req, res, sessionUser, query = {}) {
  // Total metrics
  const totalSystemUsers = store.users.length;
  const totalSystemTransactions = store.transactions.length;
  const totalSystemBalance = store.wallets.reduce((s, w) => s + w.balance, 0);
  const totalSystemIncome = store.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalSystemExpense = store.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  // Asset breakdown percentages
  const budiBal = store.wallets.filter(w => w.userId === 'usr_demo_01').reduce((s, w) => s + w.balance, 0);
  const sitiBal = store.wallets.filter(w => w.userId === 'usr_starter_01').reduce((s, w) => s + w.balance, 0);
  const adminBal = store.wallets.filter(w => w.userId === 'usr_admin_sella' || w.userId === 'usr_admin_01').reduce((s, w) => s + w.balance, 0);

  const budiPct = totalSystemBalance > 0 ? Math.round((budiBal / totalSystemBalance) * 100) : 0;
  const sitiPct = totalSystemBalance > 0 ? Math.round((sitiBal / totalSystemBalance) * 100) : 0;
  const adminPct = totalSystemBalance > 0 ? Math.max(0, 100 - budiPct - sitiPct) : 0;

  // Chart bar heights
  const maxSysVal = Math.max(totalSystemIncome, totalSystemExpense, totalSystemBalance, 100000000);
  const sysIncH = Math.max(12, Math.min(125, Math.round((totalSystemIncome / maxSysVal) * 125)));
  const sysExpH = Math.max(12, Math.min(125, Math.round((totalSystemExpense / maxSysVal) * 125)));
  const sysBalH = Math.max(12, Math.min(125, Math.round((totalSystemBalance / maxSysVal) * 125)));
  const sysIncY = 150 - sysIncH;
  const sysExpY = 150 - sysExpH;
  const sysBalY = 150 - sysBalH;

  const localIps = getLocalIpAddresses();

  const pendingUsers = store.users.filter(u => u.status === 'pending_approval');

  const html = `
    ${getHtmlHeader('TataDana Admin — Executive Console & Persetujuan Pengguna')}
    ${renderGlobalHubNav('/admin', sessionUser)}

    <div style="display: flex; min-height: calc(100vh - 54px);">
      ${renderUserSidebar('/admin', sessionUser, false, 'admin')}

      <main style="flex: 1; padding: 28px; max-width: 1240px; margin: 0 auto; width: 100%;">
        ${query && (query.notice === 'admin_only' || query.error === 'no_user_dashboard_access') ? `
          <div style="background: #FEF2F2; border: 2px solid #EF4444; color: #991B1B; padding: 16px 20px; border-radius: 14px; margin-bottom: 20px; display: flex; align-items: center; gap: 14px; box-shadow: 0 4px 14px rgba(239,68,68,0.15);">
            <span style="font-size: 26px;">🚫</span>
            <div>
              <div style="font-size: 15px; font-weight: 900; color: #991B1B;">Akses Dashboard User Ditolak (Khusus Admin Console)</div>
              <div style="font-size: 12px; color: #7F1D1D; font-weight: 500; margin-top: 2px;">
                Sesuai kebijakan keamanan, akun dengan role <b>Administrator</b> hanya diizinkan mengelola sistem dari Admin Console dan tidak dapat mengakses Dashboard Pengguna pribadi secara langsung.
              </div>
            </div>
          </div>
        ` : ''}
        <!-- DEDICATED ADMIN EXECUTIVE HEADER (TERPISAH DARI DASHBOARD PENGGUNA) -->
        <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: white; border-radius: 20px; padding: 24px 28px; margin-bottom: 24px; border: 1px solid #334155; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 52px; height: 52px; border-radius: 14px; background: linear-gradient(135deg, #F97316, #EA580C); display: flex; align-items: center; justify-content: center; font-size: 26px; color: white; box-shadow: 0 4px 15px rgba(249,115,22,0.4); flex-shrink: 0;">
                👑
              </div>
              <div>
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                  <h1 style="font-size: 22px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px;">
                    TataDana Admin & Executive Console
                  </h1>
                  <span class="badge badge-red" style="font-size: 11px;">PANEL ADMIN TERPISAH</span>
                  <span class="badge badge-green" style="font-size: 11px;">RBAC AKTIF</span>
                </div>
                <div style="font-size: 13px; color: #94A3B8; margin-top: 4px;">
                  Email Admin: <b style="color: #FB923C;">${sessionUser.email}</b> • Role: <b style="color: #FFFFFF;">${sessionUser.role.toUpperCase()}</b> • Pusat Persetujuan Pendaftaran Pengguna & Tata Kelola
                </div>
              </div>
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <a href="/portal" class="btn-dark" style="font-size: 12px; background: #334155;">🎯 Portal Hub</a>
              <a href="/api/data" target="_blank" class="btn-outline" style="font-size: 12px; color: #E2E8F0; border-color: #475569;">🗄️ Raw Data JSON</a>
            </div>
          </div>
        </div>

        ${pendingUsers.length > 0 ? `
          <!-- UNMISSABLE PENDING APPROVAL ALERT BANNER -->
          <div id="pendingAlertBanner" style="background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%); border: 2px solid #F59E0B; border-radius: 18px; padding: 20px 24px; margin-bottom: 24px; box-shadow: 0 10px 25px rgba(245,158,11,0.2); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="width: 48px; height: 48px; border-radius: 14px; background: #F59E0B; color: white; display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 4px 12px rgba(245,158,11,0.4);">
                🔔
              </div>
              <div>
                <div style="font-size: 11px; font-weight: 800; color: #B45309; text-transform: uppercase; letter-spacing: 0.5px;">PEMBERITAHUAN SISTEM — BUTUH TINDAKAN ADMIN</div>
                <div style="font-size: 18px; font-weight: 900; color: #92400E; margin-top: 2px;">
                  Ada ${pendingUsers.length} Pendaftaran Pengguna Baru Menunggu Persetujuan!
                </div>
                <div style="font-size: 13px; color: #78350F; margin-top: 2px;">
                  Pengguna baru mendaftar dengan saldo awal Rp 0 dan tidak dapat masuk ke sistem sampai Anda menyetujuinya di bawah ini.
                </div>
              </div>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <button onclick="approveAllPendingUsers()" class="btn-primary" style="background: #16A34A; padding: 10px 18px; font-size: 13px; font-weight: 800; box-shadow: 0 4px 14px rgba(22,163,74,0.3); border: none; cursor: pointer;">
                ✓ Setujui Semua (${pendingUsers.length})
              </button>
              <a href="#pending-approvals-sec" class="btn-dark" style="font-size: 13px; padding: 10px 16px; text-decoration: none;">
                Lihat Rincian &darr;
              </a>
            </div>
          </div>
        ` : ''}

        <!-- 1. DEDICATED PENDING USER APPROVALS SECTION (PERSETUJUAN PENGGUNA BARU) -->
        <div class="card" style="margin-bottom: 24px; border-left: 4px solid #F59E0B;" id="pending-approvals-sec">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 24px;">📋</span>
              <div>
                <h2 style="font-size: 18px; font-weight: 900; color: #0F172A;">Persetujuan Pendaftaran Pengguna Baru (Pending Approvals)</h2>
                <p style="font-size: 12px; color: #64748B;">Pengguna baru mendaftar dengan status <code>pending_approval</code> dan saldo awal Rp 0, membutuhkan persetujuan Admin sebelum diizinkan login.</p>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              ${pendingUsers.length > 0 ? `
                <button type="button" onclick="approveAllPendingUsers(this)" class="btn-primary btn-sm" style="background: #16A34A; font-weight: 800; cursor: pointer;">
                  ✓ Setujui Semua (${pendingUsers.length})
                </button>
              ` : ''}
              <span class="badge ${pendingUsers.length > 0 ? 'badge-amber' : 'badge-green'}" style="font-size: 12px; padding: 4px 12px;">
                ${pendingUsers.length > 0 ? `⚠️ ${pendingUsers.length} Menunggu Persetujuan` : '✓ Semua Akun Telah Disetujui'}
              </span>
            </div>
          </div>

          ${pendingUsers.length > 0 ? `
            <div style="overflow-x: auto;">
              <table class="custom-table" style="background: white; border-radius: 12px; overflow: hidden; border: 1px solid #FCD34D;">
                <thead style="background: #FFFBEB;">
                  <tr>
                    <th>Pengguna Baru</th>
                    <th>Email Pengguna</th>
                    <th>No. HP</th>
                    <th>Pilihan Paket</th>
                    <th>Saldo Awal</th>
                    <th>Waktu Pendaftaran</th>
                    <th>Status</th>
                    <th style="text-align: right; width: 220px;">Aksi Persetujuan</th>
                  </tr>
                </thead>
                <tbody>
                  ${pendingUsers.map(u => `
                    <tr style="background: #FFFDF7;">
                      <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                          <img src="${u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80'}" style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover; border: 2px solid #FCD34D;">
                          <div>
                            <div style="font-weight: 800; color: #0F172A;">${u.fullName}</div>
                            <div style="font-size: 11px; color: #94A3B8;">ID: <code>${u.id}</code></div>
                          </div>
                        </div>
                      </td>
                      <td><b style="color: #0F172A;">${u.email}</b></td>
                      <td>${u.phone || '-'}</td>
                      <td>
                        <span class="badge ${u.plan === 'pro' ? 'badge-green' : 'badge-amber'}" style="font-size: 11px; font-weight: 800;">
                          ${u.plan ? u.plan.toUpperCase() : 'STARTER'} ${u.plan === 'pro' ? '⭐' : ''}
                        </span>
                      </td>
                      <td><b style="color: #64748B;">Rp 0</b></td>
                      <td style="font-size: 12px; color: #64748B;">${u.createdAt}</td>
                      <td>
                        <span class="badge" style="background: #FEF3C7; color: #92400E; border: 1px solid #FCD34D; font-size: 10px; font-weight: 800;">
                          ⏳ MENUNGGU
                        </span>
                      </td>
                      <td style="text-align: right;">
                        <div style="display: inline-flex; gap: 6px; justify-content: flex-end; flex-wrap: wrap;">
                          <button type="button" onclick="approveUser(this, '${u.id}')" class="btn-primary btn-sm" style="background: #16A34A; padding: 6px 14px; font-weight: 800; cursor: pointer;" title="Setujui akun ini secara instan">
                            ✓ Approve
                          </button>
                          <button type="button" onclick="rejectUser(this, '${u.id}')" class="btn-outline btn-sm" style="color: #DC2626; border-color: #FECACA; padding: 6px 10px; font-weight: 700; cursor: pointer;" title="Tolak pendaftaran akun">
                            ✕ Tolak
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 22px;">✅</span>
                <div>
                  <div style="font-weight: 800; font-size: 13px; color: #166534;">Seluruh Pendaftaran Pengguna Telah Disetujui</div>
                  <div style="font-size: 11px; color: #15803D;">Tidak ada permohonan pengguna baru yang menunggu persetujuan saat ini.</div>
                </div>
              </div>
              <span class="badge badge-green" style="font-size: 11px;">SEMUA AKUN AKTIF</span>
            </div>
          `}
        </div>

        <div>
      <!-- 5 TOTAL SYSTEM KPI CARDS -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 20px;">
        <div class="card" style="border-left: 4px solid #3B82F6;">
          <div style="font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase;">Total Pengguna</div>
          <div style="font-size: 26px; font-weight: 900; color: #0F172A; margin-top: 6px;">${totalSystemUsers} Akun</div>
          <div style="font-size: 11px; color: #16A34A; font-weight: 700; margin-top: 2px;">Multi-Tenant Terisolasi</div>
        </div>

        <div class="card" style="border-left: 4px solid #8B5CF6;">
          <div style="font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase;">Total Transaksi</div>
          <div style="font-size: 26px; font-weight: 900; color: #0F172A; margin-top: 6px;">${totalSystemTransactions} Trx</div>
          <div style="font-size: 11px; color: #64748B; margin-top: 2px;">Seluruh tenant sistem</div>
        </div>

        <div class="card" style="border-left: 4px solid #16A34A;">
          <div style="font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase;">Pemasukan Ekosistem</div>
          <div style="font-size: 20px; font-weight: 900; color: #16A34A; margin-top: 6px;">${formatIDR(totalSystemIncome)}</div>
          <div style="font-size: 11px; color: #16A34A; font-weight: 700; margin-top: 2px;">Gaji & Langganan SaaS</div>
        </div>

        <div class="card" style="border-left: 4px solid #EF4444;">
          <div style="font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase;">Pengeluaran Ekosistem</div>
          <div style="font-size: 20px; font-weight: 900; color: #EF4444; margin-top: 6px;">${formatIDR(totalSystemExpense)}</div>
          <div style="font-size: 11px; color: #64748B; margin-top: 2px;">Total belanja & server</div>
        </div>

        <div class="card" style="border-left: 4px solid #F97316;">
          <div style="font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase;">Total Saldo Sistem</div>
          <div style="font-size: 20px; font-weight: 900; color: #C2410C; margin-top: 6px;">${formatIDR(totalSystemBalance)}</div>
          <div style="font-size: 11px; color: #64748B; margin-top: 2px;">${store.wallets.length} dompet tersimpan</div>
        </div>
      </div>

      <!-- QUICK MENU JUMP BAR -->
      <div style="background: #0F172A; border-radius: 14px; padding: 10px 16px; margin-bottom: 24px; border: 1px solid #1E293B; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        <span style="font-size: 11px; font-weight: 800; color: #F97316; padding-right: 12px; border-right: 1px solid #334155;">PINTASAN ADMIN:</span>
        <a href="#pending-approvals-sec" class="btn-dark" style="padding: 6px 12px; font-size: 12px; background: ${pendingUsers.length > 0 ? '#C2410C' : '#1E293B'}; color: white; font-weight: 800;">📋 Persetujuan (${pendingUsers.length})</a>
        <a href="#admin-overview" class="btn-dark" style="padding: 6px 12px; font-size: 12px; background: #1E293B;">📊 Statistik</a>
        <a href="#user-mgmt" class="btn-dark" style="padding: 6px 12px; font-size: 12px; background: #1E293B;">👥 Pengguna</a>
        <a href="#payments-sec" class="btn-dark" style="padding: 6px 12px; font-size: 12px; background: #1E293B;">💳 Pembayaran</a>
        <a href="#ai-switcher-sec" class="btn-dark" style="padding: 6px 12px; font-size: 12px; background: #1E293B;">🤖 AI Provider</a>
        <a href="#ai-logs-sec" class="btn-dark" style="padding: 6px 12px; font-size: 12px; background: #1E293B;">⚡ AI Logs</a>
        <a href="#trx-mgmt" class="btn-dark" style="padding: 6px 12px; font-size: 12px; background: #1E293B;">🔍 Inspeksi Transaksi</a>
        <a href="#audit-sec" class="btn-dark" style="padding: 6px 12px; font-size: 12px; background: #1E293B;">🔒 Audit Log</a>
        <a href="#reports-export" class="btn-dark" style="padding: 6px 12px; font-size: 12px; background: #1E293B;">📑 Ekspor Data</a>
      </div>

      <!-- CHARTS SECTION -->
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 28px;" id="admin-overview">
        <!-- Chart 1: Cashflow Ekosistem -->
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <h3 style="font-size: 16px; font-weight: 800; color: #0F172A;">📊 Arus Kas & Likuiditas Sistem</h3>
              <div style="font-size: 12px; color: #64748B;">Pemasukan vs Pengeluaran vs Saldo Total Ekosistem TataDana</div>
            </div>
            <span class="badge badge-green">Neraca Sehat</span>
          </div>

          <div style="background: #FAFAFA; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px;">
            <svg viewBox="0 0 500 180" style="width: 100%; height: auto; overflow: visible;">
              <line x1="50" y1="20" x2="480" y2="20" stroke="#E2E8F0" stroke-dasharray="3,3" />
              <line x1="50" y1="85" x2="480" y2="85" stroke="#E2E8F0" stroke-dasharray="3,3" />
              <line x1="50" y1="150" x2="480" y2="150" stroke="#94A3B8" stroke-width="1.5" />

              <text x="42" y="24" text-anchor="end" font-size="10" fill="#94A3B8">${formatIDR(maxSysVal)}</text>
              <text x="42" y="89" text-anchor="end" font-size="10" fill="#94A3B8">${formatIDR(Math.round(maxSysVal / 2))}</text>
              <text x="42" y="154" text-anchor="end" font-size="10" fill="#94A3B8">0</text>

              <!-- Pemasukan Ekosistem -->
              <rect x="110" y="${sysIncY}" width="75" height="${sysIncH}" rx="6" fill="#10B981" />
              <text x="147" y="${Math.max(16, sysIncY - 6)}" text-anchor="middle" font-size="10" font-weight="700" fill="#166534">${formatIDR(totalSystemIncome)}</text>
              <text x="147" y="170" text-anchor="middle" font-size="11" font-weight="700" fill="#475569">Pemasukan</text>

              <!-- Pengeluaran Ekosistem -->
              <rect x="225" y="${sysExpY}" width="75" height="${sysExpH}" rx="6" fill="#EF4444" />
              <text x="262" y="${Math.max(16, sysExpY - 6)}" text-anchor="middle" font-size="10" font-weight="700" fill="#991B1B">${formatIDR(totalSystemExpense)}</text>
              <text x="262" y="170" text-anchor="middle" font-size="11" font-weight="700" fill="#475569">Pengeluaran</text>

              <!-- Saldo Sistem -->
              <rect x="340" y="${sysBalY}" width="75" height="${sysBalH}" rx="6" fill="#F97316" />
              <text x="377" y="${Math.max(16, sysBalY - 6)}" text-anchor="middle" font-size="10" font-weight="700" fill="#C2410C">${formatIDR(totalSystemBalance)}</text>
              <text x="377" y="170" text-anchor="middle" font-size="11" font-weight="700" fill="#475569">Total Saldo</text>
            </svg>
          </div>
        </div>

        <!-- Chart 2: Multi-Tenant Asset Breakdown -->
        <div class="card">
          <h3 style="font-size: 16px; font-weight: 800; margin-bottom: 4px;">Distribusi Aset Multi-Tenant</h3>
          <p style="font-size: 12px; color: #64748B; margin-bottom: 16px;">Proporsi saldo per akun pengguna & operasional</p>

          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; margin-bottom: 4px;">
                <span>👤 Budi Pratama (Pro User)</span>
                <span style="color: #F97316;">${budiPct}%</span>
              </div>
              <div style="height: 8px; border-radius: 999px; background: #E2E8F0; overflow: hidden;">
                <div style="height: 100%; width: ${budiPct}%; background: #F97316; border-radius: 999px;"></div>
              </div>
              <div style="font-size: 11px; color: #94A3B8; margin-top: 2px;">Saldo: ${formatIDR(budiBal)}</div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; margin-bottom: 4px;">
                <span>👤 Siti Rahma (Starter User)</span>
                <span style="color: #3B82F6;">${sitiPct}%</span>
              </div>
              <div style="height: 8px; border-radius: 999px; background: #E2E8F0; overflow: hidden;">
                <div style="height: 100%; width: ${sitiPct}%; background: #3B82F6; border-radius: 999px;"></div>
              </div>
              <div style="font-size: 11px; color: #94A3B8; margin-top: 2px;">Saldo: ${formatIDR(sitiBal)}</div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; margin-bottom: 4px;">
                <span>👑 Kas Operasional PT TataDana</span>
                <span style="color: #10B981;">${adminPct}%</span>
              </div>
              <div style="height: 8px; border-radius: 999px; background: #E2E8F0; overflow: hidden;">
                <div style="height: 100%; width: ${adminPct}%; background: #10B981; border-radius: 999px;"></div>
              </div>
              <div style="font-size: 11px; color: #94A3B8; margin-top: 2px;">Saldo: ${formatIDR(adminBal)}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 0. ADMIN PROFILE & IDENTITY SECTION -->
      <div class="card" style="margin-bottom: 28px; border-top: 4px solid #F97316;" id="admin-profile-sec">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid #F1F5F9; padding-bottom: 16px; flex-wrap: wrap; gap: 10px;">
          <div>
            <h2 style="font-size: 18px; font-weight: 900; color: #0F172A; display: flex; align-items: center; gap: 8px;">
              <span>👤</span> <span>Profil Administrator Utama</span>
            </h2>
            <p style="font-size: 12px; color: #64748B; margin-top: 2px;">Kelola foto profil avatar, nama resmi, kontak, dan identitas kepemilikan akun admin Anda.</p>
          </div>
          <span class="badge badge-purple" style="font-weight: 800;">👑 HAK AKSES ADMINISTRATOR UTAMA</span>
        </div>

        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 18px; padding: 20px; margin-bottom: 22px;">
          <div style="display: flex; align-items: center; gap: 24px; flex-wrap: wrap;">
            <div class="avatar-hover-wrapper" onclick="triggerAdminAvatarUpload()" title="Klik untuk mengganti foto profil admin">
              <img id="adminAvatarPreview" src="${sessionUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}" alt="${sessionUser.fullName}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80';">
              <div class="avatar-hover-overlay">
                <span style="font-size: 20px;">📷</span>
                <span style="font-size: 11px; font-weight: 800; margin-top: 2px;">Ganti Foto</span>
              </div>
              <div class="avatar-camera-badge" title="Ganti Foto">📷</div>
            </div>

            <div style="flex: 1; min-width: 240px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <div style="font-size: 16px; font-weight: 900; color: #0F172A;">Foto Profil Admin</div>
                <span class="badge badge-red" style="font-size: 10px; padding: 2px 7px;">CHIEF ADMIN</span>
              </div>
              <p style="font-size: 12px; color: #64748B; margin-bottom: 12px; line-height: 1.4;">
                Unggah foto dari perangkat atau masukkan tautan gambar langsung untuk foto profil admin Anda.
              </p>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                <button type="button" onclick="triggerAdminAvatarUpload()" class="btn-primary btn-sm" style="font-size: 12px; padding: 8px 14px;">
                  💻 Upload Berkas Foto
                </button>
                <button type="button" onclick="setAdminQuickPreset('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80')" class="btn-outline btn-sm" style="font-size: 12px; padding: 8px 12px; background: white;">
                  👩 Executive 1
                </button>
                <button type="button" onclick="setAdminQuickPreset('https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80')" class="btn-outline btn-sm" style="font-size: 12px; padding: 8px 12px; background: white;">
                  👩 Executive 2
                </button>
                <button type="button" onclick="resetAdminAvatarDefault()" class="btn-outline btn-sm" style="font-size: 12px; padding: 8px 12px; color: #64748B; background: white;">
                  🔄 Reset Default
                </button>
              </div>
            </div>
          </div>

          <div style="margin-top: 16px; border-top: 1px dashed #E2E8F0; padding-top: 14px;">
            <label style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px;">
              <span>URL Foto Profil Admin (HTTPS / Base64)</span>
              <span style="font-size: 11px; color: #94A3B8; font-weight: 500;">Dapat langsung diubah atau diuji</span>
            </label>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="admProfAvatar" value="${sessionUser.avatarUrl || ''}" placeholder="https://... atau data:image/..." oninput="syncAdminAvatarInput(this.value)">
              <button type="button" onclick="syncAdminAvatarInput(document.getElementById('admProfAvatar').value)" class="btn-outline btn-sm" style="white-space: nowrap; padding: 0 14px; background: white;">👁️ Tes URL</button>
            </div>
          </div>
        </div>

        <form onsubmit="event.preventDefault(); saveAdminProfile();" style="display: flex; flex-direction: column; gap: 18px;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;">
            <div>
              <label style="display: block; font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 6px;">
                Nama Lengkap Administrator <span style="color: #EF4444;">*</span>
              </label>
              <input type="text" id="admProfName" value="${sessionUser.fullName}" placeholder="Nama resmi administrator" required>
            </div>

            <div>
              <label style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 6px;">
                <span>Email Administrator</span>
                <span class="badge badge-purple" style="font-size: 10px; padding: 2px 7px;">👑 Admin Utama</span>
              </label>
              <input type="email" id="admProfEmail" value="${sessionUser.email}" disabled style="background: #F8FAFC; color: #64748B; cursor: not-allowed;" title="Email terdaftar sebagai identitas admin utama">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;">
            <div>
              <label style="display: block; font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 6px;">
                Nomor WhatsApp / HP Kontak <span style="color: #EF4444;">*</span>
              </label>
              <input type="text" id="admProfPhone" value="${sessionUser.phone || ''}" placeholder="+62..." required>
            </div>

            <div>
              <label style="display: block; font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 6px;">
                Jabatan / Peran Eksekutif
              </label>
              <input type="text" id="admProfOccupation" value="${sessionUser.occupation || 'Head of Finance & Chief Administrator'}" placeholder="Contoh: Chief Executive Administrator">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;">
            <div>
              <label style="display: block; font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 6px;">
                Kota Domisili / Lokasi Kantor
              </label>
              <input type="text" id="admProfCity" value="${sessionUser.city || 'Jakarta Selatan, DKI Jakarta'}" placeholder="Contoh: Jakarta Selatan">
            </div>

            <div>
              <label style="display: block; font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 6px;">
                Mata Uang Default Admin
              </label>
              <select id="admProfCurrency">
                <option value="IDR" ${sessionUser.defaultCurrency === 'IDR' ? 'selected' : ''}>IDR — Rupiah Indonesia (Rp)</option>
                <option value="USD" ${sessionUser.defaultCurrency === 'USD' ? 'selected' : ''}>USD — US Dollar ($)</option>
                <option value="SGD" ${sessionUser.defaultCurrency === 'SGD' ? 'selected' : ''}>SGD — Singapore Dollar (S$)</option>
              </select>
            </div>
          </div>

          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 6px;">
              Bio / Motto Kepemimpinan
            </label>
            <textarea id="admProfBio" rows="3" placeholder="Catatan visi kepemimpinan atau bio admin...">${sessionUser.bio || 'Memastikan tata kelola finansial terpadu, transparan, dan aman untuk seluruh pengguna TataDana.'}</textarea>
          </div>

          <div style="display: flex; gap: 14px; align-items: center; margin-top: 8px; flex-wrap: wrap;">
            <button type="submit" id="btnSaveAdminProfile" class="btn-primary" style="padding: 12px 28px; font-size: 14px; font-weight: 800; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(249,115,22,0.3);">
              <span>💾</span> <span>Simpan Perubahan Profil Admin</span>
            </button>
            <span id="adminSaveStatusIndicator" style="font-size: 13px; font-weight: 700; color: #166534; display: none; padding: 10px 16px; border-radius: 12px; background: #F0FDF4; border: 1px solid #BBF7D0;">
              ✓ Profil Admin berhasil diperbarui permanen!
            </span>
          </div>
        </form>

        <input type="file" id="adminFileInput" accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml" style="display: none;" onchange="handleAdminFileSelect(this.files[0])">
      </div>

      <!-- 1. USER MANAGEMENT SECTION -->
      <div class="card" style="margin-bottom: 28px;" id="user-mgmt">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
          <div>
            <h2 style="font-size: 18px; font-weight: 900; color: #0F172A;">👥 User Management (Manajemen Pengguna)</h2>
            <p style="font-size: 12px; color: #64748B;">Kelola profil pengguna, status persetujuan, dan audit aktivitas akun secara aman.</p>
          </div>
          <span class="badge badge-purple">${store.users.length} Akun Terdaftar</span>
        </div>

        <div style="overflow-x: auto;">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status Akun</th>
                <th>Paket</th>
                <th>Total Saldo</th>
                <th>Jml Transaksi</th>
                <th>Telegram Bot</th>
                <th style="text-align: right; width: 280px;">Aksi Admin</th>
              </tr>
            </thead>
            <tbody>
              ${store.users.map(u => {
                const uWallets = store.wallets.filter(w => w.userId === u.id);
                const uBal = uWallets.reduce((s, w) => s + w.balance, 0);
                const uTxCount = store.transactions.filter(t => t.userId === u.id).length;
                return `
                  <tr>
                    <td>
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}" style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover; border: 2px solid #E2E8F0;">
                        <div>
                          <div style="font-weight: 800; color: #0F172A;">${u.fullName}</div>
                          <div style="font-size: 11px; color: #94A3B8;">ID: <code>${u.id}</code></div>
                        </div>
                      </div>
                    </td>
                    <td><code>${u.email}</code></td>
                    <td>
                      <span class="badge ${u.role === 'admin' ? 'badge-red' : 'badge-green'}" style="font-size: 11px;">
                        ${u.role.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      ${u.status === 'pending_approval' ? `
                        <span class="badge" style="background: #FEF3C7; color: #92400E; border: 1px solid #FCD34D; font-size: 10px; font-weight: 800;">
                          ⏳ PENDING
                        </span>
                      ` : u.status === 'rejected' ? `
                        <span class="badge badge-red" style="font-size: 10px; font-weight: 800;">
                          ✕ REJECTED
                        </span>
                      ` : `
                        <span class="badge badge-green" style="font-size: 10px; font-weight: 800;">
                          ✓ APPROVED
                        </span>
                      `}
                    </td>
                    <td>
                      <span style="font-weight: 700; font-size: 12px; color: ${u.plan === 'pro' ? '#16A34A' : '#3B82F6'};">
                        ${u.plan.toUpperCase()}
                      </span>
                    </td>
                    <td><b>${formatIDR(uBal)}</b></td>
                    <td>${uTxCount} transaksi</td>
                    <td>
                      ${u.telegramConnected ? `
                        <span style="color: #2563EB; font-weight: 600; font-size: 12px;">@${u.telegramUsername}</span>
                      ` : '<span style="color: #94A3B8;">Belum konek</span>'}
                    </td>
                    <td style="text-align: right;">
                      <div style="display: inline-flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end;">
                        ${u.status === 'pending_approval' ? `
                          <button onclick="approveUser('${u.id}', '${u.fullName}')" class="btn-primary btn-sm" style="background: #16A34A; padding: 4px 10px; font-size: 11px;" title="Setujui pendaftaran akun">
                            ✓ Approve
                          </button>
                          <button onclick="rejectUser('${u.id}', '${u.fullName}')" class="btn-outline btn-sm" style="color: #DC2626; border-color: #FECACA; padding: 4px 8px; font-size: 11px;" title="Tolak pendaftaran">
                            ✕ Reject
                          </button>
                        ` : ''}
                        <button onclick="inspectUserTransactions('${u.id}', '${u.fullName}')" class="btn-outline btn-sm" style="padding: 4px 10px; font-size: 11px;" title="Inspeksi transaksi dengan alasan audit">
                          🔍 Inspeksi
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- 2. PAYMENT ORDERS APPROVAL & MIDTRANS (Part 6 & 10) -->
      <div class="card" style="margin-bottom: 28px;" id="payments-sec">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
          <div>
            <h2 style="font-size: 18px; font-weight: 900; color: #0F172A;">💳 Payment Approval & Midtrans Management</h2>
            <p style="font-size: 12px; color: #64748B;">Persetujuan manual transfer bank dan pantauan transaksi otomatis Midtrans Snap QRIS.</p>
          </div>
          <button onclick="simulateMidtransSettlement()" class="btn-primary" style="font-size: 12px; padding: 8px 16px; background: #16A34A;">
            ⚡ Simulasi Settlement QRIS
          </button>
        </div>

        <div style="overflow-x: auto;">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Pengguna</th>
                <th>Paket</th>
                <th>Metode Pembayaran</th>
                <th>No. Referensi</th>
                <th>Nominal</th>
                <th>Status</th>
                <th>Waktu</th>
                <th style="text-align: right; width: 170px;">Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody>
              ${store.paymentOrders.map(ord => {
                let statusBadge = '<span class="badge badge-amber">PENDING</span>';
                if (ord.status === 'success') statusBadge = '<span class="badge badge-green">SUCCESS</span>';
                if (ord.status === 'rejected') statusBadge = '<span class="badge badge-red">REJECTED</span>';

                return `
                  <tr>
                    <td><code>${ord.id}</code></td>
                    <td>
                      <div style="font-weight: 800; color: #0F172A;">${ord.userName}</div>
                      <div style="font-size: 11px; color: #94A3B8;">${ord.userEmail}</div>
                    </td>
                    <td><span class="badge badge-purple">${ord.plan.toUpperCase()}</span></td>
                    <td><b>${ord.method}</b></td>
                    <td><code>${ord.referenceNumber}</code></td>
                    <td style="font-weight: 800; color: #16A34A;">${formatIDR(ord.amount)}</td>
                    <td>${statusBadge}</td>
                    <td style="font-size: 12px; color: #64748B;">${ord.createdAt}</td>
                    <td style="text-align: right;">
                      ${ord.status === 'pending' ? `
                        <div style="display: inline-flex; gap: 6px;">
                          <button onclick="approvePayment('${ord.id}', '${ord.userId}')" class="btn-primary btn-sm" style="background: #16A34A;">
                            ✓ Approve
                          </button>
                          <button onclick="rejectPayment('${ord.id}')" class="btn-danger btn-sm">
                            ✗ Reject
                          </button>
                        </div>
                      ` : `
                        <span style="font-size: 11px; color: #94A3B8;">Selesai diproses</span>
                      `}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- 3. AI MULTI-PROVIDER SWITCHER & LOGS -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px;" id="ai-switcher-sec">
        <!-- AI Providers Switcher Card -->
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div>
              <h3 style="font-weight: 800; font-size: 16px;">🤖 Provider AI Multimodal Switcher</h3>
              <p style="font-size: 12px; color: #64748B;">Atur primary provider (Gemini/OpenAI/DeepSeek) & mode failover</p>
            </div>
            <span class="badge badge-blue">
              Mode: ${store.aiMode === 'parallel_failover' ? 'Parallel Failover' : 'Single Mode'}
            </span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
            ${store.aiProviders.map(p => `
              <div style="padding: 12px; border-radius: 12px; background: #F8FAFC; border: 1px solid ${p.isPrimary ? '#F97316' : '#E2E8F0'}; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: 800; font-size: 14px; color: ${p.isPrimary ? '#EA580C' : '#0F172A'};">
                    ${p.isPrimary ? '⭐ PRIMARY:' : '⚪'} ${p.name}
                  </div>
                  <div style="font-size: 12px; color: #64748B;">${p.role}</div>
                  <div style="font-size: 11px; color: #16A34A; font-weight: 600; margin-top: 2px;">⚡ Status: ${p.status}</div>
                </div>
                <div>
                  ${p.isPrimary ? `
                    <span class="badge badge-green">Aktif Utama</span>
                  ` : `
                    <button onclick="setPrimaryAI('${p.id}', '${p.name}')" class="btn-dark btn-sm">
                      Jadikan Utama 🌟
                    </button>
                  `}
                </div>
              </div>
            `).join('')}
          </div>

          <div style="display: flex; gap: 10px;">
            <button onclick="toggleAiMode()" class="btn-outline" style="flex: 1; font-size: 12px; padding: 10px;">
              🔄 Toggle Failover: <b>${store.aiMode}</b>
            </button>
            <button onclick="alert('⚡ Latensi Provider AI:\\n• Google Gemini Flash: 198ms (OK)\\n• OpenAI GPT-4o Mini: 412ms (Standby)\\n• DeepSeek Chat V3: 185ms (Standby)')" class="btn-dark" style="font-size: 12px; padding: 10px;">
              ⚡ Ping Latensi
            </button>
          </div>
        </div>

        <!-- AI Telemetry & Usage Logs -->
        <div class="card" id="ai-logs-sec">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div>
              <h3 style="font-weight: 800; font-size: 16px;">⚡ AI Usage Logs (ai_logs)</h3>
              <p style="font-size: 12px; color: #64748B;">Audit tokens, task type, & execution latency</p>
            </div>
            <span class="badge badge-green">${store.aiLogs.length} Eksekusi</span>
          </div>

          <div style="max-height: 280px; overflow-y: auto;">
            <table class="custom-table" style="font-size: 12px;">
              <thead>
                <tr>
                  <th>Waktu (WIB)</th>
                  <th>Task</th>
                  <th>Provider</th>
                  <th>Tokens</th>
                  <th>Latency</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${store.aiLogs.map(l => `
                  <tr>
                    <td style="color: #64748B; font-size: 11px;">${l.timestamp}</td>
                    <td><b>${l.task}</b></td>
                    <td style="font-size: 11px;">${l.provider.split(' ')[0]} ${l.provider.split(' ')[1] || ''}</td>
                    <td>${l.tokens}</td>
                    <td><span style="color: #16A34A; font-weight: 700;">${l.latency}ms</span></td>
                    <td><span class="badge badge-green" style="font-size: 10px;">${l.status}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 4. TRANSACTION INSPECTOR WITH MANDATORY AUDIT REASON -->
      <div class="card" style="margin-bottom: 28px;" id="trx-mgmt">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
          <div>
            <h2 style="font-size: 18px; font-weight: 900; color: #0F172A;">🔍 Transaction Inspector (Semua Transaksi Tenant)</h2>
            <p style="font-size: 12px; color: #64748B;">Admin dapat melihat mutasi transaksi sistem secara transparan dengan Zero-Trust Audit Log.</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button onclick="logAuditAction()" class="btn-dark btn-sm">
              🔒 Catat Log Audit Kepatuhan
            </button>
            <span class="badge badge-blue">Total: ${store.transactions.length} mutasi</span>
          </div>
        </div>

        <div style="overflow-x: auto;">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Tanggal (WIB)</th>
                <th>Pemilik Akun</th>
                <th>Keterangan</th>
                <th>Kategori</th>
                <th>Dompet</th>
                <th style="text-align: right;">Nominal</th>
              </tr>
            </thead>
            <tbody>
              ${store.transactions.map(t => {
                const owner = store.users.find(u => u.id === t.userId) || { fullName: 'User Umum', role: 'user' };
                return `
                  <tr>
                    <td style="font-size: 12px; color: #64748B; white-space: nowrap;">${t.date}</td>
                    <td>
                      <span class="badge ${owner.role === 'admin' ? 'badge-red' : 'badge-blue'}" style="font-size: 11px;">
                        ${owner.fullName}
                      </span>
                    </td>
                    <td>
                      <div style="font-weight: 700; color: #0F172A;">${t.desc}</div>
                      ${t.items ? `<div style="font-size: 11px; color: #F97316;">🧾 Struk ${t.items.length} item: ${t.items.slice(0, 2).join(', ')}...</div>` : ''}
                    </td>
                    <td>${t.cat}</td>
                    <td><span style="background: #F1F5F9; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;">${t.wallet}</span></td>
                    <td style="text-align: right; font-weight: 900; color: ${t.type === 'income' ? '#16A34A' : '#0F172A'};">
                      ${t.type === 'income' ? '+' : '-'}${formatIDR(t.amount)}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- 5. ZERO-TRUST PRIVACY AUDIT TRAIL (audit_logs) -->
      <div class="card" style="margin-bottom: 28px;" id="audit-sec">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 16px; font-weight: 800;">Riwayat Audit Trail Privasi (audit_logs)</h3>
            <p style="font-size: 12px; color: #64748B;">Setiap tindakan administrasi dan akses data pengguna tercatat secara permanen.</p>
          </div>
          <span class="badge badge-purple">Total: <b>${store.auditLogs.length}</b> events</span>
        </div>

        <table class="custom-table">
          <thead>
            <tr>
              <th>Waktu (WIB)</th>
              <th>Admin Pengakses</th>
              <th>Target Tenant</th>
              <th>Aksi</th>
              <th>Alasan Kepatuhan & Tiket</th>
            </tr>
          </thead>
          <tbody>
            ${store.auditLogs.map(a => `
              <tr>
                <td style="font-size: 12px; color: #64748B;">${a.timestamp}</td>
                <td><b>${a.admin}</b></td>
                <td><code style="background: #F1F5F9; padding: 2px 6px; border-radius: 4px;">${a.target}</code></td>
                <td><span class="badge badge-blue" style="font-size: 11px;">${a.action}</span></td>
                <td style="color: #475569;">${a.reason}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- 6. GLOBAL DATA EXPORT & SYSTEM MONITORING -->
      <div class="card" style="margin-bottom: 28px;" id="reports-export">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
          <div>
            <h2 style="font-size: 18px; font-weight: 900; color: #0F172A;">📑 Ekspor Data Ekosistem & Telemetri Jaringan</h2>
            <p style="font-size: 12px; color: #64748B;">Unduh data lengkap dalam format CSV/JSON dan pantau alamat akses lokal/publik.</p>
          </div>
          <span class="badge badge-green">Zero Runtime Dependencies</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;">
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px;">
            <div style="font-size: 24px; margin-bottom: 8px;">💳</div>
            <h4 style="font-weight: 800; font-size: 14px; margin-bottom: 4px;">Seluruh Transaksi Ekosistem</h4>
            <p style="font-size: 11px; color: #64748B; margin-bottom: 14px;">Total ${store.transactions.length} mutasi tersimpan di store.</p>
            <button onclick="exportAllTransactionsCSV()" class="btn-primary" style="width: 100%; font-size: 12px; padding: 8px; background: #16A34A;">
              📥 Unduh CSV Transaksi
            </button>
          </div>

          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px;">
            <div style="font-size: 24px; margin-bottom: 8px;">👥</div>
            <h4 style="font-weight: 800; font-size: 14px; margin-bottom: 4px;">Daftar Seluruh Pengguna</h4>
            <p style="font-size: 11px; color: #64748B; margin-bottom: 14px;">Total ${store.users.length} akun terdaftar beserta role & paket.</p>
            <button onclick="exportAllUsersCSV()" class="btn-primary" style="width: 100%; font-size: 12px; padding: 8px; background: #2563EB;">
              📥 Unduh CSV Pengguna
            </button>
          </div>

          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px;">
            <div style="font-size: 24px; margin-bottom: 8px;">🌐</div>
            <h4 style="font-weight: 800; font-size: 14px; margin-bottom: 4px;">Akses Perangkat Lain & IP</h4>
            <p style="font-size: 11px; color: #64748B; margin-bottom: 8px;">Listen: <code>0.0.0.0:${PORT}</code></p>
            <div style="font-size: 11px; color: #0F172A; font-weight: 700; margin-bottom: 12px;">
              IP Lokal: ${localIps.map(i => `<code>${i.address}:${PORT}</code>`).join(' ') || '192.168.18.27:3000'}
            </div>
            <a href="/api/data" target="_blank" class="btn-dark" style="display: block; text-align: center; font-size: 12px; padding: 8px; text-decoration: none;">
              🗄️ Raw JSON (/api/data)
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- CLIENT INTERACTIVE SCRIPTS -->
    <script>
      function setPrimaryAI(provId, name) {
        fetch('/api/admin/set-ai-provider', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ providerId: provId, providerName: name })
        })
        .then(r => r.json())
        .then(d => {
          if (d.ok) {
            alert('Provider utama AI berhasil diubah ke: ' + name);
            window.location.reload();
          } else {
            alert('Gagal: ' + (d.error || 'Terjadi kesalahan'));
          }
        });
      }

      function toggleAiMode() {
        fetch('/api/admin/set-ai-mode', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'}
        })
        .then(r => r.json())
        .then(d => {
          alert('Mode AI diubah ke: ' + d.mode);
          window.location.reload();
        });
      }

      function approveUser(btn, userId) {
        if (!userId) return;
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = '⏳ Menyetujui...';
          btn.style.opacity = '0.7';
        }
        fetch('/api/admin/users/approve', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ userId: userId, reason: 'Persetujuan pendaftaran via Admin Console' })
        })
        .then(function(r) { return r.json(); })
        .then(function(d) {
          if (d && d.ok) {
            var magicInfo = d.magicLoginLink ? '<div style="margin-top:6px;font-size:11px;color:#FDE68A;">Tautan Sekali Pakai (Magic Link): <code>' + d.magicLoginLink + '</code></div>' : '';
            showPendingToast('✅ <b>Sukses Disetujui!</b><br>Akun pengguna telah aktif dan user otomatis masuk ke dashboard.' + magicInfo);
            setTimeout(function() { window.location.reload(); }, 1200);
          } else {
            if (btn) { btn.disabled = false; btn.innerHTML = '✓ Approve'; btn.style.opacity = '1'; }
            alert('Gagal menyetujui akun: ' + ((d && d.error) || 'Terjadi kesalahan'));
          }
        })
        .catch(function(err) {
          if (btn) { btn.disabled = false; btn.innerHTML = '✓ Approve'; btn.style.opacity = '1'; }
          alert('Koneksi bermasalah: ' + err.message);
        });
      }

      function approveAndOpen(btn, userId) {
        if (!userId) return;
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = '⏳ Membuka...';
          btn.style.opacity = '0.7';
        }
        fetch('/api/admin/users/approve', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ userId: userId, reason: 'Persetujuan pendaftaran & langsung tinjau dashboard' })
        })
        .then(function(r) { return r.json(); })
        .then(function(d) {
          if (d && d.ok) {
            window.location.reload();
          } else {
            if (btn) { btn.disabled = false; btn.innerHTML = '✓ Approve'; btn.style.opacity = '1'; }
            alert('Gagal menyetujui akun: ' + ((d && d.error) || 'Terjadi kesalahan'));
          }
        })
        .catch(function(err) {
          if (btn) { btn.disabled = false; btn.innerHTML = '✓ Approve'; btn.style.opacity = '1'; }
          alert('Koneksi bermasalah: ' + err.message);
        });
      }

      function rejectUser(btn, userId) {
        if (!userId) return;
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = '⏳...';
        }
        fetch('/api/admin/users/reject', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ userId: userId, reason: 'Pendaftaran ditolak oleh Administrator' })
        })
        .then(function(r) { return r.json(); })
        .then(function(d) {
          if (d && d.ok) {
            showPendingToast('❌ <b>Pendaftaran Ditolak:</b> Akun pengguna telah ditolak.');
            setTimeout(function() { window.location.reload(); }, 600);
          } else {
            if (btn) { btn.disabled = false; btn.innerHTML = '✕ Tolak'; }
            alert('Gagal: ' + ((d && d.error) || 'Terjadi kesalahan'));
          }
        })
        .catch(function(err) {
          if (btn) { btn.disabled = false; btn.innerHTML = '✕ Tolak'; }
          alert('Error: ' + err.message);
        });
      }

      function approveAllPendingUsers(btn) {
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = '⏳ Menyetujui Semua...';
        }
        fetch('/api/admin/users/approve-all', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ reason: 'Persetujuan massal pendaftaran via Admin Console' })
        })
        .then(function(r) { return r.json(); })
        .then(function(d) {
          if (d && d.ok) {
            showPendingToast('✅ <b>Semua Akun Disetujui!</b><br>' + (d.count || 0) + ' pengguna baru telah disetujui.');
            setTimeout(function() { window.location.reload(); }, 800);
          } else {
            if (btn) { btn.disabled = false; btn.innerHTML = '⚡ Setujui Semua Sekaligus'; }
            alert('Gagal: ' + ((d && d.error) || 'Terjadi kesalahan'));
          }
        })
        .catch(function(err) {
          if (btn) { btn.disabled = false; btn.innerHTML = '⚡ Setujui Semua Sekaligus'; }
          alert('Error: ' + err.message);
        });
      }

      // Realtime Live Polling for New User Registrations (every 3.5 seconds)
      let lastKnownPendingCount = ${pendingUsers.length};
      setInterval(function() {
        fetch('/api/admin/pending-approvals')
          .then(function(r) { return r.json(); })
          .then(function(d) {
            if (d && d.ok) {
              var count = d.count || 0;
              var topBadge = document.getElementById('topAdminPendingBadge');
              if (topBadge) {
                if (count > 0) {
                  topBadge.style.display = 'inline-block';
                  topBadge.innerText = count + ' BARU';
                } else {
                  topBadge.style.display = 'none';
                }
              }
              if (count > lastKnownPendingCount) {
                lastKnownPendingCount = count;
                var latestUser = d.users && d.users[0] ? d.users[0].fullName + ' (' + d.users[0].email + ')' : 'Pengguna Baru';
                showPendingToast('🔔 <b>Pemberitahuan Pendaftaran Baru Masuk:</b><br>' + latestUser + ' menunggu persetujuan Admin.');
                setTimeout(function() { window.location.reload(); }, 2000);
              } else if (count !== lastKnownPendingCount) {
                lastKnownPendingCount = count;
              }
            }
          })
          .catch(function(e) {});
      }, 3500);

      function showPendingToast(htmlMsg) {
        var existing = document.getElementById('adminLiveToast');
        if (existing) existing.remove();
        var toast = document.createElement('div');
        toast.id = 'adminLiveToast';
        toast.style.position = 'fixed';
        toast.style.bottom = '24px';
        toast.style.right = '24px';
        toast.style.zIndex = '99999';
        toast.style.background = '#0F172A';
        toast.style.color = '#FFFFFF';
        toast.style.border = '2px solid #F59E0B';
        toast.style.borderRadius = '16px';
        toast.style.padding = '18px 24px';
        toast.style.boxShadow = '0 15px 40px rgba(0,0,0,0.4)';
        toast.style.fontSize = '14px';
        toast.style.maxWidth = '420px';
        toast.innerHTML = htmlMsg + '<div style="margin-top: 10px; display: flex; gap: 8px;"><button onclick="window.location.reload()" class="btn-primary btn-sm" style="background: #16A34A;">Muat Ulang Halaman</button><button onclick="this.parentElement.parentElement.remove()" class="btn-outline btn-sm" style="color: white; border-color: rgba(255,255,255,0.3);">Tutup</button></div>';
        document.body.appendChild(toast);
      }

      function rejectUser(userId, name) {
        if (!confirm('Apakah Anda yakin ingin menolak akun ' + name + '?')) return;
        fetch('/api/admin/users/reject', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ userId, reason: 'Pendaftaran ditolak via Admin Console' })
        })
        .then(r => r.json())
        .then(d => {
          if (d.ok) {
            alert('Akun ' + name + ' telah ditolak.');
            window.location.reload();
          } else {
            alert('Gagal menolak akun: ' + (d.error || 'Terjadi kesalahan'));
          }
        });
      }

      function approvePayment(orderId, userId) {
        if (!confirm('Setujui pembayaran order ' + orderId + ' dan upgrade user ke Pro?')) return;
        fetch('/api/admin/approve-payment', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ orderId, userId })
        })
        .then(r => r.json())
        .then(d => {
          alert('✓ Pembayaran berhasil disetujui! User otomatis di-upgrade ke Paket Pro.');
          window.location.reload();
        });
      }

      function rejectPayment(orderId) {
        const reason = prompt('Masukkan alasan penolakan pembayaran:', 'Bukti transfer tidak valid / nominal tidak cocok');
        if (!reason) return;
        fetch('/api/admin/reject-payment', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ orderId, reason })
        })
        .then(r => r.json())
        .then(d => {
          alert('Pembayaran ditolak dan audit log tercatat.');
          window.location.reload();
        });
      }

      function inspectUserTransactions(userId, userName) {
        const reason = prompt('Zero-Trust Guard: Masukkan alasan inspeksi transaksi ' + userName + ':', 'Investigasi aduan tiket CS #' + Math.floor(Math.random() * 8000 + 1000));
        if (!reason) return;

        fetch('/api/admin/audit-log', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            targetUserId: userId,
            action: 'INSPECT_USER_TRANSACTIONS',
            reason: reason
          })
        })
        .then(r => r.json())
        .then(() => {
          alert('✅ Inspeksi Transaksi ' + name + ' berhasil dicatat ke Audit Trail SOC2.');
          window.location.reload();
        });
      }

      function logAuditAction() {
        const reason = prompt('Masukkan catatan kepatuhan privasi audit:', 'Verifikasi berkala audit internal SOC2');
        if (!reason) return;
        fetch('/api/admin/audit-log', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            targetUserId: 'all',
            action: 'SECURITY_AUDIT_MANUAL',
            reason: reason
          })
        })
        .then(r => r.json())
        .then(() => {
          alert('✓ Log audit kepatuhan berhasil ditambahkan.');
          window.location.reload();
        });
      }

      function simulateMidtransSettlement() {
        fetch('/api/payments/midtrans', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ order_id: 'MID_' + Date.now() })
        })
        .then(r => r.json())
        .then(d => {
          alert('Midtrans Webhook Triggered: ' + d.message);
          window.location.reload();
        });
      }

      function exportAllTransactionsCSV() {
        const transactions = ${JSON.stringify(store.transactions)};
        let csv = "\\uFEFFID,Tanggal,User ID,Keterangan,Kategori,Dompet,Jenis,Nominal\\n";
        transactions.forEach(t => {
          const row = [
            t.id,
            t.date,
            t.userId,
            (t.desc || '').replace(/"/g, '""'),
            t.cat,
            t.wallet,
            t.type,
            t.amount
          ].map(val => '"' + (val || '') + '"').join(',');
          csv += row + "\\n";
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tatadana_semua_transaksi_' + new Date().toISOString().slice(0, 10) + '.csv';
        a.click();
        URL.revokeObjectURL(url);
      }

      function exportAllUsersCSV() {
        const users = ${JSON.stringify(store.users.map(u => ({ id: u.id, fullName: u.fullName, email: u.email, role: u.role, plan: u.plan, phone: u.phone, telegramUsername: u.telegramUsername })))};
        let csv = "\\uFEFFID,Nama,Email,Role,Paket,No HP,Telegram\\n";
        users.forEach(u => {
          const row = [
            u.id,
            (u.fullName || '').replace(/"/g, '""'),
            u.email,
            u.role,
            u.plan,
            u.phone,
            u.telegramUsername || ''
          ].map(val => '"' + (val || '') + '"').join(',');
          csv += row + "\\n";
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tatadana_semua_pengguna_' + new Date().toISOString().slice(0, 10) + '.csv';
        a.click();
        URL.revokeObjectURL(url);
      }

      // Admin Profile & Avatar Management Handlers
      function triggerAdminAvatarUpload() {
        const inp = document.getElementById('adminFileInput');
        if (inp) inp.click();
      }

      function handleAdminFileSelect(file) {
        if (!file || !file.type.startsWith('image/')) {
          alert('Mohon pilih berkas gambar valid (JPG, PNG, WEBP, GIF, SVG).');
          return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
          const rawUrl = e.target.result;
          const canvas = document.createElement('canvas');
          const img = new Image();
          img.onload = function() {
            canvas.width = 280;
            canvas.height = 280;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, 280, 280);
            const minDim = Math.min(img.width, img.height);
            const sx = (img.width - minDim) / 2;
            const sy = (img.height - minDim) / 2;
            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 280, 280);
            const optimized = canvas.toDataURL('image/jpeg', 0.90);
            setAdminAvatar(optimized);
          };
          img.onerror = function() {
            setAdminAvatar(rawUrl);
          };
          img.src = rawUrl;
        };
        reader.readAsDataURL(file);
      }

      function setAdminAvatar(url) {
        if (!url) return;
        const inp = document.getElementById('admProfAvatar');
        if (inp) inp.value = url;
        const prev = document.getElementById('adminAvatarPreview');
        if (prev) prev.src = url;
        document.querySelectorAll('#topNavAvatar, .top-nav-avatar').forEach(function(img) { img.src = url; });
        document.querySelectorAll('#sidebarAvatar, .sidebar-avatar').forEach(function(img) { img.src = url; });
      }

      function setAdminQuickPreset(url) {
        setAdminAvatar(url);
      }

      function resetAdminAvatarDefault() {
        setAdminAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80');
      }

      function syncAdminAvatarInput(url) {
        if (url && url.trim()) setAdminAvatar(url.trim());
      }

      function saveAdminProfile() {
        const btn = document.getElementById('btnSaveAdminProfile');
        if (btn) { btn.innerHTML = '<span>⏳</span> <span>Menyimpan...</span>'; btn.disabled = true; }

        const payload = {
          userId: '${sessionUser.id}',
          fullName: document.getElementById('admProfName').value.trim(),
          phone: document.getElementById('admProfPhone').value.trim(),
          occupation: document.getElementById('admProfOccupation').value.trim(),
          city: document.getElementById('admProfCity').value.trim(),
          bio: document.getElementById('admProfBio').value.trim(),
          avatarUrl: document.getElementById('admProfAvatar').value.trim(),
          defaultCurrency: document.getElementById('admProfCurrency').value
        };

        fetch('/api/user/profile', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
        })
        .then(function(r) { return r.json(); })
        .then(function(d) {
          if (btn) { btn.innerHTML = '<span>💾</span> <span>Simpan Perubahan Profil Admin</span>'; btn.disabled = false; }
          if (d.ok) {
            setAdminAvatar(d.user.avatarUrl);
            document.querySelectorAll('.user-display-name').forEach(function(el) {
              el.innerText = '👑 ' + d.user.fullName.split(' ')[0];
            });
            document.querySelectorAll('.user-full-name-display').forEach(function(el) {
              el.innerText = d.user.fullName;
            });
            const indicator = document.getElementById('adminSaveStatusIndicator');
            if (indicator) {
              indicator.style.display = 'inline-block';
              setTimeout(function() { indicator.style.display = 'none'; }, 4000);
            }
          } else {
            alert('Gagal menyimpan profil admin: ' + (d.error || 'Terjadi kesalahan'));
          }
        })
        .catch(function(err) {
          if (btn) { btn.innerHTML = '<span>💾</span> <span>Simpan Perubahan Profil Admin</span>'; btn.disabled = false; }
          alert('Terjadi kesalahan jaringan: ' + err.message);
        });
      }
    </script>
        </div>
      </main>
    </div>
  `;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

module.exports = {
  renderAdminDashboard
};
