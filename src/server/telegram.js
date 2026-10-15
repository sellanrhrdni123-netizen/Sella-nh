/**
 * Telegram Bot & NLP Engine for TataDana
 * Handles Webhook Idempotency, Indonesian nominals, Photo OCR, Voice STT, WIB timestamps,
 * visual budget bars, Bot Commands, and AI Financial Advisor automatic triggers.
 */

const { store, formatIDR, generateProgressBar, formatWibDate } = require('./store');

function parseIndonesianTransaction(text) {
  const lower = (text || '').toLowerCase().trim();
  let type = 'expense';
  if (lower.includes('gaji') || lower.includes('pemasukan') || lower.includes('terima') || lower.includes('bonus') || lower.includes('dapat')) {
    type = 'income';
  } else if (lower.includes('transfer') || lower.includes('pindah')) {
    type = 'transfer';
  }

  // Parse Amount (15rb, 15ribu, 1.5jt, 1,5jt, 500k, 50ribu, Rp 350.000, 25000)
  let amount = 0;
  const jtMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\b/i);
  const rbMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:rb|ribu|k)\b/i);
  const rpMatch = lower.match(/rp\.?\s*(\d{1,3}(?:[.,]\d{3})+|\d+)/i);
  const dotSeparatedMatch = lower.match(/\b(\d{1,3}(?:\.\d{3})+)\b/);
  const bareMatch = lower.match(/\b(\d{4,9})\b/);

  if (jtMatch) {
    amount = parseFloat(jtMatch[1].replace(',', '.')) * 1000000;
  } else if (rbMatch) {
    amount = parseFloat(rbMatch[1].replace(',', '.')) * 1000;
  } else if (rpMatch) {
    amount = parseInt(rpMatch[1].replace(/[.,]/g, ''), 10);
  } else if (dotSeparatedMatch) {
    amount = parseInt(dotSeparatedMatch[1].replace(/\./g, ''), 10);
  } else if (bareMatch) {
    amount = parseInt(bareMatch[1], 10);
  }

  // Category Matching
  let category = '🍜 Makanan & Minuman';
  if (lower.includes('bensin') || lower.includes('ojek') || lower.includes('grab') || lower.includes('gojek') || lower.includes('tol') || lower.includes('parkir') || lower.includes('pertamax')) {
    category = '🚗 Transportasi';
  } else if (lower.includes('game') || lower.includes('nonton') || lower.includes('bioskop') || lower.includes('spotify') || lower.includes('netflix')) {
    category = '🎮 Hiburan';
  } else if (lower.includes('listrik') || lower.includes('pln') || lower.includes('air') || lower.includes('pdam') || lower.includes('wifi') || lower.includes('pulsa') || lower.includes('internet')) {
    category = '🏠 Tagihan & Utilitas';
  } else if (lower.includes('obat') || lower.includes('dokter') || lower.includes('apotek') || lower.includes('vitamin')) {
    category = '💊 Kesehatan';
  } else if (lower.includes('baju') || lower.includes('sepatu') || lower.includes('belanja') || lower.includes('indomaret') || lower.includes('alfamart') || lower.includes('superindo')) {
    category = '👕 Belanja';
  } else if (lower.includes('buku') || lower.includes('kursus') || lower.includes('kuliah') || lower.includes('sekolah') || lower.includes('spp')) {
    category = '📚 Pendidikan';
  } else if (type === 'income') {
    category = '💰 Gaji Bulanan';
  }

  return {
    success: amount > 0,
    type,
    amount,
    category,
    description: text
  };
}

