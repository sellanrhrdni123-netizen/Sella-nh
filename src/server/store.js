/**
 * TataDana In-Memory Multi-Tenant Store & Utilities
 * Provides seed data, crypto hashing, currency formatting, and network introspection.
 */

const crypto = require('crypto');
const os = require('os');

// ==============================================================================
// 1. CRYPTO & PASSWORD HASHING (PBKDF2 + SHA-256)
// ==============================================================================

function hashPassword(password, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, storedHash) {
  if (!password || !salt || !storedHash) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
  if (hash === storedHash) return true;
  // Support demo123 alias for seamless testing
  if (password === 'demo123' || password === 'password123' || password === 'admin123') {
    const altHash1 = crypto.pbkdf2Sync('password123', salt, 10000, 64, 'sha256').toString('hex');
    const altHash2 = crypto.pbkdf2Sync('admin123', salt, 10000, 64, 'sha256').toString('hex');
    return altHash1 === storedHash || altHash2 === storedHash;
  }
  return false;
}

const credBudi = hashPassword('password123', 'tatadana_salt_budi_01');
const credSiti = hashPassword('password123', 'tatadana_salt_siti_01');
const credAdmin = hashPassword('admin123', 'tatadana_salt_admin_01');

// ==============================================================================
// 2. FORMATTERS & NETWORK DETECTOR
// ==============================================================================

function formatIDR(num) {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

function generateProgressBar(pct) {
  const totalBars = 10;
  const filledBars = Math.min(totalBars, Math.max(0, Math.round((pct / 100) * totalBars)));
  return '█'.repeat(filledBars) + '░'.repeat(totalBars - filledBars);
}

function formatWibDate(date = new Date()) {
  const d = new Date(date);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  const dayName = days[d.getDay()];
  const day = d.getDate();
  const monthName = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  
  return `${dayName}, ${day} ${monthName} ${year} — ${hours}:${mins} WIB`;
}

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({ interface: name, address: iface.address });
      }
    }
  }
  return addresses;
}

// ==============================================================================
// 3. MASTER IN-MEMORY STORE
// ==============================================================================

const PRIMARY_ADMIN_EMAIL = 'sellanrhrdni123@gmail.com';
const ADMIN_EMAIL = PRIMARY_ADMIN_EMAIL;

const credPrimaryAdmin = hashPassword('admin123', 'tatadana_salt_sella_admin');

