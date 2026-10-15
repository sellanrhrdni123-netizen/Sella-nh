/**
 * Premium 15-Section Fintech Landing Page for TataDana
 * Modern Orange-White Theme (#F97316), Responsive 375px/1280px, Indonesian 100%.
 */

const {
  getHtmlHeader,
  renderGlobalHubNav
} = require('./components');

function renderLandingPage(req, res, sessionUser, query = {}) {
  const html = `
    ${getHtmlHeader('TataDana — Catat Keuangan Semudah Chat Langsung dari Telegram')}
    ${renderGlobalHubNav('/', sessionUser)}

    <div>

    <!-- 2. HERO SECTION -->
    <section style="max-width: 1000px; margin: 0 auto; padding: 50px 20px 40px; text-align: center;">
      <!-- Pre-headline badge -->
      <div class="badge" style="margin-bottom: 24px; padding: 6px 16px; font-size: 13px;">
        ✨ Catat keuangan langsung dari Telegram
      </div>

      <!-- Headline H1 -->
      <h1 style="font-size: 48px; font-weight: 900; line-height: 1.15; letter-spacing: -1.5px; margin-bottom: 20px; color: #0F172A;">
        Gaji habis sebelum akhir bulan?<br>
        <span class="orange-text">Sudah saatnya kamu tahu ke mana uangmu pergi.</span>
      </h1>

      <!-- Sub-headline -->
      <p style="font-size: 18px; color: #475569; max-width: 740px; margin: 0 auto 36px; line-height: 1.6;">
        TataDana mencatat setiap pengeluaranmu langsung dari chat Telegram atau foto struk — sisanya kami yang urus. 100% otomatis, aman, dan tanpa instal aplikasi berat.
      </p>

      <!-- CTA Buttons -->
      <div style="display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-bottom: 30px;">
        <a href="/register" class="btn-primary" style="font-size: 16px; padding: 14px 32px;">
          Mulai Gratis Sekarang 🚀
        </a>
        <a href="#demo" class="btn-outline" style="font-size: 16px; padding: 14px 28px; background: white;">
          Lihat cara kerjanya &rarr;
        </a>
      </div>

      <!-- 1-Click Feature Matrix Grid -->
      <div style="background: white; border: 2px solid #FED7AA; border-radius: 20px; padding: 22px; margin: 28px auto 36px; max-width: 960px; box-shadow: 0 10px 25px rgba(249,115,22,0.08); text-align: left;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 22px;">⚡</span>
            <div>
              <h3 style="font-size: 16px; font-weight: 900; color: #0F172A;">Pusat Akses Fitur TataDana</h3>
              <p style="font-size: 12px; color: #64748B;">Akses langsung fitur keuangan personal dan simulasi bot:</p>
            </div>
          </div>
          <span class="badge badge-green" style="font-size: 11px;">Fitur Terpadu</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(175px, 1fr)); gap: 10px;">
          <a href="/portal" class="btn-outline" style="justify-content: flex-start; padding: 10px 14px; text-align: left; background: #FFF7ED; border-color: #FDBA74; color: #C2410C; text-decoration: none;">
            <span>🎯 <b>Portal Hub</b></span>
          </a>
          <a href="/dashboard" class="btn-outline" style="justify-content: flex-start; padding: 10px 14px; text-align: left; background: #F8FAFC; border-color: #CBD5E1; text-decoration: none;">
            <span>📊 <b>Dashboard</b></span>
          </a>
          <a href="/dashboard/transactions" class="btn-outline" style="justify-content: flex-start; padding: 10px 14px; text-align: left; background: #F8FAFC; border-color: #CBD5E1; text-decoration: none;">
            <span>💳 <b>Transaksi</b></span>
          </a>
          <a href="/dashboard/reports" class="btn-outline" style="justify-content: flex-start; padding: 10px 14px; text-align: left; background: #F8FAFC; border-color: #CBD5E1; text-decoration: none;">
            <span>📑 <b>Laporan</b></span>
          </a>
          <a href="/dashboard/budget" class="btn-outline" style="justify-content: flex-start; padding: 10px 14px; text-align: left; background: #F8FAFC; border-color: #CBD5E1; text-decoration: none;">
            <span>🎯 <b>Budget</b></span>
          </a>
          <a href="/dashboard/wallet" class="btn-outline" style="justify-content: flex-start; padding: 10px 14px; text-align: left; background: #F8FAFC; border-color: #CBD5E1; text-decoration: none;">
            <span>👛 <b>Dompet</b></span>
          </a>
          <a href="/dashboard/ai-chat" class="btn-outline" style="justify-content: flex-start; padding: 10px 14px; text-align: left; background: #F8FAFC; border-color: #CBD5E1; text-decoration: none;">
            <span>🤖 <b>Tanya AI</b></span>
          </a>
          <a href="/dashboard/settings" class="btn-outline" style="justify-content: flex-start; padding: 10px 14px; text-align: left; background: #F8FAFC; border-color: #CBD5E1; text-decoration: none;">
            <span>⚙️ <b>Pengaturan</b></span>
          </a>
          <a href="/dev/telegram-simulator" class="btn-outline" style="justify-content: flex-start; padding: 10px 14px; text-align: left; background: #EFF6FF; border-color: #93C5FD; color: #1D4ED8; text-decoration: none;">
            <span>💬 <b>Bot Simulator</b></span>
          </a>
          ${sessionUser && sessionUser.role === 'admin' ? `
          <a href="/admin" class="btn-outline" style="justify-content: flex-start; padding: 10px 14px; text-align: left; background: #FEF2F2; border-color: #FCA5A5; color: #991B1B; text-decoration: none;">
            <span>👑 <b>Admin Console</b></span>
          </a>
          ` : ''}
        </div>
      </div>

      <!-- Hero Video Mockup Placeholder -->
      <!-- TODO: ganti dengan video asli presentasi produk TataDana -->
      <div style="background: linear-gradient(135deg, #1E293B, #0F172A); border: 2px solid #334155; border-radius: 24px; padding: 40px 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.15); max-width: 820px; margin: 0 auto; position: relative; overflow: hidden;">
        <div style="width: 72px; height: 72px; border-radius: 50%; background: #F97316; color: white; display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 16px; box-shadow: 0 0 30px rgba(249,115,22,0.6); cursor: pointer;" onclick="document.getElementById('demo').scrollIntoView({behavior: 'smooth'})">
          ▶
        </div>
        <div style="color: white; font-weight: 800; font-size: 18px; margin-bottom: 6px;">
          Video Preview TataDana (2 Menit)
        </div>
        <p style="color: #94A3B8; font-size: 13px; max-width: 500px; margin: 0 auto;">
          Lihat bagaimana mencatat pengeluaran di Telegram otomatis menyinkronkan saldo, budget, dan laporan web tanpa ribet.
        </p>
        <div style="position: absolute; bottom: 12px; right: 16px; font-size: 11px; color: #64748B;">
          // TODO: Ganti video placeholder dengan player MP4/YouTube asli
        </div>
      </div>
    </section>

    <!-- 3. PROBLEM AWARE BULLET POINTS -->
    <section style="background: #FFF7ED; border-top: 1px solid #FFEDD5; border-bottom: 1px solid #FFEDD5; padding: 60px 20px;">
      <div style="max-width: 1100px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h2 style="font-size: 28px; font-weight: 900; color: #9A3412;">Pernahkah Kamu Mengalami Ini?</h2>
          <p style="font-size: 15px; color: #C2410C;">Masalah klasik yang bikin saldo tabungan tak pernah bertambah.</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
          <div class="card" style="border-left: 4px solid #EF4444;">
            <div style="font-size: 32px; margin-bottom: 12px;">😫</div>
            <h3 style="font-size: 17px; font-weight: 900; margin-bottom: 8px; color: #0F172A;">"Buka aplikasi keuangan? Nanti dulu deh..."</h3>
            <p style="font-size: 14px; color: #64748B; line-height: 1.6;">
              Aplikasi keuangan biasa terlalu ribet: harus login, pilih kategori bertingkat, dan isi form panjang. Akhirnya malas dan tak pernah dicatat.
            </p>
          </div>

          <div class="card" style="border-left: 4px solid #F59E0B;">
            <div style="font-size: 32px; margin-bottom: 12px;">💸</div>
            <h3 style="font-size: 17px; font-weight: 900; margin-bottom: 8px; color: #0F172A;">"Kok uangnya habis ya? Padahal kayak tidak beli apa-apa"</h3>
            <p style="font-size: 14px; color: #64748B; line-height: 1.6;">
              Pengeluaran kecil seperti kopi, parkir, dan jajan online sering terlewat. Di akhir bulan, uang jutaan rupiah lenyap tanpa jejak.
            </p>
          </div>

          <div class="card" style="border-left: 4px solid #F97316;">
            <div style="font-size: 32px; margin-bottom: 12px;">📅</div>
            <h3 style="font-size: 17px; font-weight: 900; margin-bottom: 8px; color: #0F172A;">"Udah niat bikin budget, tapi seminggu lupa"</h3>
            <p style="font-size: 14px; color: #64748B; line-height: 1.6;">
              Tanpa pengingat otomatis dan visualisasi sisa saldo yang proaktif, budget bulanan hanya jadi coretan di buku tanpa pengaruh nyata.
            </p>
          </div>
        </div>

        <!-- Transisi ke Solusi -->
        <div style="text-align: center; margin-top: 50px;">
          <h3 style="font-size: 24px; font-weight: 900; color: #0F172A; margin-bottom: 10px;">
            Bagaimana kalau mencatat keuangan semudah kirim pesan ke teman?
          </h3>
          <p style="font-size: 16px; color: #F97316; font-weight: 800;">
            👉 Memperkenalkan TataDana
          </p>
        </div>
      </div>
    </section>

    <!-- 4. LIVE INTERACTIVE TELEGRAM BOT CHAT PREVIEW -->
    <section style="max-width: 960px; margin: 60px auto; padding: 0 20px;" id="demo">
      <div style="text-align: center; margin-bottom: 30px;">
        <span class="badge" style="margin-bottom: 10px;">LIVE INTERACTIVE DEMO</span>
        <h2 style="font-size: 32px; font-weight: 900; color: #0F172A;">Coba Langsung Bot TataDana</h2>
        <p style="font-size: 15px; color: #64748B;">Ketik transaksi santai seperti di chat asli Telegram atau klik tombol pintas di bawah:</p>
      </div>

      <div class="card" style="background: #0F172A; color: white; border: 1px solid #1E293B; box-shadow: 0 20px 40px rgba(0,0,0,0.25);">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1E293B; padding-bottom: 14px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background: #22C55E;"></div>
            <span style="font-weight: 800; font-size: 15px;">TataDana Official Bot (@tatadanabot)</span>
          </div>
          <span style="font-size: 11px; color: #94A3B8;">Webhook Idempoten • Waktu Indonesia Barat (WIB)</span>
        </div>

        <div id="liveChatBox" style="background: #020617; border-radius: 14px; padding: 20px; min-height: 260px; max-height: 380px; overflow-y: auto; font-size: 14px; display: flex; flex-direction: column; gap: 12px;">
          <div style="align-self: flex-start; background: #1E293B; padding: 12px 18px; border-radius: 14px 14px 14px 2px; max-width: 80%;">
            👋 Halo! Ketik transaksimu santai di sini (contoh: <b>beli bakso 15rb</b> atau <b>gajian 10jt</b>), AI kami otomatis memparsing nominal dan memperbarui saldo!
          </div>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 18px;">
          <input type="text" id="liveChatInput" placeholder="Ketik misalnya: beli nasi padang 25rb atau gajian 5jt..." style="flex: 1; padding: 14px 18px; border-radius: 12px; border: 1px solid #334155; background: #020617; color: white; font-size: 14px; outline: none;">
          <button onclick="sendLiveChat()" class="btn-primary" style="padding: 14px 24px;">Kirim 🚀</button>
        </div>

        <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
          <button onclick="quickDemo('beli bakso 15rb')" style="background: #1E293B; color: #94A3B8; border: none; padding: 6px 12px; border-radius: 8px; font-size: 12px; cursor: pointer;">🍜 beli bakso 15rb</button>
          <button onclick="quickDemo('kopi susu 22k gopay')" style="background: #1E293B; color: #94A3B8; border: none; padding: 6px 12px; border-radius: 8px; font-size: 12px; cursor: pointer;">☕ kopi susu 22k gopay</button>
          <button onclick="quickDemo('isi bensin 50rb')" style="background: #1E293B; color: #94A3B8; border: none; padding: 6px 12px; border-radius: 8px; font-size: 12px; cursor: pointer;">⛽ isi bensin 50rb</button>
          <button onclick="quickDemo('/saldo')" style="background: #1E293B; color: #94A3B8; border: none; padding: 6px 12px; border-radius: 8px; font-size: 12px; cursor: pointer;">👛 /saldo</button>
          <button onclick="quickDemo('/budget')" style="background: #1E293B; color: #94A3B8; border: none; padding: 6px 12px; border-radius: 8px; font-size: 12px; cursor: pointer;">🎯 /budget</button>
          <button onclick="quickDemo('/hari ini')" style="background: #1E293B; color: #94A3B8; border: none; padding: 6px 12px; border-radius: 8px; font-size: 12px; cursor: pointer;">📅 /hari ini</button>
        </div>
      </div>
    </section>

    <!-- 5. THREE ALTERNATING FEATURE SECTIONS -->
    <section style="max-width: 1100px; margin: 80px auto; padding: 0 20px;" id="fitur">
      <div style="text-align: center; margin-bottom: 60px;">
        <span class="badge" style="margin-bottom: 10px;">FITUR UNGGULAN</span>
        <h2 style="font-size: 34px; font-weight: 900; color: #0F172A;">Semua yang Kamu Butuhkan untuk Finansial Sehat</h2>
      </div>

      <!-- Fitur 1: Catat via Telegram -->
      <div style="display: flex; align-items: center; gap: 40px; margin-bottom: 70px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 300px;">
          <div class="badge badge-blue" style="margin-bottom: 12px;">FITUR 01 • INPUT MULTI-MODAL</div>
          <h3 style="font-size: 26px; font-weight: 900; color: #0F172A; margin-bottom: 14px;">
            Catat Lewat Teks, Foto Struk, atau Pesan Suara (VN)
          </h3>
          <p style="font-size: 15px; color: #64748B; line-height: 1.7; margin-bottom: 18px;">
            Ketik sesukamu: "makan siang 35rb", "pertamax 50rb gopay", atau foto struk belanja supermarket. AI TataDana mengenali format nominal Indonesia (rb, jt, k) dan otomatis mencatat item per item dengan rapi.
          </p>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 8px; font-size: 14px; color: #334155; font-weight: 700;">
            <li>✓ Parsing AI dengan structured JSON output (bukan regex semata)</li>
            <li>✓ AI Vision OCR untuk struk belanja multi-item (Pro)</li>
            <li>✓ Voice Note transcription dengan feedback teks otomatis</li>
          </ul>
        </div>
        <div style="flex: 1; min-width: 300px;">
          <div class="card" style="background: #F8FAFC; border: 2px solid #E2E8F0; text-align: center; padding: 30px;">
            <div style="font-size: 54px; margin-bottom: 12px;">📱📸🎙️</div>
            <div style="font-weight: 900; font-size: 18px; color: #0F172A; margin-bottom: 6px;">3 Cara Input Cepat Telegram</div>
            <p style="font-size: 13px; color: #64748B;">Langsung dari keyboard atau mic chat Telegram harianmu.</p>
          </div>
        </div>
      </div>

      <!-- Fitur 2: Laporan & Export Otomatis -->
      <div style="display: flex; align-items: center; gap: 40px; margin-bottom: 70px; flex-wrap: wrap-reverse;">
        <div style="flex: 1; min-width: 300px;">
          <div class="card" style="background: #F8FAFC; border: 2px solid #E2E8F0; text-align: center; padding: 30px;">
            <div style="font-size: 54px; margin-bottom: 12px;">📑📊💾</div>
            <div style="font-weight: 900; font-size: 18px; color: #0F172A; margin-bottom: 6px;">Dashboard & Export On-Demand</div>
            <p style="font-size: 13px; color: #64748B;">Laporan native, filter multi-dimensi, dan ekspor instan.</p>
          </div>
        </div>
        <div style="flex: 1; min-width: 300px;">
          <div class="badge badge-green" style="margin-bottom: 12px;">FITUR 02 • LAPORAN & EKSPOR</div>
          <h3 style="font-size: 26px; font-weight: 900; color: #0F172A; margin-bottom: 14px;">
            Laporan Real-Time & Ekspor PDF / Excel Instan
          </h3>
          <p style="font-size: 15px; color: #64748B; line-height: 1.7; margin-bottom: 18px;">
            Semua data tersimpan aman di database Supabase Postgres milik Anda. Pantau net cashflow, grafik perbandingan 6 bulan, dan unduh laporan ke format PDF rapi serta spreadsheet Excel (.xlsx) kapan pun dibutuhkan.
          </p>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 8px; font-size: 14px; color: #334155; font-weight: 700;">
            <li>✓ Filter transaksi harian, mingguan, bulanan, dan custom range</li>
            <li>✓ Riwayat ekspor tersimpan dan dapat diunduh ulang</li>
            <li>✓ Rincian item struk belanja yang bisa di-expand (Accordion)</li>
          </ul>
        </div>
      </div>

      <!-- Fitur 3: AI Financial Advisor -->
      <div style="display: flex; align-items: center; gap: 40px; margin-bottom: 30px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 300px;">
          <div class="badge badge-purple" style="margin-bottom: 12px;">FITUR 03 • AI ADVISOR</div>
          <h3 style="font-size: 26px; font-weight: 900; color: #0F172A; margin-bottom: 14px;">
            AI Financial Advisor yang Menjagamu Tetap Berhemat
          </h3>
          <p style="font-size: 15px; color: #64748B; line-height: 1.7; margin-bottom: 18px;">
            Bukan sekadar mencatat angka. AI TataDana menganalisis kebiasaan belanjamu dan memberi peringatan otomatis jika pengeluaran melonjak >50% atau mendekati batas budget bulanan.
          </p>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 8px; font-size: 14px; color: #334155; font-weight: 700;">
            <li>✓ Alert proaktif via Telegram saat budget mencapai 80% dan 100%</li>
            <li>✓ Chat tanya-jawab kondisi keuangan interaktif di dashboard web</li>
            <li>✓ Rekomendasi konkret pengalihan pos belanja yang boros</li>
          </ul>
        </div>
        <div style="flex: 1; min-width: 300px;">
          <div class="card" style="background: #F8FAFC; border: 2px solid #E2E8F0; text-align: center; padding: 30px;">
            <div style="font-size: 54px; margin-bottom: 12px;">🤖💡🎯</div>
            <div style="font-weight: 900; font-size: 18px; color: #0F172A; margin-bottom: 6px;">Asisten Finansial 24/7</div>
            <p style="font-size: 13px; color: #64748B;">Didukung model AI cerdas (Google Gemini & DeepSeek).</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 6. TESTIMONIALS (MASONRY GRID) -->
    <!-- TODO: ganti dengan testimoni asli dari beta user setelah peluncuran publik -->
    <section style="background: #F8FAFC; border-top: 1px solid #E2E8F0; border-bottom: 1px solid #E2E8F0; padding: 70px 20px;">
      <div style="max-width: 1100px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 40px;">
          <span class="badge" style="margin-bottom: 10px;">TESTIMONI PENGGUNA</span>
          <h2 style="font-size: 30px; font-weight: 900; color: #0F172A;">Kata Mereka yang Sudah Memakai TataDana</h2>
          <p style="font-size: 14px; color: #64748B;">// TODO: Placeholder testimoni persona Indonesia (siap diganti feedback live user)</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
          <div class="card">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;">
              <div>
                <div style="font-weight: 800; font-size: 14px;">Reza Pratama</div>
                <div style="font-size: 11px; color: #64748B;">Software Engineer, Jakarta</div>
              </div>
            </div>
            <p style="font-size: 13px; color: #475569; line-height: 1.6;">
              "Dulu selalu malas pakai aplikasi keuangan karena harus klik berkali-kali. Dengan TataDana, selesai makan siang tinggal ketik 'nasi padang 25rb' di Telegram. Akhir bulan kaget ternyata bisa nabung 30% dari gaji!"
            </p>
          </div>

          <div class="card">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&q=80" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;">
              <div>
                <div style="font-weight: 800; font-size: 14px;">Annisa Larasati</div>
                <div style="font-size: 11px; color: #64748B;">Freelance Graphic Designer</div>
              </div>
            </div>
            <p style="font-size: 13px; color: #475569; line-height: 1.6;">
              "Penghasilan freelancer tidak menentu, jadi harus pintar jaga cashflow. Fitur multi-wallet TataDana bikin saldo BCA dan e-wallet GoPay/OVO terpantau jelas sekali. Fitur foto struknya juga juara!"
            </p>
          </div>

          <div class="card">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;">
              <div>
                <div style="font-weight: 800; font-size: 14px;">Dimas Anggoro</div>
                <div style="font-size: 11px; color: #64748B;">Mahasiswa Tingkat Akhir, Bandung</div>
              </div>
            </div>
            <p style="font-size: 13px; color: #475569; line-height: 1.6;">
              "Uang bulanan kiriman orang tua sering habis sebelum minggu ketiga. Sejak pasang reminder TataDana dan lihat visual progress bar budget tiap hari, pengeluaran nongkrong jadi jauh lebih terkontrol."
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 7. PRICING SECTION -->
    <section style="max-width: 900px; margin: 80px auto; padding: 0 20px;" id="harga">
      <div style="text-align: center; margin-bottom: 40px;">
        <span class="badge" style="margin-bottom: 10px;">HARGA TRANSPARAN</span>
        <h2 style="font-size: 34px; font-weight: 900; color: #0F172A;">Pilih Paket yang Pas untuk Kebutuhanmu</h2>
        <p style="font-size: 15px; color: #64748B;">Tanpa biaya tersembunyi. Investasi terbaik untuk masa depan finansialmu.</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; align-items: stretch;">
        <!-- Starter Plan -->
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="badge badge-amber" style="margin-bottom: 14px;">STARTER</div>
            <h3 style="font-size: 22px; font-weight: 900; margin-bottom: 6px;">Paket Pemula</h3>
            <div style="display: flex; align-items: baseline; gap: 6px; margin-bottom: 16px;">
              <span style="font-size: 36px; font-weight: 900; color: #0F172A;">Rp49.000</span>
              <span style="font-size: 14px; color: #64748B;">/ bulan</span>
            </div>
            <p style="font-size: 13px; color: #64748B; margin-bottom: 24px;">Cocok untuk yang baru mulai membiasakan diri mencatat keuangan harian.</p>

            <ul style="list-style: none; display: flex; flex-direction: column; gap: 12px; font-size: 13px; color: #334155;">
              <li>✓ Catat transaksi via teks Telegram</li>
              <li>✓ Catat via Voice Note (STT otomatis)</li>
              <li>✓ Maksimal 50 transaksi / bulan</li>
              <li>✓ Maksimal 3 wallet & 5 kategori budget</li>
              <li>✓ Dashboard overview keuangan</li>
              <li style="color: #94A3B8;">✗ Input via foto struk (OCR)</li>
              <li style="color: #94A3B8;">✗ AI Financial Advisor</li>
              <li style="color: #94A3B8;">✗ Ekspor PDF & Excel lengkap</li>
            </ul>
          </div>

          <a href="/register?plan=starter" class="btn-outline" style="width: 100%; margin-top: 30px; padding: 12px; text-decoration: none; text-align: center;">
            Pilih Paket Starter
          </a>
        </div>

        <!-- Pro Plan (Highlighted) -->
        <div class="card" style="border: 2px solid #F97316; box-shadow: 0 10px 30px rgba(249,115,22,0.15); display: flex; flex-direction: column; justify-content: space-between; position: relative;">
          <div style="position: absolute; top: -12px; right: 24px; background: #F97316; color: white; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 999px;">
            PALING POPULER ⭐
          </div>

          <div>
            <div class="badge badge-green" style="margin-bottom: 14px;">PRO LIFETIME</div>
            <h3 style="font-size: 22px; font-weight: 900; margin-bottom: 6px;">Paket Pro Unggulan</h3>
            <div style="display: flex; align-items: baseline; gap: 6px; margin-bottom: 16px;">
              <span style="font-size: 36px; font-weight: 900; color: #F97316;">Rp99.000</span>
              <span style="font-size: 14px; color: #64748B;">Sekali Bayar (Seumur Hidup)</span>
            </div>
            <p style="font-size: 13px; color: #64748B; margin-bottom: 24px;">Akses tanpa batas ke seluruh teknologi cerdas TataDana selamanya.</p>

            <ul style="list-style: none; display: flex; flex-direction: column; gap: 12px; font-size: 13px; color: #334155; font-weight: 600;">
              <li>✓ <b>Unlimited</b> transaksi per bulan</li>
              <li>✓ <b>Unlimited</b> multi-wallet & kategori budget</li>
              <li>✓ <b>Input via foto struk belanja (AI OCR)</b></li>
              <li>✓ <b>AI Financial Advisor proaktif</b></li>
              <li>✓ <b>Ekspor PDF & Excel (.xlsx) tanpa batas</b></li>
              <li>✓ Pengingat harian (Reminder) custom</li>
              <li>✓ Prioritas dukungan customer support</li>
            </ul>
          </div>

          <a href="/register?plan=pro" class="btn-primary" style="width: 100%; margin-top: 30px; padding: 12px; text-decoration: none; text-align: center;">
            Dapatkan Akses Pro Sekarang 🔥
          </a>
        </div>
      </div>
    </section>

    <!-- 8. FAQ SECTION (MINIMAL 7 PERTANYAAN RELEVAN) -->
    <section style="max-width: 840px; margin: 80px auto; padding: 0 20px;" id="faq">
      <div style="text-align: center; margin-bottom: 40px;">
        <span class="badge" style="margin-bottom: 10px;">TANYA JAWAB</span>
        <h2 style="font-size: 30px; font-weight: 900; color: #0F172A;">Pertanyaan yang Sering Diajukan</h2>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        <details class="card" style="padding: 18px 24px; cursor: pointer;">
          <summary style="font-weight: 800; font-size: 15px; color: #0F172A;">1. Apakah saya bisa menggunakan input foto struk di paket Starter?</summary>
          <p style="margin-top: 12px; font-size: 14px; color: #64748B; line-height: 1.6;">
            Tidak. Fitur foto struk dengan AI Vision OCR adalah fitur eksklusif untuk paket Pro karena membutuhkan komputasi model AI vision. Namun pengguna Starter tetap bisa mencatat sepuasnya via teks dan voice note hingga 50 transaksi per bulan.
          </p>
        </details>

        <details class="card" style="padding: 18px 24px; cursor: pointer;">
          <summary style="font-weight: 800; font-size: 15px; color: #0F172A;">2. Bagaimana keamanan dan privasi data transaksi saya di TataDana?</summary>
          <p style="margin-top: 12px; font-size: 14px; color: #64748B; line-height: 1.6;">
            Data Anda 100% tersimpan aman di database Supabase Postgres terenkripsi dengan Row Level Security (RLS). Hanya akun Anda yang memiliki akses ke transaksi pribadi. Setiap akses oleh administrator untuk bantuan teknis diwajibkan menyertakan alasan resmi yang dicatat dalam Audit Log yang tidak bisa dihapus.
          </p>
        </details>

        <details class="card" style="padding: 18px 24px; cursor: pointer;">
          <summary style="font-weight: 800; font-size: 15px; color: #0F172A;">3. Bagaimana cara menghubungkan Telegram ke akun TataDana?</summary>
          <p style="margin-top: 12px; font-size: 14px; color: #64748B; line-height: 1.6;">
            Sangat mudah! Buka menu Settings di dashboard web, pilih tab Telegram Bot, lalu masukkan token bot dari @BotFather. Klik tombol "Test Koneksi" dan webhook akan otomatis terhubung ke sistem TataDana dalam hitungan detik.
          </p>
        </details>

        <details class="card" style="padding: 18px 24px; cursor: pointer;">
          <summary style="font-weight: 800; font-size: 15px; color: #0F172A;">4. Apakah TataDana mendukung banyak rekening bank dan e-wallet (Multi-Wallet)?</summary>
          <p style="margin-top: 12px; font-size: 14px; color: #64748B; line-height: 1.6;">
            Ya! Anda bisa menambahkan rekening BCA, Mandiri, BNI, BRI, GoPay, OVO, DANA, hingga uang tunai fisik. Anda juga bisa mengatur satu dompet sebagai default untuk transaksi cepat dari Telegram.
          </p>
        </details>

        <details class="card" style="padding: 18px 24px; cursor: pointer;">
          <summary style="font-weight: 800; font-size: 15px; color: #0F172A;">5. Apakah bot Telegram TataDana bisa memahami format nominal bahasa Indonesia?</summary>
          <p style="margin-top: 12px; font-size: 14px; color: #64748B; line-height: 1.6;">
            100% Ya! AI TataDana secara spesifik dilatih mengenali format Indonesia seperti "15rb", "15ribu", "1.5jt", "500k", dan variasi nominal umum lainnya secara akurat.
          </p>
        </details>

        <details class="card" style="padding: 18px 24px; cursor: pointer;">
          <summary style="font-weight: 800; font-size: 15px; color: #0F172A;">6. Bagaimana cara kerja AI Financial Advisor di paket Pro?</summary>
          <p style="margin-top: 12px; font-size: 14px; color: #64748B; line-height: 1.6;">
            AI Advisor aktif secara otomatis tanpa perlu perintah khusus. Ketika sistem mendeteksi lonjakan pengeluaran kategori >50% dari minggu lalu, atau ada transaksi tunggal yang memakan >20% budget, bot akan memberikan analisis personal dan saran penghematan yang bisa langsung Anda terapkan.
          </p>
        </details>

        <details class="card" style="padding: 18px 24px; cursor: pointer;">
          <summary style="font-weight: 800; font-size: 15px; color: #0F172A;">7. Apakah saya bisa mengekspor laporan transaksi ke PDF atau Excel?</summary>
          <p style="margin-top: 12px; font-size: 14px; color: #64748B; line-height: 1.6;">
            Ya! Di halaman Laporan dashboard TataDana, Anda dapat mengekspor ringkasan cashflow dan rincian transaksi lengkap ke file PDF dan Excel (.xlsx) on-demand kapan saja.
          </p>
        </details>
      </div>
    </section>

    <!-- 9. FINAL CTA SECTION (ORANGE GRADIENT) -->
    <section style="background: linear-gradient(135deg, #F97316 0%, #EA580C 100%); color: white; padding: 70px 20px; text-align: center;">
      <div style="max-width: 800px; margin: 0 auto;">
        <h2 style="font-size: 38px; font-weight: 900; margin-bottom: 16px; line-height: 1.2;">
          Mulai Kendalikan Keuanganmu Hari Ini
        </h2>
        <p style="font-size: 17px; opacity: 0.95; margin-bottom: 32px; line-height: 1.6;">
          Daftar sekarang dalam 30 detik. Rasakan kemudahan mencatat keuangan langsung dari chat Telegram tanpa instal aplikasi berat.
        </p>
        <div style="display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;">
          <a href="/register" class="btn-dark" style="font-size: 16px; padding: 14px 32px; background: #0F172A;">
            Coba Gratis Sekarang 🚀
          </a>
          <a href="/login" class="btn-outline" style="font-size: 16px; padding: 14px 28px; color: white; border-color: rgba(255,255,255,0.4);">
            Masuk ke Akun
          </a>
        </div>
      </div>
    </section>

    <!-- 10. FOOTER (4 COLUMNS) -->
    <footer style="background: #0F172A; color: white; padding: 60px 20px 30px; border-top: 1px solid #1E293B;">
      <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 40px; margin-bottom: 40px;">
        <!-- Kolom 1: Logo & Tagline -->
        <div>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #F97316, #EA580C); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 18px;">T</div>
            <span style="font-weight: 900; font-size: 20px;">Tata<span style="color: #F97316;">Dana</span></span>
          </div>
          <p style="font-size: 13px; color: #94A3B8; line-height: 1.6; margin-bottom: 16px;">
            Catat keuangan semudah chat — langsung dari Telegram kamu. Terintegrasi Supabase Postgres & Multi-Provider AI.
          </p>
          <div style="font-size: 12px; color: #64748B;">
            Jakarta, Indonesia • WIB (Asia/Jakarta)
          </div>
        </div>

        <!-- Kolom 2: Produk -->
        <div>
          <div style="font-weight: 800; font-size: 14px; margin-bottom: 16px; color: white;">PRODUK</div>
          <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px; color: #94A3B8;">
            <a href="/dev/telegram-simulator" style="color: #94A3B8; text-decoration: none;">Bot Telegram Simulator</a>
            <a href="/dashboard" style="color: #94A3B8; text-decoration: none;">Dashboard Keuangan</a>
            <a href="/dashboard/reports" style="color: #94A3B8; text-decoration: none;">Laporan & Ekspor</a>
            <a href="/dashboard/ai-chat" style="color: #94A3B8; text-decoration: none;">AI Financial Chat</a>
            <a href="#harga" style="color: #94A3B8; text-decoration: none;">Paket Langganan</a>
          </div>
        </div>

        <!-- Kolom 3: Perusahaan -->
        <div>
          <div style="font-weight: 800; font-size: 14px; margin-bottom: 16px; color: white;">PERUSAHAAN</div>
          <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px; color: #94A3B8;">
            <a href="/" style="color: #94A3B8; text-decoration: none;">Tentang TataDana</a>
            <a href="/portal" style="color: #94A3B8; text-decoration: none;">Portal Terpadu Semua Fitur</a>
            <a href="/admin" style="color: #94A3B8; text-decoration: none;">Admin Executive Console</a>
            <a href="javascript:alert('Kontak: support@tatadana.id | WhatsApp: +62 812-3456-7890')" style="color: #94A3B8; text-decoration: none;">Hubungi Kami</a>
          </div>
        </div>

        <!-- Kolom 4: Legal & Kontak -->
        <div>
          <div style="font-weight: 800; font-size: 14px; margin-bottom: 16px; color: white;">LEGAL & PRIVASI</div>
          <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px; color: #94A3B8;">
            <a href="javascript:alert('Kebijakan Privasi: Data keuangan pengguna dienkripsi dan tidak diperjualbelikan.')" style="color: #94A3B8; text-decoration: none;">Kebijakan Privasi</a>
            <a href="javascript:alert('Ketentuan Layanan: Layanan manajemen keuangan pribadi berbasis SaaS.')" style="color: #94A3B8; text-decoration: none;">Syarat & Ketentuan</a>
            <a href="javascript:alert('Keamanan: Standar enkripsi Supabase RLS & Idempotent Webhook.')" style="color: #94A3B8; text-decoration: none;">Standar Keamanan</a>
          </div>
        </div>
      </div>

      <div style="max-width: 1200px; margin: 0 auto; border-top: 1px solid #1E293B; padding-top: 20px; text-align: center; font-size: 12px; color: #64748B;">
        &copy; 2026 PT TataDana Nusantara. Hak cipta dilindungi undang-undang.
      </div>
    </footer>
    </div>

    <script>
      function quickDemo(val) {
        document.getElementById('liveChatInput').value = val;
        sendLiveChat();
      }

      function sendLiveChat() {
        const inp = document.getElementById('liveChatInput');
        const text = inp.value.trim();
        if(!text) return;
        const box = document.getElementById('liveChatBox');
        box.innerHTML += '<div style="align-self: flex-end; background: #F97316; color: white; padding: 10px 16px; border-radius: 14px 14px 2px 14px; font-weight: 600;">' + text + '</div>';
        inp.value = '';
        box.scrollTop = box.scrollHeight;

        fetch('/api/telegram/webhook', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ text: text, simulation: true })
        })
        .then(r => r.json())
        .then(d => {
          const formatted = (d.reply || 'Transaksi diproses')
            .replace(/\\n/g, '<br>')
            .replace(/\\*([^\\*]+)\\*/g, '<b>$1</b>');
          box.innerHTML += '<div style="align-self: flex-start; background: #1E293B; padding: 12px 18px; border-radius: 14px 14px 14px 2px; max-width: 85%; line-height: 1.5;">' + formatted + '</div>';
          box.scrollTop = box.scrollHeight;
        })
        .catch(err => {
          box.innerHTML += '<div style="align-self: flex-start; background: #7F1D1D; color: #FECACA; padding: 10px 14px; border-radius: 12px; font-size: 13px;">Gagal memproses pesan: ' + err.message + '</div>';
          box.scrollTop = box.scrollHeight;
        });
      }

      document.getElementById('liveChatInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendLiveChat();
      });
    </script>
    </body>
    </html>
  `;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

module.exports = {
  renderLandingPage
};
