'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  ArrowRight,
  Bot,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { store } from '@/lib/storage';

export default function LoginPage() {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<'password' | 'phone_otp'>('password');
  const [email, setEmail] = useState('budi.pratama@gmail.com');
  const [password, setPassword] = useState('password123');
  const [phone, setPhone] = useState('+6281234567890');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const em = email.toLowerCase().trim();
      if (em === 'sellanrhrdni123@gmail.com' || em.includes('sellanrhrdni')) {
        document.cookie = 'tatadana_auth_role=admin; path=/; max-age=86400';
        document.cookie = 'tatadana_auth_user=usr_admin_sella; path=/; max-age=86400';
        document.cookie = 'tatadana_admin_session=active; path=/; max-age=86400';
        document.cookie = 'tatadana_session=sess_admin_demo_01; path=/; max-age=86400';
        router.push('/admin');
      } else if (em === 'siti.rahma@gmail.com' || em.includes('siti')) {
        document.cookie = 'tatadana_auth_role=user; path=/; max-age=86400';
        document.cookie = 'tatadana_auth_user=usr_starter_01; path=/; max-age=86400';
        document.cookie = 'tatadana_session=sess_siti_demo_01; path=/; max-age=86400';
        store.setImpersonation('usr_starter_01');
        router.push('/dashboard');
      } else {
        document.cookie = 'tatadana_auth_role=user; path=/; max-age=86400';
        document.cookie = 'tatadana_auth_user=usr_demo_01; path=/; max-age=86400';
        document.cookie = 'tatadana_session=sess_budi_demo_01; path=/; max-age=86400';
        store.setImpersonation(null);
        router.push('/dashboard');
      }
    }, 400);
  };

  const handleSendOtp = () => {
    if (!phone) {
      alert('Masukkan nomor HP');
      return;
    }
    setIsOtpSent(true);
    setOtpCode('789123'); // auto prefill demo OTP
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/dashboard');
    }, 400);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/dashboard');
    }, 300);
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
              <span>Fintech Personal Terintegrasi Telegram</span>
            </span>
            <h1 className="text-4xl font-black leading-tight text-white">
              Keuanganmu.<br />Terkontrol.
            </h1>
            <p className="text-orange-100 text-sm leading-relaxed max-w-sm">
              Catat setiap pemasukan dan pengeluaran semudah kirim chat. Tanpa ribet buka aplikasi setiap waktu.
            </p>
          </div>
        </div>

        {/* Telegram Bot feature pill */}
        <div className="relative z-10 bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/20 text-xs text-white space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-200">
            <Bot className="h-4 w-4" />
            <span>Koneksi 1 Bot untuk Seluruh Transaksi</span>
          </div>
          <p className="text-orange-100/90 text-[11px] leading-relaxed">
            Cukup sebutkan "beli bakso 15rb" atau kirim foto struk belanja, AI kami mencatatnya rapi ke saldo dan budget Anda.
          </p>
        </div>

        {/* Background glow circle */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
      </div>

      {/* KANAN (60%) — Form Login (Part 8) */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Brand Header */}
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
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Masuk ke Akun Anda</h2>
            <p className="text-xs text-slate-500 mt-1">
              Belum punya akun?{' '}
              <Link href="/register" className="font-bold text-brand-600 hover:text-brand-700 underline">
                Daftar sekarang gratis
              </Link>
            </p>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Masuk dengan Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-slate-50 px-3 text-[11px] font-semibold text-slate-400 uppercase">Atau</span>
          </div>

          {/* Toggle Method: Password vs Phone OTP */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setAuthMethod('password')}
              className={`py-2 rounded-lg transition ${authMethod === 'password' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
            >
              Email & Sandi
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod('phone_otp')}
              className={`py-2 rounded-lg transition ${authMethod === 'phone_otp' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
            >
              Nomor HP (OTP)
            </button>
          </div>

          {/* Method 1: Email & Password */}
          {authMethod === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Terdaftar</label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Kata Sandi</label>
                  <a href="#" className="text-brand-600 hover:underline text-[11px]">Lupa sandi?</a>
                </div>
                <div className="relative">
                  <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-md shadow-brand-500/25 transition disabled:opacity-50"
              >
                {isLoading ? 'Memproses...' : 'Masuk ke Dashboard'}
              </button>
            </form>
          ) : (
            /* Method 2: Phone OTP (Kunci Linking Telegram) */
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
                <div className="relative">
                  <Phone className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+6281234567890"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Nomor HP ini digunakan untuk mencocokkan akun Anda dengan chat Telegram Bot.
                </span>
              </div>

              {!isOtpSent ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
                >
                  Kirim Kode OTP WhatsApp
                </button>
              ) : (
                <div className="space-y-3 animate-in fade-in">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Kode OTP telah dikirimkan ke WhatsApp Anda (Demo OTP: 789123)</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Masukkan 6 Digit OTP</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value)}
                      placeholder="789123"
                      className="w-full text-center tracking-widest text-lg font-mono font-bold py-2 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-md shadow-brand-500/25 transition disabled:opacity-50"
                  >
                    {isLoading ? 'Verifikasi OTP...' : 'Verifikasi & Masuk'}
                  </button>
                </div>
              )}
            </form>
          )}

          {/* Demo account quick login box */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
            <div className="font-bold text-slate-700 mb-2 text-center">Akun Demo Bawaan TataDana:</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('budi.pratama@gmail.com');
                  setPassword('password123');
                  document.cookie = 'tatadana_auth_role=user; path=/; max-age=86400';
                  document.cookie = 'tatadana_auth_user=usr_demo_01; path=/; max-age=86400';
                  document.cookie = 'tatadana_session=sess_budi_demo_01; path=/; max-age=86400';
                  store.setImpersonation(null);
                  router.push('/dashboard');
                }}
                className="p-2 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 hover:bg-orange-100 transition text-left"
              >
                <div className="font-bold">👤 Budi Pratama</div>
                <div className="text-[10px] text-orange-600">User (Pro) → /dashboard</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('siti.rahma@gmail.com');
                  setPassword('password123');
                  document.cookie = 'tatadana_auth_role=user; path=/; max-age=86400';
                  document.cookie = 'tatadana_auth_user=usr_starter_01; path=/; max-age=86400';
                  document.cookie = 'tatadana_session=sess_siti_demo_01; path=/; max-age=86400';
                  store.setImpersonation('usr_starter_01');
                  router.push('/dashboard');
                }}
                className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 transition text-left"
              >
                <div className="font-bold">👤 Siti Rahma</div>
                <div className="text-[10px] text-blue-600">User (Starter) → /dashboard</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('sellanrhrdni123@gmail.com');
                  setPassword('admin123');
                  document.cookie = 'tatadana_auth_role=admin; path=/; max-age=86400';
                  document.cookie = 'tatadana_auth_user=usr_admin_sella; path=/; max-age=86400';
                  document.cookie = 'tatadana_admin_session=active; path=/; max-age=86400';
                  document.cookie = 'tatadana_session=sess_admin_demo_01; path=/; max-age=86400';
                  router.push('/admin');
                }}
                className="p-2 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 hover:bg-orange-100 transition text-left"
              >
                <div className="font-bold">👑 Sella (Admin Utama)</div>
                <div className="text-[10px] text-orange-600">Admin Utama → /admin</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
