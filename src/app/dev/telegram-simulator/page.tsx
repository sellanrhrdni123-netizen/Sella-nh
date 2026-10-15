'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bot,
  Copy,
  Check,
  RotateCcw,
  User,
  ShieldCheck,
  Send,
  Zap,
  Terminal,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  Info
} from 'lucide-react';
import { TelegramSimulator } from '@/components/telegram/TelegramSimulator';
import { store, DEMO_USER_ID, STARTER_USER_ID } from '@/lib/storage';
import { UserProfile, Wallet } from '@/lib/types';
import { formatIDR } from '@/lib/utils';

export default function StandaloneTelegramSimulatorPage() {
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [txCountThisMonth, setTxCountThisMonth] = useState(0);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('http://localhost:3000/api/telegram/webhook');
  const [notification, setNotification] = useState<string | null>(null);

  const refreshState = () => {
    const user = store.getCurrentUser();
    setActiveUser(user);
    const userWallets = store.getWallets(user.id);
    setWallets(userWallets);

    const currentMonth = new Date().toISOString().substring(0, 7);
    const txs = store.getTransactions(user.id);
    const thisMonthCount = txs.filter(t => t.transactionDate.startsWith(currentMonth)).length;
    setTxCountThisMonth(thisMonthCount);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWebhookUrl(`${window.location.origin}/api/telegram/webhook`);
    }
    refreshState();
  }, []);

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleSwitchUser = (userId: string) => {
    store.setImpersonation(userId === DEMO_USER_ID ? null : userId);
    refreshState();
    setNotification(`Aktif sebagai ${userId === DEMO_USER_ID ? 'Budi Pratama (Pro)' : 'Siti Rahma (Starter)'}`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleResetStore = () => {
    if (confirm('Apakah Anda yakin ingin me-reset database in-memory ke data seeder awal?')) {
      store.resetAll();
      refreshState();
      setNotification('State database berhasil di-reset ke data awal!');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40 px-4 py-3 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition px-2.5 py-1.5 rounded-lg hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali ke Dashboard</span>
            </Link>
            <Link
              href="/portal"
              className="flex items-center gap-1.5 text-xs font-bold text-brand-400 hover:text-brand-300 transition px-2.5 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/30"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Portal Terpadu 🎯</span>
            </Link>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center">
                <Terminal className="h-4 w-4" />
              </div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                TataDana Dev Tools
                <span className="text-[10px] uppercase font-extrabold bg-brand-500 text-white px-1.5 py-0.5 rounded">
                  Simulator
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/portal"
              className="text-xs font-bold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-800 transition hidden sm:inline-flex"
            >
              Semua Fitur Hub
            </Link>
            <button
              onClick={handleResetStore}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/40 border border-rose-800/50 hover:bg-rose-900/40 px-3 py-1.5 rounded-xl transition"
              title="Reset state ke kondisi seeder default"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset State Seeder</span>
            </button>
          </div>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="bg-brand-500 text-white text-xs font-bold py-2 text-center shadow-lg transition animate-in fade-in slide-in-from-top-2">
          {notification}
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Telegram Simulator Mockup */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-md">
            <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold flex items-center gap-1.5">
                <Bot className="h-4 w-4 text-brand-400" />
                Live Telegram Chat Engine
              </span>
              <span className="text-[11px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Connected
              </span>
            </div>

            <TelegramSimulator
              onTransactionAdded={refreshState}
              className="w-full shadow-2xl border-slate-700/80"
              title="TataDana Bot Simulator"
            />

            <p className="text-[11px] text-slate-500 text-center mt-3">
              Ketik langsung di simulator atau gunakan preset uji coba cepat di panel kanan.
            </p>
          </div>
        </div>

        {/* Right Column: Developer Controls, Webhook Info, & State Inspector */}
        <div className="lg:col-span-5 space-y-6">
          {/* Webhook Endpoint Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-extrabold text-brand-400 tracking-wider flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" /> Webhook Public Endpoint
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">
                POST / Idempotent
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Kirimkan HTTP POST payload langsung dari Telegram Bot API atau via tunnel (Cloudflare Tunnel / Ngrok) ke URL ini:
            </p>

            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-2 font-mono text-xs text-slate-200">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="bg-transparent flex-1 outline-none text-xs text-brand-300 select-all"
              />
              <button
                onClick={handleCopyWebhook}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0"
                title="Salin URL Webhook"
              >
                {copiedWebhook ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* User Persona Switcher */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-brand-400" /> Profil Pengujian Aktif
              </span>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  activeUser?.plan === 'pro'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {activeUser?.plan || 'Starter'}
              </span>
            </div>

            {/* Persona Switch Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSwitchUser(DEMO_USER_ID)}
                className={`p-3 rounded-xl text-left border text-xs transition ${
                  activeUser?.id === DEMO_USER_ID
                    ? 'bg-brand-500/10 border-brand-500 text-white font-bold ring-1 ring-brand-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <div className="font-bold text-slate-200">Budi Pratama</div>
                <div className="text-[11px] text-amber-400 mt-0.5">Paket Pro (Unlimited)</div>
              </button>

              <button
                onClick={() => handleSwitchUser(STARTER_USER_ID)}
                className={`p-3 rounded-xl text-left border text-xs transition ${
                  activeUser?.id === STARTER_USER_ID
                    ? 'bg-brand-500/10 border-brand-500 text-white font-bold ring-1 ring-brand-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <div className="font-bold text-slate-200">Siti Rahma</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Paket Starter (Maks 50 tx)</div>
              </button>
            </div>

            {/* Current Quota Status */}
            <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Total Dompet Aktif:</span>
                <span className="font-bold text-white">
                  {wallets.length} {activeUser?.plan === 'starter' ? '/ 3' : '(Unlimited)'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Transaksi Bulan Ini:</span>
                <span className="font-bold text-white">
                  {txCountThisMonth} {activeUser?.plan === 'starter' ? '/ 50' : '(Unlimited)'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Foto Struk OCR:</span>
                <span className={activeUser?.plan === 'pro' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {activeUser?.plan === 'pro' ? 'Tersedia' : 'Terkunci (Upgrade CTA)'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Testing Reference */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-brand-400" /> Panduan Perintah & Sintaks
            </span>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="p-2 rounded-lg bg-slate-900 font-mono text-[11px] flex justify-between">
                <span>/saldo</span>
                <span className="text-slate-500">Cek saldo semua dompet</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 font-mono text-[11px] flex justify-between">
                <span>/budget</span>
                <span className="text-slate-500">Progress bar budget</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 font-mono text-[11px] flex justify-between">
                <span>/hari ini | /bulan ini</span>
                <span className="text-slate-500">Rekap cashflow</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 font-mono text-[11px] flex justify-between">
                <span>transfer 500rb bca ke gopay</span>
                <span className="text-slate-500">Pindah dana</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <Link href="/dashboard/settings" className="hover:text-brand-400 flex items-center gap-1 transition">
                <span>Settings Bot Token</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Link href="/dashboard/wallet" className="hover:text-brand-400 flex items-center gap-1 transition">
                <span>Kelola Dompet</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
