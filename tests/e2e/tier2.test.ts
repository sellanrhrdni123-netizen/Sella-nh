/**
 * TataDana E2E Test Suite - Tier 2: Boundary & Corner Cases
 * Verifies system resilience under extreme values, empty inputs, limit cutoffs, and edge conditions (35+ tests).
 */

import {
  assertEqual,
  assertTrue,
  assertFalse,
  assertContains,
  assertThrowsAsync,
  resetTestStore,
  callTelegramWebhook,
  callMidtransWebhook
} from './test-helpers';
import { store, DEMO_USER_ID } from '../../src/lib/storage';
import { parseTransactionNaturalLanguage, transcribeVoiceNote } from '../../src/lib/ai/parser';
import { handleBotCommand } from '../../src/lib/telegram';
import { parseIndonesianNumber, formatIDR } from '../../src/lib/utils';

export async function runTier2Tests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  const runTest = async (name: string, fn: () => void | Promise<void>) => {
    try {
      resetTestStore();
      await fn();
      results.push({ name, passed: true });
    } catch (err: any) {
      results.push({ name, passed: false, error: err.stack || err.message || String(err) });
    }
  };

  // ============================================================================
  // 1. EMPTY & WHITESPACE INPUTS (5 Tests)
  // ============================================================================

  await runTest('T2.1.1: Empty Inputs - Empty string returns failure with helpful guidance', async () => {
    const res = await parseTransactionNaturalLanguage('');
    assertFalse(res.success);
    assertContains(res.error!, 'Pesan tidak boleh kosong');
  });

  await runTest('T2.1.2: Empty Inputs - Whitespace-only string returns failure', async () => {
    const res = await parseTransactionNaturalLanguage('     \n\t   ');
    assertFalse(res.success);
    assertContains(res.error!, 'Pesan tidak boleh kosong');
  });

  await runTest('T2.1.3: Empty Inputs - Telegram webhook with empty text returns guidance', async () => {
    const res = await callTelegramWebhook({
      update_id: 2001,
      message: { chat: { id: 109283742 }, text: '   ', date: Math.floor(Date.now() / 1000) }
    });
    assertFalse(res.body.ok);
    assertContains(res.body.reply, 'Pesan tidak boleh kosong');
  });

  await runTest('T2.1.4: Empty Inputs - Standalone amount without description falls back to category name', async () => {
    const res = await parseTransactionNaturalLanguage('50rb');
    assertTrue(res.success);
    assertEqual(res.data?.nominal, 50000);
    assertTrue(Boolean(res.data?.catatan), 'Must have a default fallback note');
  });

  await runTest('T2.1.5: Empty Inputs - findProfileByPhone with unformatted/empty phone is safe', async () => {
    const p1 = store.findProfileByPhone('');
    assertEqual(p1, undefined);
    const p2 = store.findProfileByPhone('0000000000');
    assertEqual(p2, undefined);
  });

  // ============================================================================
  // 2. EXTREME AMOUNTS & PRECISION (5 Tests)
  // ============================================================================

  await runTest('T2.2.1: Extreme Amounts - 100 miliar parses without overflow (Rp100.000.000.000)', async () => {
    const num = parseIndonesianNumber('100 miliar');
    assertEqual(num, 100000000000);

    const res = await parseTransactionNaturalLanguage('pendanaan modal 100 miliar');
    assertTrue(res.success);
    assertEqual(res.data?.nominal, 100000000000);
  });

  await runTest('T2.2.2: Extreme Amounts - Single minimum unit (1 Rupiah)', async () => {
    const num = parseIndonesianNumber('1');
    assertEqual(num, 1);
  });

  await runTest('T2.2.3: Extreme Amounts - Fractional dot decimal ("1.75jt" = 1,750,000)', async () => {
    const num = parseIndonesianNumber('1.75jt');
    assertEqual(num, 1750000);

    const res = await parseTransactionNaturalLanguage('gajian proyek 1.75jt');
    assertTrue(res.success);
    assertEqual(res.data?.nominal, 1750000);
  });

  await runTest('T2.2.4: Extreme Amounts - Fractional comma decimal ("2,5jt" = 2,500,000)', async () => {
    const num = parseIndonesianNumber('2,5jt');
    assertEqual(num, 2500000);

    const res = await parseTransactionNaturalLanguage('terima bonus 2,5juta');
    assertTrue(res.success);
    assertEqual(res.data?.nominal, 2500000);
  });

  await runTest('T2.2.5: Extreme Amounts - formatIDR precision for extreme values', async () => {
    assertEqual(formatIDR(100000000000), 'Rp100.000.000.000');
    assertEqual(formatIDR(0), 'Rp0');
    assertEqual(formatIDR(-50000), 'Rp-50.000');
    assertEqual(formatIDR(NaN), 'Rp0');
  });

  // ============================================================================
  // 3. NEGATIVE VALUES & INVALID SYNTAX (5 Tests)
  // ============================================================================

  await runTest('T2.3.1: Invalid Syntax - Unparseable gibberish returns failure with examples', async () => {
    const res = await parseTransactionNaturalLanguage('xyzqwerty asdfgh');
    assertFalse(res.success);
    assertContains(res.error!, 'Contoh format yang benar:');
  });

  await runTest('T2.3.2: Invalid Syntax - Unrecognized bot command falls back to /bantuan', async () => {
    const user = store.getCurrentUser();
    const reply = handleBotCommand('/command_tidak_dikenal', user, [], [], [], []);
    assertContains(reply, 'Selamat Datang di TataDana Bot!');
    assertContains(reply, 'Daftar Perintah Cepat:');
  });

  await runTest('T2.3.3: Invalid Syntax - Symbols without digits return null in parser', async () => {
    const num = parseIndonesianNumber('$$$###@@@');
    assertEqual(num, null);
  });

  await runTest('T2.3.4: Invalid Syntax - Negative number text rejected or parsed safely', async () => {
    const res = await parseTransactionNaturalLanguage('pengeluaran minus 0 rupiah');
    assertFalse(res.success);
  });

  await runTest('T2.3.5: Invalid Syntax - Midtrans webhook with unknown order_id handles gracefully', async () => {
    const res = await callMidtransWebhook({
      order_id: 'NON_EXISTENT_ORDER_99999',
      transaction_status: 'settlement',
      fraud_status: 'accept'
    });
    assertEqual(res.status, 200);
    assertTrue(res.body.ok);
    assertEqual(res.body.status, 'settled');
  });

  // ============================================================================
  // 4. LONG TEXT & UNICODE / EMOJI STRESS (5 Tests)
  // ============================================================================

  await runTest('T2.4.1: Long Text - 500+ character description parsed without crash', async () => {
    const longDesc = 'Beli perlengkapan kantor ' + 'dan alat tulis '.repeat(40) + '250rb';
    const res = await parseTransactionNaturalLanguage(longDesc);
    assertTrue(res.success);
    assertEqual(res.data?.nominal, 250000);
    assertTrue(res.data!.catatan.length > 50);
  });

  await runTest('T2.4.2: Emoji Stress - Indonesian slang with food emojis', async () => {
    const text = 'Beli sate ayam 🍢🍗 dan es kelapa muda 🥥 35rb pakai gopay';
    const res = await parseTransactionNaturalLanguage(text);
    assertTrue(res.success);
    assertEqual(res.data?.nominal, 35000);
    assertEqual(res.data?.dompet, 'GoPay');
    assertEqual(res.data?.kategori, 'Makanan & Minuman');
  });

  await runTest('T2.4.3: Case Insensitivity - Mixed Indonesian all-caps casing', async () => {
    const text = 'BELI AYAM GEPREK LEVEL 5 25RB PAKAI GOPAY YA';
    const res = await parseTransactionNaturalLanguage(text);
    assertTrue(res.success);
    assertEqual(res.data?.nominal, 25000);
    assertEqual(res.data?.dompet, 'GoPay');
  });

  await runTest('T2.4.4: Special Characters - Quotation marks and brackets in notes', async () => {
    const text = 'bayar "tagihan wifi indihome" (keperluan WFH) 350rb';
    const res = await parseTransactionNaturalLanguage(text);
    assertTrue(res.success);
    assertEqual(res.data?.nominal, 350000);
    assertEqual(res.data?.kategori, 'Kost & Tagihan Listrik');
  });

  await runTest('T2.4.5: Long Merchant Name - Struk OCR with extreme length merchant string', async () => {
    const longMerchant = 'PT Retail Nusantara Super Market Cabang Sudirman Kavling 52-53 Jakarta Pusat';
    const tx = store.addTransaction({
      userId: DEMO_USER_ID,
      walletId: store.getDefaultWallet(DEMO_USER_ID)!.id,
      amount: 450000,
      description: `Struk Belanja: ${longMerchant}`,
      source: 'telegram_photo',
      merchantName: longMerchant,
      transactionDate: new Date().toISOString()
    });
    assertEqual(tx.merchantName, longMerchant);
  });

  // ============================================================================
  // 5. AUDIO / VOICE CUTOFF ENFORCEMENT (5 Tests)
  // ============================================================================

  await runTest('T2.5.1: Voice Cutoff - Audio duration of exactly 60 seconds succeeds', async () => {
    const res = await transcribeVoiceNote('audio_60s.ogg', 60);
    assertEqual(res.duration, 60);
    assertTrue(Boolean(res.transcript));
  });

  await runTest('T2.5.2: Voice Cutoff - Audio duration of 61 seconds throws cutoff error', async () => {
    await assertThrowsAsync(
      async () => {
        await transcribeVoiceNote('audio_61s.ogg', 61);
      },
      'Durasi voice note maksimal 60 detik.'
    );
  });

  await runTest('T2.5.3: Voice Cutoff - Extreme duration audio (120 seconds) throws cutoff error', async () => {
    await assertThrowsAsync(
      async () => {
        await transcribeVoiceNote('audio_120s.ogg', 120);
      },
      'Durasi voice note maksimal 60 detik.'
    );
  });

  await runTest('T2.5.4: Voice Cutoff - Webhook with voice > 60s returns error status without crash', async () => {
    const res = await callTelegramWebhook({
      update_id: 3001,
      type: 'voice',
      duration: 75,
      message: { chat: { id: 109283742 }, voice: { duration: 75 }, date: Math.floor(Date.now() / 1000) }
    });
    assertEqual(res.status, 200);
    assertTrue(res.body.ok);
    assertEqual(res.body.status, 'error');
    assertContains(res.body.replyText || res.body.reply || res.body.error, 'maksimal 60 detik');
  });

  await runTest('T2.5.5: Voice Cutoff - Ultra short audio (1 second) transcribes cleanly', async () => {
    const res = await transcribeVoiceNote('audio_1s.ogg', 1);
    assertEqual(res.duration, 1);
    assertTrue(Boolean(res.transcript));
  });

  // ============================================================================
  // 6. TIER LIMIT ENFORCEMENT (50 TRX/MO LIMIT) (5 Tests)
  // ============================================================================

  await runTest('T2.6.1: Plan Limits - Starter user with under 50 transactions can record transaction', async () => {
    // Siti Rahma is starter user (chat_id: 554433221)
    const res = await callTelegramWebhook({
      update_id: 4001,
      message: { chat: { id: 554433221 }, text: 'beli pulsa 25rb', date: Math.floor(Date.now() / 1000) }
    });
    assertEqual(res.status, 200);
    assertTrue(res.body.ok);
    assertTrue(Boolean(res.body.transaction));
  });

  await runTest('T2.6.2: Plan Limits - Starter user reaching 50 trx/mo is blocked on 51st transaction', async () => {
    const starterUser = store.getProfiles().find(p => p.plan === 'starter' && p.telegramChatId)!;
    const currentMonth = new Date().toISOString().substring(0, 7);
    const defaultWallet = store.getDefaultWallet(starterUser.id)!;

    // Seed transactions to reach 50 for this month
    const existingCount = store.getTransactions(starterUser.id).filter(t => t.transactionDate.startsWith(currentMonth)).length;
    for (let i = existingCount; i < 50; i++) {
      store.addTransaction({
        userId: starterUser.id,
        walletId: defaultWallet.id,
        amount: 10000,
        description: `Tx #${i + 1}`,
        type: 'expense',
        source: 'telegram_text',
        transactionDate: `${currentMonth}-05T10:00:00Z`
      });
    }

    // Attempt 51st transaction via webhook
    const res = await callTelegramWebhook({
      update_id: 4002,
      message: {
        chat: { id: starterUser.telegramChatId },
        text: 'beli bakso 15rb',
        date: Math.floor(Date.now() / 1000)
      }
    });

    assertEqual(res.status, 200);
    assertContains(res.body.reply, 'Batas Transaksi Bulanan Tercapai!');
    assertContains(res.body.reply, 'maksimal 50 transaksi/bulan');
    assertFalse(Boolean(res.body.transaction), '51st transaction must not be saved');
  });

  await runTest('T2.6.3: Plan Limits - Pro user can exceed 50 transactions without limit block', async () => {
    const proUser = store.getCurrentUser(); // Budi Pratama is Pro
    const currentMonth = new Date().toISOString().substring(0, 7);
    const defaultWallet = store.getDefaultWallet(proUser.id)!;

    // Seed 55 transactions for pro user
    for (let i = 0; i < 55; i++) {
      store.addTransaction({
        userId: proUser.id,
        walletId: defaultWallet.id,
        amount: 5000,
        description: `Pro Tx #${i + 1}`,
        type: 'expense',
        source: 'telegram_text',
        transactionDate: `${currentMonth}-05T10:00:00Z`
      });
    }

    // Submit transaction 56
    const res = await callTelegramWebhook({
      update_id: 4003,
      message: {
        chat: { id: proUser.telegramChatId },
        text: 'kopi susu 20rb',
        date: Math.floor(Date.now() / 1000)
      }
    });

    assertEqual(res.status, 200);
    assertTrue(res.body.ok);
    assertTrue(Boolean(res.body.transaction), 'Pro user must record transaction beyond 50');
  });

  await runTest('T2.6.4: Plan Limits - Bot commands (e.g. /saldo) remain accessible when limit reached', async () => {
    const starterUser = store.getProfiles().find(p => p.plan === 'starter' && p.telegramChatId)!;
    const currentMonth = new Date().toISOString().substring(0, 7);
    const defaultWallet = store.getDefaultWallet(starterUser.id)!;

    // Fill to 50
    for (let i = 0; i < 50; i++) {
      store.addTransaction({
        userId: starterUser.id,
        walletId: defaultWallet.id,
        amount: 10000,
        description: `Fill #${i}`,
        type: 'expense',
        source: 'web',
        transactionDate: `${currentMonth}-02T10:00:00Z`
      });
    }

    // Slash command /saldo
    const res = await callTelegramWebhook({
      update_id: 4004,
      message: { chat: { id: starterUser.telegramChatId }, text: '/saldo', date: Math.floor(Date.now() / 1000) }
    });

    assertEqual(res.status, 200);
    assertContains(res.body.reply, 'Daftar Saldo Dompet TataDana', '/saldo command must not be blocked by limit');
  });

  await runTest('T2.6.5: Plan Limits - Previous month transactions do not count towards current limit', async () => {
    const starterUser = store.getProfiles().find(p => p.plan === 'starter' && p.telegramChatId)!;
    const defaultWallet = store.getDefaultWallet(starterUser.id)!;

    // Seed 100 transactions in previous month (September)
    for (let i = 0; i < 100; i++) {
      store.addTransaction({
        userId: starterUser.id,
        walletId: defaultWallet.id,
        amount: 10000,
        description: `Old #${i}`,
        type: 'expense',
        source: 'web',
        transactionDate: '2026-09-10T10:00:00Z'
      });
    }

    // Current month transaction succeeds
    const res = await callTelegramWebhook({
      update_id: 4005,
      message: { chat: { id: starterUser.telegramChatId }, text: 'beli roti 12rb', date: Math.floor(Date.now() / 1000) }
    });

    assertEqual(res.status, 200);
    assertTrue(Boolean(res.body.transaction));
  });

  // ============================================================================
  // 7. DUPLICATE WEBHOOK UPDATES (5 Tests)
  // ============================================================================

  await runTest('T2.7.1: Duplicate Updates - Rapid back-to-back duplicate webhook updates', async () => {
    const updateId = 50001;
    const p1 = callTelegramWebhook({
      update_id: updateId,
      message: { chat: { id: 109283742 }, text: 'beli martabak 40rb', date: Math.floor(Date.now() / 1000) }
    });
    const p2 = callTelegramWebhook({
      update_id: updateId,
      message: { chat: { id: 109283742 }, text: 'beli martabak 40rb', date: Math.floor(Date.now() / 1000) }
    });

    const [r1, r2] = await Promise.all([p1, p2]);
    assertTrue(r1.body.ok && r2.body.ok);
    const statuses = [r1.body.status, r2.body.status];
    assertTrue(statuses.includes('already_processed_idempotent') || (r1.body.transaction && !r2.body.transaction));
  });

  await runTest('T2.7.2: Duplicate Updates - Duplicate photo updates do not duplicate receipt', async () => {
    const updateId = 50002;
    const payload = {
      update_id: updateId,
      type: 'photo',
      photoUrl: 'https://example.com/indomaret.jpg',
      merchantName: 'Indomaret Point',
      message: { chat: { id: 109283742 }, date: Math.floor(Date.now() / 1000) }
    };

    const res1 = await callTelegramWebhook(payload);
    const res2 = await callTelegramWebhook(payload);

    assertEqual(res2.body.status, 'already_processed_idempotent');
    assertFalse(Boolean(res2.body.transaction));
  });

  await runTest('T2.7.3: Duplicate Updates - Duplicate voice updates do not duplicate audio tx', async () => {
    const updateId = 50003;
    const payload = {
      update_id: updateId,
      type: 'voice',
      text: 'Beli bensin 50rb',
      message: { chat: { id: 109283742 }, voice: { duration: 4 }, date: Math.floor(Date.now() / 1000) }
    };

    const res1 = await callTelegramWebhook(payload);
    const res2 = await callTelegramWebhook(payload);

    assertEqual(res2.body.status, 'already_processed_idempotent');
  });

  await runTest('T2.7.4: Duplicate Updates - Interactive simulation requests bypass idempotency', async () => {
    const updateId = 50004;
    const payload = {
      simulation: true,
      update_id: updateId,
      message: { chat: { id: 109283742 }, text: 'kopi susu 22k', date: Math.floor(Date.now() / 1000) }
    };

    const res1 = await callTelegramWebhook(payload);
    const res2 = await callTelegramWebhook(payload);

    assertTrue(Boolean(res1.body.transaction));
    assertTrue(Boolean(res2.body.transaction), 'Simulator payload with simulation: true must not be blocked by idempotency');
  });

  await runTest('T2.7.5: Duplicate Updates - Idempotency registry maintains unique update status', async () => {
    const id = 50005;
    assertFalse(store.isTelegramUpdateProcessed(id));
    store.recordTelegramUpdate({
      updateId: id,
      status: 'processed',
      createdAt: new Date().toISOString()
    });
    assertTrue(store.isTelegramUpdateProcessed(id));
  });

  return results;
}
