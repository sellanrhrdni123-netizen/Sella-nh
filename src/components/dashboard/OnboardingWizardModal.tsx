'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Briefcase,
  GraduationCap,
  Store,
  Laptop,
  Users,
  PiggyBank,
  Coffee,
  TrendingUp,
  Receipt,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { store } from '@/lib/storage';
import { Category } from '@/lib/types';
import { dualStorage } from '@/lib/supabase/dual-storage';

export interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: (categories: Category[]) => void;
}

interface ProfessionOption {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}

interface PriorityOption {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}

export function OnboardingWizardModal({
  isOpen,
  onClose,
  onCompleted
}: OnboardingWizardModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedProfession, setSelectedProfession] = useState<string>('karyawan');
  const [selectedPriority, setSelectedPriority] = useState<string>('nabung');
  const [isApplying, setIsApplying] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 8 Recommended Categories State
  const [recommendedCategories, setRecommendedCategories] = useState<
    { name: string; emoji: string; color: string; type: 'expense' | 'income'; selected: boolean }[]
  >([]);

  if (!isOpen) return null;

  const professions: ProfessionOption[] = [
    {
      id: 'karyawan',
      title: 'Karyawan Swasta / ASN / BUMN',
      desc: 'Penghasilan bulanan teratur, fokus makan siang, transportasi & dana pensiun',
      icon: <Briefcase className="h-5 w-5 text-brand-500" />
    },
    {
      id: 'freelancer',
      title: 'Freelancer / Digital Nomad',
      desc: 'Penghasilan dinamis per proyek, langganan software kerja & cafe coworking',
      icon: <Laptop className="h-5 w-5 text-blue-500" />
    },
    {
      id: 'umkm',
      title: 'Pengusaha / Pemilik Usaha UMKM',
      desc: 'Kelola kas operasional toko, belanja stok, ongkir & penjualan bisnis',
      icon: <Store className="h-5 w-5 text-emerald-500" />
    },
    {
      id: 'mahasiswa',
      title: 'Mahasiswa / Pelajar',
      desc: 'Uang saku bulanan, makan hemat, buku kuliah & nongkrong teman',
      icon: <GraduationCap className="h-5 w-5 text-purple-500" />
    },
    {
      id: 'keluarga',
      title: 'Kepala Keluarga / Rumah Tangga',
      desc: 'Belanja supermarket, sekolah anak, listrik air & rekreasi keluarga',
      icon: <Users className="h-5 w-5 text-amber-500" />
    }
  ];

  const priorities: PriorityOption[] = [
    {
      id: 'nabung',
      title: 'Menabung & Investasi Masa Depan',
      desc: 'Kumpulkan dana darurat dan portofolio investasi agar uang berkembang',
      icon: <PiggyBank className="h-5 w-5 text-emerald-500" />
    },
    {
      id: 'kontrol_jajan',
      title: 'Kontrol Pengeluaran & Jajan',
      desc: 'Cegah gaji habis di tengah bulan akibat impulsif kopi & belanja online',
      icon: <Coffee className="h-5 w-5 text-orange-500" />
    },
    {
      id: 'cashflow_bisnis',
      title: 'Kelola Arus Kas & Pekerjaan',
      desc: 'Pantau invoice proyek, perputaran modal usaha, dan keuntungan riil',
      icon: <TrendingUp className="h-5 w-5 text-blue-500" />
    },
    {
      id: 'cicilan_tagihan',
      title: 'Bayar Tagihan & Bebas Utang',
      desc: 'Pastikan seluruh kewajiban bulanan, KPR/kendaraan terbayar tepat waktu',
      icon: <ShieldCheck className="h-5 w-5 text-red-500" />
    }
  ];

  const computeRecommendations = () => {
    let cats: { name: string; emoji: string; color: string; type: 'expense' | 'income'; selected: boolean }[] = [];

    switch (selectedProfession) {
      case 'freelancer':
        cats = [
          { name: 'Makanan & Kebutuhan', emoji: '🍜', color: '#F97316', type: 'expense', selected: true },
          { name: 'Software & Alat Kerja', emoji: '💻', color: '#3B82F6', type: 'expense', selected: true },
          { name: 'Cafe & Coworking', emoji: '☕', color: '#EC4899', type: 'expense', selected: true },
          { name: 'Internet & Tagihan', emoji: '⚡', color: '#EF4444', type: 'expense', selected: true },
          { name: 'Transportasi & Ojol', emoji: '🚕', color: '#8B5CF6', type: 'expense', selected: true },
          { name: 'Dana Darurat & Sehat', emoji: '🛡️', color: '#10B981', type: 'expense', selected: true },
          { name: 'Honor Klien & Project', emoji: '💵', color: '#16A34A', type: 'income', selected: true },
          { name: 'Royalti & Side Hustle', emoji: '📈', color: '#F59E0B', type: 'income', selected: true }
        ];
        break;
      case 'umkm':
        cats = [
          { name: 'Stok Barang & Bahan Baku', emoji: '📦', color: '#F97316', type: 'expense', selected: true },
          { name: 'Logistik & Pengiriman', emoji: '🚚', color: '#3B82F6', type: 'expense', selected: true },
          { name: 'Iklan & Pemasaran', emoji: '📢', color: '#8B5CF6', type: 'expense', selected: true },
          { name: 'Listrik & Sewa Toko', emoji: '💡', color: '#EF4444', type: 'expense', selected: true },
          { name: 'Konsumsi Tim & Operasional', emoji: '🍱', color: '#EC4899', type: 'expense', selected: true },
          { name: 'Peralatan & Perawatan', emoji: '🔧', color: '#10B981', type: 'expense', selected: true },
          { name: 'Penjualan Produk/Jasa', emoji: '💳', color: '#16A34A', type: 'income', selected: true },
          { name: 'Modal Usaha & Mitra', emoji: '🤝', color: '#F59E0B', type: 'income', selected: true }
        ];
        break;
      case 'mahasiswa':
        cats = [
          { name: 'Makan Warteg & Kantin', emoji: '🍛', color: '#F97316', type: 'expense', selected: true },
          { name: 'Bensin & Ojek Online', emoji: '🛵', color: '#3B82F6', type: 'expense', selected: true },
          { name: 'Buku Kuliah & Print', emoji: '📚', color: '#8B5CF6', type: 'expense', selected: true },
          { name: 'Sewa Kos & Listrik', emoji: '🏠', color: '#EF4444', type: 'expense', selected: true },
          { name: 'Hiburan & Games', emoji: '🎮', color: '#EC4899', type: 'expense', selected: true },
          { name: 'Paket Data & Pulsa', emoji: '📱', color: '#10B981', type: 'expense', selected: true },
          { name: 'Uang Saku Keluarga', emoji: '💸', color: '#16A34A', type: 'income', selected: true },
          { name: 'Gaji Magang / Part-time', emoji: '💼', color: '#F59E0B', type: 'income', selected: true }
        ];
        break;
      case 'keluarga':
        cats = [
          { name: 'Belanja Bulanan Supermarket', emoji: '🛒', color: '#F97316', type: 'expense', selected: true },
          { name: 'Pendidikan & Sekolah Anak', emoji: '🏫', color: '#3B82F6', type: 'expense', selected: true },
          { name: 'Listrik, Air & WiFi Rumah', emoji: '⚡', color: '#EF4444', type: 'expense', selected: true },
          { name: 'Cicilan Rumah & Transport', emoji: '🚗', color: '#8B5CF6', type: 'expense', selected: true },
          { name: 'Kesehatan & BPJS', emoji: '🏥', color: '#10B981', type: 'expense', selected: true },
          { name: 'Liburan & Makan Keluarga', emoji: '🏖️', color: '#EC4899', type: 'expense', selected: true },
          { name: 'Gaji Pokok Utama', emoji: '💼', color: '#16A34A', type: 'income', selected: true },
          { name: 'Pendapatan Tambahan', emoji: '🧺', color: '#F59E0B', type: 'income', selected: true }
        ];
        break;
      case 'karyawan':
      default:
        cats = [
          { name: 'Makan & Minum Harian', emoji: '🍜', color: '#F97316', type: 'expense', selected: true },
          { name: 'Transportasi & Bensin', emoji: '🚗', color: '#3B82F6', type: 'expense', selected: true },
          { name: 'Tempat Tinggal & Tagihan', emoji: '🏠', color: '#EF4444', type: 'expense', selected: true },
          { name: 'Belanja Kebutuhan Harian', emoji: '🛍️', color: '#8B5CF6', type: 'expense', selected: true },
          { name: 'Kopi & Nongkrong', emoji: '☕', color: '#EC4899', type: 'expense', selected: true },
          { name: 'Kesehatan & Obat', emoji: '🏥', color: '#10B981', type: 'expense', selected: true },
          { name: 'Gaji Pokok Bulanan', emoji: '💼', color: '#16A34A', type: 'income', selected: true },
          { name: 'Bonus & Investasi', emoji: '📈', color: '#F59E0B', type: 'income', selected: true }
        ];
        break;
    }

    setRecommendedCategories(cats);
  };

  const handleNextToStep2 = () => {
    setStep(2);
  };

  const handleNextToStep3 = () => {
    computeRecommendations();
    setStep(3);
  };

  const toggleCategorySelection = (idx: number) => {
    setRecommendedCategories(prev => {
      const next = [...prev];
      next[idx].selected = !next[idx].selected;
      return next;
    });
  };

  const handleApplyCategories = async () => {
    setIsApplying(true);
    try {
      const user = store.getCurrentUser();
      const selected = recommendedCategories.filter(c => c.selected);

      const createdCategories: Category[] = [];

      for (const cat of selected) {
        const newCat = store.addCategory({
          userId: user.id,
          name: cat.name,
          emoji: cat.emoji,
          color: cat.color,
          type: cat.type,
          isCustom: true
        });
        createdCategories.push(newCat);
      }

      setSuccessMessage(`Berhasil menyimpan ${createdCategories.length} kategori rekomendasi AI!`);

      setTimeout(() => {
        if (onCompleted) {
          onCompleted(createdCategories);
        }
        setIsApplying(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to apply categories:', err);
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">AI Category Onboarding Wizard</h2>
              <p className="text-xs text-orange-100">
                Langkah {step} dari 3: {step === 1 ? 'Pilih Profil & Pekerjaan' : step === 2 ? 'Prioritas Finansial' : '8 Rekomendasi Kategori Personal'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="w-full bg-slate-100 h-1.5 flex">
          <div className={`h-full bg-brand-500 transition-all duration-300 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`}></div>
        </div>

        {/* Content Area */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {/* STEP 1: PROFESI */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Apa aktivitas atau profesi utama Anda saat ini?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  TataDana AI akan menyesuaikan struktur pos pengeluaran dan pemasukan berdasarkan kebutuhan harian Anda.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 pt-2">
                {professions.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProfession(p.id)}
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border text-left transition ${
                      selectedProfession === p.id
                        ? 'border-brand-500 bg-orange-50/50 ring-2 ring-brand-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-slate-100 shrink-0">
                      {p.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{p.title}</span>
                        {selectedProfession === p.id && (
                          <CheckCircle2 className="h-5 w-5 text-brand-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{p.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: PRIORITAS */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Apa fokus atau tujuan finansial utama Anda?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih prioritas keuangan Anda agar AI dapat memetakan proporsi budget dan kategori yang relevan.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 pt-2">
                {priorities.map(pr => (
                  <button
                    key={pr.id}
                    onClick={() => setSelectedPriority(pr.id)}
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border text-left transition ${
                      selectedPriority === pr.id
                        ? 'border-brand-500 bg-orange-50/50 ring-2 ring-brand-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-slate-100 shrink-0">
                      {pr.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{pr.title}</span>
                        {selectedPriority === pr.id && (
                          <CheckCircle2 className="h-5 w-5 text-brand-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{pr.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: REKOMENDASI 8 KATEGORI */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand-500" />
                  <h3 className="text-base font-extrabold text-slate-900">8 Rekomendasi Kategori Awal</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dihasilkan khusus untuk profil <strong>{professions.find(p => p.id === selectedProfession)?.title}</strong>. Anda dapat mengaktifkan atau menonaktifkan kategori di bawah sebelum disimpan.
                </p>
              </div>

              {successMessage ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {recommendedCategories.map((cat, idx) => (
                    <div
                      key={idx}
                      onClick={() => toggleCategorySelection(idx)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer select-none transition ${
                        cat.selected
                          ? 'border-brand-300 bg-orange-50/40'
                          : 'border-slate-200 bg-slate-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                          {cat.emoji}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{cat.name}</p>
                          <span
                            className={`inline-block text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                              cat.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                          </span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={cat.selected}
                        onChange={() => {}} // handled by div onClick
                        className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 pointer-events-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              disabled={isApplying}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Kembali</span>
            </button>
          ) : (
            <div></div>
          )}

          {step === 1 && (
            <button
              onClick={handleNextToStep2}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-sm transition"
            >
              <span>Lanjut ke Prioritas</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          {step === 2 && (
            <button
              onClick={handleNextToStep3}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-sm transition"
            >
              <span>Lihat 8 Rekomendasi AI</span>
              <Sparkles className="h-4 w-4" />
            </button>
          )}

          {step === 3 && (
            <button
              onClick={handleApplyCategories}
              disabled={isApplying || recommendedCategories.filter(c => c.selected).length === 0}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              <span>{isApplying ? 'Menerapkan Kategori...' : `Terapkan ${recommendedCategories.filter(c => c.selected).length} Kategori & Mulai`}</span>
              <CheckCircle2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
