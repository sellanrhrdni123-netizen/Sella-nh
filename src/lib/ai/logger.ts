// ==============================================================================
// TATADANA AI TELEMETRY & USAGE LOGGER (Milestone 3)
// Instrumentation and audit logging for all AI multi-provider operations
// Persists to:
//   1. Supabase public.ai_logs (when configured)
//   2. In-memory & local store (TataDanaStore)
// ==============================================================================

import { store } from '@/lib/storage';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getAdminClient } from '@/lib/supabase/admin';
import type { AILog, AIProvider } from '@/lib/types';

export type AITaskType =
  | 'text_parsing'
  | 'receipt_ocr'
  | 'voice_stt'
  | 'financial_advisor'
  | 'category_recommender'
  | 'chat'
  | string;

export interface LogAIOperationParams {
  userId?: string | null;
  provider: AIProvider | string;
  model: string;
  taskType: AITaskType;
  promptSummary?: string;
  latencyMs: number;
  tokensUsed?: number;
  promptTokens?: number;
  responseTokens?: number;
  status: 'success' | 'failed' | 'fallback';
  errorMessage?: string | null;
}

export interface AISummaryStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  fallbackRequests: number;
  successRate: number; // percentage 0 - 100
  totalTokensUsed: number;
  totalPromptTokens: number;
  totalResponseTokens: number;
  avgLatencyMs: number;
  providerBreakdown: Record<string, { requests: number; tokens: number; errors: number; avgLatency: number }>;
}

export interface AILogFilter {
  userId?: string;
  provider?: string;
  taskType?: string;
  status?: 'success' | 'failed' | 'fallback';
  limit?: number;
}

/**
 * Maps high-level task_type to legacy feature enum for backward compatibility
 */
function mapTaskTypeToFeature(taskType: AITaskType): AILog['feature'] {
  switch (taskType) {
    case 'text_parsing':
      return 'text_parser';
    case 'receipt_ocr':
      return 'receipt_vision';
    case 'voice_stt':
      return 'voice_stt';
    case 'financial_advisor':
      return 'financial_advisor';
    case 'category_recommender':
      return 'category_recommender';
    default:
      return 'text_parser';
  }
}

/**
 * Logs an AI operation with full latency, token telemetry, and execution status
 */
