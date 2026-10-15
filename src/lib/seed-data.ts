// ==============================================================================
// TATADANA CANONICAL MASTER SEED DATA
// 60 Realistic Transactions across 6 Months (May - Oct 2026), WIB Timestamps (+07:00)
// 4 Wallets (Total Rp 22.950.000), 11 Categories, 48 Budgets, 33 Receipt Items
// ==============================================================================

import type {
  UserProfile,
  Wallet,
  Category,
  Budget,
  Transaction,
  ReceiptItem,
  ExportRecord,
  AIProviderConfig,
  AILog,
  PaymentRecord,
  AdminAuditLog,
  TelegramUpdate
} from './types';

// ==============================================================================
// 1. CANONICAL USER IDS
// ==============================================================================

export const DEMO_USER_ID = 'usr_budi_pratama_01';
export const ADMIN_USER_ID = 'usr_admin_tatadana_01';
export const STARTER_USER_ID = 'usr_siti_rahma_02';
export const UNVERIFIED_USER_ID = 'usr_dimas_freelance_03';

// Postgres UUID Mappings (for live Supabase seeding)
export const USER_UUID_MAP: Record<string, string> = {
  [DEMO_USER_ID]: 'a1111111-1111-1111-1111-111111111111',
  [ADMIN_USER_ID]: 'b2222222-2222-2222-2222-222222222222',
  [STARTER_USER_ID]: 'c3333333-3333-3333-3333-333333333333',
  [UNVERIFIED_USER_ID]: 'd4444444-4444-4444-4444-444444444444',
};

// ==============================================================================
// 2. USER PROFILES
// ==============================================================================

export const SEED_PROFILES: UserProfile[] = [
  {
    id: DEMO_USER_ID,
    email: 'budi.pratama@gmail.com',
    fullName: 'Budi Pratama (Demo Pro)',
    phoneNumber: '+6281234567890',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    currency: 'IDR',
    plan: 'pro',
    role: 'user',
    telegramChatId: 109283742,
    telegramUsername: 'budipratama_id',
    telegramBotToken: '7234567890:AAHkL123456789abcdefghijklmnopqrstuv',
    telegramConnected: true,
    dailyReminderEnabled: true,
    reminderFrequency: 2,
    reminderTimes: ['12:30', '20:00'],
    onboardingCompleted: true,
    createdAt: '2026-05-01T08:00:00+07:00',
    updatedAt: '2026-10-14T08:00:00+07:00',
  },
  {
    id: ADMIN_USER_ID,
    email: 'sellanrhrdni123@gmail.com',
    fullName: 'Sella Nurhardiani (Administrator Utama)',
    phoneNumber: '+628111222333',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    currency: 'IDR',
    plan: 'pro',
    role: 'admin',
    telegramChatId: 998877665,
    telegramUsername: 'admin_tatadana',
    telegramConnected: true,
    dailyReminderEnabled: false,
    reminderFrequency: 1,
    reminderTimes: ['21:00'],
    onboardingCompleted: true,
    createdAt: '2026-05-01T08:00:00+07:00',
    updatedAt: '2026-10-14T08:00:00+07:00',
  },
  {
    id: STARTER_USER_ID,
    email: 'siti.rahma@gmail.com',
    fullName: 'Siti Rahma (Demo Starter)',
    phoneNumber: '+6285712345678',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    currency: 'IDR',
    plan: 'starter',
    role: 'user',
    telegramChatId: 554433221,
    telegramUsername: 'sitirahma_ui',
    telegramConnected: true,
    dailyReminderEnabled: true,
    reminderFrequency: 1,
    reminderTimes: ['19:30'],
    onboardingCompleted: true,
    createdAt: '2026-06-15T14:20:00+07:00',
    updatedAt: '2026-10-12T18:00:00+07:00',
  },
  {
    id: UNVERIFIED_USER_ID,
    email: 'dimas.creative@gmail.com',
    fullName: 'Dimas Anggara',
    phoneNumber: '+6287890123456',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    currency: 'IDR',
    plan: 'starter',
    role: 'user',
    telegramConnected: false,
    dailyReminderEnabled: false,
    reminderFrequency: 1,
    reminderTimes: ['20:00'],
    onboardingCompleted: false,
    createdAt: '2026-10-10T09:15:00+07:00',
    updatedAt: '2026-10-10T09:15:00+07:00',
  }
];

// ==============================================================================
// 3. 4 MANDATORY WALLETS (Total Rp 22.950.000)
// ==============================================================================

export const SEED_WALLETS: Wallet[] = [
  {
    id: 'wal_bca_01',
    userId: DEMO_USER_ID,
    name: 'BCA Utama',
    type: 'bank',
    balance: 12500000,
    isDefault: true,
    color: '#00529C',
    icon: 'landmark',
    accountNumber: '8830192831',
    createdAt: '2026-05-01T08:05:00+07:00',
  },
  {
    id: 'wal_mandiri_02',
    userId: DEMO_USER_ID,
    name: 'Mandiri Livin',
    type: 'bank',
    balance: 8200000,
    isDefault: false,
    color: '#003366',
    icon: 'credit-card',
    accountNumber: '137001928374',
    createdAt: '2026-05-01T08:10:00+07:00',
  },
  {
    id: 'wal_cash_03',
    userId: DEMO_USER_ID,
    name: 'Uang Tunai (Cash)',
    type: 'cash',
    balance: 1500000,
    isDefault: false,
    color: '#F97316',
    icon: 'banknote',
    createdAt: '2026-05-01T08:15:00+07:00',
  },
  {
    id: 'wal_gopay_04',
    userId: DEMO_USER_ID,
    name: 'GoPay',
    type: 'ewallet',
    balance: 750000,
    isDefault: false,
    color: '#00AA13',
    icon: 'smartphone',
    accountNumber: '081234567890',
    createdAt: '2026-05-01T08:20:00+07:00',
  }
];

// ==============================================================================
// 4. 11 STANDARD CATEGORIES
// ==============================================================================

