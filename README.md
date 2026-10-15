# TataDana — Fintech SaaS Manajemen Keuangan Terintegrasi Telegram Bot

> **Tagline**: *Catat keuangan semudah chat — langsung dari Telegram kamu.*

TataDana adalah aplikasi manajemen keuangan pribadi Indonesia kelas dunia yang terintegrasi penuh dengan Telegram Bot. User dapat mencatat pengeluaran dan pemasukan langsung dari chat Telegram dengan bahasa santai (*"beli bakso 15rb"*, *"gajian 5jt"*), rekaman suara (Voice Note), atau foto struk belanjaan (OCR Vision). Setiap transaksi tersimpan rapi secara real-time dan dapat diakses melalui dashboard web serta diekspor ke PDF dan Excel (.xlsx) on-demand.

---

## 🚀 Fitur Unggulan End-to-End

### 1. Telegram Bot Pintar (Core Engine)
- **1 Bot Shared**: 1 bot resmi digunakan bersama oleh semua user, ditautkan melalui nomor WhatsApp/HP yang terverifikasi OTP.
- **Natural Language LLM Parsing**: Memahami format penulisan angka khas Indonesia: `15rb` = 15.000, `500k` = 500.000, `1.5jt` = 1.500.000, `kopi susu 22k gopay`, dll.
- **Multi-Item Receipt OCR (Pro)**: Foto struk belanja (Indomaret, Alfamart, restoran) diekstrak detail item dan harganya, dicatat sebagai 1 transaksi utama dengan rincian breakdown.
- **Voice Note Transcription**: Menerima VN hingga 60 detik, ditranskrip menjadi teks dan otomatis diproses ke database dengan baris transkrip `🎙️ Transkrip: "[teks]"`.
- **WIB Timezone**: Seluruh timestamp menggunakan Waktu Indonesia Barat (UTC+7 / Asia/Jakarta).
- **Format Balasan Realistis**: Dilengkapi visual progress bar `[████████░░] 80%` dan pesan motivasi.
- **Perintah Bot Cepat**: `/saldo`, `/hari ini`, `/minggu ini`, `/bulan ini`, `/budget`, `/sheet`, `/bantuan`.
- **AI Financial Advisor (Pro)**: Memicu notifikasi saran actionable saat pengeluaran melonjak >50%, pengeluaran >80% pemasukan, atau pengeluaran tunggal >20% budget.
- **Interactive Simulator**: Disediakan simulator Telegram interaktif langsung di web app!

### 2. Dashboard Laporan Finansial Native
- **Ringkasan Arus Kas**: Pemasukan, Pengeluaran, Net Cashflow, dan Top 5 Kategori.
- **Tabel Transaksi Lengkap**: Sortir kolom tanggal, nominal, kategori, wallet, pagination, dan filter/search.
- **Expandable Struk Item**: Transaksi dari foto struk dapat di-expand untuk melihat detail item rinciannya.
- **Export On-Demand PDF & Excel (.xlsx)**: File hasil generate dapat langsung diunduh dan riwayat tersimpan di storage.

### 3. Multi-Wallet & Anggaran Kategori
- **Multi Wallet**: BCA, Mandiri, GoPay, OVO, Tunai/Cash dengan saldo terpisah, set 1 dompet default untuk Telegram, dan transfer antar dompet.
- **Budgeting**: Batas bulanan per kategori dengan progress bar dan peringatan ambang batas 80% & 100%.

### 4. Portal Superadmin
- **Multi-Provider AI**: Pengelolaan model Google Gemini, OpenAI GPT, DeepSeek dengan mode Single atau Paralel Failover dan penyimpanan kunci API terenkripsi.
- **Audit Privasi & Transaksi**: Inspeksi transaksi user untuk support dengan pencatatan wajib ke Audit Log demi perlindungan privasi.
- **Impersonasi Satu Klik**: Masuk ke tampilan dashboard user secara live tanpa butuh password.
- **Approval Pembayaran Midtrans & Transfer Manual**.
- **Log AI**: Monitoring latensi ms dan token yang digunakan.

---

## 🛠️ Tech Stack & Arsitektur
- **Framework**: Next.js 14 App Router + TypeScript
- **Styling**: Tailwind CSS (Tema Modern Orange & White Fintech Indonesia)
- **Database & Storage**: Supabase Postgres & Supabase Storage (Skema SQL lengkap di `supabase/migrations/`)
- **Dual-Storage Engine**: Terintegrasi Supabase Client + In-Memory/LocalStorage fallback dengan data demo realistis.
- **Ekspor Dokumen**: `jspdf`, `jspdf-autotable`, `xlsx` (SheetJS)
- **AI Providers**: Google Gemini 1.5 Flash (Default NLP & Vision), OpenAI, DeepSeek.

---

## 📦 Struktur Folder
```
tatadana/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── telegram/webhook/route.ts      # Webhook Idempotent Telegram
│   │   │   ├── telegram/test-connection/      # Endpoint getMe & setWebhook
│   │   │   ├── payments/midtrans/             # Webhook notifikasi Midtrans
│   │   │   └── ai/chat/                       # Endpoint pemrosesan AI
│   │   ├── dashboard/                         # Dashboard User
│   │   │   ├── page.tsx                       # Beranda (Overview & Charts)
│   │   │   ├── transaksi/page.tsx             # Catat Transaksi & Transfer
│   │   │   ├── laporan/page.tsx               # Laporan Native & Export
│   │   │   ├── budget/page.tsx                # Target Budget Bulanan
│   │   │   ├── wallet/page.tsx                # Multi-Wallet
│   │   │   └── settings/page.tsx              # Settings & BotFather Setup
│   │   ├── admin/                             # Portal Superadmin
│   │   │   ├── providers/page.tsx             # Kelola API AI Multi-Provider
│   │   │   ├── users/page.tsx                 # Kelola User & Impersonasi
│   │   │   ├── ai-logs/page.tsx               # Monitoring Latensi & Token
│   │   │   ├── payments/page.tsx              # Verifikasi Pembayaran
│   │   │   └── transactions/page.tsx          # Inspeksi Transaksi & Audit
│   │   ├── login/page.tsx                     # Auth Login (Split Layout & OTP)
│   │   ├── register/page.tsx                  # Auth Register & OTP HP
│   │   ├── page.tsx                           # Landing Page (15 Section Lengkap)
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── telegram/TelegramSimulator.tsx     # Widget Simulator Bot Telegram
│   └── lib/
│       ├── types.ts                           # Interface & Model TypeScript
│       ├── storage.ts                         # Dual Engine Repository & Seed Data
│       ├── telegram.ts                        # Format Balasan WIB & Bot Router
│       ├── export.ts                          # Generator PDF & Excel (.xlsx)
│       ├── utils.ts                           # Formatter IDR, WIB Date, Parser
│       ├── supabase.ts                        # Supabase Client Wrapper
│       └── ai/
│           ├── parser.ts                      # Parser Bahasa Indonesia & OCR
│           └── advisor.ts                     # AI Financial Advisor Rules
├── supabase/
│   └── migrations/
│       ├── 20261013000001_initial_schema.sql  # Skema Lengkap Supabase Postgres
│       └── 20261013000002_seed_data.sql       # Seed AI Providers & Master Data
├── .env.example
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## ⚡ Menjalankan Aplikasi
1. Pasang dependensi:
   ```bash
   npm install
   ```
2. Jalankan server lokal:
   ```bash
   npm run dev
   ```
3. Buka `http://localhost:3000` di browser.