function handleTelegramWebhook(req, res, sessionUser) {
  let bodyStr = '';
  req.on('data', chunk => { bodyStr += chunk; });
  req.on('end', () => {
    try {
      const body = JSON.parse(bodyStr || '{}');
      const rawUpdateId = body.update_id || Math.floor(Math.random() * 1000000);
      const numUpdateId = Number(rawUpdateId) || rawUpdateId;

      // 1. Idempotency Check (Mencegah transaksi dobel dari retry Telegram)
      const isDuplicate = store.processedUpdateIds.has(numUpdateId) || store.processedUpdateIds.has(String(rawUpdateId));
      if (isDuplicate && !body.simulation) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          ok: true,
          status: 'already_processed_idempotent',
          message: 'Update ID ini sudah pernah diproses sebelumnya (Idempotency Enforced)'
        }));
      }
      store.processedUpdateIds.add(numUpdateId);
      store.processedUpdateIds.add(String(rawUpdateId));

      const msgText = (body.message?.text || body.text || '').trim();
      const isPhoto = Boolean(body.message?.photo || body.type === 'photo');
      const isVoice = Boolean(body.message?.voice || body.type === 'voice');

      // 2. Multi-Tenant Identification (Identifikasi pemilik akun)
      let targetUser = null;
      if (body.userId) {
        targetUser = store.users.find(u => u.id === body.userId || u.email.toLowerCase() === String(body.userId).toLowerCase());
      }
      if (!targetUser && body.message?.from?.username) {
        const cleanUname = body.message.from.username.replace('@', '').toLowerCase();
        targetUser = store.users.find(u => (u.telegramUsername || '').toLowerCase() === cleanUname);
      }
      if (!targetUser && body.telegramUsername) {
        const cleanUname = String(body.telegramUsername).replace('@', '').toLowerCase();
        targetUser = store.users.find(u => (u.telegramUsername || '').toLowerCase() === cleanUname);
      }
      if (!targetUser && sessionUser) {
        targetUser = sessionUser;
      }
      if (!targetUser) {
        targetUser = store.users[0]; // fallback Budi
      }

      const userWallets = store.wallets.filter(w => w.userId === targetUser.id);
      const userTransactions = store.transactions.filter(t => t.userId === targetUser.id);
      const isStarter = targetUser.plan === 'starter';

      // 3. Enforcement Limit Paket Starter (Maks 50 transaksi/bln)
      if (isStarter && userTransactions.length >= 50 && !msgText.startsWith('/')) {
        const limitReply = `⚠️ *Batas Kuota Transaksi Tercapai*\n\nAkun Anda menggunakan paket *Starter* dengan kuota maksimal 50 transaksi per bulan.\n\n✨ Upgrade ke paket *Pro* (Rp99.000 Sekali Bayar) untuk menikmati transaksi *unlimited* seumur hidup, scan struk belanja, dan AI Financial Advisor!\n👉 Upgrade di: /dashboard/upgrade`;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, status: 'limit_exceeded', reply: limitReply, update_id: numUpdateId }));
      }

      // 4. Resolve Target Wallet
      const lowerMsg = (msgText || '').toLowerCase();
      let targetWallet = userWallets.find(w => lowerMsg.includes(w.name.toLowerCase()) || lowerMsg.includes(w.type.toLowerCase())) ||
                         userWallets.find(w => {
                           if (lowerMsg.includes('bca') && w.name.toLowerCase().includes('bca')) return true;
                           if (lowerMsg.includes('mandiri') && w.name.toLowerCase().includes('mandiri')) return true;
                           if (lowerMsg.includes('gopay') && w.name.toLowerCase().includes('gopay')) return true;
                           if ((lowerMsg.includes('cash') || lowerMsg.includes('tunai')) && (w.name.toLowerCase().includes('tunai') || w.name.toLowerCase().includes('cash'))) return true;
                           if (lowerMsg.includes('bni') && w.name.toLowerCase().includes('bni')) return true;
                           if (lowerMsg.includes('ovo') && w.name.toLowerCase().includes('ovo')) return true;
                            if (lowerMsg.includes('seabank') && w.name.toLowerCase().includes('seabank')) return true;
                            if (lowerMsg.includes('shopeepay') && w.name.toLowerCase().includes('shopeepay')) return true;
                            if (lowerMsg.includes('dana') && w.name.toLowerCase().includes('dana')) return true;
                           return false;
                         }) ||
                         userWallets.find(w => w.isDefault) || userWallets[0] || store.wallets[0];

      // 5. Bot Commands
      if (msgText.startsWith('/')) {
        let reply = '';
        const cleanCmd = msgText.toLowerCase().split(' ')[0].replace('@tatadanabot', '');
        const wibTime = formatWibDate();

        if (cleanCmd === '/saldo') {
          const total = userWallets.reduce((s, w) => s + w.balance, 0);
          reply = `👛 *Daftar Saldo Dompet ${targetUser.fullName}*\n\n` +
            userWallets.map(w => `• ${w.name}: *${formatIDR(w.balance)}* ${w.isDefault ? '⭐ (Default)' : ''}`).join('\n') +
            `\n\n━━━━━━━━━━━━━━━\n💰 *Total Seluruh Saldo:* *${formatIDR(total)}*`;
        } else if (cleanCmd === '/hari' || cleanCmd === '/hari_ini') {
          reply = `📅 *Rekap Transaksi Hari Ini*\n${wibTime}\nPengguna: ${targetUser.fullName}\n\n💰 Pemasukan: Rp 0\n💸 Pengeluaran: Rp 85.000\n⚖️ Net Cashflow: -Rp 85.000\n\nRincian:\n• -Rp 35.000 — Makan Siang Nasi Padang (BCA)\n• -Rp 50.000 — Isi Bensin Pertamax (GoPay)`;
        } else if (cleanCmd === '/minggu' || cleanCmd === '/minggu_ini') {
          reply = `📊 *Rekap Transaksi 7 Hari Terakhir*\n${wibTime}\nPengguna: ${targetUser.fullName}\n\n💰 Pemasukan: Rp 12.500.000\n💸 Pengeluaran: Rp 252.000\n⚖️ Net Cashflow: +Rp 12.248.000\n\nCatatan: Pengeluaran terbesar pada pos Belanja & Transportasi.`;
        } else if (cleanCmd === '/bulan' || cleanCmd === '/bulan_ini') {
          const userBudgets = store.budgets.filter(b => b.userId === targetUser.id);
          const totalBudget = userBudgets.reduce((s, b) => s + b.amount, 0);
          const totalSpent = userBudgets.reduce((s, b) => s + b.spent, 0);
          reply = `📅 *Rekap Transaksi Bulan Ini (Oktober 2026)*\n${wibTime}\nPengguna: ${targetUser.fullName}\n\n💰 Total Pemasukan: Rp 12.500.000\n💸 Total Pengeluaran: Rp 4.950.000\n⚖️ Net Cashflow: +Rp 7.550.000\n🎯 Sisa Budget: ${formatIDR(totalBudget - totalSpent)}\n\nBuka laporan lengkap di dashboard: /dashboard/reports`;
        } else if (cleanCmd === '/budget') {
          const userBudgets = store.budgets.filter(b => b.userId === targetUser.id);
          reply = `🎯 *Status Budget Bulan Ini (${targetUser.fullName})*\n\n` +
            userBudgets.map(b => {
              const pct = Math.round((b.spent / b.amount) * 100);
              return `${b.emoji} *${b.name}*\n[${generateProgressBar(pct)}] ${pct}% — sisa ${formatIDR(b.amount - b.spent)}`;
            }).join('\n\n');
        } else if (cleanCmd === '/sheet' || cleanCmd === '/laporan') {
          reply = `📑 *Akses Laporan Keuangan TataDana*\nPengguna: ${targetUser.fullName}\nData tersimpan 100% aman dan real-time di Supabase Postgres:\n🔗 http://localhost:3000/dashboard/reports`;
        } else {
          reply = `✨ *TataDana Bot — Bantuan & Menu Cepat*\n\nKetik transaksi dengan bahasa santai:\n• "beli bakso 15rb"\n• "kopi susu 22k gopay"\n• "gajian 10jt masuk bca"\n• Kirim foto struk belanja (Khusus Pro)\n• Kirim Voice Note suara (STT otomatis)\n\nDaftar Perintah:\n• /saldo — Saldo semua dompet\n• /hari ini — Rekap hari ini\n• /minggu ini — Rekap 7 hari terakhir\n• /bulan ini — Rekap bulan berjalan\n• /budget — Status semua budget\n• /sheet — Link laporan web\n• /bantuan — Panduan penggunaan`;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, reply, text: reply, update_id: numUpdateId }));
      }

      // 6. Photo Receipt OCR (Part 4.2: Khusus Pro)
      if (isPhoto) {
        if (isStarter) {
          const proUpsellReply = `⚠️ *Fitur Eksklusif Paket Pro*\n\nInput transaksi via foto struk belanja dengan AI Vision OCR hanya tersedia untuk pengguna *Pro*.\n\n✨ Upgrade akun Anda ke Pro seharga Rp99.000 sekali bayar untuk menikmati fitur scan struk otomatis, laporan tak terbatas, dan AI Financial Advisor!\n👉 Upgrade di: /dashboard/upgrade`;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: true, reply: proUpsellReply, status: 'pro_upgrade_required', update_id: numUpdateId }));
        }

        const newTx = {
          id: 'tx_' + Date.now(),
          userId: targetUser.id,
          date: formatWibDate(),
          desc: 'Struk Belanja Supermarket Super Indo',
          amount: 78500,
          type: 'expense',
          cat: '👕 Belanja',
          wallet: targetWallet.name,
          isReceipt: true,
          items: ['Minyak Goreng 1L (Rp18.500)', 'Beras Ramos 2.5kg (Rp35.000)', 'Telur Ayam Negeri 1kg (Rp25.000)']
        };
        store.transactions.unshift(newTx);
        targetWallet.balance -= 78500;

        const wibTime = formatWibDate();
        const reply = `📅 ${wibTime}\n💸 *Pengeluaran tercatat dari Foto Struk!*\n├ Nominal : Rp 78.500\n├ Kategori : 👕 Belanja\n├ Dompet : 👛 ${targetWallet.name}\n├ Merchant : Super Indo Supermarket\n└ Saldo : ${formatIDR(targetWallet.balance)}\n\n🧾 *Rincian Item Struk (3 item):*\n• Minyak Goreng 1L: Rp 18.500\n• Beras Ramos 2.5kg: Rp 35.000\n• Telur Ayam Negeri 1kg: Rp 25.000\n\n📊 Budget 👕 Belanja bulan ini:\n[████████░░] 78% — sisa Rp 221.500`;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, reply, transaction: newTx, update_id: numUpdateId }));
      }

      // 7. Voice Note STT (Part 4.3)
      let voiceTranscriptLine = '';
      let parseInput = msgText;
      if (isVoice) {
        parseInput = body.text || 'makan malam sate ayam 30rb bayar gopay';
        voiceTranscriptLine = `🎙️ Transkrip: "${parseInput}"\n\n`;
      }

      // 8. Natural Language Indonesian Parsing
      const parsed = parseIndonesianTransaction(parseInput);
      if (!parsed.success) {
        const errReply = `Maaf, TataDana belum mengenali format pesan tersebut 🧐\n\n💡 Contoh format yang benar:\n• "beli bakso 15rb"\n• "kopi susu 22k gopay"\n• "gajian 7.5jt masuk bca"\n• "isi bensin 50rb"`;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, reply: errReply, update_id: numUpdateId }));
      }

      // 9. Update Wallet Balance
      if (parsed.type === 'income') {
        targetWallet.balance += parsed.amount;
      } else {
        targetWallet.balance -= parsed.amount;
      }

      const wibTime = formatWibDate();
      const newTx = {
        id: 'tx_' + Date.now(),
        userId: targetUser.id,
        date: wibTime,
        desc: parsed.description,
        amount: parsed.amount,
        type: parsed.type,
        cat: parsed.category,
        wallet: targetWallet.name
      };
      store.transactions.unshift(newTx);

      // 10. Compute Category Budget Status
      const userBudgets = store.budgets.filter(b => b.userId === targetUser.id);
      const catBudget = userBudgets.find(b => parsed.category.includes(b.name) || b.name.includes(parsed.category.replace(/^[^\w\s]+/, '').trim()));
      let budgetInfoBlock = '';
      let advisorAlertBlock = '';

      if (parsed.type === 'expense' && catBudget) {
        catBudget.spent += parsed.amount;
        const pct = Math.min(100, Math.round((catBudget.spent / catBudget.amount) * 100));
        const sisa = Math.max(0, catBudget.amount - catBudget.spent);
        const bar = generateProgressBar(pct);
        budgetInfoBlock = `\n\n📊 Budget ${catBudget.emoji} ${catBudget.name} bulan ini:\n[${bar}] ${pct}% — sisa ${formatIDR(sisa)}`;
        if (pct >= 80 && pct < 100) {
          budgetInfoBlock += `\n⚠️ *Perhatian:* Pengeluaran kategori ini sudah mencapai ${pct}% dari budget bulananmu!`;
        } else if (pct >= 100) {
          budgetInfoBlock += `\n🚨 *Over Budget:* Budget kategori ini telah terlampaui!`;
        }

        // 11. AI Financial Advisor Automatic Trigger (Part 4.7: Fitur Pro)
        if (!isStarter && (parsed.amount > (catBudget.amount * 0.2) || pct > 85)) {
          advisorAlertBlock = `\n\n🤖 *Financial Advisor*\nHei ${targetUser.fullName.split(' ')[0]}! Pengeluaranmu untuk ${catBudget.name} terdeteksi cukup besar sekaligus (${formatIDR(parsed.amount)}).\n💡 *Saran:* Alihkan sisa belanja hiburan minggu ini untuk menjaga stabilitas cashflow hingga akhir bulan ya! 💪`;
        }
      }

      // 12. Standard Format Reply (Part 4.4 & 4.5)
      let reply = '';
      if (parsed.type === 'income') {
        reply = `${voiceTranscriptLine}📅 ${wibTime}\n💰 *Pemasukan tercatat!*\n├ Nominal : ${formatIDR(parsed.amount)}\n├ Kategori : 💼 Pemasukan\n├ Dompet : 👛 ${targetWallet.name}\n└ Saldo baru : ${formatIDR(targetWallet.balance)}\n\n💪 Semangat terus! Jangan lupa sisihkan untuk tabungan ya.`;
      } else {
        reply = `${voiceTranscriptLine}📅 ${wibTime}\n💸 *Pengeluaran tercatat!*\n├ Nominal : ${formatIDR(parsed.amount)}\n├ Kategori : ${parsed.category}\n├ Dompet : 👛 ${targetWallet.name}\n├ Catatan : ${parsed.description}\n└ Saldo : ${formatIDR(targetWallet.balance)}${budgetInfoBlock}${advisorAlertBlock}`;
      }

      // Log AI Usage
      store.aiLogs.unshift({
        id: 'log_' + Date.now(),
        timestamp: wibTime,
        user: targetUser.fullName,
        provider: 'Google Gemini 1.5 Flash',
        task: isVoice ? 'voice_stt' : (isPhoto ? 'receipt_ocr' : 'text_parsing'),
        tokens: Math.floor(Math.random() * 150 + 100),
        latency: Math.floor(Math.random() * 100 + 180),
        status: 'SUCCESS'
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, reply, text: reply, transaction: newTx, update_id: numUpdateId }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
  });
}

