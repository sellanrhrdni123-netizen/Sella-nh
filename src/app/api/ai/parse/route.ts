// ==============================================================================
// TATADANA AI PARSING ROUTE HANDLER (Milestone 3)
// POST /api/ai/parse
// Dispatches multimodal parsing requests (text, receipt photo OCR, voice note STT)
// through the Multi-Provider Engine with automatic failover and telemetry logging.
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { executeAITask, getActiveProviders } from '@/lib/ai/provider';
import { store } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = body.type || body.taskType || 'text';
    const provider = body.provider;
    const mode = body.mode;
    const userId = body.userId || store.getActiveUserId();

    // 1. Text Parsing
    if (type === 'text' || type === 'text_parsing') {
      const text = body.text || '';
      if (!text.trim()) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Pesan tidak boleh kosong. Ketik transaksi seperti: "beli bakso 15rb" atau "gajian 5jt".',
          },
          { status: 400 }
        );
      }

      const categories = body.categories || store.getCategories(userId);
      const taskResult = await executeAITask({
        taskType: 'text_parsing',
        userId,
        payload: { text, categories },
        preferredProvider: provider,
        modeOverride: mode,
      });

      if (!taskResult.ok) {
        return NextResponse.json(
          { ok: false, error: taskResult.error || 'Gagal memproses teks transaksi' },
          { status: 422 }
        );
      }

      return NextResponse.json({
        ok: true,
        data: taskResult.data,
        provider: taskResult.provider,
        model: taskResult.model,
        latencyMs: taskResult.latencyMs,
        tokensUsed: taskResult.tokensUsed,
        fallbackUsed: taskResult.fallbackUsed,
      });
    }

    // 2. Receipt OCR Vision
    if (type === 'receipt' || type === 'receipt_ocr' || type === 'photo') {
      const imageUrl = body.imageUrl || body.photoUrl || body.image || '';
      const merchant = body.merchant || body.merchantName;

      const taskResult = await executeAITask({
        taskType: 'receipt_ocr',
        userId,
        payload: { imageUrl, merchant },
        preferredProvider: provider,
        modeOverride: mode,
      });

      if (!taskResult.ok) {
        return NextResponse.json(
          { ok: false, error: taskResult.error || 'Gagal memproses foto struk' },
          { status: 422 }
        );
      }

      return NextResponse.json({
        ok: true,
        data: taskResult.data,
        provider: taskResult.provider,
        model: taskResult.model,
        latencyMs: taskResult.latencyMs,
        tokensUsed: taskResult.tokensUsed,
        fallbackUsed: taskResult.fallbackUsed,
      });
    }

    // 3. Voice Note Audio STT
    if (type === 'voice' || type === 'voice_stt' || type === 'audio') {
      const audioUrl = body.audioUrl || body.url || '';
      const duration = Number(body.duration || body.durationSeconds || 5);
      const hint = body.hint || body.inputHint;

      // Hard limit validation
      if (duration > 60) {
        return NextResponse.json(
          { ok: false, error: 'Durasi voice note maksimal 60 detik.' },
          { status: 400 }
        );
      }

      const taskResult = await executeAITask({
        taskType: 'voice_stt',
        userId,
        payload: { audioUrl, duration, hint },
        preferredProvider: provider,
        modeOverride: mode,
      });

      if (!taskResult.ok) {
        return NextResponse.json(
          { ok: false, error: taskResult.error || 'Gagal mentranskripsi audio voice note' },
          { status: 422 }
        );
      }

      return NextResponse.json({
        ok: true,
        data: taskResult.data,
        provider: taskResult.provider,
        model: taskResult.model,
        latencyMs: taskResult.latencyMs,
        tokensUsed: taskResult.tokensUsed,
        fallbackUsed: taskResult.fallbackUsed,
      });
    }

    return NextResponse.json(
      { ok: false, error: `Tipe parsing tidak didukung: "${type}". Gunakan "text", "receipt", atau "voice".` },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Internal server error in AI parse route' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const activeProviders = getActiveProviders();
  return NextResponse.json({
    ok: true,
    service: 'TataDana AI Multimodal Parsing API',
    supportedTypes: ['text', 'receipt', 'voice'],
    activeProviders: activeProviders.map(p => ({
      provider: p.provider,
      name: p.name,
      model: p.modelName,
      priority: p.priority,
      mode: p.mode,
    })),
  });
}
