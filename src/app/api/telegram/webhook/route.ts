import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/storage';
import { dualStorage } from '@/lib/supabase/dual-storage';
import { parseTransactionNaturalLanguage, parseReceiptPhoto, transcribeVoiceNote } from '@/lib/ai/parser';
import {
  formatExpenseReply,
  formatIncomeReply,
  formatTransferReply,
  handleBotCommand
} from '@/lib/telegram';
import { evaluateFinancialAdvisor } from '@/lib/ai/advisor';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support both real Telegram update and interactive simulator payload
    const isSimulator = body.simulation === true;
    const updateId = body.update_id || Math.floor(Math.random() * 100000000);

    // Extract message fields
    const message = body.message || body;
    const chatId = message.chat?.id || body.chat_id || 109283742;
    const text = message.text || '';
    const isPhoto = Boolean(message.photo || body.type === 'photo');
    const isVoice = Boolean(message.voice || message.audio || body.type === 'voice');

    // 2. Resolve User Profile
    // Link by chat_id or telegram username or fallback to active demo user
    let user = store.findProfileByTelegramChatId(chatId);
    if (!user) {
      user = store.getCurrentUser();
    }

    // 1. Idempotency Check & Immediate Synchronous Lock (BUG-M2-002)
    if (!isSimulator) {
      if (store.isTelegramUpdateProcessed(updateId)) {
        return NextResponse.json({ ok: true, status: 'already_processed_idempotent' });
      }
      // Immediately claim lock synchronously in memory before any async yields
      store.recordTelegramUpdate({
        updateId,
        userId: user.id,
        chatId,
        messageText: text || (isPhoto ? '[Photo Struk]' : isVoice ? '[Voice Note]' : ''),
        status: 'processed',
        createdAt: new Date().toISOString()
      });
      dualStorage.recordTelegramUpdate({
        updateId,
        userId: user.id,
        chatId,
        messageText: text || (isPhoto ? '[Photo Struk]' : isVoice ? '[Voice Note]' : ''),
        status: 'processed'
      }).catch(() => {});
    }

    // 3. User Wallet & Category Resolution
    const wallets = store.getWallets(user.id);
    const defaultWallet = store.getDefaultWallet(user.id) || wallets[0];
    const categories = store.getCategories(user.id);
    const currentMonth = new Date().toISOString().substring(0, 7);
    const budgets = store.getBudgets(user.id, currentMonth);
    const allUserTx = store.getTransactions(user.id);

    // 4. Plan Limit Enforcement (Part 4.9)
    // Starter limit: 50 transactions per month
    const thisMonthTxCount = allUserTx.filter(t => t.transactionDate.startsWith(currentMonth)).length;
    if (user.plan === 'starter' && thisMonthTxCount >= 50 && (text || isPhoto || isVoice) && !text.startsWith('/')) {
      const limitReply =
        `⚠️ *Batas Transaksi Bulanan Tercapai!*\n\n` +
        `Paket *Starter* dibatasi maksimal 50 transaksi/bulan (sudah tercatat: ${thisMonthTxCount} transaksi).\n\n` +
        `🚀 *Upgrade ke Pro sekarang* untuk transaksi unlimited, OCR foto struk, dan AI Financial Advisor!\n` +
        `🔗 Kunjungi: https://tatadana.id/dashboard/settings`;

      return NextResponse.json({
        ok: true,
        reply: limitReply,
        userPlan: user.plan
      });
    }

    // 5. Bot Commands Handling (Part 4.6)
    if (text.startsWith('/')) {
      const reply = handleBotCommand(text, user, wallets, allUserTx, categories, budgets);
      if (!isSimulator && user.telegramBotToken) {
        try {
          fetch(`https://api.telegram.org/bot${user.telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: reply, parse_mode: 'Markdown' }),
            signal: AbortSignal.timeout(4000)
          }).catch(() => {});
        } catch (_) {}
      }
      return NextResponse.json({
        ok: true,
        method: 'sendMessage',
        chat_id: chatId,
        text: reply,
        reply,
        command: text
      });
    }

    // 6. Photo Receipt OCR Input (Part 4.2 - Pro Only)
    if (isPhoto) {
      if (user.plan !== 'pro') {
        const upgradeReply =
          `🔒 *Fitur Foto Struk Khusus Pengguna Pro*\n\n` +
          `Paket Starter hanya mendukung pencatatan via teks dan VN.\n` +
          `Dengan paket *Pro (Rp99.000 Sekali Bayar)*, Anda bisa foto struk belanjaan apa saja (Indomaret, Alfamart, resto) dan AI akan otomatis membaca rincian per itemnya!\n\n` +
          `👉 *Upgrade ke Pro:* https://tatadana.id/dashboard/settings`;

        if (!isSimulator && user.telegramBotToken) {
          try {
            fetch(`https://api.telegram.org/bot${user.telegramBotToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: chatId, text: upgradeReply, parse_mode: 'Markdown' }),
              signal: AbortSignal.timeout(4000)
            }).catch(() => {});
          } catch (_) {}
        }

        return NextResponse.json({
          ok: true,
          method: 'sendMessage',
          chat_id: chatId,
          text: upgradeReply,
          reply: upgradeReply,
          requiresUpgrade: true
        });
      }

      // Pro Plan: Process receipt OCR
      const receiptData = await parseReceiptPhoto(
        body.photoUrl || 'https://images.unsplash.com/photo-1554415707-9e49016a3455?w=600',
        body.merchantName
      );

      // Match category
      const matchedCat = categories.find(c => c.name.toLowerCase() === receiptData.suggestedCategory.toLowerCase()) || categories[0];

      // Save as 1 main transaction with receipt items breakdown via dualStorage
      const newTx = await dualStorage.addTransaction({
        userId: user.id,
        walletId: defaultWallet.id,
        categoryId: matchedCat.id,
        type: 'expense',
        amount: receiptData.totalAmount,
        description: `Struk Belanja: ${receiptData.merchant}`,
        source: 'telegram_photo',
        receiptItems: receiptData.items,
        isReceiptParent: true,
        merchantName: receiptData.merchant,
        transactionDate: new Date().toISOString()
      } as any);

      // Record AI Log
      store.addAILog({
        userId: user.id,
        feature: 'receipt_vision',
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        promptSummary: `OCR Struk ${receiptData.merchant} (${receiptData.items.length} items)`,
        latencyMs: 240,
        tokensUsed: 420,
        status: 'success'
      });

      // Calculate category spending for budget bar
      const catBudget = budgets.find(b => b.categoryId === matchedCat.id);
      const catTotal = store.getTransactions(user.id)
        .filter(t => t.categoryId === matchedCat.id && t.type === 'expense' && t.transactionDate.startsWith(currentMonth))
        .reduce((s, t) => s + t.amount, 0);

      if (catBudget && catBudget.amount > 0) {
        const pct = (catTotal / catBudget.amount) * 100;
        if (pct >= 100) { catBudget.alert100Sent = true; catBudget.alert80Sent = true; }
        else if (pct >= 80) { catBudget.alert80Sent = true; }
      }

      let reply = formatExpenseReply(newTx, defaultWallet, matchedCat, catBudget, catTotal);
      reply += `\n🧾 *Rincian Item Struk (${receiptData.items.length} item):*\n`;
      receiptData.items.forEach((item) => {
        reply += `• ${item.name}: Rp${item.price.toLocaleString('id-ID')}\n`;
      });

      // Financial Advisor Check
      const advisor = evaluateFinancialAdvisor(user, newTx, store.getTransactions(user.id), budgets);
      if (advisor.triggered && advisor.message) {
        reply += `\n\n${advisor.message}`;
      }

      if (!isSimulator && user.telegramBotToken) {
        try {
          fetch(`https://api.telegram.org/bot${user.telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: reply, parse_mode: 'Markdown' }),
            signal: AbortSignal.timeout(4000)
          }).catch(() => {});
        } catch (_) {}
      }

      return NextResponse.json({
        ok: true,
        method: 'sendMessage',
        chat_id: chatId,
        text: reply,
        reply,
        transaction: newTx
      });
    }

    // 7. Voice Note Input (Part 4.3 - All Plans)
    let processedText = text;
    let voiceTranscript = '';

    if (isVoice) {
      const duration = message.voice?.duration || message.audio?.duration || body.duration || 6;
      if (duration > 60) {
        const friendlyLimitMsg = '⚠️ Maaf, durasi voice note maksimal 60 detik. Silakan kirim pesan suara yang lebih singkat atau gunakan teks.';
        if (!isSimulator && user.telegramBotToken) {
          try {
            fetch(`https://api.telegram.org/bot${user.telegramBotToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: chatId, text: friendlyLimitMsg, parse_mode: 'Markdown' }),
              signal: AbortSignal.timeout(4000)
            }).catch(() => {});
          } catch (_) {}
        }
        return NextResponse.json({
          ok: true,
          status: 'error',
          replyText: friendlyLimitMsg,
          reply: friendlyLimitMsg,
          text: friendlyLimitMsg,
          error: friendlyLimitMsg
        });
      }

      try {
        const voiceResult = await transcribeVoiceNote(
          body.audioUrl || message.voice?.file_id || 'sample_voice.ogg',
          duration,
          text || body.text || message.caption
        );
        voiceTranscript = voiceResult.transcript;
        processedText = voiceResult.transcript;

        // Record AI Log
        store.addAILog({
          userId: user.id,
          feature: 'voice_stt',
          provider: 'gemini',
          model: 'gemini-1.5-flash-audio',
          promptSummary: `STT Voice Note (${voiceResult.duration}s)`,
          latencyMs: 140,
          tokensUsed: 130,
          status: 'success'
        });
      } catch (voiceError: any) {
        const voiceErrMsg = voiceError.message || 'Gagal memproses voice note.';
        const friendlyErrorMsg = voiceErrMsg.includes('60 detik')
          ? '⚠️ Maaf, durasi voice note maksimal 60 detik. Silakan kirim pesan suara yang lebih singkat atau gunakan teks.'
          : `⚠️ Gagal memproses voice note: ${voiceErrMsg}`;

        if (!isSimulator && user.telegramBotToken) {
          try {
            fetch(`https://api.telegram.org/bot${user.telegramBotToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: chatId, text: friendlyErrorMsg, parse_mode: 'Markdown' }),
              signal: AbortSignal.timeout(4000)
            }).catch(() => {});
          } catch (_) {}
        }

        return NextResponse.json({
          ok: true,
          status: 'error',
          replyText: friendlyErrorMsg,
          reply: friendlyErrorMsg,
          text: friendlyErrorMsg,
          error: voiceErrMsg
        });
      }
    }

    // 8. Natural Language Text Parsing (Part 4.1)
    const parseRes = await parseTransactionNaturalLanguage(processedText, categories);

    if (!parseRes.success || !parseRes.data) {
      const errorReply = parseRes.error || 'Gagal memproses transaksi. Coba ketik contoh: "beli bakso 15rb"';
      return NextResponse.json({
        ok: false,
        method: 'sendMessage',
        chat_id: chatId,
        text: errorReply,
        reply: errorReply,
      });
    }

    // Record AI Log for text parsing
    store.addAILog({
      userId: user.id,
      feature: 'text_parser',
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      promptSummary: `NLP Parse: "${processedText.substring(0, 60)}"`,
      latencyMs: 65,
      tokensUsed: 80,
      status: 'success'
    });

    const { jenis, nominal, kategori, catatan, dompet, destinationDompet } = parseRes.data;

    // Resolve source wallet
    let activeWallet = defaultWallet;
    if (dompet) {
      const foundW = wallets.find(w => w.name.toLowerCase() === dompet.toLowerCase() || w.name.toLowerCase().includes(dompet.toLowerCase()));
      if (foundW) activeWallet = foundW;
    }

    // Handle Transfer transaction
    if (jenis === 'transfer') {
      let destWallet = wallets.find(w => w.id !== activeWallet.id);
      if (destinationDompet) {
        const foundDest = wallets.find(w => w.name.toLowerCase() === destinationDompet.toLowerCase() || w.name.toLowerCase().includes(destinationDompet.toLowerCase()));
        if (foundDest && foundDest.id !== activeWallet.id) destWallet = foundDest;
      }
      if (!destWallet) destWallet = wallets[0];

      const newTx = await dualStorage.addTransaction({
        userId: user.id,
        walletId: activeWallet.id,
        destinationWalletId: destWallet.id,
        type: 'transfer',
        amount: nominal,
        description: catatan || `Transfer dari ${activeWallet.name} ke ${destWallet.name}`,
        source: isVoice ? 'telegram_voice' : 'telegram_text',
        transcriptText: voiceTranscript || undefined,
        transactionDate: new Date().toISOString()
      } as any);

      const updatedSource = store.getWallets(user.id).find(w => w.id === activeWallet.id) || activeWallet;
      const updatedDest = store.getWallets(user.id).find(w => w.id === destWallet.id) || destWallet;
      const reply = formatTransferReply(newTx, updatedSource, updatedDest);

      if (!isSimulator && user.telegramBotToken) {
        try {
          fetch(`https://api.telegram.org/bot${user.telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: reply, parse_mode: 'Markdown' }),
            signal: AbortSignal.timeout(4000)
          }).catch(() => {});
        } catch (_) {}
      }

      return NextResponse.json({
        ok: true,
        method: 'sendMessage',
        chat_id: chatId,
        text: reply,
        reply,
        transaction: newTx
      });
    }

    // Match Category
    let targetCat = categories.find(c => c.name.toLowerCase() === kategori.toLowerCase());
    if (!targetCat) {
      targetCat = categories.find(c => c.type === (jenis === 'pemasukan' ? 'income' : 'expense')) || categories[0];
    }

    // Insert transaction
    const newTx = await dualStorage.addTransaction({
      userId: user.id,
      walletId: activeWallet.id,
      categoryId: targetCat?.id,
      type: jenis === 'pemasukan' ? 'income' : 'expense',
      amount: nominal,
      description: catatan,
      source: isVoice ? 'telegram_voice' : 'telegram_text',
      transcriptText: voiceTranscript || undefined,
      transactionDate: new Date().toISOString()
    } as any);

    // Re-fetch updated wallet
    const updatedWallet = store.getWallets(user.id).find(w => w.id === activeWallet.id) || activeWallet;

    let reply = '';
    if (newTx.type === 'income') {
      reply = formatIncomeReply(newTx, updatedWallet, targetCat, voiceTranscript || undefined);
    } else {
      const catBudget = budgets.find(b => b.categoryId === targetCat?.id);
      const catTotal = store.getTransactions(user.id)
        .filter(t => t.categoryId === targetCat?.id && t.type === 'expense' && t.transactionDate.startsWith(currentMonth))
        .reduce((s, t) => s + t.amount, 0);

      if (catBudget && catBudget.amount > 0) {
        const pct = (catTotal / catBudget.amount) * 100;
        if (pct >= 100) { catBudget.alert100Sent = true; catBudget.alert80Sent = true; }
        else if (pct >= 80) { catBudget.alert80Sent = true; }
      }

      reply = formatExpenseReply(newTx, updatedWallet, targetCat, catBudget, catTotal, voiceTranscript || undefined);

      // Financial advisor trigger
      const advisor = evaluateFinancialAdvisor(user, newTx, store.getTransactions(user.id), budgets);
      if (advisor.triggered && advisor.message) {
        reply += `\n\n${advisor.message}`;
        store.addAILog({
          userId: user.id,
          feature: 'financial_advisor',
          provider: 'gemini',
          model: 'gemini-1.5-flash',
          promptSummary: `Advisor trigger: ${advisor.triggerType} on tx Rp${newTx.amount}`,
          latencyMs: 85,
          tokensUsed: 160,
          status: 'success'
        });
      }
    }

    if (!isSimulator && user.telegramBotToken) {
      try {
        fetch(`https://api.telegram.org/bot${user.telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: reply, parse_mode: 'Markdown' }),
          signal: AbortSignal.timeout(4000)
        }).catch(() => {});
      } catch (_) {}
    }

    return NextResponse.json({
      ok: true,
      method: 'sendMessage',
      chat_id: chatId,
      text: reply,
      reply,
      transaction: newTx
    });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({
      ok: false,
      error: error.message || 'Terjadi kesalahan sistem saat memproses pesan.'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Prevent 405 Method Not Allowed when accessing Webhook Tester URL directly in browser
  const acceptsHtml = req.headers.get('accept')?.includes('text/html');
  if (acceptsHtml) {
    return new Response(
      `<!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>TataDana — Webhook Endpoint Status</title>
        <style>
          body { font-family: sans-serif; background: #0F172A; color: white; padding: 40px; text-align: center; }
          .card { background: #1E293B; border-radius: 16px; padding: 32px; max-width: 600px; margin: 0 auto; border: 1px solid #334155; }
          .btn { background: #F97316; color: white; padding: 10px 20px; border-radius: 10px; text-decoration: none; font-weight: bold; display: inline-block; margin: 8px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2 style="color: #F97316;">⚡ TataDana Webhook Endpoint Online</h2>
          <p style="color: #94A3B8; font-size: 14px; margin: 16px 0;">Endpoint <code>/api/telegram/webhook</code> siap menerima request POST Telegram Update.</p>
          <div>
            <a href="/portal" class="btn">🎯 Portal Terpadu</a>
            <a href="/dev/telegram-simulator" class="btn" style="background: #3B82F6;">💬 Bot Simulator</a>
            <a href="/dashboard" class="btn" style="background: #020617;">📊 Dashboard</a>
          </div>
        </div>
      </body>
      </html>`,
      {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        status: 200
      }
    );
  }

  return NextResponse.json({
    ok: true,
    status: 'online',
    endpoint: '/api/telegram/webhook',
    allowedMethods: ['POST', 'GET'],
    message: 'TataDana Telegram Webhook is active and listening for POST updates.'
  });
}
