import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Transaction, Wallet, Category, ExportRecord } from './types';
import { formatIDR, formatWIBDate } from './utils';
import { getBrowserClient } from './supabase/client';
import { getAdminClient } from './supabase/admin';
import { isSupabaseConfigured, getSupabaseEnvConfig } from './supabase/config';
import { mapExportFromDb } from './supabase/mappers';
import { store } from './storage';

export interface ReportSummary {
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  transactionCount: number;
  topCategories: { name: string; amount: number; percentage: number }[];
}

/**
 * Calculate financial summary for transactions
 */
export function calculateReportSummary(
  transactions: Transaction[],
  categories: Category[]
): ReportSummary {
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryTotals: { [name: string]: number } = {};

  transactions.forEach(t => {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else if (t.type === 'expense') {
      totalExpense += t.amount;
      const cat = categories.find(c => c.id === t.categoryId);
      const catName = cat ? `${cat.emoji} ${cat.name}` : 'Lainnya';
      categoryTotals[catName] = (categoryTotals[catName] || 0) + t.amount;
    }
  });

  const netCashflow = totalIncome - totalExpense;
  const topCategories = Object.entries(categoryTotals)
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return {
    totalIncome,
    totalExpense,
    netCashflow,
    transactionCount: transactions.length,
    topCategories
  };
}

/**
 * Generate PDF Report on demand
 */
