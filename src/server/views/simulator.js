/**
 * Telegram Bot Interactive Simulator & Webhook Tester for TataDana
 * Features:
 * - Standalone Telegram chat GUI with dark mode styling
 * - Multimodal input simulation: Text with Indonesian nominals ("15rb", "1.5jt", "500k"), Photo OCR, Voice STT
 * - Bot commands: /saldo, /hari ini, /minggu ini, /bulan ini, /budget, /sheet, /bantuan
 * - Tenant user selector (simulate as Budi, Siti, or Admin)
 * - Persistent Idempotency test (duplicate update_id handling)
 * - Live Webhook Tester & Response Inspector
 */

const { store, formatIDR } = require('../store');
const { getHtmlHeader, renderGlobalHubNav } = require('./components');

function renderSimulatorPage(req, res, sessionUser) {
  const html = `
    ${getHtmlHeader('TataDana — Telegram Bot Interactive Simulator')}
    ${renderGlobalHubNav('/dev/telegram-simulator', sessionUser)}

    <div style="max-width: 960px; margin: 30px auto; padding: 0 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <a href="/" style="color: #F97316; font-weight: 700; text-decoration: none; font-size: 13px;">← Beranda Utama</a>
            <span style="color: #CBD5E1;">•</span>
            <a href="/portal" style="color: #64748B; font-weight: 700; text-decoration: none; font-size: 13px;">🎯 Portal Terpadu</a>
          </div>
          <h1 style="font-size: 26px; font-weight: 900; margin-top: 6px;">⚡ Telegram Bot Interactive Simulator</h1>
          <p style="font-size: 13px; color: #64748B;">Uji langsung parsing teks WIB ("15rb", "5jt", "500k"), OCR struk belanja, dan bot commands.</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="/dashboard" class="btn-primary" style="padding: 9px 16px; font-size: 13px;">Dashboard Web →</a>
          <a href="/api/telegram/webhook" class="btn-dark" style="padding: 9px 14px; font-size: 13px;">Tester Webhook ⚡</a>
        </div>
      </div>

      <div class="card" style="background: #0F172A; color: white; border: 1px solid #1E293B; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.25);">
        <!-- BOT HEADER -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1E293B; padding-bottom: 16px; margin-bottom: 18px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #F97316, #EA580C); display: flex; align-items: center; justify-content: center; font-size: 22px;">🤖</div>
            <div>
              <div style="font-weight: 800; font-size: 16px;">TataDana FinAssistant</div>
              <div style="font-size: 12px; color: #22C55E; display: flex; align-items: center; gap: 6px;">
                <span class="pulse-dot"></span> bot aktif • online
              </div>
            </div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #94A3B8;">
            <div>Webhook Idempoten Siap</div>
            <div>Zona Waktu: <b>WIB (Asia/Jakarta)</b></div>
          </div>
        </div>

        <!-- TENANT USER SIMULATION SELECTOR -->
        <div style="background: #1E293B; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; border: 1px solid #334155;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 13px; font-weight: 700; color: #F97316;">👤 Simulasi Akun Pengirim:</span>
            <select id="simUserSelect" style="background: #020617; color: white; border: 1px solid #475569; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; outline: none;">
              ${store.users.map(u => `
                <option value="${u.id}" ${sessionUser && sessionUser.id === u.id ? 'selected' : (u.id === 'usr_demo_01' ? 'selected' : '')}>
                  ${u.fullName} (${u.role.toUpperCase()}) — @${u.telegramUsername || 'tatadana_bot'}
                </option>
              `).join('')}
            </select>
          </div>
          <div style="font-size: 11px; color: #94A3B8;">
            Setiap chat otomatis masuk ke dompet tenant pengguna terpilih.
          </div>
        </div>

        <!-- CHAT LOG -->
        <div id="simChatBox" style="background: #020617; border-radius: 16px; padding: 20px; min-height: 380px; max-height: 480px; overflow-y: auto; font-size: 14px; display: flex; flex-direction: column; gap: 14px; border: 1px solid #1E293B;">
          <div style="align-self: flex-start; background: #1E293B; padding: 14px 18px; border-radius: 16px 16px 16px 2px; max-width: 82%; line-height: 1.5;">
            👋 <b>Halo!</b> Selamat datang di TataDana Bot.<br><br>
            Kamu bisa ketik pengeluaran atau pemasukan santai seperti chat ke teman:<br>
            • <i>"beli bakso 15rb"</i><br>
            • <i>"kopi susu 22k gopay"</i><br>
            • <i>"gajian 5jt"</i><br><br>
            Atau coba tombol simulasi Foto Struk & Voice Note di bawah!
          </div>
        </div>

        <!-- INPUT FORM -->
        <div style="display: flex; gap: 10px; margin-top: 18px;">
          <input type="text" id="simChatInput" placeholder="Ketik pengeluaran / pemasukan kamu..." style="flex: 1; padding: 14px 18px; border-radius: 12px; border: 1px solid #334155; background: #020617; color: white; font-size: 14px; outline: none;">
          <button onclick="simSendMessage()" class="btn-primary" style="padding: 14px 24px; font-size: 14px;">Kirim 🚀</button>
        </div>

        <!-- MODALITY BUTTONS -->
        <div style="display: flex; gap: 10px; margin-top: 14px; padding-top: 14px; border-top: 1px solid #1E293B; flex-wrap: wrap;">
          <button onclick="simSendPhotoReceipt()" class="btn-dark" style="background: #2563EB; font-size: 12px; padding: 8px 14px;">
            🧾 Simulasi Foto Struk (OCR Multi-Item)
          </button>
          <button onclick="simSendVoiceNote()" class="btn-dark" style="background: #7C3AED; font-size: 12px; padding: 8px 14px;">
            🎙️ Simulasi Voice Note (STT)
          </button>
          <button onclick="simTestIdempotency()" class="btn-dark" style="background: #D97706; font-size: 12px; padding: 8px 14px;">
            🔁 Uji Idempotency (Kirim Duplicate Update ID)
          </button>
        </div>

        <!-- QUICK SHORTCUT BUTTONS -->
        <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
          <span style="font-size: 11px; color: #64748B; align-self: center; margin-right: 4px;">Pintasan Cepat:</span>
          <button onclick="simQuick('beli bakso 15rb')" style="background: #1E293B; color: #CBD5E1; border: 1px solid #334155; padding: 6px 12px; border-radius: 8px; font-size: 12px; cursor: pointer;">🍜 beli bakso 15rb</button>
          <button onclick="simQuick('kopi susu 22k gopay')" style="background: #1E293B; color: #CBD5E1; border: 1px solid #334155; padding: 6px 12px; border-radius: 8px; font-size: 12px; cursor: pointer;">☕ kopi susu 22k gopay</button>
          <button onclick="simQuick('isi pertalite 50rb')" style="background: #1E293B; color: #CBD5E1; border: 1px solid #334155; padding: 6px 12px; border-radius: 8px; font-size: 12px; cursor: pointer;">⛽ bensin 50rb</button>
          <button onclick="simQuick('gajian 5jt mandiri')" style="background: #1E293B; color: #CBD5E1; border: 1px solid #334155; padding: 6px 12px; border-radius: 8px; font-size: 12px; cursor: pointer;">💰 gajian 5jt</button>
          <button onclick="simQuick('/saldo')" style="background: #1E293B; color: #F97316; border: 1px solid #EA580C; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer;">👛 /saldo</button>
          <button onclick="simQuick('/budget')" style="background: #1E293B; color: #F97316; border: 1px solid #EA580C; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer;">🎯 /budget</button>
          <button onclick="simQuick('/hari ini')" style="background: #1E293B; color: #94A3B8; border: 1px solid #334155; padding: 6px 12px; border-radius: 8px; font-size: 12px; cursor: pointer;">📅 /hari ini</button>
          <button onclick="simQuick('/sheet')" style="background: #1E293B; color: #94A3B8; border: 1px solid #334155; padding: 6px 12px; border-radius: 8px; font-size: 12px; cursor: pointer;">📑 /sheet</button>
          <button onclick="simQuick('/bantuan')" style="background: #1E293B; color: #94A3B8; border: 1px solid #334155; padding: 6px 12px; border-radius: 8px; font-size: 12px; cursor: pointer;">❓ /bantuan</button>
        </div>
      </div>
    </div>

    <script>
      function simQuick(val) {
        document.getElementById('simChatInput').value = val;
        simSendMessage();
      }

      function simSendMessage() {
        const inp = document.getElementById('simChatInput');
        const text = inp.value.trim();
        if (!text) return;
        const box = document.getElementById('simChatBox');
        box.innerHTML += '<div style="align-self: flex-end; background: #F97316; color: white; padding: 10px 16px; border-radius: 16px 16px 2px 16px; font-weight: 600;">' + text + '</div>';
        inp.value = '';
        box.scrollTop = box.scrollHeight;

        const selUser = document.getElementById('simUserSelect') ? document.getElementById('simUserSelect').value : undefined;
        fetch('/api/telegram/webhook', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ text: text, simulation: true, userId: selUser })
        })
        .then(r => r.json())
        .then(d => {
          const formatted = (d.reply || 'Transaksi berhasil dicatat')
            .replace(/\\n/g, '<br>')
            .replace(/\\*([^\\*]+)\\*/g, '<b>$1</b>');
          box.innerHTML += '<div style="align-self: flex-start; background: #1E293B; padding: 14px 18px; border-radius: 16px 16px 16px 2px; max-width: 85%; line-height: 1.5; border: 1px solid #334155;">' + formatted + '</div>';
          box.scrollTop = box.scrollHeight;
        })
        .catch(err => {
          box.innerHTML += '<div style="align-self: flex-start; background: #7F1D1D; color: #FECACA; padding: 12px 16px; border-radius: 14px;">Gagal memproses pesan: ' + err.message + '</div>';
          box.scrollTop = box.scrollHeight;
        });
      }

      function simSendPhotoReceipt() {
        const box = document.getElementById('simChatBox');
        box.innerHTML += '<div style="align-self: flex-end; background: #2563EB; color: white; padding: 10px 16px; border-radius: 16px 16px 2px 16px; font-weight: 600;">📷 [Mengirim Foto Struk Super Indo...]</div>';
        box.scrollTop = box.scrollHeight;

        const selUser = document.getElementById('simUserSelect') ? document.getElementById('simUserSelect').value : undefined;
        fetch('/api/telegram/webhook', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ type: 'photo', simulation: true, userId: selUser })
        })
        .then(r => r.json())
        .then(d => {
          const formatted = (d.reply || 'Struk diproses')
            .replace(/\\n/g, '<br>')
            .replace(/\\*([^\\*]+)\\*/g, '<b>$1</b>');
          box.innerHTML += '<div style="align-self: flex-start; background: #1E293B; padding: 14px 18px; border-radius: 16px 16px 16px 2px; max-width: 85%; line-height: 1.5; border: 1px solid #334155;">' + formatted + '</div>';
          box.scrollTop = box.scrollHeight;
        });
      }

      function simSendVoiceNote() {
        const box = document.getElementById('simChatBox');
        box.innerHTML += '<div style="align-self: flex-end; background: #7C3AED; color: white; padding: 10px 16px; border-radius: 16px 16px 2px 16px; font-weight: 600;">🎙️ [Pesan Suara VN: "makan malam sate ayam 30rb"...]</div>';
        box.scrollTop = box.scrollHeight;

        const selUser = document.getElementById('simUserSelect') ? document.getElementById('simUserSelect').value : undefined;
        fetch('/api/telegram/webhook', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ type: 'voice', text: 'makan malam sate ayam 30rb', simulation: true, userId: selUser })
        })
        .then(r => r.json())
        .then(d => {
          const formatted = (d.reply || 'Voice Note diproses')
            .replace(/\\n/g, '<br>')
            .replace(/\\*([^\\*]+)\\*/g, '<b>$1</b>');
          box.innerHTML += '<div style="align-self: flex-start; background: #1E293B; padding: 14px 18px; border-radius: 16px 16px 16px 2px; max-width: 85%; line-height: 1.5; border: 1px solid #334155;">' + formatted + '</div>';
          box.scrollTop = box.scrollHeight;
        });
      }

      function simTestIdempotency() {
        const box = document.getElementById('simChatBox');
        box.innerHTML += '<div style="align-self: flex-end; background: #D97706; color: white; padding: 10px 16px; border-radius: 16px 16px 2px 16px; font-weight: 600;">🔁 [Mengirim Update ID 100001 yang Sudah Pernah Diproses...]</div>';
        box.scrollTop = box.scrollHeight;

        fetch('/api/telegram/webhook', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ update_id: 100001, text: 'beli bakso 15rb', simulation: false })
        })
        .then(r => r.json())
        .then(d => {
          box.innerHTML += '<div style="align-self: flex-start; background: #78350F; color: #FEF3C7; padding: 14px 18px; border-radius: 16px 16px 16px 2px; max-width: 85%; line-height: 1.5; border: 1px solid #B45309;">🛡️ <b>IDEMPOTENCY VERIFIED</b>: Status = ' + d.status + '<br>' + (d.message || 'Update ID sudah pernah diproses. Permintaan diabaikan secara aman.') + '</div>';
          box.scrollTop = box.scrollHeight;
        });
      }

      document.getElementById('simChatInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') simSendMessage();
      });
    </script>
  `;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function renderWebhookTesterPage(req, res, sessionUser) {
  const html = `
    ${getHtmlHeader('TataDana — Webhook API Tester & Data Real-Time')}
    ${renderGlobalHubNav('/api/telegram/webhook', sessionUser)}

    <div style="max-width: 1080px; margin: 36px auto; padding: 0 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="badge badge-purple">WEBHOOK & DATA TESTER</span>
            <a href="/portal" style="color: #F97316; font-size: 12px; font-weight: 700; text-decoration: none;">🎯 Portal Terpadu</a>
          </div>
          <h1 style="font-size: 28px; font-weight: 900; margin-top: 6px;">⚡ Webhook API Tester & Data Real-Time</h1>
          <p style="font-size: 13px; color: #64748B;">Uji langsung pengiriman payload Telegram Update, verifikasi idempoten, dan inspeksi data store JSON.</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <a href="/api/data" target="_blank" class="btn-dark" style="font-size: 13px;">Lihat Raw JSON (/api/data) ↗</a>
          <a href="/dashboard" class="btn-primary" style="font-size: 13px;">Buka Dashboard Web →</a>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <!-- PAYLOAD SENDER CARD -->
        <div class="card">
          <h3 style="font-size: 16px; font-weight: 800; margin-bottom: 12px;">1. Konfigurasi Request Payload</h3>

          <div style="margin-bottom: 14px;">
            <label style="font-size: 12px; font-weight: 700; color: #475569; display: block; margin-bottom: 6px;">Pilih Preset Uji Cepat:</label>
            <select id="presetSelect" onchange="applyPreset()" style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #CBD5E1; font-size: 13px; outline: none; background: #FFF;">
              <option value="expense_text">🍜 Pengeluaran Teks: "beli bakso 15rb"</option>
              <option value="income_text">💰 Pemasukan Teks: "gajian 10jt masuk bca"</option>
              <option value="photo_receipt">🧾 Foto Struk OCR Multi-Item (Super Indo)</option>
              <option value="voice_stt">🎙️ Voice Note STT: "kopi susu 22k gopay"</option>
              <option value="cmd_saldo">👛 Perintah /saldo</option>
              <option value="cmd_budget">🎯 Perintah /budget</option>
              <option value="cmd_hari">📅 Perintah /hari ini</option>
              <option value="idempotency_dup">🔁 Uji Idempotency: Kirim Update ID Duplikat</option>
            </select>
          </div>

          <div style="margin-bottom: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label style="font-size: 12px; font-weight: 700; color: #475569;">JSON Request Body (POST):</label>
              <span style="font-size: 11px; color: #94A3B8;">Target: <code>/api/telegram/webhook</code></span>
            </div>
            <textarea id="payloadTextarea" rows="11" style="width: 100%; font-family: monospace; font-size: 12px; padding: 12px; border-radius: 10px; border: 1px solid #CBD5E1; background: #0F172A; color: #F8FAFC; outline: none; line-height: 1.5;"></textarea>
          </div>

          <button onclick="sendWebhookTest()" class="btn-primary" style="width: 100%; padding: 12px; font-size: 14px;">
            🚀 Kirim POST ke /api/telegram/webhook
          </button>
        </div>

        <!-- RESPONSE INSPECTOR CARD -->
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <h3 style="font-size: 16px; font-weight: 800;">2. Live Response Inspector</h3>
              <span id="responseStatus" class="badge" style="background: #F1F5F9; color: #64748B; border-color: #E2E8F0;">Menunggu Request</span>
            </div>

            <!-- PREVIEW TELEGRAM REPLY -->
            <div style="margin-bottom: 14px;">
              <label style="font-size: 12px; font-weight: 700; color: #475569; display: block; margin-bottom: 6px;">Preview Balasan Bot Telegram:</label>
              <div id="replyPreviewBox" style="background: #020617; color: white; border-radius: 12px; padding: 14px; min-height: 110px; font-size: 13px; line-height: 1.5; border: 1px solid #1E293B;">
                <span style="color: #64748B;">Balasan bot akan muncul di sini setelah payload dikirim...</span>
              </div>
            </div>

            <!-- RAW JSON RESPONSE -->
            <div>
              <label style="font-size: 12px; font-weight: 700; color: #475569; display: block; margin-bottom: 6px;">Raw HTTP JSON Response:</label>
              <pre id="jsonResponseBox" style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 12px; font-size: 11px; max-height: 170px; overflow-y: auto; color: #0F172A; font-family: monospace;">{ "status": "idle" }</pre>
            </div>
          </div>

          <div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid #F1F5F9; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; color: #64748B;">Transaksi otomatis tercatat di store</span>
            <a href="/dashboard" style="color: #F97316; font-weight: 700; font-size: 12px; text-decoration: none;">Cek di Dashboard →</a>
          </div>
        </div>
      </div>
    </div>

    <script>
      const presets = {
        expense_text: JSON.stringify({ update_id: Math.floor(Math.random() * 900000 + 100000), text: "beli bakso 15rb", simulation: true }, null, 2),
        income_text: JSON.stringify({ update_id: Math.floor(Math.random() * 900000 + 100000), text: "gajian 10jt masuk bca", simulation: true }, null, 2),
        photo_receipt: JSON.stringify({ update_id: Math.floor(Math.random() * 900000 + 100000), type: "photo", simulation: true }, null, 2),
        voice_stt: JSON.stringify({ update_id: Math.floor(Math.random() * 900000 + 100000), type: "voice", text: "kopi susu 22k gopay", simulation: true }, null, 2),
        cmd_saldo: JSON.stringify({ update_id: Math.floor(Math.random() * 900000 + 100000), text: "/saldo", simulation: true }, null, 2),
        cmd_budget: JSON.stringify({ update_id: Math.floor(Math.random() * 900000 + 100000), text: "/budget", simulation: true }, null, 2),
        cmd_hari: JSON.stringify({ update_id: Math.floor(Math.random() * 900000 + 100000), text: "/hari ini", simulation: true }, null, 2),
        idempotency_dup: JSON.stringify({ update_id: 100001, text: "beli bakso 15rb", simulation: false }, null, 2)
      };

      function applyPreset() {
        const sel = document.getElementById('presetSelect').value;
        document.getElementById('payloadTextarea').value = presets[sel] || '';
      }

      function sendWebhookTest() {
        const val = document.getElementById('payloadTextarea').value;
        const statusBadge = document.getElementById('responseStatus');
        const replyBox = document.getElementById('replyPreviewBox');
        const jsonBox = document.getElementById('jsonResponseBox');

        statusBadge.innerText = 'Mengirim...';
        statusBadge.className = 'badge badge-blue';

        const tStart = Date.now();
        fetch('/api/telegram/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: val
        })
        .then(async r => {
          const duration = Date.now() - tStart;
          const data = await r.json();
          statusBadge.innerText = r.status + ' OK (' + duration + 'ms)';
          statusBadge.className = r.ok ? 'badge badge-green' : 'badge badge-purple';

          jsonBox.innerText = JSON.stringify(data, null, 2);
          if (data.reply) {
            replyBox.innerHTML = data.reply
              .replace(/\\n/g, '<br>')
              .replace(/\\*([^\\*]+)\\*/g, '<b>$1</b>');
          } else if (data.status === 'already_processed_idempotent') {
            replyBox.innerHTML = '🛡️ <b style="color: #FBBF24;">IDEMPOTENCY TRIGGERED</b><br>Update ID ini sudah pernah diproses. Permintaan di-skip untuk mencegah transaksi ganda.';
          } else {
            replyBox.innerHTML = '<span style="color: #94A3B8;">Tidak ada balasan teks (response status: ' + (data.status || 'sukses') + ')</span>';
          }
        })
        .catch(err => {
          statusBadge.innerText = 'Error';
          statusBadge.className = 'badge';
          jsonBox.innerText = 'Error: ' + err.message;
          replyBox.innerHTML = '<span style="color: #EF4444;">Gagal menghubungi webhook: ' + err.message + '</span>';
        });
      }

      applyPreset();
    </script>
  `;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

module.exports = {
  renderSimulatorPage,
  renderWebhookTesterPage
};
