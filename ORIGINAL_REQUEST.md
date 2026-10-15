# Original User Request

## Initial Request — 2026-10-14T04:25:13Z

# Teamwork Project Prompt — TataDana

TataDana adalah aplikasi SaaS manajemen keuangan pribadi Indonesia kelas dunia yang terintegrasi penuh dengan Telegram Bot, Supabase (Database, Auth, Storage, Realtime), Midtrans payment gateway, dan Multi-Provider AI (Gemini Flash default) untuk pencatatan transaksi via teks natural, foto struk (OCR multi-item), dan voice note (STT).

Working directory: C:\Users\sella\.gemini\antigravity\scratch\tatadana
Integrity mode: development

## Architecture & Technology Decisions
1. Framework: Next.js 14/15 App Router + TypeScript + Tailwind CSS + Lucide Icons + Supabase SDK.
2. Auth & Phone OTP: Dual Mode — Dev Simulator OTP (auto-display di dev banner/console untuk pengujian instan) + integrasi siap pakai Supabase Auth Phone / WhatsApp Gateway.
3. Telegram Webhook & Local Testing: Endpoint /api/telegram/webhook publik, idempotent (skip update_id yang sudah diproses), dilengkapi helper tunneling (Cloudflare Tunnel/Ngrok) dan hybrid Long-Polling mode untuk pengujian lokal.
4. AI Multi-Provider: Google Gemini (Gemini 2.0 / 1.5 Flash) sebagai primary provider multimodal (teks, visi OCR foto struk, audio VN), didukung arsitektur multi-provider (OpenAI GPT, DeepSeek) dengan failover paralel yang dapat dikonfigurasi dari Admin Dashboard.
5. Data Seeding: Automated seeder script lengkap berisi akun admin, akun user demo, sample wallet (BCA, Mandiri, Cash, GoPay), riwayat transaksi 6 bulan realistis, kategori, dan budget bulanan.
6. Timezone: Seluruh timestamp data transaksi, reminder, dan reply bot menggunakan zona waktu WIB (Asia/Jakarta).
7. Design Standard: Tema Orange + Putih (#F97316 / modern fintech), geometric typography (Plus Jakarta Sans / Inter), responsif sempurna di mobile (375px) dan desktop (1280px).

## Requirements

### R1. Database Schema & Supabase Configuration
- Definisikan seluruh skema database di supabase/migrations/ dengan Postgres DDL dan Row Level Security (RLS) policies.
- Tabel yang wajib ada:
  - profiles: user profile, nomor HP (terverifikasi), mata uang default, role (user / superadmin).
  - wallets: id, user_id, name (BCA, GoPay, Cash, dll), balance, is_default, color, icon.
  - categories: id, user_id, name, emoji, color, type (expense / income), is_custom.
  - transactions: id, user_id, wallet_id, category_id, type (expense / income / transfer), amount, notes, transaction_date (WIB), source (telegram_text, telegram_photo, telegram_voice, web_manual), is_receipt_parent.
  - transaction_items: id, transaction_id, item_name, price, quantity, category_id (untuk item struk belanja yang di-expand).
  - budgets: id, user_id, category_id, monthly_amount, period_month, period_year.
  - subscription_plans: id, slug (starter, pro), name, price, billing_type (monthly, lifetime), features_json.
  - user_subscriptions: id, user_id, plan_id, status (active, pending, expired), payment_gateway, midtrans_order_id, proof_url, approved_at.
  - telegram_bot_configs: id, user_id, bot_token_encrypted, telegram_chat_id, telegram_username, is_connected, webhook_url, reminder_enabled, reminder_times (json array, maks 2x/hari), last_active_at.
  - telegram_updates: id, update_id (unique, untuk idempotency check), processed_at, status.
  - ai_providers: id, provider_name (gemini, openai, deepseek), api_key_encrypted, is_active, is_primary, failover_order, mode (single, parallel_failover).
  - ai_logs: id, user_id, provider, prompt_tokens, response_tokens, latency_ms, status, task_type (text_parsing, receipt_ocr, voice_stt, financial_advisor).
  - audit_logs: id, admin_user_id, target_user_id, action, ip_address, created_at (untuk audit log privasi akses data transaksi).
  - report_exports: id, user_id, file_name, file_url, file_type (pdf, xlsx), period_start, period_end, created_at.

### R2. Core Telegram Bot Engine & Webhook Idempotency
- Endpoint Webhook publik /api/telegram/webhook menerima POST dari Telegram API.
- Idempotency check: verifikasi update_id ke tabel telegram_updates. Jika sudah ada, return HTTP 200 OK langsung (cegah transaksi ganda dari Telegram retry).
- Pengaturan token di Settings memanggil Telegram API getMe (validasi status bot) dan setWebhook mengarah ke <WEBHOOK_BASE_URL>/api/telegram/webhook.
- Parsing Teks Natural (LLM Structured Output):
  - Ekstraksi nominal format Indonesia ("15rb" = 15000, "1.5jt" = 1500000, "500k" = 500000).
  - Klasifikasi jenis (pemasukan / pengeluaran), kategori yang cocok, dan catatan.
  - Error fallback ramah jika input ambigu dengan contoh format yang benar.
- Input Foto Struk (Paket Pro):
  - AI Vision OCR mendeteksi merchant, tanggal, total, dan rincian item per baris.
  - Disimpan sebagai 1 transaksi utama dengan relasi child transaction_items (bisa di-expand).
  - Starter user yang kirim foto dibalas edukasi fitur Pro + CTA upgrade.
- Input Voice Note (STT):
  - Menerima audio/voice Telegram, transkripsi via Gemini/Whisper ke teks.
  - Diparsing lewat pipeline yang sama, pesan balasan mencantumkan 🎙️ Transkrip: "...".
  - Durasi audio dibatasi maks 60 detik.
- Format Reply Pesan:
  - Format pengeluaran: tanggal & jam WIB, nominal, kategori, dompet, catatan, sisa saldo, progress bar budget visual (█ dan ░), persentase, sisa budget, dan pesan motivasi.
  - Format pemasukan: tanggal & jam WIB, nominal, kategori, dompet, saldo baru, pesan semangat.
- Bot Commands:
  - /saldo: saldo semua wallet user.
  - /hari ini: rekap transaksi hari ini (WIB).
  - /minggu ini: rekap 7 hari terakhir.
  - /bulan ini: rekap bulan berjalan dengan breakdown kategori.
  - /budget: status seluruh budget bulan ini.
  - /sheet: link laporan dashboard pribadi user.
  - /bantuan: daftar bantuan lengkap.
- AI Financial Advisor (Fitur Pro):
  - Analisis otomatis saat terjadi spike pengeluaran >50%, pengeluaran >80% pemasukan, atau pengeluaran >20% budget kategori.
- Reminder Harian:
  - Maksimal 2x/hari sesuai jadwal user di tab Settings, mengirim notifikasi motivasi pencatatan keuangan.
- Enforcement Limit Paket:
  - Starter dibatasi 50 transaksi/bulan, 3 wallet, 5 kategori budget. Jika limit tercapai, bot membalas pesan limit tercapai + CTA upgrade.

### R3. Web Application Dashboard & Laporan Native
- Multi-Wallet: Tampilan kartu wallet interaktif, tambah/edit saldo, transfer antar-dompet, dan set 1 dompet default Telegram.
- Input Transaksi Manual: Modal form pemasukan, pengeluaran, dan transfer dengan kategori dan wallet selector.
- AI Category Onboarding Wizard: Rekomendasi 8 kategori awal berbasis kuesioner singkat saat pertama kali daftar.
- Budget Bulanan: Progress bar interaktif per kategori, indikator warna aman/waspada/bahaya, alert 80% & 100%.
- Dashboard Overview:
  - 4 Stats Cards: Saldo Total, Pemasukan Bulan Ini, Pengeluaran Bulan Ini, Budget Tersisa.
  - Pie Chart: Pengeluaran per kategori.
  - Bar Chart: Pemasukan vs Pengeluaran 6 bulan terakhir.
  - Trendline Chart: Pengeluaran harian bulan ini.
  - List 10 transaksi terbaru dengan badge wallet & kategori.
  - Onboarding checklist untuk user baru (Hubungkan Telegram -> Set Wallet -> Set Budget).
  - Filter Periode: Harian, Mingguan, Bulanan, Tahunan, Custom Range.
- Modul Laporan Native (/dashboard/reports):
  - Tabel transaksi lengkap dengan pagination, sortable per kolom (tanggal, nominal, kategori, wallet).
  - Filter & Search: per kategori, wallet, rentang tanggal, jenis transaksi, search by catatan.
  - Transaksi struk memiliki tombol accordion "Lihat Rincian Item" yang mengekspansi daftar item struk.
  - Ringkasan Laporan: Total Pemasukan, Total Pengeluaran, Net Cashflow, Top 5 Pengeluaran.
  - Generator Export PDF & Excel (.xlsx) on-demand, disimpan di Supabase Storage dengan signed download URL.
  - Riwayat export tersimpan untuk download ulang instan.
  - Real-time refresh via Supabase Realtime subscription.
- Settings Page:
  - Tab Profil: Nama, avatar, mata uang default (IDR).
  - Tab Telegram Bot: Input token, step-by-step BotFather guide, tombol "Test Koneksi", status webhook.
  - Tab Reminder: Toggle ON/OFF, frekuensi (1x atau 2x sehari), picker jam WIB, preview live pesan reminder.
  - Tab Kategori: Tambah/edit/hapus kategori custom.

### R4. Admin Dashboard, AI Multi-Provider & Midtrans
- Admin Dashboard Terpisah (/admin):
  - Superadmin authentication & route protection.
  - Impersonation: Admin bisa masuk melihat tampilan dashboard user tertentu tanpa perlu password/re-login.
  - Audit Logs: Setiap akses admin ke data transaksi user tercatat di audit log demi menjaga privasi.
  - Kelola AI Multi-Provider: Tambah/edit provider (Gemini, OpenAI, DeepSeek), API key terenkripsi, toggle single mode vs parallel failover mode, set active primary provider.
  - AI Usage Logs: Pemantauan latency, prompt tokens, completion tokens, dan error rate.
  - Manajemen User & Subscriptions: Daftar user, status plan, status koneksi Telegram.
  - Midtrans & Payment Approval: Monitor transaksi Midtrans, approve/reject manual bukti transfer bank.
  - Export Global Data: Backup data transaksi dan user untuk support internal.

### R5. Landing Page Fintech Kelas Dunia & Auth Flow
- Landing Page (/):
  - Tema Orange-Putih premium, clean, high-contrast, modern geometric typography.
  - 1. Navbar sticky dengan logo TataDana, link Fitur, Harga, FAQ, tombol "Masuk" dan "Coba Gratis".
  - 2. Pre-headline badge: "✨ Catat keuangan langsung dari Telegram".
  - 3. H1: "Gaji habis sebelum akhir bulan? Sudah saatnya kamu tahu ke mana uangmu pergi." (gradient orange).
  - 4. Subheadline: "TataDana mencatat setiap pengeluaranmu langsung dari chat Telegram atau foto struk — sisanya kami yang urus."
  - 5. Hero media preview (Interactive Telegram chat mockup + dashboard preview).
  - 6. CTA buttons: "Mulai Gratis Sekarang" + "Lihat cara kerjanya ->".
  - 7. Problem bullet points (3 rasa sakit finansial karyawan/freelancer).
  - 8. Solution transition section: "Bagaimana kalau mencatat keuangan semudah kirim pesan ke teman?".
  - 9. Interactive Dashboard Preview: dummy interaktif dengan simulator chat bot Telegram.
  - 10. Alternating 3 Features: Catat via Telegram (Teks/Foto/VN), Laporan & Export Otomatis, AI Financial Advisor.
  - 11. Testimoni Masonry Grid (placeholder dengan komentar // TODO: ganti dengan testimoni asli).
  - 12. Pricing Section: Toggle Bulanan / Sekali Bayar (Starter Rp49.000/bln vs Pro Rp99.000 Sekali Bayar).
  - 13. FAQ Section: Minimal 7 pertanyaan interaktif accordion.
  - 14. Final CTA banner: Orange gradient dengan tombol konversi.
  - 15. Footer: 4 kolom lengkap (Branding, Produk, Perusahaan, Legal).
- Auth Pages (/auth/login, /auth/register):
  - Split Layout: Kiri (40%) Branding panel "Keuanganmu. Terkontrol.", Kanan (60%) Form autentikasi.
  - Opsi login: Email + Password, Google OAuth, dan Nomor HP.
  - Verifikasi OTP Nomor HP: input OTP 6-digit dengan dual-mode dev simulator banner untuk testing cepat tanpa jeda SMS gateway.

### R6. Automated Seeder & Local Testing Tooling
- Skrip database seeder otomatis (npm run seed) yang membuat akun Superadmin, akun Pro Demo, 4 wallet (BCA, Mandiri, GoPay, Cash), kategori standar & budget bulanan, serta 50+ data transaksi realistis 6 bulan terakhir.
- Local Telegram Simulator Web/CLI di /dev/telegram-simulator.

## Acceptance Criteria
- [ ] Database schema lengkap di supabase/migrations mencakup semua tabel, relasi, RLS policies, dan index.
- [ ] Endpoint /api/telegram/webhook idempotent, menangani input teks Indonesia via Gemini structured output, dan mengembalikan reply berformat WIB beserta progress bar budget.
- [ ] Input foto struk mengekstrak merchant, total, dan rincian item untuk Pro user.
- [ ] Input voice note mentranskripsi suara (STT) dan memprosesnya dengan reply memuat 🎙️ Transkrip: "...".
- [ ] Modul Laporan berfungsi penuh: sorting, filter kategori/wallet/tanggal, accordion expand rincian struk, dan generator export PDF & Excel (.xlsx) dengan signed URL.
- [ ] Admin Dashboard memiliki panel AI Multi-Provider switcher, log latency, impersonation user, dan Midtrans approval.
- [ ] Landing page responsif, pixel-perfect orange-putih fintech style, dan semua link navigasi berfungsi.
- [ ] Dev simulator OTP dan Webhook Simulator siap dijalankan untuk testing end-to-end secara instan.


## Follow-up — 2026-10-14T08:03:48Z

USER URGENT REQUEST: /boost tolong percepat.
User explicitly requests to accelerate execution speed. Please instruct the orchestrator and all active workers to execute in accelerated overdrive:
1. Complete M2 remediation and gating review immediately.
2. Parallelize M3 (AI Multi-Provider & Parsing), M4 (Web Dashboard & Native Reporting), M5 (Admin Dashboard & Midtrans), and M6 (Landing Page & Auth Flow) simultaneously where possible.
3. Keep quality standards high while bypassing unnecessary delays to reach full victory and deliver the complete TataDana codebase swiftly.