export const SEED_CATEGORIES: Category[] = [
  // 8 Expense Categories
  { id: 'cat_makanan', userId: DEMO_USER_ID, name: 'Makanan & Minuman', type: 'expense', emoji: '🍜', color: '#F97316', isDefault: true, createdAt: '2026-05-01T08:00:00+07:00' },
  { id: 'cat_transport', userId: DEMO_USER_ID, name: 'Transportasi', type: 'expense', emoji: '🚗', color: '#3B82F6', isDefault: true, createdAt: '2026-05-01T08:00:00+07:00' },
  { id: 'cat_kopi', userId: DEMO_USER_ID, name: 'Kopi & Nongkrong', type: 'expense', emoji: '☕', color: '#B45309', isDefault: false, createdAt: '2026-05-01T08:00:00+07:00' },
  { id: 'cat_tagihan', userId: DEMO_USER_ID, name: 'Kost & Tagihan Listrik', type: 'expense', emoji: '🏠', color: '#8B5CF6', isDefault: true, createdAt: '2026-05-01T08:00:00+07:00' },
  { id: 'cat_belanja', userId: DEMO_USER_ID, name: 'Belanja Harian', type: 'expense', emoji: '🛒', color: '#EC4899', isDefault: true, createdAt: '2026-05-01T08:00:00+07:00' },
  { id: 'cat_hiburan', userId: DEMO_USER_ID, name: 'Hiburan & Liburan', type: 'expense', emoji: '🎮', color: '#06B6D4', isDefault: false, createdAt: '2026-05-01T08:00:00+07:00' },
  { id: 'cat_kesehatan', userId: DEMO_USER_ID, name: 'Kesehatan & Obat', type: 'expense', emoji: '💊', color: '#10B981', isDefault: false, createdAt: '2026-05-01T08:00:00+07:00' },
  { id: 'cat_pendidikan', userId: DEMO_USER_ID, name: 'Pendidikan & Buku', type: 'expense', emoji: '📚', color: '#6366F1', isDefault: false, createdAt: '2026-05-01T08:00:00+07:00' },

  // 3 Income Categories
  { id: 'cat_gaji', userId: DEMO_USER_ID, name: 'Gaji Pokok', type: 'income', emoji: '💰', color: '#16A34A', isDefault: true, createdAt: '2026-05-01T08:00:00+07:00' },
  { id: 'cat_freelance', userId: DEMO_USER_ID, name: 'Project Freelance', type: 'income', emoji: '💼', color: '#2563EB', isDefault: false, createdAt: '2026-05-01T08:00:00+07:00' },
  { id: 'cat_investasi', userId: DEMO_USER_ID, name: 'Dividen & Investasi', type: 'income', emoji: '📈', color: '#D97706', isDefault: false, createdAt: '2026-05-01T08:00:00+07:00' }
];

// ==============================================================================
// 5. MONTHLY BUDGETS (6 Months: May - Oct 2026, 48 total)
// ==============================================================================

const MONTHS_6 = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];

const BASE_BUDGET_AMOUNTS: Record<string, number> = {
  cat_makanan: 2500000,
  cat_transport: 1000000,
  cat_kopi: 600000,
  cat_tagihan: 2500000,
  cat_belanja: 1500000,
  cat_hiburan: 600000,
  cat_kesehatan: 400000,
  cat_pendidikan: 300000,
};

export const SEED_BUDGETS: Budget[] = MONTHS_6.flatMap(month => {
  return Object.entries(BASE_BUDGET_AMOUNTS).map(([catId, amount]) => {
    const isOct = month === '2026-10';
    const isKopi = catId === 'cat_kopi';
    return {
      id: `bdg_${month.replace('-', '')}_${catId.replace('cat_', '')}`,
      userId: DEMO_USER_ID,
      categoryId: catId,
      month,
      amount,
      alert80Sent: isOct && isKopi,
      alert100Sent: false,
    };
  });
});

// ==============================================================================
// 6. 33 CHILD ITEMS FOR 9 RECEIPT TRANSACTIONS
// ==============================================================================

