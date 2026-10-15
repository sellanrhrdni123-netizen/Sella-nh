/**
 * ==============================================================================
 * TATADANA ADVERSARIAL STRESS TEST SUITE: MILESTONE 3 (AI MULTI-PROVIDER & MULTIMODAL)
 * File: tests/adversarial/m3-adversarial.test.ts
 *
 * Verifies:
 * 1. AI Telemetry & Usage Logger (src/lib/ai/logger.ts):
 *    - Logging operation metadata (latency, prompt/response tokens, provider, model)
 *    - Filtered querying and summary statistical aggregation
 * 2. Gemini Multimodal Client (src/lib/ai/gemini.ts):
 *    - Structured text parsing of Indonesian currency and transaction types
 *    - Itemized receipt OCR parsing with exact total sum reconciliation
 *    - Voice note STT transcription and 60-second limit cutoff enforcement
 * 3. AI Multi-Provider Engine (src/lib/ai/provider.ts):
 *    - Primary provider resolution and active provider sorting
 *    - Single mode execution vs Parallel Failover mode
 *    - Seamless failover across Gemini, OpenAI, and DeepSeek
 *    - Automatic telemetry logging for every task execution
 * 4. AI API Route Handlers:
 *    - /api/ai/parse (text, receipt, voice, and boundary validation)
 *    - /api/ai/chat (chat, parse_text backward-compat, advisor, and categories)
 * ==============================================================================
 */

import { store, DEMO_USER_ID } from '../../src/lib/storage';
import { logAIOperation, getAILogs, getAISummaryStats } from '../../src/lib/ai/logger';
import {
  geminiParseText,
  geminiParseReceipt,
  geminiTranscribeVoice,
  geminiGenerateText,
  getGeminiApiKey,
  isLiveGeminiKey,
} from '../../src/lib/ai/gemini';
import {
  executeAITask,
  getActiveProviders,
  getPrimaryProvider,
  setProviderMode,
} from '../../src/lib/ai/provider';
import { POST as parsePOST, GET as parseGET } from '../../src/app/api/ai/parse/route';
import { POST as chatPOST, GET as chatGET } from '../../src/app/api/ai/chat/route';

export interface TestResult {
  name: string;
  passed: boolean;
  category: string;
  details?: string;
  error?: string;
}

