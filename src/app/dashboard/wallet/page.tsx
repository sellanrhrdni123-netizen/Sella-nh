'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet as WalletIcon,
  Plus,
  Star,
  ArrowRightLeft,
  Smartphone,
  Landmark,
  Banknote,
  CreditCard,
  X,
  Check,
  AlertTriangle
} from 'lucide-react';
import { store } from '@/lib/storage';
import { Wallet, WalletType } from '@/lib/types';
import { formatIDR } from '@/lib/utils';

export default function WalletPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // New Wallet form
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState<WalletType>('bank');
  const [initialBalance, setInitialBalance] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [isDefaultWallet, setIsDefaultWallet] = useState(false);

  const handleOpenAddModal = () => {
    const u = store.getCurrentUser();
    if (u.plan === 'starter' && wallets.length >= 3) {
      setIsUpgradeModalOpen(true);
      return;
    }
    setIsAddModalOpen(true);
  };

  // Transfer form
  const [fromWalletId, setFromWalletId] = useState('');
  const [toWalletId, setToWalletId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  const loadData = () => {
    const u = store.getCurrentUser();
    const w = store.getWallets(u.id);
    setWallets(w);
    if (w.length > 0 && !fromWalletId) setFromWalletId(w[0].id);
    if (w.length > 1 && !toWalletId) setToWalletId(w[1].id);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateWallet = (e: React.FormEvent) => {
    e.preventDefault();
    const u = store.getCurrentUser();
    if (u.plan === 'starter' && wallets.length >= 3) {
      setIsAddModalOpen(false);
      setIsUpgradeModalOpen(true);
      return;
    }
    const bal = parseFloat(initialBalance.replace(/\D/g, '')) || 0;

    store.addWallet({
      userId: u.id,
      name: walletName.trim(),
      type: walletType,
      balance: bal,
      isDefault: isDefaultWallet || wallets.length === 0,
      color: walletType === 'bank' ? '#00529C' : walletType === 'ewallet' ? '#00AA13' : '#F97316',
      icon: walletType === 'bank' ? 'landmark' : walletType === 'ewallet' ? 'smartphone' : 'banknote',
      accountNumber: accountNumber.trim() || undefined
    });

    setIsAddModalOpen(false);
    setWalletName('');
    setInitialBalance('');
    setAccountNumber('');
    setIsDefaultWallet(false);
    loadData();
  };

  const handleSetDefault = (id: string) => {
    store.updateWallet(id, { isDefault: true });
    loadData();
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const u = store.getCurrentUser();
    const amt = parseFloat(transferAmount.replace(/\D/g, ''));
    if (!amt || amt <= 0) {
      alert('Masukkan nominal transfer yang valid');
      return;
    }
    if (fromWalletId === toWalletId) {
      alert('Dompet asal dan tujuan tidak boleh sama');
      return;
    }

    const fromW = wallets.find(w => w.id === fromWalletId);
    if (fromW && fromW.balance < amt) {
      alert(`Saldo dompet ${fromW.name} tidak mencukupi (${formatIDR(fromW.balance)})`);
      return;
    }

    store.addTransaction({
      userId: u.id,
      walletId: fromWalletId,
      destinationWalletId: toWalletId,
      type: 'transfer',
      amount: amt,
      description: `Pindah dana dari ${wallets.find(w => w.id === fromWalletId)?.name} ke ${wallets.find(w => w.id === toWalletId)?.name}`,
      source: 'web',
      transactionDate: new Date().toISOString()
    });

    setIsTransferModalOpen(false);
    setTransferAmount('');
    loadData();
  };

  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <WalletIcon className="h-6 w-6 text-brand-500" />
            <span>Multi Wallet & Rekening</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola saldo bank, e-wallet, dan uang tunai. Tentukan dompet default untuk transaksi Telegram.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
          >
            <ArrowRightLeft className="h-4 w-4" />
            <span>Transfer Dana</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Dompet</span>
          </button>
        </div>
      </div>

      {/* Total Balance Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-700/60">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Total Akumulasi Seluruh Dompet</span>
          <h2 className="text-3xl font-black mt-1 text-white">{formatIDR(totalBalance)}</h2>
          <p className="text-xs text-slate-400 mt-2">
            Tersebar di {wallets.length} dompet (Bank, E-Wallet, Cash)
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10 text-xs max-w-xs">
          <span className="text-brand-300 font-bold block mb-1">Dompet Default Telegram:</span>
          <span className="text-slate-200">
            {wallets.find(w => w.isDefault)?.name || 'Belum diatur'} (Setiap transaksi Telegram langsung memotong dompet ini)
          </span>
        </div>
      </div>

      {/* Wallet Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {wallets.map(w => {
          const Icon = w.type === 'bank' ? Landmark : w.type === 'ewallet' ? Smartphone : Banknote;

          return (
            <div
              key={w.id}
              className={`bg-white rounded-2xl p-5 border shadow-card transition relative group ${
                w.isDefault ? 'border-brand-500 ring-2 ring-brand-500/10' : 'border-slate-200'
              }`}
            >
              {w.isDefault && (
                <div className="absolute top-4 right-4 flex items-center gap-1 bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                  <Star className="h-3 w-3 fill-current" />
                  <span>Default Telegram</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
                  style={{ backgroundColor: w.color }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">{w.name}</h4>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">
                    {w.type === 'bank' ? 'Bank Account' : w.type === 'ewallet' ? 'E-Wallet' : 'Cash'}
                    {w.accountNumber ? ` • ${w.accountNumber}` : ''}
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <span className="text-[11px] text-slate-400 font-medium">Saldo Saat Ini:</span>
                <p className="text-xl font-black text-slate-900 mt-0.5">{formatIDR(w.balance)}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                {!w.isDefault ? (
                  <button
                    onClick={() => handleSetDefault(w.id)}
                    className="font-bold text-slate-600 hover:text-brand-600 flex items-center gap-1 transition"
                  >
                    <Star className="h-3.5 w-3.5" />
                    <span>Jadikan Default</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Terkoneksi ke Bot
                  </span>
                )}

                <button
                  onClick={() => {
                    setFromWalletId(w.id);
                    setIsTransferModalOpen(true);
                  }}
                  className="font-bold text-brand-600 hover:text-brand-700 transition"
                >
                  Kirim Dana
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Tambah Dompet */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Tambah Dompet Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWallet} className="mt-4 space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Dompet</label>
                <input
                  type="text"
                  placeholder="Contoh: OVO, ShopeePay, Bank Jago"
                  required
                  value={walletName}
                  onChange={e => setWalletName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipe</label>
                <select
                  value={walletType}
                  onChange={e => setWalletType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
                >
                  <option value="bank">Bank</option>
                  <option value="ewallet">E-Wallet</option>
                  <option value="cash">Tunai (Cash)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Saldo Awal (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={initialBalance}
                  onChange={e => setInitialBalance(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Rekening / HP (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: 081234567890"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="defaultCheck"
                  checked={isDefaultWallet}
                  onChange={e => setIsDefaultWallet(e.target.checked)}
                  className="h-4 w-4 rounded text-brand-500 focus:ring-brand-500"
                />
                <label htmlFor="defaultCheck" className="text-slate-700 font-medium">
                  Jadikan dompet default untuk Telegram Bot
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold shadow-md shadow-brand-500/20 transition"
                >
                  Simpan Dompet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Transfer Antar Dompet */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Transfer Antar Dompet</h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleTransfer} className="mt-4 space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Dari Dompet (Asal)</label>
                <select
                  value={fromWalletId}
                  onChange={e => setFromWalletId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({formatIDR(w.balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ke Dompet (Tujuan)</label>
                <select
                  value={toWalletId}
                  onChange={e => setToWalletId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({formatIDR(w.balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nominal Pindah Dana (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 200000"
                  required
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-extrabold text-base text-slate-900 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold shadow-md shadow-brand-500/20 transition"
                >
                  Proses Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upgrade Modal for Starter Tier Limit */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div>
              <h3 className="font-extrabold text-base text-slate-900">Batas Dompet Tercapai</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Pengguna paket <strong className="text-slate-800">Starter</strong> dibatasi maksimal <strong>3 dompet</strong> aktif (Bank / E-Wallet / Cash).
              </p>
              <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-left text-xs text-amber-900">
                <span className="font-bold block mb-1">Keuntungan Pro:</span>
                • Unlimited dompet & rekening bank<br />
                • OCR foto struk belanja otomatis<br />
                • AI Financial Advisor real-time
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <a
                href="/dashboard/settings"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition"
              >
                Upgrade ke Pro (Rp99.000 Sekali Bayar)
              </a>
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(false)}
                className="w-full py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