export const SEED_TRANSACTION_ITEMS = [
  // 1. Mei 2026 - Indomaret Point (tx_0505, Total: Rp 185.000)
  { id: 'item_0501', transactionId: 'tx_0505', itemName: 'Beras Ramos Super 5kg', price: 74000, quantity: 1, categoryId: 'cat_belanja' },
  { id: 'item_0502', transactionId: 'tx_0505', itemName: 'Minyak Goreng Bimoli 2L', price: 38500, quantity: 1, categoryId: 'cat_belanja' },
  { id: 'item_0503', transactionId: 'tx_0505', itemName: 'Ultra Milk Cokelat 1000ml', price: 21500, quantity: 1, categoryId: 'cat_makanan' },
  { id: 'item_0504', transactionId: 'tx_0505', itemName: 'Sari Roti Gandum Kupas', price: 23000, quantity: 1, categoryId: 'cat_makanan' },
  { id: 'item_0505', transactionId: 'tx_0505', itemName: 'Deterjen Rinso Molto 770g', price: 28000, quantity: 1, categoryId: 'cat_belanja' },

  // 2. Juni 2026 - Alfamart Rasuna Said (tx_0605, Total: Rp 245.000)
  { id: 'item_0601', transactionId: 'tx_0605', itemName: 'Telur Ayam Negeri 10 Butir', price: 31000, quantity: 1, categoryId: 'cat_belanja' },
  { id: 'item_0602', transactionId: 'tx_0605', itemName: 'Daging Ayam Fillet Dada 500g', price: 46000, quantity: 1, categoryId: 'cat_belanja' },
  { id: 'item_0603', transactionId: 'tx_0605', itemName: 'Shampoo Pantene Anti Ketombe 290ml', price: 48000, quantity: 1, categoryId: 'cat_belanja' },
  { id: 'item_0604', transactionId: 'tx_0605', itemName: 'Pampers & Tisu Basah Mitu 4pk', price: 120000, quantity: 1, categoryId: 'cat_belanja' },

  // 3. Juni 2026 - Starbucks (tx_0607, Total: Rp 92.000)
  { id: 'item_0605', transactionId: 'tx_0607', itemName: 'Cold Brew Grande', price: 54000, quantity: 1, categoryId: 'cat_kopi' },
  { id: 'item_0606', transactionId: 'tx_0607', itemName: 'Butter Croissant', price: 38000, quantity: 1, categoryId: 'cat_makanan' },

  // 4. Juli 2026 - Tokopedia (tx_0705, Total: Rp 650.000)
  { id: 'item_0701', transactionId: 'tx_0705', itemName: 'Logitech M331 Silent Mouse Wireless', price: 245000, quantity: 1, categoryId: 'cat_belanja' },
  { id: 'item_0702', transactionId: 'tx_0705', itemName: 'Extended Deskmat 90x40cm Dark Grey', price: 165000, quantity: 1, categoryId: 'cat_belanja' },
  { id: 'item_0703', transactionId: 'tx_0705', itemName: 'Baseus 65W GaN Fast Charger USB-C', price: 240000, quantity: 1, categoryId: 'cat_belanja' },

  // 5. Agustus 2026 - Super Indo (tx_0805, Total: Rp 320.000)
  { id: 'item_0801', transactionId: 'tx_0805', itemName: 'Salmon Fillet Fresh 200g', price: 82000, quantity: 1, categoryId: 'cat_belanja' },
  { id: 'item_0802', transactionId: 'tx_0805', itemName: 'Buah Apel Fuji 1kg', price: 45000, quantity: 1, categoryId: 'cat_makanan' },
  { id: 'item_0803', transactionId: 'tx_0805', itemName: 'Susu Greenfields UHT 1L', price: 24500, quantity: 2, categoryId: 'cat_makanan' },
  { id: 'item_0804', transactionId: 'tx_0805', itemName: 'Minyak Kelapa Barco 1L', price: 39000, quantity: 1, categoryId: 'cat_belanja' },
  { id: 'item_0805', transactionId: 'tx_0805', itemName: 'Sabun Cuci Piring Sunlight 750ml', price: 18500, quantity: 2, categoryId: 'cat_belanja' },

  // 6. September 2026 - Indomaret Tebet (tx_0905, Total: Rp 168.000)
  { id: 'item_0901', transactionId: 'tx_0905', itemName: 'Kopi Kapal Api Special Mix 20s', price: 26000, quantity: 1, categoryId: 'cat_kopi' },
  { id: 'item_0902', transactionId: 'tx_0905', itemName: 'Tepung Terigu Segitiga Biru 1kg', price: 15500, quantity: 2, categoryId: 'cat_belanja' },
  { id: 'item_0903', transactionId: 'tx_0905', itemName: 'Pasta Gigi Sensodyne Fresh Mint', price: 38500, quantity: 1, categoryId: 'cat_belanja' },
  { id: 'item_0904', transactionId: 'tx_0905', itemName: 'Sabun Mandi Lifebuoy Cair 450ml', price: 28000, quantity: 2, categoryId: 'cat_belanja' },

  // 7. Oktober 2026 - Indomaret Point Sudirman (tx_1010, Total: Rp 142.500)
  { id: 'item_1001', transactionId: 'tx_1010', itemName: 'Susu Ultra Milk 1000ml Plain', price: 21500, quantity: 1, categoryId: 'cat_makanan' },
  { id: 'item_1002', transactionId: 'tx_1010', itemName: 'Roti Gandum Sari Roti Special', price: 24000, quantity: 1, categoryId: 'cat_makanan' },
  { id: 'item_1003', transactionId: 'tx_1010', itemName: 'Sabun Mandi Dettol Original 450ml', price: 38000, quantity: 1, categoryId: 'cat_belanja' },
  { id: 'item_1004', transactionId: 'tx_1010', itemName: 'Shampoo Tresemme Keratin 340ml', price: 46000, quantity: 1, categoryId: 'cat_belanja' },
  { id: 'item_1005', transactionId: 'tx_1010', itemName: 'Air Mineral Aqua Botol 1500ml', price: 13000, quantity: 1, categoryId: 'cat_makanan' },

  // 8. Oktober 2026 - Starbucks Grand Indonesia (tx_1011, Total: Rp 78.000)
  { id: 'item_1006', transactionId: 'tx_1011', itemName: 'Brewed Coffee Pike Place Venti', price: 42000, quantity: 1, categoryId: 'cat_kopi' },
  { id: 'item_1007', transactionId: 'tx_1011', itemName: 'Blueberry Crumble Muffin', price: 36000, quantity: 1, categoryId: 'cat_makanan' },

  // 9. Oktober 2026 - Alfamart Bendungan Hilir (tx_1013, Total: Rp 54.000)
  { id: 'item_1008', transactionId: 'tx_1013', itemName: 'Roti Kasur Cokelat Keju', price: 16000, quantity: 1, categoryId: 'cat_makanan' },
  { id: 'item_1009', transactionId: 'tx_1013', itemName: 'Susu UHT Bear Brand 189ml', price: 12500, quantity: 2, categoryId: 'cat_makanan' },
  { id: 'item_1010', transactionId: 'tx_1013', itemName: 'Snack Keripik Singkong Kusuka 60g', price: 13000, quantity: 1, categoryId: 'cat_makanan' }
];

function getReceiptItemsForTx(txId: string): ReceiptItem[] {
  return SEED_TRANSACTION_ITEMS
    .filter(item => item.transactionId === txId)
    .map(item => ({
      id: item.id,
      name: item.itemName,
      price: item.price,
      categoryName: SEED_CATEGORIES.find(c => c.id === item.categoryId)?.name
    }));
}

// ==============================================================================
// 7. 60 REALISTIC TRANSACTIONS (6 MONTHS: MAY - OCT 2026)
// ==============================================================================

