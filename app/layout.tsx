import type { Metadata } from 'next';
import { Cinzel, Cormorant_Garamond, Dancing_Script } from 'next/font/google';
import { gardenDescription, gardenTitle } from '@/lib/garden/config';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-cormorant'
});

const dancing = Dancing_Script({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-dancing'
});

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-display'
});

const baseUrlValue =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

const metadataBase = (() => {
  try {
    return new URL(baseUrlValue);
  } catch {
    return new URL('http://localhost:3000');
  }
})();

const siteTitle = gardenTitle;
const siteDescription = gardenDescription;

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  metadataBase,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    type: 'website',
    locale: 'id_ID',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: siteTitle
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: ['/opengraph-image']
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true
    }
  },
  alternates: {
    canonical: '/'
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${cormorant.variable} ${dancing.variable} ${cinzel.variable}`}>
      <body className="font-garden">
        {children}
      </body>
    </html>
  );
}
