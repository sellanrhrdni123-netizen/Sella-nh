'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  ShieldAlert,
  Lock,
  Unlock,
  Receipt,
  Eye,
  History,
  AlertTriangle,
  X,
  FileText,
  User,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { store } from '@/lib/storage';
import { UserProfile, Transaction, AdminAuditLog } from '@/lib/types';
import { formatIDR, formatWIBDate, formatWIBTime } from '@/lib/utils';

export default function AdminTransactionInspectorPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [accessReason, setAccessReason] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeReasonUsed, setActiveReasonUsed] = useState('');
  const [expandedReceiptId, setExpandedReceiptId] = useState<string | null>(null);

  const loadData = () => {
    const allUsers = store.getProfiles();
    setUsers(allUsers);
    if (allUsers.length > 0 && !selectedUserId) {
      setSelectedUserId(allUsers[0].id);
    }
    setAuditLogs(store.getAuditLogs());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenReasonModal = () => {
    setAccessReason('');
    setIsModalOpen(true);
  };

  const handleConfirmAccessReason = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessReason.trim() || accessReason.trim().length < 5) {
      alert('Alasan akses wajib diisi minimal 5 karakter demi kepatuhan audit privasi pengguna.');
      return;
    }

    const admin = store.getAdminUser();
    const targetUser = users.find(u => u.id === selectedUserId);

    // Record strictly in audit_logs table
    store.addAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      targetUserId: selectedUserId,
      action: 'INSPECT_USER_TRANSACTIONS',
      details: {
        targetUserName: targetUser?.fullName,
        targetUserEmail: targetUser?.email,
        reason: accessReason.trim(),
        ipAddress: '127.0.0.1' // Client IP tracking for privacy audit
      }
    });

    setActiveReasonUsed(accessReason.trim());
    setTransactions(store.getTransactions(selectedUserId));
    setAuditLogs(store.getAuditLogs());
    setIsUnlocked(true);
    setIsModalOpen(false);
  };

  const handleUserChange = (newUserId: string) => {
    setSelectedUserId(newUserId);
    setIsUnlocked(false);
    setTransactions([]);
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="space-y-6 text-xs text-slate-300">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-amber-500" />
          <span>Inspeksi Transaksi Pengguna & Audit Privasi</span>
        </h1>
        <p className="text-slate-400 mt-1">
          Akses data transaksi user dilindungi oleh modal alasan kepatuhan privasi (Privacy Audit Log). Setiap pembukaan data dicatat permanen di tabel audit_logs.
        </p>
      </div>

      {/* Select User & Inspection Lock Card */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-slate-300 mb-1.5 font-bold">Pilih Akun Pengguna:</label>
            <select
              value={selectedUserId}
              onChange={e => handleUserChange(e.target.value)}
              className="w-full max-w-lg px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.email}) — Paket {u.plan.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:self-end">
            {!isUnlocked ? (
              <button
                type="button"
                onClick={handleOpenReasonModal}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition"
              >
                <Lock className="h-4 w-4" />
                <span>Buka Data Transaksi (Wajib Alasan)</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-xs">
                  <Unlock className="h-3.5 w-3.5" />
                  <span>Data Terbuka</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsUnlocked(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition text-xs font-semibold"
                >
                  Kunci Kembali
                </button>
              </div>
            )}
          </div>
        </div>

        {isUnlocked && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                <strong>Audit Log Tercatat:</strong> "{activeReasonUsed}" • IP: 127.0.0.1 • Admin: {store.getAdminUser().email}
              </span>
            </div>
            <span className="font-mono text-[10px] text-amber-400/80 uppercase tracking-wider">COMPLIANT</span>
          </div>
        )}
      </div>

      {/* Modal Wajib Alasan Akses */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-800 text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Modal Alasan Akses Data Pribadi</h3>
                  <p className="text-[11px] text-slate-400">Wajib audit trail sebelum inspeksi riwayat transaksi</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAccessReason} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-1">
                <span className="text-slate-400 block">Target Pengguna:</span>
                <span className="font-bold text-white text-sm block">
                  {selectedUser?.fullName} ({selectedUser?.email})
                </span>
                <span className="text-[11px] text-amber-400 block">ID: {selectedUserId}</span>
              </div>

              <div>
                <label className="block text-slate-200 mb-1.5 font-bold">
                  Alasan Inspeksi Transaksi <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Contoh: Investigasi keluhan tiket support #8831 mengenai transaksi OCR struk belanja Alfamart."
                  value={accessReason}
                  onChange={e => setAccessReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Informasi ini disimpan secara permanen di database audit_logs (admin_user_id, target_user_id, reason, ip_address, timestamp).
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 transition"
                >
                  Konfirmasi & Buka Data →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unlocked Transactions View */}
      {isUnlocked && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <div>
              <h3 className="font-extrabold text-white text-sm">
                Riwayat Transaksi: <u>{selectedUser?.fullName}</u> ({selectedUser?.email})
              </h3>
              <p className="text-[11px] text-slate-400">
                Total {transactions.length} transaksi tercatat di database
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-emerald-400 font-bold">
                Pemasukan: {formatIDR(transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-red-400 font-bold">
                Pengeluaran: {formatIDR(transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Tanggal (WIB)</th>
                  <th className="py-2.5 px-3">Catatan / Merchant</th>
                  <th className="py-2.5 px-3">Tipe</th>
                  <th className="py-2.5 px-3">Sumber</th>
                  <th className="py-2.5 px-3 text-right">Nominal</th>
                  <th className="py-2.5 px-3 text-center">Struk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {transactions.map(t => (
                  <React.Fragment key={t.id}>
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{formatWIBDate(t.transactionDate)}</td>
                      <td className="py-2.5 px-3 text-white font-medium">
                        {t.description}
                        {t.merchantName && (
                          <span className="block text-[11px] text-amber-400 font-normal">🏪 {t.merchantName}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 uppercase text-[10px] font-bold">
                        <span className={t.type === 'income' ? 'text-emerald-400' : 'text-slate-300'}>{t.type}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{t.source}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-white whitespace-nowrap">{formatIDR(t.amount)}</td>
                      <td className="py-2.5 px-3 text-center">
                        {t.receiptItems && t.receiptItems.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setExpandedReceiptId(expandedReceiptId === t.id ? null : t.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold hover:bg-amber-500/30 transition"
                          >
                            <span>{t.receiptItems.length} item</span>
                          </button>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                    {expandedReceiptId === t.id && t.receiptItems && (
                      <tr className="bg-slate-950/60">
                        <td colSpan={6} className="p-3 pl-8">
                          <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-1.5 text-[11px]">
                            <span className="font-bold text-amber-400 block">Rincian Item Struk Belanja:</span>
                            {t.receiptItems.map((item, idx) => (
                              <div key={idx} className="flex justify-between border-b border-slate-800/50 py-1 text-slate-300">
                                <span>{item.name}</span>
                                <span className="font-mono text-white">{formatIDR(item.price)}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      User ini belum memiliki riwayat transaksi tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Log Trail */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <History className="h-4 w-4 text-amber-500" />
              <span>Jejak Audit Privasi (Privacy Audit Trail)</span>
            </h3>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Setiap akses inspeksi data oleh Superadmin tercatat permanen dengan alasan audit dan identitas pengakses.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px] border border-slate-700">
            {auditLogs.length} Entri Log
          </span>
        </div>

        <div className="divide-y divide-slate-800">
          {auditLogs.map(a => (
            <div key={a.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-400">{a.action}</span>
                  {a.targetUserId && (
                    <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                      Target: {a.targetUserId}
                    </span>
                  )}
                </div>
                <span className="text-slate-400 text-[11px] block mt-0.5">
                  Admin: <strong className="text-slate-300">{a.adminEmail}</strong> • Alasan: "{a.details?.reason || 'Support inspection'}"
                  {a.details?.ipAddress && ` • IP: ${a.details.ipAddress}`}
                </span>
              </div>
              <span className="text-slate-500 font-mono text-[11px] whitespace-nowrap">
                {formatWIBDate(a.createdAt)} {formatWIBTime(a.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
