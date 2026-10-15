'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Eye,
  Download,
  Bot,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  UserCheck,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { store } from '@/lib/storage';
import { UserProfile } from '@/lib/types';
import { formatWIBDate } from '@/lib/utils';
import * as XLSX from 'xlsx';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [impersonatingUserId, setImpersonatingUserId] = useState<string | null>(null);
  const [confirmModalUser, setConfirmModalUser] = useState<UserProfile | null>(null);

  const loadData = () => {
    setUsers(store.getProfiles());
    setImpersonatingUserId(store.getImpersonatingUserId());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartImpersonate = (user: UserProfile) => {
    const admin = store.getAdminUser();

    // Log impersonation action in audit log
    store.addAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      targetUserId: user.id,
      action: 'IMPERSONATE_USER_DASHBOARD',
      details: {
        targetUserName: user.fullName,
        targetUserEmail: user.email,
        reason: 'Superadmin customer support / investigation'
      }
    });

    // Set active impersonation context in store
    store.setImpersonation(user.id);
    setImpersonatingUserId(user.id);
    setConfirmModalUser(null);

    // Direct redirect to user dashboard without password
    router.push('/dashboard');
  };

  const handleClearImpersonation = () => {
    store.setImpersonation(null);
    setImpersonatingUserId(null);
    loadData();
  };

  const handleExportAllUsers = () => {
    const data = users.map(u => ({
      'User ID': u.id,
      'Nama': u.fullName,
      'Email': u.email,
      'No HP': u.phoneNumber,
      'Paket': u.plan.toUpperCase(),
      'Role': u.role,
      'Telegram Terhubung': u.telegramConnected ? 'YA' : 'TIDAK',
      'Telegram Username': u.telegramUsername || '-',
      'Tanggal Daftar': formatWIBDate(u.createdAt)
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Semua Pengguna');
    XLSX.writeFile(wb, `TataDana_Semua_Pengguna_${Date.now()}.xlsx`);
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phoneNumber.includes(q);
  });

  const activeImpersonatedUser = users.find(u => u.id === impersonatingUserId);

  return (
    <div className="space-y-6">
      {/* Active Impersonation Alert Banner */}
      {impersonatingUserId && activeImpersonatedUser && (
        <div className="rounded-2xl p-4 bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-300">
            <UserCheck className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-extrabold text-white block">Mode Impersonasi Sedang Aktif!</span>
              <span>
                Anda sedang terhubung ke dashboard milik <strong>{activeImpersonatedUser.fullName}</strong> ({activeImpersonatedUser.email}).
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center gap-1.5"
            >
              <span>Buka Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleClearImpersonation}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition"
            >
              Batalkan
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-amber-500" />
            <span>Kelola Pengguna & Impersonasi</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Daftar seluruh akun, status integrasi Telegram bot, dan fitur impersonasi langsung tanpa password untuk support teknis.
          </p>
        </div>

        <button
          onClick={handleExportAllUsers}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition shadow-xs"
        >
          <Download className="h-4 w-4 text-amber-400" />
          <span>Export Data Semua Pengguna</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cari user berdasarkan nama, email, atau no HP..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-800/80 text-slate-400 uppercase font-bold text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Kontak (HP OTP)</th>
                <th className="py-3 px-4">Paket Aktif</th>
                <th className="py-3 px-4">Status Telegram</th>
                <th className="py-3 px-4">Terdaftar</th>
                <th className="py-3 px-4 text-center">Tindakan Impersonasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(u => {
                const isCurrentlyImpersonated = impersonatingUserId === u.id;
                return (
                  <tr key={u.id} className={`hover:bg-slate-800/40 transition ${isCurrentlyImpersonated ? 'bg-amber-500/5' : ''}`}>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={u.fullName}
                          className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-700"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white block">{u.fullName}</span>
                            {isCurrentlyImpersonated && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                Aktif
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400 text-[11px]">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {u.phoneNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                          u.plan === 'pro'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {u.plan}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.telegramConnected ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>@{u.telegramUsername || 'connected'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <XCircle className="h-3.5 w-3.5" /> Belum Konek
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {formatWIBDate(u.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isCurrentlyImpersonated ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => router.push('/dashboard')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold transition text-xs shadow-xs"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Lihat Dashboard</span>
                          </button>
                          <button
                            onClick={handleClearImpersonation}
                            className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700"
                            title="Hentikan Impersonasi"
                          >
                            Lepas
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmModalUser(u)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-slate-950 font-bold transition text-xs border border-amber-500/30 hover:border-amber-500"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Masuk sbg User</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Impersonation Confirmation Modal */}
      {confirmModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-800 text-white space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">Konfirmasi Impersonasi Pengguna</h3>
                <p className="text-[11px] text-slate-400">Akses langsung ke antarmuka akun user tanpa kata sandi</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2 text-xs">
              <div className="flex items-center gap-3">
                <img
                  src={confirmModalUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={confirmModalUser.fullName}
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-amber-500/50"
                />
                <div>
                  <strong className="text-white text-sm block">{confirmModalUser.fullName}</strong>
                  <span className="text-slate-400 font-mono text-[11px]">{confirmModalUser.email}</span>
                </div>
              </div>
              <div className="pt-2 text-slate-300 text-[11px] leading-relaxed">
                Anda akan masuk ke Dashboard dengan data dompet, transaksi, dan budget milik user ini. Banner kuning penunjuk impersonasi akan ditampilkan di bagian atas layar dengan opsi untuk kembali ke Admin kapan saja.
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleStartImpersonate(confirmModalUser)}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 transition"
              >
                Masuk ke Dashboard →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
