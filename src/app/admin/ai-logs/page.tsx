'use client';

import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  Cpu,
  Search,
  Filter,
  BarChart2,
  Coins,
  Activity
} from 'lucide-react';
import { store } from '@/lib/storage';
import { AILog } from '@/lib/types';
import { formatWIBDate, formatWIBTime } from '@/lib/utils';

export default function AILogsPage() {
  const [logs, setLogs] = useState<AILog[]>([]);
  const [featureFilter, setFeatureFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadData = () => {
    setLogs(store.getAILogs());
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = logs.filter(l => {
    const matchFeature = featureFilter === 'all' || l.feature === featureFilter;
    const matchProvider = providerFilter === 'all' || l.provider === providerFilter;
    const matchSearch =
      !search ||
      l.promptSummary.toLowerCase().includes(search.toLowerCase()) ||
      l.model.toLowerCase().includes(search.toLowerCase());
    return matchFeature && matchProvider && matchSearch;
  });

  // Aggregated Metrics
  const totalTokens = logs.reduce((sum, l) => sum + (l.tokensUsed || 0), 0);
  const avgLatency = logs.length > 0 ? Math.round(logs.reduce((sum, l) => sum + (l.latencyMs || 0), 0) / logs.length) : 0;
  const successCount = logs.filter(l => l.status === 'success').length;
  const successRate = logs.length > 0 ? Math.round((successCount / logs.length) * 100) : 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Terminal className="h-6 w-6 text-amber-500" />
            <span>Log Aktivitas AI & Metrik Latensi</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitoring riwayat pemanggilan AI, pemakaian token, latensi eksekusi (ms), dan error rate secara transparan.
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <Coins className="h-4 w-4 text-amber-400" />
            <span>Total Token</span>
          </div>
          <p className="text-2xl font-black text-white font-mono">{totalTokens.toLocaleString('id-ID')}</p>
          <span className="text-[10px] text-slate-500 font-mono">Prompt & Completion</span>
        </div>

        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <Clock className="h-4 w-4 text-sky-400" />
            <span>Rata-rata Latensi</span>
          </div>
          <p className="text-2xl font-black text-sky-400 font-mono">{avgLatency}ms</p>
          <span className="text-[10px] text-slate-500 font-mono">Response time</span>
        </div>

        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span>Tingkat Sukses</span>
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono">{successRate}%</p>
          <span className="text-[10px] text-slate-500 font-mono">{successCount} / {logs.length} sukses</span>
        </div>

        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <BarChart2 className="h-4 w-4 text-purple-400" />
            <span>Total Panggilan</span>
          </div>
          <p className="text-2xl font-black text-white font-mono">{logs.length}</p>
          <span className="text-[10px] text-slate-500 font-mono">NLP, OCR, STT & Advisor</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari prompt, input text, atau model..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <select
          value={providerFilter}
          onChange={e => setProviderFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:ring-2 focus:ring-amber-500"
        >
          <option value="all">Semua Provider</option>
          <option value="gemini">Google Gemini</option>
          <option value="openai">OpenAI</option>
          <option value="deepseek">DeepSeek</option>
        </select>

        <select
          value={featureFilter}
          onChange={e => setFeatureFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:ring-2 focus:ring-amber-500"
        >
          <option value="all">Semua Fitur AI</option>
          <option value="text_parser">Text Parser (Telegram NLP)</option>
          <option value="receipt_vision">Receipt Vision (OCR Struk)</option>
          <option value="voice_stt">Voice STT (Transkripsi VN)</option>
          <option value="financial_advisor">Financial Advisor</option>
        </select>
      </div>

      {/* Log Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-800/80 text-slate-400 uppercase font-bold text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Waktu (WIB)</th>
                <th className="py-3 px-4">Fitur</th>
                <th className="py-3 px-4">Provider & Model</th>
                <th className="py-3 px-4">Ringkasan Prompt / Input</th>
                <th className="py-3 px-4">Latensi</th>
                <th className="py-3 px-4">Tokens Digunakan</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                    {formatWIBDate(log.createdAt)} {formatWIBTime(log.createdAt)}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-amber-400 whitespace-nowrap">
                    {log.feature === 'text_parser'
                      ? '📝 NLP Teks'
                      : log.feature === 'receipt_vision'
                      ? '📸 OCR Struk'
                      : log.feature === 'voice_stt'
                      ? '🎙️ Speech-to-Text'
                      : '🤖 Fin Advisor'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                    <span className="uppercase text-[10px] font-bold bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 mr-1.5 border border-slate-700">
                      {log.provider}
                    </span>
                    {log.model}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate" title={log.promptSummary}>
                    {log.promptSummary}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                    <span className={log.latencyMs > 1000 ? 'text-amber-400' : 'text-emerald-400 font-bold'}>
                      {log.latencyMs}ms
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                    {log.tokensUsed} tokens
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        log.status === 'success'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {log.status === 'success' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Tidak ada log pemanggilan AI yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