export const SEED_TRANSACTIONS: Transaction[] = [
  // --- BULAN 1: MEI 2026 (8 Transaksi) ---
  {
    id: 'tx_0501',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_gaji',
    type: 'income',
    amount: 15500000,
    description: 'Gaji Pokok Mei 2026 PT Maju Digital',
    source: 'web',
    transactionDate: '2026-05-01T08:00:00+07:00',
    createdAt: '2026-05-01T08:00:00+07:00',
  },
  {
    id: 'tx_0502',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    destinationWalletId: 'wal_cash_03',
    type: 'transfer',
    amount: 1000000,
    description: 'Tarik Tunai ATM BCA Menara BCA',
    source: 'web',
    transactionDate: '2026-05-03T10:15:00+07:00',
    createdAt: '2026-05-03T10:15:00+07:00',
  },
  {
    id: 'tx_0503',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_tagihan',
    type: 'expense',
    amount: 2200000,
    description: 'Sewa Kost Executive Setiabudi Mei',
    source: 'web',
    transactionDate: '2026-05-05T09:00:00+07:00',
    createdAt: '2026-05-05T09:00:00+07:00',
  },
  {
    id: 'tx_0504',
    userId: DEMO_USER_ID,
    walletId: 'wal_cash_03',
    categoryId: 'cat_makanan',
    type: 'expense',
    amount: 32000,
    description: 'Makan siang Nasi Ayam Bakar Pak Ndut',
    source: 'telegram_text',
    transactionDate: '2026-05-08T13:15:00+07:00',
    createdAt: '2026-05-08T13:15:00+07:00',
  },
  {
    id: 'tx_0505',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_belanja',
    type: 'expense',
    amount: 185000,
    description: 'Struk Belanja Indomaret Point',
    source: 'telegram_photo',
    merchantName: 'Indomaret Point',
    receiptUrl: 'https://images.unsplash.com/photo-1554415707-9e49016a3455?auto=format&fit=crop&w=600&q=80',
    receiptItems: getReceiptItemsForTx('tx_0505'),
    transactionDate: '2026-05-12T19:30:00+07:00',
    createdAt: '2026-05-12T19:30:00+07:00',
  },
  {
    id: 'tx_0506',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_transport',
    type: 'expense',
    amount: 250000,
    description: 'Isi Pertamax SPBU Pertamina 31.129.02 Kuningan',
    source: 'telegram_text',
    transactionDate: '2026-05-16T08:30:00+07:00',
    createdAt: '2026-05-16T08:30:00+07:00',
  },
  {
    id: 'tx_0507',
    userId: DEMO_USER_ID,
    walletId: 'wal_gopay_04',
    categoryId: 'cat_kopi',
    type: 'expense',
    amount: 52000,
    description: 'Kopi Kenangan Mantan 2 cup',
    source: 'telegram_voice',
    transcriptText: 'Kopi kenangan mantan dua cup lima puluh dua ribu pakai gopay',
    transactionDate: '2026-05-20T16:45:00+07:00',
    createdAt: '2026-05-20T16:45:00+07:00',
  },
  {
    id: 'tx_0508',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_tagihan',
    type: 'expense',
    amount: 502500,
    description: 'Beli Token Listrik PLN Mobile 500rb',
    source: 'web',
    transactionDate: '2026-05-25T20:00:00+07:00',
    createdAt: '2026-05-25T20:00:00+07:00',
  },

  // --- BULAN 2: JUNI 2026 (9 Transaksi) ---
  {
    id: 'tx_0601',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_gaji',
    type: 'income',
    amount: 15500000,
    description: 'Gaji Pokok Juni 2026',
    source: 'web',
    transactionDate: '2026-06-01T08:00:00+07:00',
    createdAt: '2026-06-01T08:00:00+07:00',
  },
  {
    id: 'tx_0602',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    destinationWalletId: 'wal_gopay_04',
    type: 'transfer',
    amount: 500000,
    description: 'Top up saldo GoPay',
    source: 'web',
    transactionDate: '2026-06-02T11:00:00+07:00',
    createdAt: '2026-06-02T11:00:00+07:00',
  },
  {
    id: 'tx_0603',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_tagihan',
    type: 'expense',
    amount: 2200000,
    description: 'Sewa Kost Juni',
    source: 'web',
    transactionDate: '2026-06-05T09:30:00+07:00',
    createdAt: '2026-06-05T09:30:00+07:00',
  },
  {
    id: 'tx_0604',
    userId: DEMO_USER_ID,
    walletId: 'wal_gopay_04',
    categoryId: 'cat_makanan',
    type: 'expense',
    amount: 45000,
    description: 'Nasi Padang RM Sederhana Sabang',
    source: 'telegram_text',
    transactionDate: '2026-06-09T12:45:00+07:00',
    createdAt: '2026-06-09T12:45:00+07:00',
  },
  {
    id: 'tx_0605',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_belanja',
    type: 'expense',
    amount: 245000,
    description: 'Belanja Bulanan Alfamart Rasuna Said',
    source: 'telegram_photo',
    merchantName: 'Alfamart Rasuna Said',
    receiptUrl: 'https://images.unsplash.com/photo-1554415707-9e49016a3455?auto=format&fit=crop&w=600&q=80',
    receiptItems: getReceiptItemsForTx('tx_0605'),
    transactionDate: '2026-06-14T15:20:00+07:00',
    createdAt: '2026-06-14T15:20:00+07:00',
  },
  {
    id: 'tx_0606',
    userId: DEMO_USER_ID,
    walletId: 'wal_mandiri_02',
    categoryId: 'cat_freelance',
    type: 'income',
    amount: 3000000,
    description: 'DP Pembuatan Web Company Profile',
    source: 'web',
    transactionDate: '2026-06-17T10:00:00+07:00',
    createdAt: '2026-06-17T10:00:00+07:00',
  },
  {
    id: 'tx_0607',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_kopi',
    type: 'expense',
    amount: 92000,
    description: 'Starbucks Cold Brew & Butter Croissant',
    source: 'telegram_photo',
    merchantName: 'Starbucks',
    receiptUrl: 'https://images.unsplash.com/photo-1554415707-9e49016a3455?auto=format&fit=crop&w=600&q=80',
    receiptItems: getReceiptItemsForTx('tx_0607'),
    transactionDate: '2026-06-21T14:15:00+07:00',
    createdAt: '2026-06-21T14:15:00+07:00',
  },
  {
    id: 'tx_0608',
    userId: DEMO_USER_ID,
    walletId: 'wal_gopay_04',
    categoryId: 'cat_transport',
    type: 'expense',
    amount: 175000,
    description: 'GrabCar Bandara Soekarno-Hatta',
    source: 'telegram_text',
    transactionDate: '2026-06-24T18:30:00+07:00',
    createdAt: '2026-06-24T18:30:00+07:00',
  },
  {
    id: 'tx_0609',
    userId: DEMO_USER_ID,
    walletId: 'wal_cash_03',
    categoryId: 'cat_kesehatan',
    type: 'expense',
    amount: 88000,
    description: 'Beli Vitamin C & Obat Flu di Kimia Farma',
    source: 'telegram_text',
    transactionDate: '2026-06-28T20:10:00+07:00',
    createdAt: '2026-06-28T20:10:00+07:00',
  },

  // --- BULAN 3: JULI 2026 (9 Transaksi) ---
  {
    id: 'tx_0701',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_gaji',
    type: 'income',
    amount: 15500000,
    description: 'Gaji Pokok Juli 2026',
    source: 'web',
    transactionDate: '2026-07-01T08:00:00+07:00',
    createdAt: '2026-07-01T08:00:00+07:00',
  },
  {
    id: 'tx_0702',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    destinationWalletId: 'wal_cash_03',
    type: 'transfer',
    amount: 1500000,
    description: 'Tarik Tunai ATM BCA',
    source: 'web',
    transactionDate: '2026-07-04T12:00:00+07:00',
    createdAt: '2026-07-04T12:00:00+07:00',
  },
  {
    id: 'tx_0703',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_tagihan',
    type: 'expense',
    amount: 2200000,
    description: 'Sewa Kost Juli',
    source: 'web',
    transactionDate: '2026-07-05T09:00:00+07:00',
    createdAt: '2026-07-05T09:00:00+07:00',
  },
  {
    id: 'tx_0704',
    userId: DEMO_USER_ID,
    walletId: 'wal_gopay_04',
    categoryId: 'cat_makanan',
    type: 'expense',
    amount: 120000,
    description: 'GoFood - Martabak Pecenongan 65',
    source: 'telegram_text',
    transactionDate: '2026-07-08T19:15:00+07:00',
    createdAt: '2026-07-08T19:15:00+07:00',
  },
  {
    id: 'tx_0705',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_belanja',
    type: 'expense',
    amount: 650000,
    description: 'Tokopedia - Keyboard & Mouse Kantor',
    source: 'telegram_photo',
    merchantName: 'Tokopedia',
    receiptUrl: 'https://images.unsplash.com/photo-1554415707-9e49016a3455?auto=format&fit=crop&w=600&q=80',
    receiptItems: getReceiptItemsForTx('tx_0705'),
    transactionDate: '2026-07-12T14:30:00+07:00',
    createdAt: '2026-07-12T14:30:00+07:00',
  },
  {
    id: 'tx_0706',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_transport',
    type: 'expense',
    amount: 250000,
    description: 'SPBU Pertamina MT Haryono',
    source: 'telegram_text',
    transactionDate: '2026-07-16T08:15:00+07:00',
    createdAt: '2026-07-16T08:15:00+07:00',
  },
  {
    id: 'tx_0707',
    userId: DEMO_USER_ID,
    walletId: 'wal_mandiri_02',
    categoryId: 'cat_freelance',
    type: 'income',
    amount: 3000000,
    description: 'Pelunasan Project Freelance Web',
    source: 'web',
    transactionDate: '2026-07-20T16:00:00+07:00',
    createdAt: '2026-07-20T16:00:00+07:00',
  },
  {
    id: 'tx_0708',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_hiburan',
    type: 'expense',
    amount: 110000,
    description: 'Tiket Bioskop XXI weekend',
    source: 'telegram_voice',
    transcriptText: 'Nonton bioskop XXI seratus sepuluh ribu bayar bca',
    transactionDate: '2026-07-24T11:30:00+07:00',
    createdAt: '2026-07-24T11:30:00+07:00',
  },
  {
    id: 'tx_0709',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_tagihan',
    type: 'expense',
    amount: 385000,
    description: 'Tagihan Wifi Telkom Indihome',
    source: 'web',
    transactionDate: '2026-07-29T21:00:00+07:00',
    createdAt: '2026-07-29T21:00:00+07:00',
  },

  // --- BULAN 4: AGUSTUS 2026 (10 Transaksi) ---
  {
    id: 'tx_0801',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_gaji',
    type: 'income',
    amount: 16000000,
    description: 'Gaji Pokok Agustus (Penyesuaian Promosi)',
    source: 'web',
    transactionDate: '2026-08-01T08:00:00+07:00',
    createdAt: '2026-08-01T08:00:00+07:00',
  },
  {
    id: 'tx_0802',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    destinationWalletId: 'wal_gopay_04',
    type: 'transfer',
    amount: 750000,
    description: 'Top up GoPay dari BCA',
    source: 'web',
    transactionDate: '2026-08-02T10:00:00+07:00',
    createdAt: '2026-08-02T10:00:00+07:00',
  },
  {
    id: 'tx_0803',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_tagihan',
    type: 'expense',
    amount: 2200000,
    description: 'Sewa Kost Agustus',
    source: 'web',
    transactionDate: '2026-08-05T09:00:00+07:00',
    createdAt: '2026-08-05T09:00:00+07:00',
  },
  {
    id: 'tx_0804',
    userId: DEMO_USER_ID,
    walletId: 'wal_cash_03',
    categoryId: 'cat_makanan',
    type: 'expense',
    amount: 48000,
    description: 'Soto Betawi H. Husen Tebet',
    source: 'telegram_text',
    transactionDate: '2026-08-07T13:00:00+07:00',
    createdAt: '2026-08-07T13:00:00+07:00',
  },
  {
    id: 'tx_0805',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_belanja',
    type: 'expense',
    amount: 320000,
    description: 'Struk Belanja Super Indo Pancoran',
    source: 'telegram_photo',
    merchantName: 'Super Indo',
    receiptUrl: 'https://images.unsplash.com/photo-1554415707-9e49016a3455?auto=format&fit=crop&w=600&q=80',
    receiptItems: getReceiptItemsForTx('tx_0805'),
    transactionDate: '2026-08-11T18:45:00+07:00',
    createdAt: '2026-08-11T18:45:00+07:00',
  },
  {
    id: 'tx_0806',
    userId: DEMO_USER_ID,
    walletId: 'wal_mandiri_02',
    categoryId: 'cat_investasi',
    type: 'income',
    amount: 450000,
    description: 'Dividen Reksadana Sucorinvest',
    source: 'web',
    transactionDate: '2026-08-15T09:30:00+07:00',
    createdAt: '2026-08-15T09:30:00+07:00',
  },
  {
    id: 'tx_0807',
    userId: DEMO_USER_ID,
    walletId: 'wal_gopay_04',
    categoryId: 'cat_kopi',
    type: 'expense',
    amount: 35000,
    description: 'Fore Coffee Caramel Praline',
    source: 'telegram_text',
    transactionDate: '2026-08-18T17:20:00+07:00',
    createdAt: '2026-08-18T17:20:00+07:00',
  },
  {
    id: 'tx_0808',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_transport',
    type: 'expense',
    amount: 280000,
    description: 'Bensin Shell V-Power Gatot Subroto',
    source: 'telegram_text',
    transactionDate: '2026-08-22T14:00:00+07:00',
    createdAt: '2026-08-22T14:00:00+07:00',
  },
  {
    id: 'tx_0809',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_hiburan',
    type: 'expense',
    amount: 236000,
    description: 'Langganan Netflix & Spotify Family',
    source: 'web',
    transactionDate: '2026-08-26T20:30:00+07:00',
    createdAt: '2026-08-26T20:30:00+07:00',
  },
  {
    id: 'tx_0810',
    userId: DEMO_USER_ID,
    walletId: 'wal_gopay_04',
    categoryId: 'cat_kesehatan',
    type: 'expense',
    amount: 165000,
    description: 'Konsultasi Dokter & Resep Halodoc',
    source: 'telegram_voice',
    transcriptText: 'Halodoc tebus obat seratus enam puluh lima ribu gopay',
    transactionDate: '2026-08-30T11:00:00+07:00',
    createdAt: '2026-08-30T11:00:00+07:00',
  },

  // --- BULAN 5: SEPTEMBER 2026 (11 Transaksi) ---
  {
    id: 'tx_0901',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_gaji',
    type: 'income',
    amount: 16000000,
    description: 'Gaji Pokok September 2026',
    source: 'web',
    transactionDate: '2026-09-01T08:00:00+07:00',
    createdAt: '2026-09-01T08:00:00+07:00',
  },
  {
    id: 'tx_0902',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    destinationWalletId: 'wal_cash_03',
    type: 'transfer',
    amount: 1000000,
    description: 'Tarik Tunai BCA ATM',
    source: 'web',
    transactionDate: '2026-09-03T10:30:00+07:00',
    createdAt: '2026-09-03T10:30:00+07:00',
  },
  {
    id: 'tx_0903',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_tagihan',
    type: 'expense',
    amount: 2200000,
    description: 'Sewa Kost September',
    source: 'web',
    transactionDate: '2026-09-05T09:00:00+07:00',
    createdAt: '2026-09-05T09:00:00+07:00',
  },
  {
    id: 'tx_0904',
    userId: DEMO_USER_ID,
    walletId: 'wal_cash_03',
    categoryId: 'cat_makanan',
    type: 'expense',
    amount: 42000,
    description: 'Bakso Solo Samrat Tebet',
    source: 'telegram_text',
    transactionDate: '2026-09-07T12:30:00+07:00',
    createdAt: '2026-09-07T12:30:00+07:00',
  },
  {
    id: 'tx_0905',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_belanja',
    type: 'expense',
    amount: 168000,
    description: 'Struk Belanja Indomaret Tebet Barat',
    source: 'telegram_photo',
    merchantName: 'Indomaret Tebet',
    receiptUrl: 'https://images.unsplash.com/photo-1554415707-9e49016a3455?auto=format&fit=crop&w=600&q=80',
    receiptItems: getReceiptItemsForTx('tx_0905'),
    transactionDate: '2026-09-11T19:40:00+07:00',
    createdAt: '2026-09-11T19:40:00+07:00',
  },
  {
    id: 'tx_0906',
    userId: DEMO_USER_ID,
    walletId: 'wal_mandiri_02',
    categoryId: 'cat_transport',
    type: 'expense',
    amount: 200000,
    description: 'Isi saldo e-Money Mandiri gerbang tol',
    source: 'web',
    transactionDate: '2026-09-15T08:00:00+07:00',
    createdAt: '2026-09-15T08:00:00+07:00',
  },
  {
    id: 'tx_0907',
    userId: DEMO_USER_ID,
    walletId: 'wal_gopay_04',
    categoryId: 'cat_kopi',
    type: 'expense',
    amount: 66000,
    description: 'Kopi Janji Jiwa Kopi Susu Senja 3 cup',
    source: 'telegram_voice',
    transcriptText: 'Janji jiwa tiga cup enam puluh enam ribu pakai gopay',
    transactionDate: '2026-09-18T16:15:00+07:00',
    createdAt: '2026-09-18T16:15:00+07:00',
  },
  {
    id: 'tx_0908',
    userId: DEMO_USER_ID,
    walletId: 'wal_mandiri_02',
    categoryId: 'cat_freelance',
    type: 'income',
    amount: 4500000,
    description: 'DP Project Mobile App Flutter',
    source: 'web',
    transactionDate: '2026-09-21T14:00:00+07:00',
    createdAt: '2026-09-21T14:00:00+07:00',
  },
  {
    id: 'tx_0909',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_pendidikan',
    type: 'expense',
    amount: 175000,
    description: 'Buku Arsitektur Software Gramedia Matraman',
    source: 'web',
    transactionDate: '2026-09-24T20:00:00+07:00',
    createdAt: '2026-09-24T20:00:00+07:00',
  },
  {
    id: 'tx_0910',
    userId: DEMO_USER_ID,
    walletId: 'wal_gopay_04',
    categoryId: 'cat_makanan',
    type: 'expense',
    amount: 38000,
    description: 'GoFood - Ayam Geprek Bensu',
    source: 'telegram_text',
    transactionDate: '2026-09-27T13:30:00+07:00',
    createdAt: '2026-09-27T13:30:00+07:00',
  },
  {
    id: 'tx_0911',
    userId: DEMO_USER_ID,
    walletId: 'wal_mandiri_02',
    categoryId: 'cat_investasi',
    type: 'income',
    amount: 215000,
    description: 'Bunga Deposito Bank Mandiri',
    source: 'web',
    transactionDate: '2026-09-30T22:00:00+07:00',
    createdAt: '2026-09-30T22:00:00+07:00',
  },

  // --- BULAN 6: OKTOBER 2026 (13 Transaksi) ---
  {
    id: 'tx_1001',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_gaji',
    type: 'income',
    amount: 16000000,
    description: 'Gaji Pokok Oktober 2026 PT Maju Digital',
    source: 'telegram_text',
    transactionDate: '2026-10-01T08:00:00+07:00',
    createdAt: '2026-10-01T08:00:00+07:00',
  },
  {
    id: 'tx_1002',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    destinationWalletId: 'wal_gopay_04',
    type: 'transfer',
    amount: 500000,
    description: 'Topup saldo GoPay bulanan dari BCA',
    source: 'web',
    transactionDate: '2026-10-02T10:00:00+07:00',
    createdAt: '2026-10-02T10:00:00+07:00',
  },
  {
    id: 'tx_1003',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_tagihan',
    type: 'expense',
    amount: 2200000,
    description: 'Bayar sewa kost bulan Oktober',
    source: 'web',
    transactionDate: '2026-10-05T09:00:00+07:00',
    createdAt: '2026-10-05T09:00:00+07:00',
  },
  {
    id: 'tx_1004',
    userId: DEMO_USER_ID,
    walletId: 'wal_cash_03',
    categoryId: 'cat_makanan',
    type: 'expense',
    amount: 45000,
    description: 'Nasi Goreng Kambing Kebon Sirih',
    source: 'telegram_text',
    transactionDate: '2026-10-06T12:15:00+07:00',
    createdAt: '2026-10-06T12:15:00+07:00',
  },
  {
    id: 'tx_1005',
    userId: DEMO_USER_ID,
    walletId: 'wal_gopay_04',
    categoryId: 'cat_kopi',
    type: 'expense',
    amount: 28000,
    description: 'Kopi kenangan mantan large',
    source: 'telegram_voice',
    transcriptText: 'Kopi kenangan 28 ribu bayar pakai gopay ya',
    transactionDate: '2026-10-08T15:30:00+07:00',
    createdAt: '2026-10-08T15:30:00+07:00',
  },
  {
    id: 'tx_1006',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_transport',
    type: 'expense',
    amount: 250000,
    description: 'Isi Pertamax mobil SPBU Kuningan',
    source: 'telegram_text',
    transactionDate: '2026-10-09T08:30:00+07:00',
    createdAt: '2026-10-09T08:30:00+07:00',
  },
  {
    id: 'tx_1007',
    userId: DEMO_USER_ID,
    walletId: 'wal_mandiri_02',
    categoryId: 'cat_freelance',
    type: 'income',
    amount: 3500000,
    description: 'DP Pembuatan Landing Page UI/UX',
    source: 'web',
    transactionDate: '2026-10-10T11:20:00+07:00',
    createdAt: '2026-10-10T11:20:00+07:00',
  },
  {
    id: 'tx_1008',
    userId: DEMO_USER_ID,
    walletId: 'wal_mandiri_02',
    destinationWalletId: 'wal_bca_01',
    type: 'transfer',
    amount: 2000000,
    description: 'Transfer tabungan Mandiri ke BCA',
    source: 'web',
    transactionDate: '2026-10-11T16:00:00+07:00',
    createdAt: '2026-10-11T16:00:00+07:00',
  },
  {
    id: 'tx_1009',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_transport',
    type: 'expense',
    amount: 250000,
    description: 'Isi Pertamax 250rb mobil',
    source: 'telegram_text',
    transactionDate: '2026-10-12T07:40:00+07:00',
    createdAt: '2026-10-12T07:40:00+07:00',
  },
  {
    id: 'tx_1010',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_belanja',
    type: 'expense',
    amount: 142500,
    description: 'Struk Indomaret Point Sudirman',
    source: 'telegram_photo',
    merchantName: 'Indomaret Point Sudirman',
    receiptUrl: 'https://images.unsplash.com/photo-1554415707-9e49016a3455?auto=format&fit=crop&w=600&q=80',
    receiptItems: getReceiptItemsForTx('tx_1010'),
    transactionDate: '2026-10-12T19:45:00+07:00',
    createdAt: '2026-10-12T19:45:00+07:00',
  },
  {
    id: 'tx_1011',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_kopi',
    type: 'expense',
    amount: 78000,
    description: 'Starbucks Grand Indonesia Pike Place & Muffin',
    source: 'telegram_photo',
    merchantName: 'Starbucks Grand Indonesia',
    receiptUrl: 'https://images.unsplash.com/photo-1554415707-9e49016a3455?auto=format&fit=crop&w=600&q=80',
    receiptItems: getReceiptItemsForTx('tx_1011'),
    transactionDate: '2026-10-13T09:15:00+07:00',
    createdAt: '2026-10-13T09:15:00+07:00',
  },
  {
    id: 'tx_1012',
    userId: DEMO_USER_ID,
    walletId: 'wal_bca_01',
    categoryId: 'cat_makanan',
    type: 'expense',
    amount: 35000,
    description: 'Nasi padang rendang komplit RM Surya',
    source: 'telegram_text',
    transactionDate: '2026-10-13T12:30:00+07:00',
    createdAt: '2026-10-13T12:30:00+07:00',
  },
  {
    id: 'tx_1013',
    userId: DEMO_USER_ID,
    walletId: 'wal_gopay_04',
    categoryId: 'cat_belanja',
    type: 'expense',
    amount: 54000,
    description: 'Belanja Sarapan & Roti Alfamart Benhil',
    source: 'telegram_photo',
    merchantName: 'Alfamart Benhil',
    receiptUrl: 'https://images.unsplash.com/photo-1554415707-9e49016a3455?auto=format&fit=crop&w=600&q=80',
    receiptItems: getReceiptItemsForTx('tx_1013'),
    transactionDate: '2026-10-14T08:30:00+07:00',
    createdAt: '2026-10-14T08:30:00+07:00',
  }
];

