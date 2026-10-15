'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ExternalLink,
  ShieldCheck,
  X,
  AlertCircle,
  Search,
  Filter,
  Check,
  Ban
} from 'lucide-react';
import { store } from '@/lib/storage';
import { PaymentRecord } from '@/lib/types';
import { formatIDR, formatWIBDate, formatWIBTime } from '@/lib/utils';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');

  // Modals for approval and rejection
  const [approvingPayment, setApprovingPayment] = useState<PaymentRecord | null>(null);
  const [rejectingPayment, setRejectingPayment] = useState<PaymentRecord | null>(null);
  const [adminNotes, setAdminNotes] = useState('Verifikasi mutasi rekening via KlikBCA sesuai.');
  const [rejectReason, setRejectReason] = useState('Bukti transfer tidak valid atau dana belum masuk.');

  const loadData = () => {
    setPayments(store.getPayments());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmApprove = () => {
    if (!approvingPayment) return;
    const admin = store.getAdminUser();

    store.updatePaymentStatus(
      approvingPayment.id,
      'approved',
      adminNotes.trim() || 'Disetujui oleh Superadmin via admin console',
      admin.id
    );

    // Record audit log
    store.addAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      targetUserId: approvingPayment.userId,
      action: 'APPROVE_MANUAL_PAYMENT',
      details: {
        orderId: approvingPayment.orderId,
        amount: approvingPayment.amount,
        plan: approvingPayment.plan,
        notes: adminNotes.trim()
      }
    });

    setApprovingPayment(null);
    loadData();
  };

  const handleConfirmReject = () => {
    if (!rejectingPayment) return;
    const admin = store.getAdminUser();

    store.updatePaymentStatus(
      rejectingPayment.id,
      'rejected',
      rejectReason.trim() || 'Bukti transfer ditolak oleh admin',
      admin.id
    );

    // Record audit log
    store.addAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      targetUserId: rejectingPayment.userId,
      action: 'REJECT_MANUAL_PAYMENT',
      details: {
        orderId: rejectingPayment.orderId,
        amount: rejectingPayment.amount,
        plan: rejectingPayment.plan,
        notes: rejectReason.trim()
      }
    });

    setRejectingPayment(null);
    loadData();
  };

  const filtered = payments.filter(p => {
    const matchStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'approved'
        ? p.status === 'approved' || p.status === 'settled'
        : p.status === filterStatus;

    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      p.orderId.toLowerCase().includes(q) ||
      p.userName?.toLowerCase().includes(q) ||
      p.userEmail?.toLowerCase().includes(q);

    return matchStatus && matchSearch;
  });

  const pendingCount = payments.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-amber-500" />
            <span>Verifikasi & Persetujuan Pembayaran</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitoring transaksi Midtrans QRIS/VA dan verifikasi bukti transfer manual. Persetujuan otomatis meng-upgrade akun ke Pro.
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 px-3.5 py-2 rounded-xl text-xs font-bold animate-pulse">
            <Clock className="h-4 w-4" />
            <span>{pendingCount} Pembayaran Menunggu Persetujuan</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari order ID, nama, atau email pembayar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterStatus === 'all' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua ({payments.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterStatus === 'pending' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterStatus === 'approved' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Selesai
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterStatus === 'rejected' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            Ditolak
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-800/80 text-slate-400 uppercase font-bold text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Order ID & Waktu</th>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Paket & Nominal</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4">Bukti Transfer</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Tindakan Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-mono">
                    <span className="font-bold text-white block">{p.orderId}</span>
                    <span className="text-[11px] text-slate-400">
                      {formatWIBDate(p.createdAt)} {formatWIBTime(p.createdAt)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-white block">{p.userName || 'User'}</span>
                    <span className="text-[11px] text-slate-400">{p.userEmail}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-amber-400 block">{formatIDR(p.amount)}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Paket {p.plan}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-300 capitalize">
                      {p.paymentMethod.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {p.proofImageUrl ? (
                      <button
                        type="button"
                        onClick={() => setSelectedProofUrl(p.proofImageUrl!)}
                        className="inline-flex items-center gap-1 font-semibold text-amber-400 hover:text-amber-300 underline"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Lihat Bukti</span>
                      </button>
                    ) : (
                      <span className="text-slate-500 font-mono text-[11px]">Midtrans Direct</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        p.status === 'approved' || p.status === 'settled'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : p.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {p.status}
                    </span>
                    {p.adminNotes && (
                      <span className="block text-[10px] text-slate-400 max-w-[150px] truncate mt-0.5" title={p.adminNotes}>
                        {p.adminNotes}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {p.status === 'pending' ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setApprovingPayment(p)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition shadow-xs flex items-center gap-1"
                        >
                          <Check className="h-3 w-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectingPayment(p)}
                          className="px-2.5 py-1 rounded-lg bg-red-600/80 hover:bg-red-500 text-white font-bold text-[11px] transition shadow-xs flex items-center gap-1"
                        >
                          <Ban className="h-3 w-3" />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[11px] font-mono">
                        {p.approvedBy ? `Oleh: Admin (${p.approvedBy.substring(0, 8)}...)` : 'Selesai'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Tidak ada transaksi pembayaran yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proof Modal */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-800 text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Bukti Transfer Pelanggan (Slip Pembayaran)</h3>
              <button onClick={() => setSelectedProofUrl(null)} className="text-slate-400 hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
              <img src={selectedProofUrl} alt="Bukti Transfer" className="w-full h-auto max-h-[70vh] object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {approvingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-800 text-white space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">Setujui Pembayaran Order</h3>
                <p className="text-[11px] text-slate-400">Order: {approvingPayment.orderId}</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Pengguna:</span>
                <span className="font-bold text-white">{approvingPayment.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nominal:</span>
                <span className="font-bold text-amber-400">{formatIDR(approvingPayment.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Paket Upgrade:</span>
                <span className="font-bold text-white uppercase">{approvingPayment.plan}</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-bold text-xs">Catatan Admin (Wajib):</label>
              <input
                type="text"
                required
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                placeholder="Contoh: Terverifikasi di rekening BCA 12345678"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApprovingPayment(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition"
              >
                Konfirmasi Setuju & Upgrade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-800 text-white space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="h-9 w-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                <Ban className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">Tolak Bukti Pembayaran</h3>
                <p className="text-[11px] text-slate-400">Order: {rejectingPayment.orderId}</p>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-bold text-xs">Alasan Penolakan:</label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Contoh: Bukti transfer buram atau dana tidak masuk ke rekening tujuan."
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingPayment(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg shadow-red-500/25 transition"
              >
                Tolak Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
