import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Founder Hub QR | Instant Phone Contact Auto-Save Engine',
  description: 'Powered by AI Founder Hub (aifounderhub.com). Generate QR codes that automatically save your phone number, email, and social profiles directly into mobile phone contacts when scanned.',
  keywords: ['ai founder hub', 'qr contact generator', 'vcard qr code', 'auto save phone number', 'digital business card', 'ai agency tools'],
  authors: [{ name: 'AI Founder Hub', url: 'https://aifounderhub.com' }],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#07070b',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="bg-grid-overlay" />
        {children}
      </body>
    </html>
  );
}
