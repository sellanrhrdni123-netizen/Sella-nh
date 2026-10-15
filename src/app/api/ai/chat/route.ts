// ==============================================================================
// TATADANA AI CHAT & ADVISOR ROUTE HANDLER (Milestone 3)
// POST /api/ai/chat
// Supports:
//   - Natural language text transaction parsing (action: 'parse_text')
//   - Conversational financial chat (action: 'chat' or prompt/messages)
//   - Financial advisor evaluation (action: 'financial_advisor')
//   - Onboarding category recommendations (action: 'category_recommendation')
// All requests are instrumented and logged via AI Telemetry (logAIOperation).
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { executeAITask, getActiveProviders } from '@/lib/ai/provider';
import { store } from '@/lib/storage';
import { logAIOperation } from '@/lib/ai/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action = 'chat',
      text,
      prompt,
      messages,
      provider = 'gemini',
      mode,
    } = body;

    const activeUser = store.getCurrentUser();
    const userId = body.userId || activeUser.id;

    // 1. Backward-Compatible Text Parsing Action
    if (action === 'parse_text') {
      const inputText = text || prompt || '';
      const userCategories = store.getCategories(userId);

      const taskResult = await executeAITask({
        taskType: 'text_parsing',
        userId,
        payload: { text: inputText, categories: userCategories },
        preferredProvider: provider,
        modeOverride: mode,
      });

      if (!taskResult.ok) {
        return NextResponse.json(
          { ok: false, error: taskResult.error || 'Gagal memproses parsing teks' },
          { status: 422 }
        );
      }

      return NextResponse.json({
        ok: true,
        data: taskResult.data,
        latencyMs: taskResult.latencyMs,
        provider: taskResult.provider,
        model: taskResult.model,
        tokensUsed: taskResult.tokensUsed,
        fallbackUsed: taskResult.fallbackUsed,
      });
    }

    // 2. Financial Advisor Action
    if (action === 'financial_advisor') {
      const transactions = store.getTransactions(userId);
      const currentMonth = new Date().toISOString().substring(0, 7);
      const budgets = store.getBudgets(userId, currentMonth);

      const taskResult = await executeAITask({
        taskType: 'financial_advisor',
        userId,
        payload: {
          user: activeUser,
          transaction: body.transaction,
          allTransactions: transactions,
          budgets,
          prompt: prompt || text,
        },
        preferredProvider: provider,
        modeOverride: mode,
      });

      return NextResponse.json({
        ok: true,
        data: taskResult.data,
        latencyMs: taskResult.latencyMs,
        provider: taskResult.provider,
        model: taskResult.model,
        tokensUsed: taskResult.tokensUsed,
      });
    }

    // 3. Category Recommendation Action
    if (action === 'category_recommendation' || action === 'categories') {
      const taskResult = await executeAITask({
        taskType: 'category_recommender',
        userId,
        payload: { answers: body.answers },
        preferredProvider: provider,
        modeOverride: mode,
      });

      return NextResponse.json({
        ok: true,
        data: taskResult.data,
        latencyMs: taskResult.latencyMs,
        provider: taskResult.provider,
        model: taskResult.model,
      });
    }

    // 4. Conversational Chat Action
    const userMessage =
      prompt ||
      text ||
      (Array.isArray(messages) && messages[messages.length - 1]?.content) ||
      'Halo TataDana';

    const taskResult = await executeAITask({
      taskType: 'chat',
      userId,
      payload: userMessage,
      preferredProvider: provider,
      modeOverride: mode,
    });

    const replyText =
      taskResult.data?.reply ||
      taskResult.data?.advice ||
      'Saya asisten keuangan TataDana. Ada yang bisa saya bantu terkait transaksi atau budget Anda?';

    return NextResponse.json({
      ok: true,
      reply: replyText,
      data: taskResult.data,
      latencyMs: taskResult.latencyMs,
      provider: taskResult.provider,
      model: taskResult.model,
      tokensUsed: taskResult.tokensUsed,
      fallbackUsed: taskResult.fallbackUsed,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Internal server error in AI chat route' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const configs = store.getAIConfigs();
  return NextResponse.json({
    ok: true,
    service: 'TataDana AI Multi-Provider Chat API',
    supportedActions: ['chat', 'parse_text', 'financial_advisor', 'category_recommendation'],
    providers: configs,
  });
}
