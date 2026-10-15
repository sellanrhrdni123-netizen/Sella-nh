'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Briefcase,
  Laptop,
  Store,
  GraduationCap,
  Users,
  PiggyBank,
  Coffee,
  TrendingUp,
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { store } from '@/lib/storage';
import { Category } from '@/lib/types';
import { OnboardingWizardModal } from '@/components/dashboard/OnboardingWizardModal';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedProfession, setSelectedProfession] = useState<string>('karyawan');
  const [selectedPriority, setSelectedPriority] = useState<string>('nabung');
  const [isApplying, setIsApplying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [appliedCount, setAppliedCount] = useState(0);

  const professions = [
    {
      id: 'karyawan',
      title: 'Karyawan Swasta / ASN / BUMN',
      desc: 'Penghasilan bulanan teratur, fokus makan siang, transportasi & dana pensiun',
      icon: <Briefcase className="h-6 w-6 text-brand-500" />
    },
    {
      id: 'freelancer',
      title: 'Freelancer / Digital Nomad',
      desc: 'Penghasilan dinamis per proyek, langganan software kerja & cafe coworking',
      icon: <Laptop className="h-6 w-6 text-blue-500" />
    },
    {
      id: 'umkm',
      title: 'Pengusaha / Pemilik Usaha UMKM',
      desc: 'Kelola kas operasional toko, belanja stok, ongkir & penjualan bisnis',
      icon: <Store className="h-6 w-6 text-emerald-500" />
    },
    {
      id: 'mahasiswa',
      title: 'Mahasiswa / Pelajar',
      desc: 'Uang saku bulanan, makan hemat, buku kuliah & nongkrong teman',
      icon: <GraduationCap className="h-6 w-6 text-purple-500" />
    },
    {
      id: 'keluarga',
      title: 'Kepala Keluarga / Rumah Tangga',
      desc: 'Belanja supermarket, sekolah anak, listrik air & rekreasi keluarga',
      icon: <Users className="h-6 w-6 text-amber-500" />
    }
  ];

  const priorities = [
    {
      id: 'nabung',
      title: 'Menabung & Investasi Masa Depan',
      desc: 'Kumpulkan dana darurat dan portofolio investasi agar uang berkembang',
      icon: <PiggyBank className="h-6 w-6 text-emerald-500" />
    },
    {
      id: 'kontrol_jajan',
      title: 'Kontrol Pengeluaran & Jajan',
      desc: 'Cegah gaji habis di tengah bulan akibat impulsif kopi & belanja online',
      icon: <Coffee className="h-6 w-6 text-orange-500" />
    },
    {
      id: 'cashflow_bisnis',
      title: 'Kelola Arus Kas & Pekerjaan',
      desc: 'Pantau invoice proyek, perputaran modal usaha, dan keuntungan riil',
      icon: <TrendingUp className="h-6 w-6 text-blue-500" />
    },
    {
      id: 'cicilan_tagihan',
      title: 'Bayar Tagihan & Bebas Utang',
      desc: 'Pastikan seluruh kewajiban bulanan, KPR/kendaraan terbayar tepat waktu',
      icon: <ShieldCheck className="h-6 w-6 text-red-500" />
    }
  ];

  const [recommendedCategories, setRecommendedCategories] = useState<
    { name: string; emoji: string; color: string; type: 'expense' | 'income'; selected: boolean }[]
  >([]);

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

  const handleNextToStep2 = () => setStep(2);
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

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const user = store.getCurrentUser();
      const selected = recommendedCategories.filter(c => c.selected);

      for (const cat of selected) {
        store.addCategory({
          userId: user.id,
          name: cat.name,
          emoji: cat.emoji,
          color: cat.color,
          type: cat.type,
          isCustom: true
        });
      }

      setAppliedCount(selected.length);
      setCompleted(true);
    } catch (e) {
      console.error('Error applying onboarding categories:', e);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-brand-700 text-xs font-extrabold uppercase tracking-wider">
          <Sparkles className="h-4 w-4" />
          <span>TataDana Smart Onboarding</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Setup 8 Kategori Finansial Pintar Anda
        </h1>
        <p className="text-slate-500 text-sm max-w-xl mx-auto">
          Jawab kuesioner 3-langkah singkat ini agar AI TataDana dapat merekomendasikan 8 kategori pengeluaran dan pemasukan yang paling relevan dengan gaya hidup Anda.
        </p>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${step === 1 ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
          <span>1. Profil Pekerjaan</span>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300" />
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${step === 2 ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
          <span>2. Prioritas Finansial</span>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300" />
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${step === 3 ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
          <span>3. Rekomendasi 8 Kategori</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 sm:p-8">
        {completed ? (
          <div className="text-center py-10 space-y-6">
            <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900">
                Setup Selesai! {appliedCount} Kategori Siap Digunakan.
              </h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Kategori Anda telah tersimpan. Anda sekarang bisa mulai mencatat transaksi langsung via Telegram Bot atau lewat menu transaksi web.
              </p>
            </div>
            <div className="pt-4 flex justify-center gap-4">
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold shadow-md transition flex items-center gap-2"
              >
                <span>Buka Dashboard TataDana</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Pilih Status atau Profesi Anda Saat Ini:</h2>
                  <p className="text-xs text-slate-500">Pilih salah satu yang paling mendekati kegiatan sehari-hari Anda.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {professions.map(p => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProfession(p.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3.5 ${
                        selectedProfession === p.id
                          ? 'border-brand-500 bg-orange-50/50 ring-2 ring-brand-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="p-3 rounded-xl bg-slate-100 shrink-0">
                        {p.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-sm text-slate-900">{p.title}</h3>
                          {selectedProfession === p.id && (
                            <CheckCircle2 className="h-5 w-5 text-brand-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{p.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    onClick={handleNextToStep2}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition shadow-xs"
                  >
                    <span>Lanjut ke Prioritas</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Apa Fokus atau Prioritas Finansial Anda?</h2>
                  <p className="text-xs text-slate-500">AI akan menyesuaikan pembobotan kategori berdasarkan tujuan Anda.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {priorities.map(pr => (
                    <div
                      key={pr.id}
                      onClick={() => setSelectedPriority(pr.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-3.5 ${
                        selectedPriority === pr.id
                          ? 'border-brand-500 bg-orange-50/50 ring-2 ring-brand-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="p-3 rounded-xl bg-slate-100 shrink-0">
                        {pr.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-sm text-slate-900">{pr.title}</h3>
                          {selectedPriority === pr.id && (
                            <CheckCircle2 className="h-5 w-5 text-brand-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{pr.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Kembali</span>
                  </button>
                  <button
                    onClick={handleNextToStep3}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition shadow-xs"
                  >
                    <span>Lihat 8 Rekomendasi AI</span>
                    <Sparkles className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-brand-500" />
                    <h2 className="text-lg font-bold text-slate-900">8 Rekomendasi Kategori Personalisasi</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Centang kategori yang ingin Anda aktifkan ke dalam akun TataDana Anda.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {recommendedCategories.map((cat, idx) => (
                    <div
                      key={idx}
                      onClick={() => toggleCategorySelection(idx)}
                      className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer select-none transition ${
                        cat.selected
                          ? 'border-brand-300 bg-orange-50/40 shadow-xs'
                          : 'border-slate-200 bg-slate-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="text-2xl p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                          {cat.emoji}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{cat.name}</p>
                          <span
                            className={`inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded mt-0.5 ${
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
                        onChange={() => {}}
                        className="h-5 w-5 rounded text-brand-600 focus:ring-brand-500 border-slate-300 pointer-events-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setStep(2)}
                    disabled={isApplying}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Kembali</span>
                  </button>
                  <button
                    onClick={handleApply}
                    disabled={isApplying || recommendedCategories.filter(c => c.selected).length === 0}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition shadow-md disabled:opacity-50"
                  >
                    <span>{isApplying ? 'Menerapkan Kategori...' : `Terapkan ${recommendedCategories.filter(c => c.selected).length} Kategori & Selesai`}</span>
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