export async function logAIOperation(params: LogAIOperationParams): Promise<AILog> {
  const {
    userId = null,
    provider,
    model,
    taskType,
    promptSummary = `Task: ${taskType}`,
    latencyMs,
    status,
    errorMessage = null,
  } = params;

  // Resolve token breakdown
  let tokensUsed = params.tokensUsed || 0;
  let promptTokens = params.promptTokens || 0;
  let responseTokens = params.responseTokens || 0;

  if (tokensUsed > 0 && promptTokens === 0 && responseTokens === 0) {
    promptTokens = Math.floor(tokensUsed * 0.6);
    responseTokens = Math.max(0, tokensUsed - promptTokens);
  } else if ((promptTokens > 0 || responseTokens > 0) && tokensUsed === 0) {
    tokensUsed = promptTokens + responseTokens;
  } else if (tokensUsed === 0 && promptTokens === 0 && responseTokens === 0) {
    // Realistic default estimation based on task type
    if (taskType === 'receipt_ocr') {
      promptTokens = 450;
      responseTokens = 180;
    } else if (taskType === 'voice_stt') {
      promptTokens = 120;
      responseTokens = 60;
    } else {
      promptTokens = 85;
      responseTokens = 45;
    }
    tokensUsed = promptTokens + responseTokens;
  }

  const legacyFeature = mapTaskTypeToFeature(taskType);
  const normalizedProvider = (provider as AIProvider) || 'gemini';

  // 1. Persist to in-memory store
  const newLog = store.addAILog({
    userId: userId || undefined,
    feature: legacyFeature,
    provider: normalizedProvider,
    model,
    promptSummary: promptSummary.slice(0, 255),
    latencyMs: Math.max(0, Math.round(latencyMs)),
    tokensUsed,
    status,
    errorMessage: errorMessage || undefined,
  });

  // 2. Persist to Supabase if live database is configured
  if (isSupabaseConfigured()) {
    try {
      const adminClient = getAdminClient();
      if (adminClient) {
        await adminClient.from('ai_logs').insert({
          user_id: userId,
          provider: normalizedProvider,
          task_type: taskType,
          feature: legacyFeature,
          model,
          prompt_summary: promptSummary.slice(0, 255),
          latency_ms: Math.max(0, Math.round(latencyMs)),
          tokens_used: tokensUsed,
          prompt_tokens: promptTokens,
          response_tokens: responseTokens,
          status,
          error_message: errorMessage,
          created_at: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      console.warn('⚠️ [AILogger] Failed to persist log entry to Supabase:', err?.message);
    }
  }

  return newLog;
}

/**
 * Retrieves AI logs matching optional filters, sorted newest first
 */
export function getAILogs(filter?: AILogFilter): AILog[] {
  let logs = store.getAILogs();

  if (filter?.userId) {
    logs = logs.filter(l => l.userId === filter.userId);
  }
  if (filter?.provider) {
    logs = logs.filter(l => l.provider === filter.provider);
  }
  if (filter?.status) {
    logs = logs.filter(l => l.status === filter.status);
  }
  if (filter?.taskType) {
    const targetFeature = mapTaskTypeToFeature(filter.taskType);
    logs = logs.filter(l => l.feature === targetFeature);
  }
  if (filter?.limit && filter.limit > 0) {
    logs = logs.slice(0, filter.limit);
  }

  return logs;
}

/**
 * Computes aggregated telemetry statistics across all recorded AI operations
 */
export function getAISummaryStats(): AISummaryStats {
  const logs = store.getAILogs();
  const total = logs.length;

  if (total === 0) {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      fallbackRequests: 0,
      successRate: 100,
      totalTokensUsed: 0,
      totalPromptTokens: 0,
      totalResponseTokens: 0,
      avgLatencyMs: 0,
      providerBreakdown: {},
    };
  }

  let successCount = 0;
  let failCount = 0;
  let fallbackCount = 0;
  let totalTokens = 0;
  let totalLatency = 0;

  const providerBreakdown: Record<string, { requests: number; tokens: number; errors: number; totalLatency: number; avgLatency: number }> = {};

  for (const log of logs) {
    if (log.status === 'success') successCount++;
    else if (log.status === 'failed') failCount++;
    else if (log.status === 'fallback') fallbackCount++;

    totalTokens += log.tokensUsed;
    totalLatency += log.latencyMs;

    const p = log.provider || 'unknown';
    if (!providerBreakdown[p]) {
      providerBreakdown[p] = { requests: 0, tokens: 0, errors: 0, totalLatency: 0, avgLatency: 0 };
    }
    providerBreakdown[p].requests++;
    providerBreakdown[p].tokens += log.tokensUsed;
    providerBreakdown[p].totalLatency += log.latencyMs;
    if (log.status === 'failed') {
      providerBreakdown[p].errors++;
    }
  }

  for (const p of Object.keys(providerBreakdown)) {
    const item = providerBreakdown[p];
    item.avgLatency = item.requests > 0 ? Math.round(item.totalLatency / item.requests) : 0;
  }

  const promptEstimate = Math.round(totalTokens * 0.6);
  const responseEstimate = Math.round(totalTokens * 0.4);

  return {
    totalRequests: total,
    successfulRequests: successCount,
    failedRequests: failCount,
    fallbackRequests: fallbackCount,
    successRate: Math.round(((successCount + fallbackCount) / total) * 1000) / 10,
    totalTokensUsed: totalTokens,
    totalPromptTokens: promptEstimate,
    totalResponseTokens: responseEstimate,
    avgLatencyMs: Math.round(totalLatency / total),
    providerBreakdown,
  };
}