// ==============================================================================
// 8. MASTER SUBSCRIPTION PLANS & USER SUBSCRIPTIONS
// ==============================================================================

export const SEED_SUBSCRIPTION_PLANS = [
  {
    id: 'plan_starter',
    slug: 'starter',
    name: 'Starter Plan',
    price: 49000,
    billing_type: 'monthly',
    features_json: {
      max_wallets: 3,
      max_categories: 5,
      max_transactions_monthly: 50,
      receipt_ocr: false,
      voice_stt: false,
      financial_advisor: false,
      export_formats: ['pdf']
    },
    is_active: true
  },
  {
    id: 'plan_pro',
    slug: 'pro',
    name: 'Pro Lifetime',
    price: 99000,
    billing_type: 'lifetime',
    features_json: {
      max_wallets: 999,
      max_categories: 999,
      max_transactions_monthly: 999999,
      receipt_ocr: true,
      voice_stt: true,
      financial_advisor: true,
      export_formats: ['pdf', 'xlsx']
    },
    is_active: true
  }
];

export const SEED_USER_SUBSCRIPTIONS = [
  {
    id: 'sub_demo_01',
    user_id: DEMO_USER_ID,
    plan_id: 'plan_pro',
    status: 'active',
    payment_gateway: 'midtrans',
    midtrans_order_id: 'ORDER-TATADANA-20260901-098',
    amount: 99000,
    approved_at: '2026-05-01T08:00:00+07:00'
  },
  {
    id: 'sub_siti_02',
    user_id: STARTER_USER_ID,
    plan_id: 'plan_pro',
    status: 'pending',
    payment_gateway: 'manual_transfer',
    midtrans_order_id: 'ORDER-TATADANA-20261012-001',
    amount: 99000,
    proof_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
    admin_notes: 'Bukti transfer BCA an Siti Rahma nominal Rp99.000'
  }
];

