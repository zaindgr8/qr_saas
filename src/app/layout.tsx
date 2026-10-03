import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'QuickContact QR | Instant Phone Contact Auto-Save SaaS',
  description: 'Generate QR codes that automatically save your phone number, email, and social profiles directly into mobile phone contacts when scanned.',
  keywords: ['qr contact generator', 'vcard qr code', 'auto save phone number', 'digital business card', 'saas qr contact'],
  authors: [{ name: 'QuickContact' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
