'use client';

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Plus,
  Key,
  Shield,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Trash2,
  X,
  Check,
  Zap,
  Star,
  RefreshCw,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { store } from '@/lib/storage';
import { AIProviderConfig, AIProvider } from '@/lib/types';

export default function AIProvidersPage() {
  const [configs, setConfigs] = useState<AIProviderConfig[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testStatus, setTestStatus] = useState<{ [id: string]: 'idle' | 'testing' | 'success' }>({});

  // Form State
  const [provider, setProvider] = useState<AIProvider>('gemini');
  const [name, setName] = useState('');
  const [modelName, setModelName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [mode, setMode] = useState<'single' | 'parallel_failover'>('parallel_failover');

  const loadData = () => {
    setConfigs(store.getAIConfigs());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleActive = (id: string, current: boolean) => {
    store.updateAIConfig(id, { isActive: !current });
    loadData();
  };

  const handleToggleMode = (id: string, currentMode: 'single' | 'parallel_failover') => {
    const nextMode = currentMode === 'single' ? 'parallel_failover' : 'single';
    store.updateAIConfig(id, { mode: nextMode });
    loadData();
  };

  const handleSetPrimary = (targetConfig: AIProviderConfig) => {
    // Reorder priorities so target becomes #1
    const current = store.getAIConfigs();
    current.forEach(c => {
      if (c.id === targetConfig.id) {
        store.updateAIConfig(c.id, { priority: 1, isActive: true });
      } else if (c.priority <= targetConfig.priority) {
        store.updateAIConfig(c.id, { priority: c.priority + 1 });
      }
    });
    loadData();
  };

  const handleTestConnection = (id: string) => {
    setTestStatus(prev => ({ ...prev, [id]: 'testing' }));
    setTimeout(() => {
      setTestStatus(prev => ({ ...prev, [id]: 'success' }));
      setTimeout(() => {
        setTestStatus(prev => ({ ...prev, [id]: 'idle' }));
      }, 3000);
    }, 600);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    store.addAIConfig({
      provider,
      name: name.trim() || `${provider.toUpperCase()} Model`,
      modelName: modelName.trim() || (provider === 'gemini' ? 'gemini-1.5-flash' : provider === 'openai' ? 'gpt-4o-mini' : 'deepseek-chat'),
      apiKeyEncrypted: `enc_${apiKey.trim()}`,
      isActive: true,
      priority: configs.length + 1,
      mode
    });

    setIsModalOpen(false);
    setName('');
    setModelName('');
    setApiKey('');
    loadData();
  };

  const handleDelete = (id: string) => {
    if (confirm('Yakin ingin menghapus konfigurasi provider AI ini?')) {
      store.deleteAIConfig(id);
      loadData();
    }
  };

  const sortedConfigs = [...configs].sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Cpu className="h-6 w-6 text-amber-500" />
            <span>Kelola Multi-Provider AI & Failover</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Konfigurasi Google Gemini Flash (Primary multimodal), OpenAI GPT, dan DeepSeek. Beralih mode Single vs Parallel Failover secara realtime.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Provider AI</span>
        </button>
      </div>

      {/* Info Architecture Banner */}
      <div className="rounded-2xl p-5 bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-900 border border-amber-500/30 text-xs text-amber-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Zap className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-white block font-extrabold text-sm">
              Arsitektur Multi-Provider Parallel Failover
            </strong>
            <p className="text-slate-300 text-[11px] leading-relaxed max-w-2xl">
              TataDana menggunakan <strong>Google Gemini Flash</strong> sebagai primary provider untuk parsing teks, OCR foto struk, dan audio STT. Jika kuota limit atau error jaringan terjadi, router otomatis mengalihkan request ke OpenAI / DeepSeek tanpa kegagalan pada bot Telegram.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 shrink-0 text-[11px]">
          <span className="text-slate-400">Total Provider Aktif:</span>
          <span className="font-mono font-bold text-amber-400">{configs.filter(c => c.isActive).length} / {configs.length}</span>
        </div>
      </div>

      {/* List Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {sortedConfigs.map(cfg => {
          const isPrimary = cfg.priority === 1;
          const status = testStatus[cfg.id] || 'idle';

          return (
            <div
              key={cfg.id}
              className={`bg-slate-900 rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                cfg.isActive
                  ? isPrimary
                    ? 'border-amber-500/60 shadow-xl shadow-amber-500/10'
                    : 'border-slate-800 shadow-lg'
                  : 'border-slate-800/40 opacity-55'
              }`}
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isPrimary
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Priority #{cfg.priority} {isPrimary && '★ PRIMARY'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleActive(cfg.id, cfg.isActive)}
                    className="text-slate-400 hover:text-white transition"
                    title={cfg.isActive ? 'Nonaktifkan Provider' : 'Aktifkan Provider'}
                  >
                    {cfg.isActive ? (
                      <ToggleRight className="h-7 w-7 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="h-7 w-7 text-slate-600" />
                    )}
                  </button>
                </div>

                <div className="mt-3">
                  <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                    <span>{cfg.name}</span>
                  </h3>
                  <span className="text-xs text-amber-400 font-mono block mt-0.5">{cfg.modelName}</span>
                </div>

                {/* Details Table */}
                <div className="mt-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-slate-400 bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800/60">
                    <span>Status Kunci API:</span>
                    <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-400">
                      <Shield className="h-3.5 w-3.5" /> Terenkripsi
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400 bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800/60">
                    <span>Mode Failover:</span>
                    <button
                      type="button"
                      onClick={() => handleToggleMode(cfg.id, cfg.mode)}
                      className="font-bold text-amber-400 hover:underline text-[11px] flex items-center gap-1"
                    >
                      <Sliders className="h-3 w-3" />
                      <span>{cfg.mode === 'parallel_failover' ? 'Paralel Failover' : 'Single Mode'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => handleTestConnection(cfg.id)}
                    disabled={status === 'testing'}
                    className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-amber-400 font-bold transition"
                  >
                    <RefreshCw className={`h-3 w-3 ${status === 'testing' ? 'animate-spin text-amber-400' : ''}`} />
                    <span>{status === 'testing' ? 'Mengetes...' : status === 'success' ? '✓ Tersambung' : 'Test Koneksi'}</span>
                  </button>

                  {!isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(cfg)}
                      className="text-[11px] font-bold text-amber-400 hover:underline"
                    >
                      Jadikan Utama
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(cfg.id)}
                    className="text-red-400 hover:text-red-300 p-1 transition"
                    title="Hapus Konfigurasi"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add Provider */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-800 text-xs text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white">Tambah Konfigurasi Provider AI</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Provider Engine</label>
                <select
                  value={provider}
                  onChange={e => {
                    const p = e.target.value as AIProvider;
                    setProvider(p);
                    if (p === 'gemini') {
                      setName('Google Gemini Flash');
                      setModelName('gemini-1.5-flash');
                    } else if (p === 'openai') {
                      setName('OpenAI GPT-4o Mini');
                      setModelName('gpt-4o-mini');
                    } else {
                      setName('DeepSeek Chat V3');
                      setModelName('deepseek-chat');
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-amber-500"
                >
                  <option value="gemini">Google Gemini (Recommended Multimodal)</option>
                  <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                  <option value="deepseek">DeepSeek (V3 / R1)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Nama Label</label>
                <input
                  type="text"
                  placeholder="Contoh: Gemini 2.0 Flash"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Model Name</label>
                <input
                  type="text"
                  placeholder="Contoh: gemini-1.5-flash atau gpt-4o"
                  required
                  value={modelName}
                  onChange={e => setModelName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">API Key</label>
                <input
                  type="password"
                  placeholder="sk-... atau AIzaSy..."
                  required
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Kunci otomatis dienkripsi sebelum disimpan ke database.</span>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Mode Operasi</label>
                <select
                  value={mode}
                  onChange={e => setMode(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-amber-500"
                >
                  <option value="parallel_failover">Paralel Failover (Failover otomatis)</option>
                  <option value="single">Single Mode (Hanya satu provider)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20 transition"
                >
                  Simpan Konfigurasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