// Payments for store.ts backward compatibility
export const SEED_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay_01',
    userId: STARTER_USER_ID,
    userName: 'Siti Rahma',
    userEmail: 'siti.rahma@ui.ac.id',
    orderId: 'ORDER-TATADANA-20261012-001',
    plan: 'pro',
    amount: 99000,
    paymentMethod: 'manual_transfer',
    status: 'pending',
    proofImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
    adminNotes: 'Bukti transfer BCA an Siti Rahma nominal Rp99.000',
    createdAt: '2026-10-12T14:10:00+07:00'
  },
  {
    id: 'pay_02',
    userId: DEMO_USER_ID,
    userName: 'Budi Pratama (Demo Pro)',
    userEmail: 'budi.pratama@gmail.com',
    orderId: 'ORDER-TATADANA-20260901-098',
    plan: 'pro',
    amount: 99000,
    paymentMethod: 'midtrans_qris',
    status: 'settled',
    createdAt: '2026-05-01T08:00:00+07:00'
  }
];

// ==============================================================================
// 9. AI MULTI-PROVIDER CONFIGS & LOGS
// ==============================================================================

export const SEED_AI_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'cfg_gemini',
    provider: 'gemini',
    name: 'Google Gemini 1.5 Flash',
    apiKeyEncrypted: 'AIzaSyDemoTataDanaKeyGemini12345',
    modelName: 'gemini-1.5-flash',
    isActive: true,
    priority: 1,
    mode: 'parallel_failover',
    createdAt: '2026-05-01T00:00:00+07:00'
  },
  {
    id: 'cfg_openai',
    provider: 'openai',
    name: 'OpenAI GPT-4o Mini',
    apiKeyEncrypted: 'sk-proj-demoOpenAIKeyTataDana98765',
    modelName: 'gpt-4o-mini',
    isActive: true,
    priority: 2,
    mode: 'parallel_failover',
    createdAt: '2026-05-01T00:00:00+07:00'
  },
  {
    id: 'cfg_deepseek',
    provider: 'deepseek',
    name: 'DeepSeek Chat V3',
    apiKeyEncrypted: 'sk-deepseek-demoTataDanaKey554433',
    modelName: 'deepseek-chat',
    isActive: true,
    priority: 3,
    mode: 'parallel_failover',
    createdAt: '2026-05-01T00:00:00+07:00'
  }
];

