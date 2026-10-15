'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  Phone,
  User,
  Sparkles,
  Bot,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { store } from '@/lib/storage';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStartRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      alert('Nomor HP wajib diisi untuk verifikasi OTP dan integrasi Telegram Bot.');
      return;
    }
    setIsOtpStep(true);
    setOtpCode('456123'); // Demo OTP code
  };

  const handleCompleteRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      // Simulate registering new user in store
      const newUserId = `usr_${Date.now()}`;
      store.updateProfile(store.getActiveUserId(), {
        fullName: fullName || 'User Baru TataDana',
        phoneNumber: phone,
      });

      setIsLoading(false);
      router.push('/dashboard');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* KIRI (40%) — Branding Panel (Part 8) */}
      <div className="hidden md:flex md:w-[40%] bg-gradient-to-br from-brand-600 via-brand-500 to-amber-500 p-12 text-white flex-col justify-between relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-black text-2xl shadow-md">
              T
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              Tata<span className="text-amber-200">Dana</span>
            </span>
          </Link>

          <div className="mt-20 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold text-amber-100">
              <Sparkles className="h-3.5 w-3.5 text-amber-200" />
              <span>Daftar Akun Baru</span>
            </span>
            <h1 className="text-4xl font-black leading-tight text-white">
              Mulai Kendalikan<br />Uangmu Hari Ini.
            </h1>
            <p className="text-orange-100 text-sm leading-relaxed max-w-sm">
              Satu langkah mudah. Hubungkan nomor HP kamu untuk verifikasi instan dan langsung nikmati pencatatan cerdas via Telegram.
            </p>
          </div>
        </div>

        {/* Feature badge */}
        <div className="relative z-10 bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/20 text-xs text-white space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-200">
            <Bot className="h-4 w-4" />
            <span>Otomatisasi Struktur Awal</span>
          </div>
          <p className="text-orange-100/90 text-[11px] leading-relaxed">
            Begitu mendaftar, dompet default dan kategori rekomendasi AI langsung disiapkan siap pakai.
          </p>
        </div>

        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
      </div>

      {/* KANAN (60%) — Form Register (Part 8) */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="md:hidden flex items-center justify-between mb-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold text-lg">
                T
              </div>
              <span className="font-extrabold text-lg text-slate-900">
                Tata<span className="text-brand-500">Dana</span>
              </span>
            </Link>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Daftar Akun TataDana</h2>
            <p className="text-xs text-slate-500 mt-1">
              Sudah memiliki akun?{' '}
              <Link href="/login" className="font-bold text-brand-600 hover:text-brand-700 underline">
                Masuk di sini
              </Link>
            </p>
          </div>

          {!isOtpStep ? (
            <form onSubmit={handleStartRegister} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <div className="relative">
                  <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Budi Pratama"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="budi@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp / HP (Wajib untuk OTP & Bot)</label>
                <div className="relative">
                  <Phone className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="+6281234567890"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Nomor HP ini akan diverifikasi via OTP dan digunakan untuk sinkronisasi chat Telegram bot.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kata Sandi</label>
                <div className="relative">
                  <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-md shadow-brand-500/25 transition"
              >
                Lanjut ke Verifikasi Nomor HP →
              </button>
            </form>
          ) : (
            /* OTP Verification Step */
            <form onSubmit={handleCompleteRegister} className="space-y-4 text-xs animate-in fade-in">
              <div className="p-4 bg-orange-50 border border-brand-200 rounded-2xl text-xs space-y-2">
                <span className="font-bold text-brand-900 block">Verifikasi OTP Nomor WhatsApp</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Kode OTP telah dikirimkan ke <strong>{phone}</strong>. Masukkan kode 6 digit untuk mengaktifkan akun dan linking bot Telegram.
                </p>
                <span className="text-[10px] text-brand-700 font-mono block">Demo OTP otomatis: 456123</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Masukkan 6 Digit OTP</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  placeholder="456123"
                  className="w-full text-center tracking-widest text-xl font-mono font-bold py-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-md shadow-brand-500/25 transition disabled:opacity-50"
              >
                {isLoading ? 'Menyiapkan Akun & Struktur Data...' : 'Selesaikan Registrasi & Masuk'}
              </button>

              <button
                type="button"
                onClick={() => setIsOtpStep(false)}
                className="w-full text-center text-slate-400 hover:text-slate-600 text-xs py-1"
              >
                ← Ubah nomor HP
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
