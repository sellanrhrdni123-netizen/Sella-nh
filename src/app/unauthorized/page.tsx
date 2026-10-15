import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-wider">
            403 Forbidden • Akses Ditolak
          </span>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Hak Akses Dibatasi
          </h1>
          <p className="text-slate-400 text-xs leading-relaxed">
            Halaman ini khusus untuk Administrator TataDana. Akun Anda terdaftar dengan role <b>User</b> dan tidak memiliki izin untuk mengakses Console Admin atau endpoint internal.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/60 text-left text-xs space-y-2">
          <div className="flex justify-between text-slate-400">
            <span>Server Guard:</span>
            <span className="text-emerald-400 font-bold">RBAC Enforced</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Session Status:</span>
            <span className="text-amber-400 font-bold">Authenticated (User Role)</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Target Route:</span>
            <span className="font-mono text-slate-300">/admin/*</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/dashboard"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition shadow-md shadow-orange-600/20"
          >
            <Home className="w-4 h-4" />
            <span>Ke Dashboard User</span>
          </Link>
          <a
            href="/logout"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ganti Akun (Logout)</span>
          </a>
        </div>
      </div>
    </div>
  );
}