export const SEED_AI_LOGS: AILog[] = [
  {
    id: 'log_01',
    userId: DEMO_USER_ID,
    feature: 'text_parser',
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    promptSummary: 'Parse text: "beli bakso 15rb"',
    latencyMs: 382,
    tokensUsed: 145,
    status: 'success',
    createdAt: '2026-10-13T12:30:02+07:00'
  },
  {
    id: 'log_02',
    userId: DEMO_USER_ID,
    feature: 'receipt_vision',
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    promptSummary: 'Extract items & merchant from receipt photo (Indomaret Point Sudirman)',
    latencyMs: 1240,
    tokensUsed: 620,
    status: 'success',
    createdAt: '2026-10-12T19:45:05+07:00'
  },
  {
    id: 'log_03',
    userId: DEMO_USER_ID,
    feature: 'voice_stt',
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    promptSummary: 'Transcribe 8s audio: "Kopi kenangan 28 ribu..."',
    latencyMs: 780,
    tokensUsed: 310,
    status: 'success',
    createdAt: '2026-10-08T15:30:02+07:00'
  },
  {
    id: 'log_04',
    userId: DEMO_USER_ID,
    feature: 'financial_advisor',
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    promptSummary: 'Evaluate budget status: Kopi & Nongkrong at 82% threshold',
    latencyMs: 512,
    tokensUsed: 290,
    status: 'success',
    createdAt: '2026-10-13T09:16:00+07:00'
  }
];

