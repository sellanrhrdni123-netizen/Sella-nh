'use client';

import React, { useState } from 'react';
import { Smartphone, Copy, Check, ChevronDown, ChevronUp, Zap, ShieldCheck } from 'lucide-react';

interface DevOTPBannerProps {
  currentOtp?: string;
  onFillOtp?: (otp: string) => void;
  targetPhone?: string;
}

export function DevOTPBanner({
  currentOtp = '789123',
  onFillOtp,
  targetPhone = '+6281234567890'
}: DevOTPBannerProps) {
  const [copied, setCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentOtp);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFill = () => {
    if (onFillOtp) {
      onFillOtp(currentOtp);
    } else if (typeof document !== 'undefined') {
      const otpInputs = document.querySelectorAll<HTMLInputElement>('input[placeholder*="OTP"], input[maxLength="6"], input[type="text"][maxlength="6"]');
      if (otpInputs.length > 0) {
        const input = otpInputs[0];
        input.value = currentOtp;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    handleCopy();
  };

  return (
    <aside
      aria-label="Developer OTP Simulator"
      className="fixed bottom-4 right-4 z-50 max-w-sm w-[92vw] sm:w-96 rounded-2xl bg-slate-900/95 text-white p-4 shadow-2xl border border-amber-500/40 backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-xs">
            <Zap className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs text-white">Dev OTP Simulator</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                Dual Mode
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          aria-label={isCollapsed ? 'Perbesar panel simulator OTP' : 'Kecilkan panel simulator OTP'}
        >
          {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="mt-3 space-y-3 text-xs">
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Testing instan tanpa jeda SMS gateway. Kode verifikasi OTP aktif untuk nomor <code className="text-amber-300 font-mono font-bold bg-slate-800 px-1 py-0.5 rounded">{targetPhone}</code>:
          </p>

          {/* OTP Display Card */}
          <div className="flex items-center justify-between bg-slate-800/80 rounded-xl px-3 py-2 border border-slate-700/80">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="font-mono text-lg font-black tracking-widest text-amber-400">
                {currentOtp}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-[11px] font-bold transition text-slate-200"
                title="Salin ke clipboard"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Salin</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleFill}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black transition shadow-xs"
              >
                Auto-Fill
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-400" /> WhatsApp & Phone Dual-Mode
            </span>
            <span className="text-slate-500 font-mono">IDR Asia/Jakarta</span>
          </div>
        </div>
      )}
    </aside>
  );
}

export default DevOTPBanner;