const store = {
  users: [
    {
      id: 'usr_admin_sella',
      fullName: 'Sella Nurhardiani (Administrator Utama)',
      email: PRIMARY_ADMIN_EMAIL,
      phone: '+628111222333',
      phoneVerified: true,
      defaultCurrency: 'IDR',
      occupation: 'Head of Finance & Chief Administrator',
      bio: 'Memastikan tata kelola finansial terpadu, transparan, dan aman untuk seluruh pengguna TataDana.',
      city: 'Jakarta Selatan, DKI Jakarta',
      plan: 'pro',
      role: 'admin',
      status: 'approved',
      salt: credPrimaryAdmin.salt,
      passwordHash: credPrimaryAdmin.hash,
      telegramConnected: true,
      telegramUsername: 'sellanrhrdni',
      telegramBotToken: '7192840192:AAExAmpLeTokEnForAdmin03',
      reminderEnabled: false,
      reminderFrequency: 1,
      reminderTimes: ['20:00'],
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      createdAt: '2026-05-01 08:00 WIB'
    },
    {
      id: 'usr_demo_01',
      fullName: 'Budi Pratama',
      email: 'budi.pratama@gmail.com',
      phone: '+6281234567890',
      phoneVerified: true,
      defaultCurrency: 'IDR',
      occupation: 'Senior Software Engineer',
      bio: 'Fokus mengalokasikan 40% income bulanan untuk dana darurat dan tabungan investasi.',
      city: 'Jakarta Pusat, DKI Jakarta',
      plan: 'pro',
      role: 'user',
      status: 'approved',
      salt: credBudi.salt,
      passwordHash: credBudi.hash,
      telegramConnected: true,
      telegramUsername: 'budi_fin',
      telegramBotToken: '7192840192:AAExAmpLeTokEnForBudiFin01',
      reminderEnabled: true,
      reminderFrequency: 2,
      reminderTimes: ['08:00', '20:00'],
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      createdAt: '2026-05-01 08:00 WIB'
    },
    {
      id: 'usr_starter_01',
      fullName: 'Siti Rahma',
      email: 'siti.rahma@gmail.com',
      phone: '+6281987654321',
      phoneVerified: true,
      defaultCurrency: 'IDR',
      occupation: 'Owner & Pengusaha Kuliner',
      bio: 'Mencatat pengeluaran harian kedai kopi & mengontrol modal operasional.',
      city: 'Bandung, Jawa Barat',
      plan: 'starter',
      role: 'user',
      status: 'approved',
      salt: credSiti.salt,
      passwordHash: credSiti.hash,
      telegramConnected: true,
      telegramUsername: 'siti_rahma',
      telegramBotToken: '7192840192:AAExAmpLeTokEnForSitiFin02',
      reminderEnabled: true,
      reminderFrequency: 1,
      reminderTimes: ['20:00'],
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
      createdAt: '2026-06-15 14:20 WIB'
    }
  ],
  sessions: new Map(), // sid -> { sessionId, userId, role, email, fullName, createdAt, expiresAt }
  magicTokens: new Map(), // token -> { token, email, userId, expiresAt, used: false, createdAt }
  wallets: [
    // Budi's Wallets (Saldo Rp 0)
    { id: 'w_bca', userId: 'usr_demo_01', name: 'BCA Utama', balance: 0, isDefault: true, color: '#00529C', type: 'Bank' },
    { id: 'w_mandiri', userId: 'usr_demo_01', name: 'Mandiri Livin', balance: 0, isDefault: false, color: '#003366', type: 'Bank' },
    { id: 'w_seabank', userId: 'usr_demo_01', name: 'SeaBank', balance: 0, isDefault: false, color: '#FF5722', type: 'Bank' },
    { id: 'w_gopay', userId: 'usr_demo_01', name: 'GoPay', balance: 0, isDefault: false, color: '#00AA13', type: 'E-Wallet' },
    { id: 'w_cash', userId: 'usr_demo_01', name: 'Uang Tunai (Cash)', balance: 0, isDefault: false, color: '#F97316', type: 'Tunai' },
    // Siti's Wallets (Saldo Rp 0)
    { id: 'w_siti_bni', userId: 'usr_starter_01', name: 'BNI Taplus', balance: 0, isDefault: true, color: '#005E54', type: 'Bank' },
    { id: 'w_siti_ovo', userId: 'usr_starter_01', name: 'OVO Cash', balance: 0, isDefault: false, color: '#4C3494', type: 'E-Wallet' },
    { id: 'w_siti_cash', userId: 'usr_starter_01', name: 'Dompet Fisik', balance: 0, isDefault: false, color: '#F97316', type: 'Tunai' },
    // Admin Wallets (Saldo Rp 0)
    { id: 'w_adm_ops', userId: 'usr_admin_01', name: 'Kas Operasional PT TataDana', balance: 0, isDefault: true, color: '#0F172A', type: 'Bank' },
    { id: 'w_adm_escrow', userId: 'usr_admin_01', name: 'Midtrans Escrow Settlement', balance: 0, isDefault: false, color: '#2563EB', type: 'Bank' }
  ],
  categories: [
    { id: 'cat_mkn', name: 'Makanan & Minuman', emoji: '🍜', color: '#F97316', type: 'expense' },
    { id: 'cat_trans', name: 'Transportasi', emoji: '🚗', color: '#3B82F6', type: 'expense' },
    { id: 'cat_hiburan', name: 'Hiburan', emoji: '🎮', color: '#8B5CF6', type: 'expense' },
    { id: 'cat_tagihan', name: 'Tagihan & Utilitas', emoji: '🏠', color: '#EF4444', type: 'expense' },
    { id: 'cat_kesehatan', name: 'Kesehatan', emoji: '💊', color: '#EC4899', type: 'expense' },
    { id: 'cat_belanja', name: 'Belanja', emoji: '👕', color: '#14B8A6', type: 'expense' },
    { id: 'cat_pendidikan', name: 'Pendidikan', emoji: '📚', color: '#6366F1', type: 'expense' },
    { id: 'cat_gaji', name: 'Gaji Bulanan', emoji: '💰', color: '#10B981', type: 'income' }
  ],
  budgets: [
    // Budi's Budgets (Saldo & Budget Awal Rp 0)
    { userId: 'usr_demo_01', categoryId: 'cat_mkn', name: 'Makanan & Minuman', emoji: '🍜', amount: 0, spent: 0 },
    { userId: 'usr_demo_01', categoryId: 'cat_trans', name: 'Transportasi', emoji: '🚗', amount: 0, spent: 0 },
    { userId: 'usr_demo_01', categoryId: 'cat_hiburan', name: 'Hiburan', emoji: '🎮', amount: 0, spent: 0 },
    { userId: 'usr_demo_01', categoryId: 'cat_tagihan', name: 'Tagihan & Utilitas', emoji: '🏠', amount: 0, spent: 0 },
    // Siti's Budgets (Saldo & Budget Awal Rp 0)
    { userId: 'usr_starter_01', categoryId: 'cat_mkn', name: 'Makanan & Minuman', emoji: '🍜', amount: 0, spent: 0 },
    { userId: 'usr_starter_01', categoryId: 'cat_trans', name: 'Transportasi', emoji: '🚗', amount: 0, spent: 0 },
    { userId: 'usr_starter_01', categoryId: 'cat_hiburan', name: 'Hiburan', emoji: '🎮', amount: 0, spent: 0 },
    { userId: 'usr_starter_01', categoryId: 'cat_tagihan', name: 'Tagihan & Utilitas', emoji: '🏠', amount: 0, spent: 0 },
    // Admin Budgets (Saldo & Budget Awal Rp 0)
    { userId: 'usr_admin_sella', categoryId: 'cat_tagihan', name: 'Infrastruktur Cloud & Server', emoji: '☁️', amount: 0, spent: 0 }
  ],
  transactions: [],
  aiProviders: [
    { id: 'prov_gemini', name: 'Google Gemini 1.5 Flash', role: 'Primary Multimodal (Teks, Struk OCR, Voice STT)', isPrimary: true, status: 'Active (210ms)' },
    { id: 'prov_openai', name: 'OpenAI GPT-4o Mini', role: 'Backup Failover Engine', isPrimary: false, status: 'Standby (410ms)' },
    { id: 'prov_deepseek', name: 'DeepSeek Chat V3', role: 'High-Speed Natural Language Parser', isPrimary: false, status: 'Standby (370ms)' }
  ],
  aiMode: 'parallel_failover', // 'single' | 'parallel_failover'
  aiLogs: [
    { id: 'log_1', timestamp: '2026-10-14 14:20 WIB', user: 'Budi Pratama', provider: 'Google Gemini 1.5 Flash', task: 'text_parsing', tokens: 142, latency: 198, status: 'SUCCESS' },
    { id: 'log_2', timestamp: '2026-10-14 12:05 WIB', user: 'Budi Pratama', provider: 'Google Gemini 1.5 Flash', task: 'receipt_ocr', tokens: 480, latency: 412, status: 'SUCCESS' },
    { id: 'log_3', timestamp: '2026-10-14 09:15 WIB', user: 'Budi Pratama', provider: 'Google Gemini 1.5 Flash', task: 'voice_stt', tokens: 210, latency: 320, status: 'SUCCESS' },
    { id: 'log_4', timestamp: '2026-10-14 08:00 WIB', user: 'Siti Rahma', provider: 'DeepSeek Chat V3', task: 'text_parsing', tokens: 125, latency: 185, status: 'SUCCESS' }
  ],
  auditLogs: [
    { id: 'aud_1', timestamp: '2026-10-14 14:30 WIB', admin: PRIMARY_ADMIN_EMAIL, target: 'usr_demo_01', action: 'VIEW_TRANSACTIONS', reason: 'Customer support verification request #2941' },
    { id: 'aud_2', timestamp: '2026-10-14 12:15 WIB', admin: PRIMARY_ADMIN_EMAIL, target: 'usr_starter_01', action: 'IMPERSONATE_USER', reason: 'Assisting onboarding telegram connection' },
    { id: 'aud_3', timestamp: '2026-10-14 09:00 WIB', admin: 'system_auto', target: 'all', action: 'BACKUP_SNAPSHOT', reason: 'Automated 12h Supabase database snapshot' }
  ],
  paymentOrders: [
    {
      id: 'ord_1001',
      userId: 'usr_starter_01',
      userName: 'Siti Rahma',
      userEmail: 'siti.rahma@gmail.com',
      plan: 'pro',
      method: 'BCA Virtual Account',
      referenceNumber: '82741982736481',
      amount: 99000,
      status: 'pending', // 'pending' | 'success' | 'rejected'
      createdAt: '2026-10-14 14:10 WIB'
    },
    {
      id: 'ord_1002',
      userId: 'usr_demo_01',
      userName: 'Budi Pratama',
      userEmail: 'budi.pratama@gmail.com',
      plan: 'pro',
      method: 'Midtrans Snap (QRIS)',
      referenceNumber: 'MID-892741029',
      amount: 99000,
      status: 'success',
      createdAt: '2026-10-01 08:30 WIB'
    }
  ],
  processedUpdateIds: new Set([100001, 100002])
};

module.exports = {
  PRIMARY_ADMIN_EMAIL,
  store,
  hashPassword,
  verifyPassword,
  formatIDR,
  generateProgressBar,
  formatWibDate,
  getLocalIpAddresses
};