// ==============================================================================
// 10. AUDIT LOGS, EXPORTS & TELEGRAM
// ==============================================================================

export const SEED_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'audit_01',
    adminId: ADMIN_USER_ID,
    adminEmail: 'sellanrhrdni123@gmail.com',
    targetUserId: DEMO_USER_ID,
    action: 'VIEW_USER_TRANSACTIONS',
    details: { reason: 'User requested support regarding receipt OCR breakdown' },
    createdAt: '2026-10-12T20:00:00+07:00'
  }
];

export const SEED_EXPORT_HISTORY: ExportRecord[] = [
  {
    id: 'exp_01',
    userId: DEMO_USER_ID,
    fileName: 'Laporan_Keuangan_September_2026.pdf',
    format: 'pdf',
    periodLabel: 'September 2026',
    fileSizeBytes: 245800,
    downloadUrl: 'https://exports.tatadana.id/signed/Laporan_Keuangan_September_2026.pdf',
    createdAt: '2026-10-01T09:00:00+07:00'
  },
  {
    id: 'exp_02',
    userId: DEMO_USER_ID,
    fileName: 'Transaksi_Q3_2026.xlsx',
    format: 'xlsx',
    periodLabel: 'Q3 2026 (Juli - September)',
    fileSizeBytes: 89400,
    downloadUrl: 'https://exports.tatadana.id/signed/Transaksi_Q3_2026.xlsx',
    createdAt: '2026-10-02T14:30:00+07:00'
  }
];

export const SEED_TELEGRAM_BOT_CONFIGS = [
  {
    id: 'tbc_demo_01',
    user_id: DEMO_USER_ID,
    bot_token_encrypted: 'enc_7234567890_AAHkL123456789abcdefghijklmnopqrstuv',
    telegram_chat_id: 109283742,
    telegram_username: 'budipratama_id',
    is_connected: true,
    webhook_url: 'https://api.tatadana.id/api/telegram/webhook',
    reminder_enabled: true,
    reminder_times: ['12:30', '20:00'],
    last_active_at: '2026-10-14T08:30:00+07:00'
  }
];

export const SEED_TELEGRAM_UPDATES: TelegramUpdate[] = [
  {
    updateId: 9001234,
    userId: DEMO_USER_ID,
    chatId: 109283742,
    messageText: 'Gaji Pokok Oktober 2026 PT Maju Digital',
    status: 'processed',
    createdAt: '2026-10-01T08:00:00+07:00'
  },
  {
    updateId: 9001235,
    userId: DEMO_USER_ID,
    chatId: 109283742,
    messageText: 'Nasi padang rendang komplit RM Surya 35rb',
    status: 'processed',
    createdAt: '2026-10-13T12:30:00+07:00'
  }
];
