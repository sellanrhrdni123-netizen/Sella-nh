/**
 * TataDana Telegram Bot Local Long-Polling Runner
 * 
 * Enables developers to test real Telegram Bot interactions locally without
 * needing a public HTTPS URL or tunneling tool (Ngrok / Cloudflare Tunnel).
 * 
 * Usage:
 *   npx tsx scripts/telegram-polling.ts
 *   npx tsx scripts/telegram-polling.ts --token <BOT_TOKEN> --url http://localhost:3000/api/telegram/webhook
 */

const args = process.argv.slice(2);

function getArgValue(flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return undefined;
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🤖 TataDana Telegram Bot Local Long-Polling Helper

Usage:
  npx tsx scripts/telegram-polling.ts [options]

Options:
  --token <token>       Telegram Bot API Token (defaults to TELEGRAM_BOT_TOKEN env var)
  --url <webhookUrl>    Local webhook endpoint URL (defaults to http://localhost:3000/api/telegram/webhook)
  --help, -h            Show this help message
`);
  process.exit(0);
}

const BOT_TOKEN = getArgValue('--token') || process.env.TELEGRAM_BOT_TOKEN || process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = getArgValue('--url') || process.env.WEBHOOK_URL || 'http://localhost:3000/api/telegram/webhook';

if (!BOT_TOKEN) {
  console.error(`
❌ Error: Telegram Bot Token tidak ditemukan!
Silakan set environment variable TELEGRAM_BOT_TOKEN atau jalankan dengan argumen:
  npx tsx scripts/telegram-polling.ts --token <BOT_TOKEN>
`);
  process.exit(1);
}

const TELEGRAM_API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

function getWIBTimestamp(): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'medium'
  }).format(new Date());
}

async function deleteWebhook(): Promise<boolean> {
  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/deleteWebhook?drop_pending_updates=false`);
    const data = await res.json();
    return data.ok;
  } catch (err: any) {
    console.warn('⚠️ Gagal memanggil deleteWebhook:', err.message);
    return false;
  }
}

async function getMe(): Promise<{ ok: boolean; result?: any; description?: string }> {
  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/getMe`);
    return await res.json();
  } catch (err: any) {
    return { ok: false, description: err.message };
  }
}

async function forwardToLocalWebhook(update: any): Promise<{ ok: boolean; status: number; body?: any; error?: string }> {
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(update)
    });

    const body = await res.json().catch(() => null);
    return {
      ok: res.ok,
      status: res.status,
      body
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      error: err.message || 'Gagal menghubungi local webhook endpoint'
    };
  }
}

async function startPolling() {
  console.log('='.repeat(70));
  console.log('🚀 TATADANA TELEGRAM BOT LOCAL LONG-POLLING RUNNER');
  console.log('='.repeat(70));
  console.log(`⏱️  Waktu Mulai : ${getWIBTimestamp()} WIB`);
  console.log(`🎯 Target URL  : ${WEBHOOK_URL}`);
  console.log(`🔑 Bot Token   : ${BOT_TOKEN.substring(0, 8)}...${BOT_TOKEN.substring(BOT_TOKEN.length - 4)}`);

  // 1. Verify Bot Token
  process.stdout.write('🔍 Memverifikasi bot token ke Telegram API... ');
  const me = await getMe();
  if (!me.ok) {
    console.log('❌ GAGAL');
    console.error(`Error dari Telegram: ${me.description}`);
    process.exit(1);
  }
  console.log(`✅ OK (@${me.result.username} - ${me.result.first_name})`);

  // 2. Clear existing webhook
  process.stdout.write('🧹 Menghapus webhook aktif (agar long-polling aktif)... ');
  await deleteWebhook();
  console.log('✅ Siap.');

  console.log('\n🟢 Long-Polling aktif! Menunggu pesan masuk dari Telegram (Tekan Ctrl+C untuk berhenti)...\n');

  let offset = 0;
  let isRunning = true;

  process.on('SIGINT', () => {
    console.log('\n\n🛑 Menghentikan long-polling...');
    isRunning = false;
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    isRunning = false;
    process.exit(0);
  });

  while (isRunning) {
    try {
      const url = `${TELEGRAM_API_BASE}/getUpdates?offset=${offset}&timeout=30&allowed_updates=["message","edited_message","callback_query"]`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data.ok) {
        console.error(`⚠️ Telegram getUpdates error: ${data.description}`);
        await new Promise(r => setTimeout(r, 3000));
        continue;
      }

      const updates = data.result || [];
      for (const update of updates) {
        offset = update.update_id + 1;

        const msg = update.message || update.edited_message;
        const sender = msg?.from?.username || msg?.from?.first_name || 'Anonymous';
        const text = msg?.text || (msg?.photo ? '[Foto Struk]' : msg?.voice ? '[Voice Note]' : '[Unknown]');
        const chatId = msg?.chat?.id;

        console.log(`\n📩 [${getWIBTimestamp()} WIB] Update #${update.update_id} dari @${sender} (Chat ID: ${chatId})`);
        console.log(`   Isi Pesan: "${text}"`);

        process.stdout.write('   -> Meneruskan ke webhook lokal... ');
        const webhookResult = await forwardToLocalWebhook(update);

        if (webhookResult.ok) {
          console.log(`✅ HTTP ${webhookResult.status}`);
          if (webhookResult.body?.reply) {
            console.log(`   💬 Bot Reply:\n   ${webhookResult.body.reply.replace(/\n/g, '\n   ')}`);
          }
        } else {
          console.log(`❌ GAGAL (HTTP ${webhookResult.status})`);
          if (webhookResult.error) {
            console.log(`   Error: ${webhookResult.error}`);
            console.log('   💡 Pastikan server TataDana berjalan di http://localhost:3000 (npm run dev atau node server.js)');
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('timeout')) {
        continue;
      }
      console.warn(`⚠️ Network loop error: ${err.message}. Mencoba lagi dalam 3 detik...`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

startPolling();
