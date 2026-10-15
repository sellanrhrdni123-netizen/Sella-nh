import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TataDana — Catat Keuangan Semudah Chat dari Telegram Kamu',
  description: 'TataDana adalah aplikasi manajemen keuangan pribadi terintegrasi Telegram Bot. Catat pengeluaran dan pemasukan dengan bahasa santai atau foto struk secara otomatis.',
  keywords: ['keuangan pribadi', 'catat keuangan telegram', 'bot telegram keuangan', 'fintech indonesia', 'tatadana'],
  authors: [{ name: 'TataDana Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
