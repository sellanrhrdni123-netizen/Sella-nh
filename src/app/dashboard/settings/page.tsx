'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Bot,
  Bell,
  Tag,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Send,
  Plus,
  Trash2,
  Copy,
  Clock
} from 'lucide-react';
import { store } from '@/lib/storage';
import { UserProfile, Category } from '@/lib/types';
import { formatDailyReminder } from '@/lib/telegram';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'telegram' | 'reminder' | 'categories' | 'plan'>('telegram');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Profile form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Telegram test connection state (Part 5)
  const [botToken, setBotToken] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [testedBotInfo, setTestedBotInfo] = useState<any>(null);

  // Reminder form (Part 3)
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderFrequency, setReminderFrequency] = useState<1 | 2>(1);
  const [time1, setTime1] = useState('20:00');
  const [time2, setTime2] = useState('12:30');

  // Categories & AI Onboarding
  const [onboardingPrompt, setOnboardingPrompt] = useState('');
  const [isGeneratingCategories, setIsGeneratingCategories] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('🛍️');
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense');

  // Plan modal
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');

  const loadData = () => {
    const u = store.getCurrentUser();
    setUser(u);
    setFullName(u.fullName);
    setEmail(u.email);
    setPhoneNumber(u.phoneNumber);
    setBotToken(u.telegramBotToken || '');
    setConnectionStatus(u.telegramConnected ? 'connected' : 'idle');
    setReminderEnabled(u.dailyReminderEnabled);
    setReminderFrequency(u.reminderFrequency);
    setTime1(u.reminderTimes[0] || '20:00');
    setTime2(u.reminderTimes[1] || '12:30');
    setCategories(store.getCategories(u.id));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Telegram Test Connection (Part 5 flow)
  const handleTestTelegramConnection = async () => {
    if (!botToken.trim()) {
      setConnectionStatus('error');
      setConnectionMessage('Harap masukkan token Telegram Bot dari @BotFather terlebih dahulu.');
      return;
    }

    setConnectionStatus('testing');
    setConnectionMessage('Menghubungkan ke Telegram API & mendaftarkan Webhook...');

    try {
      const res = await fetch('/api/telegram/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: botToken.trim(), userId: user?.id })
      });
      const data = await res.json();

      if (data.ok) {
        setConnectionStatus('connected');
        setTestedBotInfo(data.bot);
        setConnectionMessage(data.message || `Bot @${data.bot.username} berhasil terhubung!`);
        loadData();
      } else {
        setConnectionStatus('error');
        setConnectionMessage(data.error || 'Gagal menghubungkan bot Telegram.');
      }
    } catch (err: any) {
      setConnectionStatus('error');
      setConnectionMessage(`Koneksi gagal: ${err.message}`);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    store.updateProfile(user.id, {
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim()
    });
    alert('Profil berhasil diperbarui!');
    loadData();
  };

  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const times = reminderFrequency === 2 ? [time1, time2] : [time1];
    store.updateProfile(user.id, {
      dailyReminderEnabled: reminderEnabled,
      reminderFrequency,
      reminderTimes: times
    });
    alert('Pengaturan reminder berhasil disimpan!');
    loadData();
  };

  // AI Category Recommender (Part 3)
  const handleGenerateCategoriesWithAI = () => {
    if (!user) return;
    setIsGeneratingCategories(true);

    setTimeout(() => {
      // Simulate AI generating categories tailored to prompt
      const aiSuggestions = [
        { name: 'Kopi & Nongkrong', emoji: '☕', color: '#B45309', type: 'expense' as const },
        { name: 'Kost & Tagihan PLN', emoji: '🏠', color: '#8B5CF6', type: 'expense' as const },
        { name: 'Makan Siang & Jajan', emoji: '🍜', color: '#F97316', type: 'expense' as const },
        { name: 'Transportasi Bensin', emoji: '🚗', color: '#3B82F6', type: 'expense' as const },
        { name: 'Langganan Netflix & AI', emoji: '🎮', color: '#06B6D4', type: 'expense' as const },
        { name: 'Gaji Bulanan', emoji: '💰', color: '#16A34A', type: 'income' as const },
      ];

      aiSuggestions.forEach(cat => {
        store.addCategory({
          userId: user.id,
          name: cat.name,
          emoji: cat.emoji,
          color: cat.color,
          type: cat.type,
          isDefault: true
        });
      });

      setIsGeneratingCategories(false);
      loadData();
      alert('AI berhasil menyusun rekomendasi kategori keuangan Anda!');
    }, 600);
  };

  const handleAddCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCatName.trim()) return;

    store.addCategory({
      userId: user.id,
      name: newCatName.trim(),
      emoji: newCatEmoji || '🏷️',
      color: newCatType === 'expense' ? '#F97316' : '#16A34A',
      type: newCatType,
      isDefault: false
    });

    setNewCatName('');
    loadData();
  };

  const handleDeleteCategory = (id: string) => {
    store.deleteCategory(id);
    loadData();
  };

  const handleUpgradePlan = (plan: 'pro') => {
    if (!user) return;
    // Simulate instant Midtrans payment approval for demo
    store.updateProfile(user.id, { plan: 'pro' });
    store.addPayment({
      userId: user.id,
      userName: user.fullName,
      userEmail: user.email,
      orderId: `ORDER-${Date.now()}`,
      plan: 'pro',
      amount: 99000,
      paymentMethod: 'midtrans_qris',
      status: 'settled'
    });
    setPaymentSuccessMsg('Selamat! Akun Anda telah berhasil di-upgrade ke TataDana Pro.');
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Pengaturan & Integrasi</h1>
        <p className="text-xs text-slate-500 mt-1">
          Kelola profil akun, token Telegram Bot, jadwal reminder harian, dan kategori keuangan.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto text-xs font-bold no-scrollbar">
        <button
          onClick={() => setActiveTab('telegram')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 transition ${
            activeTab === 'telegram'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bot className="h-4 w-4" />
          <span>Telegram Bot</span>
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 transition ${
            activeTab === 'profile'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="h-4 w-4" />
          <span>Profil Akun</span>
        </button>

        <button
          onClick={() => setActiveTab('reminder')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 transition ${
            activeTab === 'reminder'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Reminder Harian</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 transition ${
            activeTab === 'categories'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tag className="h-4 w-4" />
          <span>Kategori & AI</span>
        </button>

        <button
          onClick={() => setActiveTab('plan')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 transition ${
            activeTab === 'plan'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Paket Langganan</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-100 text-brand-700">
            {user?.plan.toUpperCase()}
          </span>
        </button>
      </div>

      {/* TAB 1: TELEGRAM BOT (Part 5 Specifications) */}
      {activeTab === 'telegram' && (
        <div className="space-y-6">
          {/* Status Banner */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Status Koneksi Telegram Bot</h3>
                  <p className="text-xs text-slate-500">
                    Satu bot bersama melayani transaksi Anda secara real-time via Webhook.
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {connectionStatus === 'connected' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    <span>🟢 Terhubung & Webhook Aktif</span>
                  </span>
                ) : connectionStatus === 'testing' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs animate-pulse">
                    <Clock className="h-3.5 w-3.5" />
                    <span>⏳ Testing...</span>
                  </span>
                ) : connectionStatus === 'error' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-800 font-bold text-xs">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>🔴 Tidak Terhubung</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                    <span>Belum Dikonfigurasi</span>
                  </span>
                )}
              </div>
            </div>

            {/* Inline Step-by-Step Guide from @BotFather (Part 5) */}
            <div className="mt-6 rounded-xl p-4 bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-brand-500" />
                <span>Panduan Step-by-Step Menghubungkan Bot dari @BotFather:</span>
              </h4>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1 leading-relaxed">
                <li>Buka aplikasi Telegram dan cari akun resmi <strong>@BotFather</strong></li>
                <li>Ketik perintah <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">/newbot</code> lalu beri nama bot Anda (misal: <em>TataDana Assistant</em>)</li>
                <li>Beri username berakhiran <em>bot</em> (misal: <em>budi_tatadana_bot</em>)</li>
                <li>Salin token HTTP API yang diberikan (contoh format: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">7234567890:AAHkL123456789...</code>)</li>
                <li>Tempel (paste) token tersebut ke kolom di bawah ini dan klik tombol <strong>"Test Koneksi"</strong>.</li>
              </ol>
            </div>

            {/* Token Input and Test Connection Button */}
            <div className="mt-6 space-y-3">
              <label className="block text-xs font-bold text-slate-700">Token Bot Telegram</label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  placeholder="Paste token dari @BotFather di sini..."
                  value={botToken}
                  onChange={e => setBotToken(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleTestTelegramConnection}
                  disabled={connectionStatus === 'testing'}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-extrabold shadow-md shadow-brand-500/20 transition disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span>{connectionStatus === 'testing' ? '⏳ Testing...' : 'Test Koneksi'}</span>
                </button>
              </div>

              {connectionMessage && (
                <div className={`p-3 rounded-xl text-xs font-medium ${
                  connectionStatus === 'connected' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                  connectionStatus === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-amber-50 text-amber-800'
                }`}>
                  {connectionMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROFIL */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card max-w-xl text-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base">Informasi Profil Akun</h3>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp / HP (Terverifikasi OTP)</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Nomor ini menjadi kunci identifikasi untuk linking chat Telegram Anda.</span>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Mata Uang Default</label>
              <input
                type="text"
                disabled
                value="IDR (Rupiah Indonesia)"
                className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold shadow-xs transition"
            >
              Simpan Perubahan
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: REMINDER HARIAN (Part 3 & Part 4.8) */}
      {activeTab === 'reminder' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-card max-w-xl text-xs space-y-5">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Bell className="h-5 w-5 text-brand-500" />
              <span>Pengingat Keuangan Telegram</span>
            </h3>
            <p className="text-slate-500 mt-0.5">
              Notifikasi otomatis untuk mencatat pengeluaran harian ke bot Telegram Anda (maksimal 2x per hari).
            </p>
          </div>

          <form onSubmit={handleSaveReminder} className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="font-bold text-slate-800 block">Status Pengingat Harian</span>
                <span className="text-[11px] text-slate-400">Aktifkan atau matikan pesan reminder</span>
              </div>
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={e => setReminderEnabled(e.target.checked)}
                className="h-5 w-5 rounded text-brand-500 focus:ring-brand-500 cursor-pointer"
              />
            </div>

            {reminderEnabled && (
              <>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Frekuensi Reminder</label>
                  <select
                    value={reminderFrequency}
                    onChange={e => setReminderFrequency(Number(e.target.value) as 1 | 2)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
                  >
                    <option value={1}>1x Sehari</option>
                    <option value={2}>2x Sehari (Maksimal)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jam Reminder 1 (WIB)</label>
                    <input
                      type="time"
                      value={time1}
                      onChange={e => setTime1(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  {reminderFrequency === 2 && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Jam Reminder 2 (WIB)</label>
                      <input
                        type="time"
                        value={time2}
                        onChange={e => setTime2(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Preview Pesan Reminder (Part 4.8) */}
            <div className="rounded-xl p-4 bg-orange-50/60 border border-brand-200 space-y-1">
              <span className="font-bold text-brand-900 block text-[11px]">Preview Pesan yang Diterima di Telegram:</span>
              <pre className="font-sans text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                {formatDailyReminder()}
              </pre>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold shadow-xs transition"
            >
              Simpan Jadwal Reminder
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: KATEGORI & AI ONBOARDING (Part 3) */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* AI Onboarding Recommender */}
          <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 rounded-2xl p-6 border border-brand-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-brand-600" />
              <h3 className="font-bold text-slate-900 text-sm">AI Onboarding Recommender</h3>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Ketik profil singkat Anda (misal: "Karyawan swasta kos di Jakarta, sering nongkrong"), dan AI TataDana akan otomatis merekomendasikan set kategori awal yang relevan.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                placeholder="Contoh: Freelance desainer grafis hidup sendiri di Bandung..."
                value={onboardingPrompt}
                onChange={e => setOnboardingPrompt(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-white border border-brand-300 text-xs focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={handleGenerateCategoriesWithAI}
                disabled={isGeneratingCategories}
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
              >
                {isGeneratingCategories ? 'AI Sedang Menyusun...' : 'Generate Kategori via AI'}
              </button>
            </div>
          </div>

          {/* Add Category and Categories List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Form Add */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-card text-xs space-y-3">
              <h4 className="font-extrabold text-slate-900 text-sm">Tambah Kategori Custom</h4>
              <form onSubmit={handleAddCustomCategory} className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Kategori</label>
                  <input
                    type="text"
                    placeholder="Contoh: Skincare, Gym, Zakat"
                    required
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Emoji</label>
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="Contoh: 💄 atau 🏋️"
                    value={newCatEmoji}
                    onChange={e => setNewCatEmoji(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis</label>
                  <select
                    value={newCatType}
                    onChange={e => setNewCatType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="expense">Pengeluaran</option>
                    <option value="income">Pemasukan</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-xs transition"
                >
                  Tambah Kategori
                </button>
              </form>
            </div>

            {/* List */}
            <div className="md:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-card text-xs space-y-3">
              <h4 className="font-extrabold text-slate-900 text-sm">Daftar Kategori Aktif ({categories.length})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[360px] overflow-y-auto">
                {categories.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{c.emoji}</span>
                      <span className="font-semibold text-slate-800">{c.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${c.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}`}>
                        {c.type === 'income' ? 'Masuk' : 'Keluar'}
                      </span>
                    </div>
                    {!c.isDefault && (
                      <button
                        onClick={() => handleDeleteCategory(c.id)}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SUBSCRIPTION PLANS (Part 6) */}
      {activeTab === 'plan' && (
        <div className="space-y-6">
          {paymentSuccessMsg && (
            <div className="rounded-xl p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span>{paymentSuccessMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            {/* Starter Plan Card */}
            <div className={`rounded-3xl p-6 border transition bg-white shadow-card ${user?.plan === 'starter' ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-slate-200'}`}>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Starter Plan</span>
                {user?.plan === 'starter' && (
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                    Paket Aktif Anda
                  </span>
                )}
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-slate-900">Rp49.000</span>
                <span className="text-xs text-slate-500"> / bulan</span>
              </div>
              <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Catat via Teks & VN Telegram</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Maksimal 50 transaksi / bulan</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Maksimal 3 dompet, 5 budget</li>
                <li className="flex items-center gap-2 text-slate-400">❌ Input via foto struk (OCR AI)</li>
                <li className="flex items-center gap-2 text-slate-400">❌ AI Financial Advisor aktif</li>
                <li className="flex items-center gap-2 text-slate-400">❌ Export Laporan ke PDF/Excel</li>
              </ul>
            </div>

            {/* Pro Plan Card */}
            <div className={`rounded-3xl p-6 border transition bg-white shadow-xl relative ${user?.plan === 'pro' ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-brand-200'}`}>
              <div className="absolute -top-3 right-6 bg-gradient-to-r from-brand-500 to-amber-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-sm">
                PALING POPULER & HEMAT
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Pro Lifetime</span>
                {user?.plan === 'pro' && (
                  <span className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-[10px] font-bold">
                    Paket Aktif Anda
                  </span>
                )}
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-slate-900">Rp99.000</span>
                <span className="text-xs text-slate-500"> / sekali bayar seumur hidup</span>
              </div>
              <ul className="mt-6 space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600" /> <strong>Semua fitur Starter</strong></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600" /> <strong>Unlimited</strong> transaksi, wallet, & kategori</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600" /> <strong>Input via foto struk</strong> dengan AI OCR Vision</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600" /> <strong>Export unlimited</strong> PDF & Excel (.xlsx)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600" /> <strong>AI Financial Advisor</strong> trigger otomatis</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600" /> Prioritas support 24/7</li>
              </ul>

              {user?.plan !== 'pro' && (
                <button
                  type="button"
                  onClick={() => handleUpgradePlan('pro')}
                  className="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white font-extrabold text-xs shadow-lg shadow-brand-500/25 transition"
                >
                  Upgrade ke Pro Sekarang (Rp99.000)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