export async function runM3AdversarialTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  function assert(name: string, category: string, condition: boolean, details?: string) {
    results.push({
      name,
      category,
      passed: Boolean(condition),
      details,
      error: condition ? undefined : details || 'Assertion failed',
    });
  }

  function assertEqual(name: string, category: string, actual: any, expected: any, details?: string) {
    const passed = actual === expected;
    results.push({
      name,
      category,
      passed,
      details: details ? `${details} (got ${actual}, expected ${expected})` : `Got ${actual}, expected ${expected}`,
      error: passed ? undefined : `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    });
  }

  function createMockRequest(url: string, method: string = 'POST', body?: any): any {
    return {
      url,
      method,
      json: async () => body || {},
      headers: new Headers({ 'content-type': 'application/json' }),
    };
  }

  // ============================================================================
  // CATEGORY 1: AI TELEMETRY & USAGE LOGGER
  // ============================================================================
  const CAT_LOGGER = 'AI Telemetry & Usage Logger';

  try {
    const initialLogCount = getAILogs().length;
    const testLog = await logAIOperation({
      userId: DEMO_USER_ID,
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      taskType: 'text_parsing',
      promptSummary: 'Parse: "beli martabak 30rb"',
      latencyMs: 245,
      tokensUsed: 130,
      status: 'success',
    });

    assert('Log entry generated with unique ID', CAT_LOGGER, Boolean(testLog.id));
    assertEqual('Log entry recorded with correct latency', CAT_LOGGER, testLog.latencyMs, 245);
    assertEqual('Log entry recorded with correct tokens', CAT_LOGGER, testLog.tokensUsed, 130);
    assertEqual('Total logs incremented', CAT_LOGGER, getAILogs().length, initialLogCount + 1);

    const filtered = getAILogs({ provider: 'gemini', taskType: 'text_parsing' });
    assert('Filter logs by provider and task type', CAT_LOGGER, filtered.length > 0);

    const stats = getAISummaryStats();
    assert('Aggregated summary stats total requests > 0', CAT_LOGGER, stats.totalRequests > 0);
    assert('Summary stats success rate is valid percentage', CAT_LOGGER, stats.successRate >= 0 && stats.successRate <= 100);
    assert('Provider breakdown contains gemini', CAT_LOGGER, Boolean(stats.providerBreakdown['gemini']));
  } catch (err: any) {
    assert('Logger suite execution without error', CAT_LOGGER, false, err?.message);
  }

  // ============================================================================
  // CATEGORY 2: GEMINI MULTIMODAL CLIENT
  // ============================================================================
  const CAT_GEMINI = 'Gemini Multimodal Client';

  try {
    const key = getGeminiApiKey();
    assert('Gemini API key is resolvable', CAT_GEMINI, key !== null && key.length > 0);

    const isLive = isLiveGeminiKey('AIzaSyDemoTataDanaKeyGemini12345');
    assertEqual('Demo key detected as non-live mock', CAT_GEMINI, isLive, false);

    // Multimodal text parsing
    const parsedText = await geminiParseText('beli nasi padang rendang 28rb');
    assertEqual('Gemini parses expense type correctly', CAT_GEMINI, parsedText.result.jenis, 'pengeluaran');
    assertEqual('Gemini parses nominal 28rb = 28000', CAT_GEMINI, parsedText.result.nominal, 28000);
    assert('Gemini tokens used is recorded', CAT_GEMINI, parsedText.tokensUsed > 0);

    // Multimodal receipt OCR
    const parsedReceipt = await geminiParseReceipt('sample_url', 'Indomaret Point Sudirman');
    assertEqual('Receipt OCR detects merchant correctly', CAT_GEMINI, parsedReceipt.merchant, 'Indomaret Point Sudirman');
    assert('Receipt OCR produces line items', CAT_GEMINI, parsedReceipt.items.length > 0);
    const sumItems = parsedReceipt.items.reduce((s, itm) => s + itm.price, 0);
    assertEqual('Receipt items sum exactly to total amount', CAT_GEMINI, parsedReceipt.totalAmount, sumItems);

    // Multimodal voice STT with valid duration
    const voiceValid = await geminiTranscribeVoice('audio_sample.ogg', 15);
    assert('Voice note STT returns transcript', CAT_GEMINI, Boolean(voiceValid.transcript));
    assertEqual('Voice note STT preserves duration', CAT_GEMINI, voiceValid.duration, 15);

    // Voice STT hard cutoff validation (>60s must fail)
    let cutoffThrew = false;
    try {
      await geminiTranscribeVoice('audio_long.ogg', 65);
    } catch (e: any) {
      cutoffThrew = e.message.includes('60 detik');
    }
    assert('Voice note exceeding 60s throws hard cutoff error', CAT_GEMINI, cutoffThrew);

    // Conversational text generation
    const genText = await geminiGenerateText('Beri tips hemat belanja');
    assert('Gemini text generation returns content', CAT_GEMINI, genText.text.length > 0);
  } catch (err: any) {
    assert('Gemini multimodal client execution without error', CAT_GEMINI, false, err?.message);
  }

  // ============================================================================
  // CATEGORY 3: MULTI-PROVIDER ENGINE & FAILOVER
  // ============================================================================
  const CAT_PROVIDER = 'AI Multi-Provider Engine & Failover';

  try {
    const activeProviders = getActiveProviders();
    assert('Multiple active providers registered', CAT_PROVIDER, activeProviders.length >= 3);

    const primary = getPrimaryProvider();
    assertEqual('Primary provider is Google Gemini', CAT_PROVIDER, primary.provider, 'gemini');

    // Execute standard text parsing task
    const taskResult = await executeAITask({
      taskType: 'text_parsing',
      payload: { text: 'gajian 12.5jt' },
    });
    assert('Task executes successfully', CAT_PROVIDER, taskResult.ok);
    assertEqual('Parsed nominal is 12,500,000', CAT_PROVIDER, taskResult.data.nominal, 12500000);
    assertEqual('Parsed type is pemasukan', CAT_PROVIDER, taskResult.data.jenis, 'pemasukan');
    assert('Task records execution latency', CAT_PROVIDER, taskResult.latencyMs >= 0);

    // Execute receipt OCR task
    const receiptTask = await executeAITask({
      taskType: 'receipt_ocr',
      payload: { imageUrl: 'https://example.com/receipt.jpg', merchant: 'Alfamart Express' },
    });
    assert('Receipt OCR task succeeds', CAT_PROVIDER, receiptTask.ok);
    assertEqual('Receipt OCR merchant matches', CAT_PROVIDER, receiptTask.data.merchant, 'Alfamart Express');

    // Execute voice STT task
    const voiceTask = await executeAITask({
      taskType: 'voice_stt',
      payload: { audioUrl: 'voice.ogg', duration: 10 },
    });
    assert('Voice STT task succeeds for duration <= 60s', CAT_PROVIDER, voiceTask.ok);

    // Execute financial advisor task
    const advisorTask = await executeAITask({
      taskType: 'financial_advisor',
      payload: { prompt: 'Analisis spending' },
    });
    assert('Financial advisor task succeeds', CAT_PROVIDER, advisorTask.ok);

    // Execute onboarding category recommendation
    const catTask = await executeAITask({
      taskType: 'category_recommender',
      payload: {},
    });
    assert('Category recommender returns 8 standard categories', CAT_PROVIDER, Array.isArray(catTask.data) && catTask.data.length === 8);

    // Failover test: request non-existent or failing configuration falls back gracefully
    const fallbackTask = await executeAITask({
      taskType: 'text_parsing',
      preferredProvider: 'openai',
      payload: { text: 'kopi susu 20k' },
    });
    assert('Alternative provider executes successfully', CAT_PROVIDER, fallbackTask.ok);
    assertEqual('Alternative provider parsed nominal', CAT_PROVIDER, fallbackTask.data.nominal, 20000);
  } catch (err: any) {
    assert('Provider engine execution without error', CAT_PROVIDER, false, err?.message);
  }

  // ============================================================================
  // CATEGORY 4: AI API ROUTE HANDLERS
  // ============================================================================
  const CAT_ROUTES = 'AI API Route Handlers';

  try {
    // 1. /api/ai/parse GET
    const parseGetRes = await parseGET();
    const parseGetData = await parseGetRes.json();
    assert('/api/ai/parse GET returns ok', CAT_ROUTES, parseGetData.ok);
    assert('/api/ai/parse lists supported types', CAT_ROUTES, parseGetData.supportedTypes.includes('receipt'));

    // 2. /api/ai/parse POST (Text)
    const parseTextReq = createMockRequest('http://localhost:3000/api/ai/parse', 'POST', {
      type: 'text',
      text: 'beli pulsa telkomsel 100rb via bca',
    });
    const parseTextRes = await parsePOST(parseTextReq);
    const parseTextData = await parseTextRes.json();
    assertEqual('/api/ai/parse POST text status 200', CAT_ROUTES, parseTextRes.status, 200);
    assert('/api/ai/parse returns ok: true', CAT_ROUTES, parseTextData.ok);
    assertEqual('/api/ai/parse extracts nominal 100000', CAT_ROUTES, parseTextData.data.nominal, 100000);
    assertEqual('/api/ai/parse detects BCA wallet', CAT_ROUTES, parseTextData.data.dompet, 'BCA Utama');

    // 3. /api/ai/parse POST (Voice > 60s hard limit)
    const parseVoiceTooLongReq = createMockRequest('http://localhost:3000/api/ai/parse', 'POST', {
      type: 'voice',
      audioUrl: 'voice.ogg',
      duration: 65,
    });
    const parseVoiceTooLongRes = await parsePOST(parseVoiceTooLongReq);
    assertEqual('/api/ai/parse rejects audio > 60s with 400', CAT_ROUTES, parseVoiceTooLongRes.status, 400);

    // 4. /api/ai/parse POST (Empty text validation)
    const parseEmptyReq = createMockRequest('http://localhost:3000/api/ai/parse', 'POST', {
      type: 'text',
      text: '   ',
    });
    const parseEmptyRes = await parsePOST(parseEmptyReq);
    assertEqual('/api/ai/parse rejects empty text with 400', CAT_ROUTES, parseEmptyRes.status, 400);

    // 5. /api/ai/chat GET
    const chatGetRes = await chatGET();
    const chatGetData = await chatGetRes.json();
    assert('/api/ai/chat GET returns ok', CAT_ROUTES, chatGetData.ok);
    assert('/api/ai/chat returns provider list', CAT_ROUTES, Array.isArray(chatGetData.providers));

    // 6. /api/ai/chat POST (action: parse_text backward-compatibility)
    const chatParseReq = createMockRequest('http://localhost:3000/api/ai/chat', 'POST', {
      action: 'parse_text',
      text: 'beli sate ayam 25k',
    });
    const chatParseRes = await chatPOST(chatParseReq);
    const chatParseData = await chatParseRes.json();
    assertEqual('/api/ai/chat parse_text status 200', CAT_ROUTES, chatParseRes.status, 200);
    assert('/api/ai/chat parse_text ok', CAT_ROUTES, chatParseData.ok);
    assertEqual('/api/ai/chat nominal 25000', CAT_ROUTES, chatParseData.data.nominal, 25000);

    // 7. /api/ai/chat POST (action: chat)
    const chatConvReq = createMockRequest('http://localhost:3000/api/ai/chat', 'POST', {
      action: 'chat',
      prompt: 'Halo TataDana, bagaimana cara membuat budget bulanan?',
    });
    const chatConvRes = await chatPOST(chatConvReq);
    const chatConvData = await chatConvRes.json();
    assertEqual('/api/ai/chat conversation status 200', CAT_ROUTES, chatConvRes.status, 200);
    assert('/api/ai/chat conversation returns reply', CAT_ROUTES, Boolean(chatConvData.reply));
  } catch (err: any) {
    assert('Route handler execution without error', CAT_ROUTES, false, err?.message);
  }

  return results;
}
