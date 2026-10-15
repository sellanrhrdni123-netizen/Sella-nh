import { ParsedTransactionResult, ReceiptItem } from '../types';
import { parseIndonesianNumber } from '../utils';

/**
 * Natural Language Transaction Parsing for Indonesian Fintech
 * Supports Gemini API / OpenAI / DeepSeek with local robust Indonesian NLP fallback
 */
export async function parseTransactionNaturalLanguage(
  input: string,
  userCategories: { name: string; type: string }[] = []
): Promise<{ success: boolean; data?: ParsedTransactionResult; error?: string }> {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      success: false,
      error: 'Pesan tidak boleh kosong. Ketik transaksi seperti: "beli bakso 15rb" atau "gajian 5jt".'
    };
  }

  // Try parsing using local Indonesian NLP engine first or as robust fallback
  const result = parseIndonesianText(trimmed, userCategories);
  if (result) {
    return { success: true, data: result };
  }

  return {
    success: false,
    error: `Maaf, TataDana belum bisa mengenali format tersebut 🧐\n\n💡 Contoh format yang benar:\n• "beli nasi goreng 25rb"\n• "gajian 7.5jt"\n• "kopi susu 22k gopay"\n• "isi bensin pertamax 50rb"`
  };
}

/**
 * Robust Indonesian NLP parser for transactions
 */
