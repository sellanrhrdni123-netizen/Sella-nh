import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/storage';
import { formatDailyReminder } from '@/lib/telegram';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Daily Reminder Cron Endpoint
 * Scheduled / invoked (e.g. by Vercel Cron or local scheduler) to deliver daily
 * financial recording reminders to users who enabled reminders at their preferred WIB times.
 */
export async function GET(req: NextRequest) {
  return handleReminders(req);
}

export async function POST(req: NextRequest) {
  return handleReminders(req);
}

async function handleReminders(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const force = url.searchParams.get('force') === 'true';
    const overrideTime = url.searchParams.get('time') || undefined;

    // Calculate current time in WIB (Asia/Jakarta, UTC+7) in 'HH:mm' format
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const currentWibTime = overrideTime || formatter.format(now); // e.g. "12:30", "20:00"

    // 1. Fetch eligible profiles
    // In dual storage, check Supabase first if configured, otherwise store
    let eligibleProfiles: Array<{
      id: string;
      fullName: string;
      telegramChatId?: number;
      telegramBotToken?: string;
      reminderTimes: string[];
    }> = [];

    if (isSupabaseConfigured()) {
      const client = getAdminClient();
      if (client) {
        const { data, error } = await client
          .from('profiles')
          .select('id, full_name, telegram_chat_id, telegram_bot_token, reminder_times, daily_reminder_enabled')
          .eq('daily_reminder_enabled', true)
          .not('telegram_chat_id', 'is', null);

        if (!error && data && data.length > 0) {
          eligibleProfiles = data.map(d => ({
            id: d.id,
            fullName: d.full_name || 'Pengguna TataDana',
            telegramChatId: d.telegram_chat_id,
            telegramBotToken: d.telegram_bot_token,
            reminderTimes: Array.isArray(d.reminder_times) ? d.reminder_times : []
          }));
        }
      }
    }

    // Fallback or union with local store profiles
    if (eligibleProfiles.length === 0) {
      eligibleProfiles = store
        .getProfiles()
        .filter(p => p.dailyReminderEnabled && Boolean(p.telegramChatId))
        .map(p => ({
          id: p.id,
          fullName: p.fullName,
          telegramChatId: p.telegramChatId,
          telegramBotToken: p.telegramBotToken,
          reminderTimes: p.reminderTimes || []
        }));
    }

    const reminderText = formatDailyReminder();
    const dispatched: Array<{
      userId: string;
      fullName: string;
      chatId: number;
      scheduledTime: string;
      status: 'sent' | 'skipped' | 'failed';
      error?: string;
    }> = [];

    for (const profile of eligibleProfiles) {
      if (!profile.telegramChatId) continue;

      // Limit to max 2x/day schedules
      const times = profile.reminderTimes.slice(0, 2);
      const isDue = force || times.includes(currentWibTime);

      if (!isDue) {
        continue;
      }

      const scheduledTime = times.find(t => t === currentWibTime) || times[0] || currentWibTime;
      const botToken = profile.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;

      let deliveryStatus: 'sent' | 'skipped' | 'failed' = 'sent';
      let deliveryError: string | undefined = undefined;

      if (botToken) {
        try {
          const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: profile.telegramChatId,
              text: reminderText,
              parse_mode: 'Markdown'
            }),
            signal: AbortSignal.timeout(4000)
          });
          if (!res.ok) {
            deliveryStatus = 'failed';
            deliveryError = `HTTP ${res.status}`;
          }
        } catch (err: any) {
          deliveryStatus = 'failed';
          deliveryError = err.message || 'Network timeout';
        }
      } else {
        // Simulator / offline dev environment: mark simulated delivery as sent
        deliveryStatus = 'sent';
      }

      dispatched.push({
        userId: profile.id,
        fullName: profile.fullName,
        chatId: profile.telegramChatId,
        scheduledTime,
        status: deliveryStatus,
        error: deliveryError
      });
    }

    return NextResponse.json({
      ok: true,
      timestamp: now.toISOString(),
      wibTime: currentWibTime,
      totalChecked: eligibleProfiles.length,
      dispatchedCount: dispatched.length,
      dispatched
    });
  } catch (error: any) {
    console.error('Error executing reminder cron:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error.message || 'Gagal memproses reminder harian.'
      },
      { status: 500 }
    );
  }
}
