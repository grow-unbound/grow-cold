import type { Metadata } from 'next';
import { Noto_Sans, Noto_Serif, Noto_Sans_Mono } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const notoSans = Noto_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const notoSerif = Noto_Serif({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const notoSansMono = Noto_Sans_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'GrowCold',
  description: 'Mobile-first cold storage (WMS) for Indian SMBs',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`h-full ${notoSans.variable} ${notoSerif.variable} ${notoSansMono.variable}`}
    >
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