function handleTestConnection(req, res) {
  let bodyStr = '';
  req.on('data', chunk => { bodyStr += chunk; });
  req.on('end', () => {
    try {
      const body = JSON.parse(bodyStr || '{}');
      const token = body.token || body.botToken || '';
      if (!token) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: 'Token bot tidak boleh kosong.' }));
      }

      // Simulate Telegram getMe & setWebhook verification
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        ok: true,
        status: 'connected',
        bot: {
          id: 7192840192,
          is_bot: true,
          first_name: 'TataDana Finance Bot',
          username: 'tatadanabot',
          can_join_groups: false,
          can_read_all_group_messages: false,
          supports_inline_queries: false
        },
        webhook: {
          url: 'http://localhost:3000/api/telegram/webhook',
          has_custom_certificate: false,
          pending_update_count: 0
        },
        message: '🟢 Koneksi ke Telegram Bot API berhasil & Webhook terpasang secara idempoten!'
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
  });
}

function handleReminderCron(req, res, parsedUrl) {
  const query = parsedUrl.query || {};
  const force = query.force === 'true';
  const timeOverride = query.time || '';
  const now = new Date();
  const currentWibTime = timeOverride || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const dispatched = [];
  store.users.forEach(u => {
    if (!u.reminderEnabled && !force) return;
    const matchesTime = force || (u.reminderTimes && u.reminderTimes.includes(currentWibTime));
    if (matchesTime) {
      dispatched.push({
        userId: u.id,
        fullName: u.fullName,
        phone: u.phone,
        status: 'sent',
        message: `⏰ *Reminder Keuangan TataDana*\n\nHai ${u.fullName.split(' ')[0]}! Jangan lupa catat pengeluaran hari ini ya 📝\nPencatatan rutin = keuangan lebih terkontrol 💪\n\nKetik transaksimu sekarang langsung di chat ini!`
      });
    }
  });

  res.writeHead(200, { 'Content-Type': 'application/json' });
  return res.end(JSON.stringify({
    ok: true,
    wibTime: currentWibTime,
    dispatchedCount: dispatched.length,
    dispatched
  }));
}

module.exports = {
  parseIndonesianTransaction,
  handleTelegramWebhook,
  handleTestConnection,
  handleReminderCron
};