export function generatePDFReport(
  transactions: Transaction[],
  wallets: Wallet[],
  categories: Category[],
  userName: string,
  periodLabel: string
): { doc: jsPDF; fileName: string; fileSize: number } {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const summary = calculateReportSummary(transactions, categories);

  // Header Banner
  doc.setFillColor(249, 115, 22); // Orange #F97316
  doc.rect(0, 0, 210, 36, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('TataDana', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Laporan Keuangan & Arus Kas Pribadi', 14, 25);
  doc.text(`Periode: ${periodLabel} | User: ${userName}`, 14, 30);

  // Summary Cards
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Ringkasan Arus Kas', 14, 46);

  const startY = 50;
  // Box 1: Pemasukan
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, startY, 56, 22, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52);
  doc.text('TOTAL PEMASUKAN', 18, startY + 6);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(formatIDR(summary.totalIncome), 18, startY + 15);

  // Box 2: Pengeluaran
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(77, startY, 56, 22, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(153, 27, 27);
  doc.text('TOTAL PENGELUARAN', 81, startY + 6);
  doc.setFontSize(12);
  doc.text(formatIDR(summary.totalExpense), 81, startY + 15);

  // Box 3: Net Cashflow
  const isNetPositive = summary.netCashflow >= 0;
  doc.setFillColor(isNetPositive ? 255, 247, 237 : 254, 242, 242);
  doc.roundedRect(140, startY, 56, 22, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(isNetPositive ? 194, 65, 12 : 153, 27, 27);
  doc.text('NET CASHFLOW', 144, startY + 6);
  doc.setFontSize(12);
  doc.text(formatIDR(summary.netCashflow), 144, startY + 15);

  // Top 5 Categories Section
  let tableStartY = 80;
  if (summary.topCategories.length > 0) {
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Top Kategori Pengeluaran:', 14, 78);

    const catSummaryRows = summary.topCategories.map(c => [
      c.name,
      formatIDR(c.amount),
      `${c.percentage}%`
    ]);

    autoTable(doc, {
      startY: 81,
      head: [['Kategori', 'Nominal Terpakai', 'Porsi Pengeluaran']],
      body: catSummaryRows,
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: 14, right: 14 },
    });

    const lastTable = (doc as any).lastAutoTable;
    tableStartY = lastTable ? lastTable.finalY + 10 : 100;
  }

  // Transactions Table
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Rincian Transaksi:', 14, tableStartY);

  const txRows = transactions.map(t => {
    const dateFormatted = formatWIBDate(t.transactionDate);
    const wallet = wallets.find(w => w.id === t.walletId)?.name || 'Dompet';
    const cat = categories.find(c => c.id === t.categoryId)?.name || '-';
    const typeLabel = t.type === 'income' ? '+ Pemasukan' : t.type === 'expense' ? '- Pengeluaran' : 'Transfer';
    const amountLabel = formatIDR(t.amount);
    const receiptNote = t.receiptItems && t.receiptItems.length > 0
      ? ` (Struk: ${t.receiptItems.length} item)`
      : '';
    return [
      dateFormatted,
      typeLabel,
      amountLabel,
      cat,
      wallet,
      `${t.description}${receiptNote}`
    ];
  });

  autoTable(doc, {
    startY: tableStartY + 3,
    head: [['Tanggal', 'Tipe', 'Nominal', 'Kategori', 'Dompet', 'Catatan']],
    body: txRows,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 24 },
      2: { cellWidth: 26 },
      3: { cellWidth: 30 },
      4: { cellWidth: 26 },
      5: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
  });

  const fileName = `TataDana_Laporan_${periodLabel.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  const pdfOutput = doc.output('blob');
  const arrayBuffer = doc.output('arraybuffer');
  const buffer = new Uint8Array(arrayBuffer);

  return {
    doc,
    fileName,
    fileSize: pdfOutput.size,
    buffer
  };
}

/**
 * Generate Excel (.xlsx) Report on demand
 */
export function generateExcelReport(
  transactions: Transaction[],
  wallets: Wallet[],
  categories: Category[],
  userName: string,
  periodLabel: string
): { wb: XLSX.WorkBook; fileName: string; buffer: Uint8Array } {
  const summary = calculateReportSummary(transactions, categories);

  // Sheet 1: Rincian Transaksi
  const txData = transactions.map((t, idx) => {
    const wallet = wallets.find(w => w.id === t.walletId)?.name || 'Dompet';
    const cat = categories.find(c => c.id === t.categoryId)?.name || '-';
    return {
      'No': idx + 1,
      'Tanggal (WIB)': formatWIBDate(t.transactionDate),
      'Tipe Transaksi': t.type.toUpperCase(),
      'Nominal (Rp)': t.amount,
      'Kategori': cat,
      'Dompet': wallet,
      'Sumber': t.source,
      'Catatan': t.description,
      'Merchant': t.merchantName || '-',
      'Item Struk': t.receiptItems ? t.receiptItems.map(i => `${i.name} (Rp${i.price})`).join('; ') : '-'
    };
  });

  // Sheet 2: Ringkasan
  const summaryData = [
    { 'Metrik': 'Pengguna', 'Nilai': userName },
    { 'Metrik': 'Periode Laporan', 'Nilai': periodLabel },
    { 'Metrik': 'Total Transaksi', 'Nilai': summary.transactionCount },
    { 'Metrik': 'Total Pemasukan (Rp)', 'Nilai': summary.totalIncome },
    { 'Metrik': 'Total Pengeluaran (Rp)', 'Nilai': summary.totalExpense },
    { 'Metrik': 'Net Cashflow (Rp)', 'Nilai': summary.netCashflow },
    ...summary.topCategories.map(c => ({
      'Metrik': `Kategori: ${c.name}`,
      'Nilai': `Rp${c.amount.toLocaleString('id-ID')} (${c.percentage}%)`
    }))
  ];

  const wb = XLSX.utils.book_new();
  const wsTx = XLSX.utils.json_to_sheet(txData);
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);

  XLSX.utils.book_append_sheet(wb, wsTx, 'Daftar Transaksi');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Keuangan');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const fileName = `TataDana_Laporan_${periodLabel.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;

  return {
    wb,
    fileName,
    buffer: new Uint8Array(excelBuffer)
  };
}

// ==============================================================================
// SUPABASE STORAGE & SIGNED URL EXPORT INTEGRATION
// ==============================================================================

/**
 * Returns the active Supabase Client (browser or admin service role)
 */
export function getActiveSupabaseClient() {
  if (typeof window === 'undefined') {
    return getAdminClient();
  }
  return getBrowserClient();
}

export interface UploadExportParams {
  userId: string;
  fileName: string;
  fileType: 'pdf' | 'xlsx';
  buffer: Uint8Array;
  fileSize: number;
  periodLabel: string;
  periodStart?: string | null;
  periodEnd?: string | null;
}

export interface UploadExportResult {
  signedUrl: string | null;
  record: ExportRecord;
}

/**
 * Uploads generated document buffer to Supabase Storage bucket 'tatadana-exports'
 * under exports/${userId}/${fileName}, generates a signed URL valid for 24h,
 * and records the export in the 'report_exports' table.
 */
export async function uploadAndRecordExport(
  params: UploadExportParams
): Promise<UploadExportResult> {
  const {
    userId,
    fileName,
    fileType,
    buffer,
    fileSize,
    periodLabel,
    periodStart,
    periodEnd
  } = params;

  const bucket = getSupabaseEnvConfig().storageBucket || 'tatadana-exports';
  const storagePath = `exports/${userId}/${fileName}`;
  let signedUrl: string | null = null;
  const client = getActiveSupabaseClient();

  if (client && isSupabaseConfigured()) {
    try {
      const contentType = fileType === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      // 1. Upload to Supabase Storage
      const { error: uploadErr } = await client.storage
        .from(bucket)
        .upload(storagePath, buffer, {
          contentType,
          upsert: true
        });

      if (uploadErr) {
        console.warn('Supabase storage upload error:', uploadErr.message);
      } else {
        // 2. Generate signed URL valid for 24h (86400 seconds)
        const { data: signedData, error: signedErr } = await client.storage
          .from(bucket)
          .createSignedUrl(storagePath, 24 * 60 * 60);

        if (!signedErr && signedData?.signedUrl) {
          signedUrl = signedData.signedUrl;
        }
      }

      // 3. Insert record into report_exports table
      const { data: recordData, error: recordErr } = await client
        .from('report_exports')
        .insert({
          user_id: userId,
          file_name: fileName,
          file_url: signedUrl || storagePath,
          file_type: fileType,
          period_start: periodStart || null,
          period_end: periodEnd || null,
          file_size_bytes: fileSize,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (!recordErr && recordData) {
        const mapped = mapExportFromDb(recordData);
        // Sync with local store
        store.addExportRecord({
          userId,
          fileName,
          format: fileType,
          periodLabel,
          fileSizeBytes: fileSize,
          downloadUrl: signedUrl || undefined
        });
        return { signedUrl, record: mapped };
      }
    } catch (err: any) {
      console.warn('Supabase export integration exception:', err?.message || err);
    }
  }

  // Fallback to local store
  const localRecord = store.addExportRecord({
    userId,
    fileName,
    format: fileType,
    periodLabel,
    fileSizeBytes: fileSize,
    downloadUrl: signedUrl || undefined
  });

  return { signedUrl, record: localRecord };
}

/**
 * Generates fresh 24h signed URL for an existing export file in Supabase Storage
 */
export async function getSignedExportUrl(
  userId: string,
  fileName: string
): Promise<string | null> {
  const client = getActiveSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    return null;
  }

  try {
    const bucket = getSupabaseEnvConfig().storageBucket || 'tatadana-exports';
    const storagePath = `exports/${userId}/${fileName}`;
    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrl(storagePath, 24 * 60 * 60);

    if (error || !data) {
      console.warn('Failed to generate signed URL:', error?.message);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.warn('Error fetching signed export URL:', err);
    return null;
  }
}

/**
 * Fetches user export history from report_exports table with fallback to store
 */
export async function fetchExportHistory(userId: string): Promise<ExportRecord[]> {
  const client = getActiveSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      const { data, error } = await client
        .from('report_exports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map(mapExportFromDb);
      }
    } catch (err) {
      console.warn('Failed to fetch report_exports from Supabase:', err);
    }
  }

  return store.getExportHistory(userId);
}