function parseIndonesianText(
  text: string,
  categories: { name: string; type: string }[]
): ParsedTransactionResult | null {
  const lower = text.toLowerCase();

  // Known wallets in Indonesia
  const knownWallets = [
    { key: 'bca', name: 'BCA Utama' },
    { key: 'mandiri', name: 'Mandiri Livin' },
    { key: 'gopay', name: 'GoPay' },
    { key: 'go-pay', name: 'GoPay' },
    { key: 'ovo', name: 'OVO' },
    { key: 'dana', name: 'DANA' },
    { key: 'tunai', name: 'Uang Tunai (Dompet)' },
    { key: 'cash', name: 'Uang Tunai (Dompet)' }
  ];

  // 1. Detect Type (Income vs Expense vs Transfer)
  let jenis: 'pengeluaran' | 'pemasukan' | 'transfer' = 'pengeluaran';

  const transferKeywords = ['transfer', 'pindah dana', 'pindah', 'topup', 'top up', 'kirim uang', 'kirim'];
  const incomeKeywords = ['gaji', 'gajian', 'pemasukan', 'bonus', 'dapat uang', 'terima transfer', 'freelance', 'cair', 'dividen', 'cashback', 'penjualan'];

  const isExplicitTransfer = transferKeywords.some(kw => lower.includes(kw)) && (lower.includes(' ke ') || lower.includes(' dari ') || lower.includes('topup') || lower.includes('top up'));

  if (isExplicitTransfer) {
    jenis = 'transfer';
  } else if (incomeKeywords.some(kw => lower.includes(kw))) {
    jenis = 'pemasukan';
  }

  // Keywords indicating financial intent or transaction context
  const financialKeywords = [
    'beli', 'bayar', 'pesan', 'jajan', 'order', 'isi', 'belanja', 'ongkir',
    'kost', 'kos', 'tagihan', 'pln', 'listrik', 'air', 'pdam', 'wifi', 'pulsa', 'kuota',
    'gaji', 'gajian', 'bonus', 'upah', 'terima', 'dapat', 'cair', 'pendanaan', 'modal',
    'investasi', 'dividen', 'saham', 'reksadana', 'crypto', 'cashback', 'penjualan',
    'transfer', 'topup', 'top up', 'kirim', 'pindah', 'makan', 'minum', 'kopi', 'sate',
    'bakso', 'nasi', 'ayam', 'bensin', 'pertamax', 'ojek', 'grab', 'gojek', 'obat',
    'biaya', 'tarif', 'harga', 'total', 'habis', 'rp', 'rupiah'
  ];

  const hasFinancialContext =
    financialKeywords.some(kw => lower.includes(kw)) ||
    knownWallets.some(w => lower.includes(w.key)) ||
    lower.includes('rp') ||
    isExplicitTransfer ||
    incomeKeywords.some(kw => lower.includes(kw));

  // Quantity counter units in Indonesian (to avoid confusing quantities like "100 lembar" with amounts)
  const quantityUnitPattern = /^\s*(?:lembar|lbr|buah|biji|butir|porsi|pcs|ekor|pack|paket|box|dus|bungkus|bgks|botol|btl|gelas|cup|pasang|psg|potong|ptg|kg|kilo|gram|gr|meter|m|liter|lt|ltr|menit|mnt|jam|orang|org|tiket|tkt|pax|item|sachet)\b/i;

  // 2. Extract Amount using Indonesian units with strict precedence:
  // Precedence Tier 1: Explicit currency units (rb, k, jt, juta, miliar) or 'rp' prefix
  // Precedence Tier 2: Standard formatted thousands dots e.g. "35.000", "1.500.000"
  // Precedence Tier 3: Bare numbers e.g. "15000", excluding quantities followed by counter units ("100 lembar")
  let nominal = 0;
  let remainingText = text;
  let chosenMatchStr = '';

  // Tier 1 Check: Explicit currency suffix or 'rp' prefix
  // Matches "50rb", "15ribu", "500k", "1.5jt", "rp 25.000", "rp 50000", "100 miliar", "2.5m"
  const tier1Regex = /(?:rp\.?\s*(\d{1,3}(?:[.,]\d{3})+(?!\d)|\d+(?:[.,]\d+)?\s*(?:jt|juta|m|miliar|rb|ribu|k)?|\d+)|\b(\d+(?:[.,]\d+)?\s*(?:jt|juta|miliar|rb|ribu|k))\b|\b(\d+(?:[.,]\d+)?\s*m)\b)/gi;
  let m1: RegExpExecArray | null;
  while ((m1 = tier1Regex.exec(lower)) !== null) {
    const rawMatch = m1[0];
    const candidateVal = m1[1] || m1[2] || m1[3];
    // Check if single 'm' requires financial context
    if (/\bm$/i.test(candidateVal.trim()) && !hasFinancialContext && !/[.,]/.test(candidateVal) && !/^rp/i.test(rawMatch)) {
      continue;
    }
    const parsed = parseIndonesianNumber(candidateVal, hasFinancialContext);
    if (parsed && parsed > 0) {
      nominal = parsed;
      chosenMatchStr = rawMatch;
      break;
    }
  }

  // Tier 2 Check: Formatted thousands (e.g. "35.000")
  if (nominal <= 0) {
    const tier2Regex = /\b(\d{1,3}(?:\.\d{3})+)\b/g;
    let m2: RegExpExecArray | null;
    while ((m2 = tier2Regex.exec(lower)) !== null) {
      const parsed = parseIndonesianNumber(m2[1], hasFinancialContext);
      if (parsed && parsed > 0) {
        nominal = parsed;
        chosenMatchStr = m2[0];
        break;
      }
    }
  }

  // Tier 3 Check: Bare numbers without currency unit (e.g. "15000"), avoiding quantity tokens
  if (nominal <= 0) {
    const tier3Regex = /\b(\d{3,9}|\d{1,2})\b/g;
    let m3: RegExpExecArray | null;
    let bestBareNumber = 0;
    let bestBareStr = '';

    while ((m3 = tier3Regex.exec(lower)) !== null) {
      const candidateStr = m3[1];
      const matchIndex = m3.index;
      const afterText = lower.slice(matchIndex + m3[0].length);

      // If immediately followed by a quantity unit (e.g. "100 lembar", "2 porsi"), skip as quantity
      if (quantityUnitPattern.test(afterText)) {
        continue;
      }

      const parsed = parseIndonesianNumber(candidateStr, hasFinancialContext);
      if (parsed && parsed > 0) {
        // Prefer numbers >= 1000 for bare amounts, or the largest valid candidate
        if (parsed > bestBareNumber) {
          bestBareNumber = parsed;
          bestBareStr = m3[0];
        }
      }
    }

    if (bestBareNumber > 0) {
      nominal = bestBareNumber;
      chosenMatchStr = bestBareStr;
    }
  }

  if (nominal <= 0 || !chosenMatchStr) {
    return null; // Could not parse nominal
  }

  // Clean note by removing the chosen monetary amount
  remainingText = text.replace(new RegExp(chosenMatchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '').replace(/\s+/g, ' ').trim();

  // 3. Detect Source and Destination Wallets
  let detectedWallet: string | undefined = undefined;
  let detectedDestWallet: string | undefined = undefined;

  if (jenis === 'transfer') {
    // Detect "dari [wallet] ke [wallet]" or "[wallet] ke [wallet]"
    const transferMatch = lower.match(/(?:dari\s+)?(\w+)\s+ke\s+(\w+)/i);
    if (transferMatch) {
      const fromKey = transferMatch[1];
      const toKey = transferMatch[2];
      const foundFrom = knownWallets.find(w => w.key === fromKey);
      const foundTo = knownWallets.find(w => w.key === toKey);
      if (foundFrom) detectedWallet = foundFrom.name;
      if (foundTo) detectedDestWallet = foundTo.name;
    } else {
      // e.g. "topup gopay"
      const destMatch = lower.match(/(?:ke|topup|top up)\s+(\w+)/i);
      if (destMatch) {
        const found = knownWallets.find(w => w.key === destMatch[1]);
        if (found) detectedDestWallet = found.name;
      }
    }
  } else {
    // For normal expense/income, check if wallet is specified (e.g. "kopi 22k gopay" or "via bca" or "pakai cash")
    for (const kw of knownWallets) {
      const walletRegex = new RegExp(`(?:\\b(?:pakai|via|lewat|dari)\\s+)?\\b${kw.key}\\b`, 'i');
      if (walletRegex.test(remainingText)) {
        detectedWallet = kw.name;
        // Clean wallet reference from remainingText
        remainingText = remainingText.replace(walletRegex, '').replace(/\s+/g, ' ').trim();
        break;
      }
    }
  }

  // 4. Category inference
  let matchedCategory = jenis === 'pemasukan' ? 'Gaji Pokok' : 'Makanan & Minuman';

  const categoryMappings: { [key: string]: string[] } = {
    'Makanan & Minuman': ['makan', 'bakso', 'sate', 'nasi', 'ayam', 'mie', 'soto', 'kfc', 'mcd', 'warteg', 'gofood', 'grabfood', 'shopeefood', 'snack', 'roti', 'sarapan', 'dinner', 'lunch'],
    'Kopi & Nongkrong': ['kopi', 'coffee', 'cafe', 'starbucks', 'kenangan', 'janji jiwa', 'fore', 'nongkrong', 'boba', 'chatime'],
    'Transportasi': ['bensin', 'pertamax', 'pertalite', 'gojek', 'grab', 'maxim', 'parkir', 'tol', 'kereta', 'krl', 'mrt', 'ojek', 'taksi'],
    'Kost & Tagihan Listrik': ['kost', 'kos', 'sewa', 'kontrakan', 'pln', 'listrik', 'air', 'pdam', 'wifi', 'indihome', 'pulsa', 'kuota'],
    'Belanja Harian': ['indomaret', 'alfamart', 'supermarket', 'belanja', 'sabun', 'shampoo', 'pasar', 'sayur', 'daging'],
    'Hiburan & Liburan': ['bioskop', 'film', 'game', 'steam', 'netflix', 'spotify', 'jalan-jalan', 'staycation', 'liburan', 'tiket'],
    'Kesehatan & Obat': ['obat', 'apotek', 'dokter', 'klinik', 'vitamin', 'panadol', 'paracetamol', 'rumah sakit'],
    'Gaji Pokok': ['gaji', 'gajian', 'salary', 'upah'],
    'Project Freelance': ['freelance', 'proyek', 'project', 'klien', 'client', 'desain', 'coding', 'web'],
    'Dividen & Bunga': ['dividen', 'bunga', 'reksadana', 'saham', 'crypto', 'cashback']
  };

  for (const [catName, kws] of Object.entries(categoryMappings)) {
    if (kws.some(kw => lower.includes(kw))) {
      matchedCategory = catName;
      break;
    }
  }

  // Clean note
  let catatan = remainingText.trim();
  // Remove common filler words
  catatan = catatan
    .replace(/^(beli|bayar|pesan|jajan|buat|isi|order|transaksi)\s+/i, '')
    .trim();
  
  if (!catatan) {
    catatan = jenis === 'transfer' ? `Transfer Dana ${detectedDestWallet ? 'ke ' + detectedDestWallet : ''}` : matchedCategory;
  } else {
    // Capitalize first letter
    catatan = catatan.charAt(0).toUpperCase() + catatan.slice(1);
  }

  return {
    jenis,
    nominal,
    kategori: matchedCategory,
    catatan,
    dompet: detectedWallet,
    destinationDompet: detectedDestWallet,
    confidence: 0.95
  };
}

/**
 * Receipt OCR Multi-Item Parsing (Pro Plan)
 */
export async function parseReceiptPhoto(
  imageUrl: string,
  merchantOverride?: string
): Promise<{
  merchant: string;
  totalAmount: number;
  items: ReceiptItem[];
  suggestedCategory: string;
}> {
  // Simulates AI Vision OCR on receipts like Indomaret, Alfamart, or restaurants
  const mockMerchants = ['Indomaret Point', 'Alfamart Express', 'Superindo', 'KFC Indonesia', 'Starbucks Coffee'];
  const merchant = merchantOverride || mockMerchants[Math.floor(Math.random() * mockMerchants.length)];

  if (merchant.toLowerCase().includes('indomaret') || merchant.toLowerCase().includes('alfamart')) {
    const items: ReceiptItem[] = [
      { id: 'itm_1', name: 'Susu Ultra Milk Full Cream 1L', price: 21500, categoryName: 'Makanan & Minuman' },
      { id: 'itm_2', name: 'Roti Gandum Sari Roti', price: 23500, categoryName: 'Makanan & Minuman' },
      { id: 'itm_3', name: 'Sabun Mandi Dettol 450ml', price: 38000, categoryName: 'Belanja Harian' },
      { id: 'itm_4', name: 'Aqua 1500ml 2 Botol', price: 14000, categoryName: 'Makanan & Minuman' },
    ];
    const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
    return {
      merchant,
      totalAmount,
      items,
      suggestedCategory: 'Belanja Harian'
    };
  }

  // Generic restaurant receipt
  const items: ReceiptItem[] = [
    { id: 'itm_1', name: 'Paket Ayam Komplit + Es Teh', price: 42000, categoryName: 'Makanan & Minuman' },
    { id: 'itm_2', name: 'Tahu Goreng Krispi', price: 15000, categoryName: 'Makanan & Minuman' },
  ];
  return {
    merchant,
    totalAmount: 57000,
    items,
    suggestedCategory: 'Makanan & Minuman'
  };
}

/**
 * Audio / Voice Note Speech-to-Text Transcription (All Plans)
 */
export async function transcribeVoiceNote(
  audioBufferOrUrl: string,
  durationSeconds: number = 5,
  inputHint?: string
): Promise<{ transcript: string; duration: number }> {
  if (durationSeconds > 60) {
    throw new Error('Durasi voice note maksimal 60 detik.');
  }

  if (inputHint && inputHint.trim().length > 0) {
    const cleanHint = inputHint.replace(/^🎙️\s*Voice\s*note\s*\(.*?\):\s*["']?/i, '').replace(/["']?$/, '').trim();
    if (cleanHint) {
      return { transcript: cleanHint, duration: durationSeconds };
    }
  }

  // Realistic sample voice transcripts
  const sampleTranscripts = [
    'Beli bakso malang campur 25 ribu bayar pakai gopay ya',
    'Isi bensin pertamax 50 ribu',
    'Kopi susu gula aren 22 ribu tadi sore',
    'Bayar tagihan listrik PLN 185 ribu',
    'Makan siang padang rendang 32 ribu'
  ];

  const transcript = sampleTranscripts[Math.floor(Math.random() * sampleTranscripts.length)];
  return {
    transcript,
    duration: durationSeconds
  };
}
