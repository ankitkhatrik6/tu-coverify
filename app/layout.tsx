import type {Metadata} from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { HeartHandshake, ExternalLink } from 'lucide-react';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'TU Coverify | TU Lab Report Cover Page & Index Generator',
  description: 'Instantly generate pixel-perfect, print-ready Tribhuvan University (TU) Lab Report Cover Pages and Lab Indexes. Free, fast, and exactly formatted to TU standards.',
  keywords: [
    'TU Cover Page', 
    'Tribhuvan University', 
    'Lab Report Generator', 
    'Lab Index Generator',
    'BSc CSIT Cover Page', 
    'TU Assignment Front Page',
    'TU Lab Report Format',
    'Nepal',
    'Coverify'
  ],
  authors: [{ name: 'Ankit Khatri KC', url: 'https://github.com/ankitkhatrik6' }],
  creator: 'Ankit Khatri KC',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tucoverify.ankitak.com.np/',
    title: 'TU Coverify | TU Lab Report Cover Page & Index Generator',
    description: 'Instantly generate pixel-perfect, print-ready Tribhuvan University (TU) Lab Report Cover Pages and Lab Indexes. Free, fast, and exactly formatted to TU standards.',
    siteName: 'TU Coverify',
    images: [
      {
        url: '/preview.png',
        width: 1200,
        height: 630,
        alt: 'TU Coverify Preview Interface',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TU Coverify | TU Lab Report Cover Page & Index Generator',
    description: 'Instantly generate pixel-perfect, print-ready Tribhuvan University (TU) Lab Report Cover Pages and Lab Indexes.',
    images: ['/preview.png'],
  },
  verification: {
    google: 'kV4VPBDYMLp7-qjktWPDpYWcNWjGsfLeTxkT_9J09B0',
  },
  metadataBase: new URL('https://tucoverify.ankitak.com.np/'),
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning className="antialiased font-sans transition-colors duration-200">
        {/* Prominent Disaster Relief Donation Banner */}
        <div className="bg-gradient-to-r from-red-50 via-white to-red-50 dark:from-red-950/40 dark:via-zinc-950 dark:to-red-950/40 text-neutral-900 dark:text-neutral-100 border-b border-red-200 dark:border-red-900/50 py-3 md:py-4 px-4 text-center transition-colors shadow-sm">
          <a
            href="https://pmdrf.nchl.com.np/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 font-semibold hover:text-red-700 dark:hover:text-red-400 transition-colors group"
          >
            <span className="inline-flex items-center justify-center h-8 w-8 sm:h-6 sm:w-6 rounded-full bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 border border-red-200 dark:border-red-800 shadow-sm shrink-0">
              <HeartHandshake className="h-5 w-5 sm:h-4 sm:w-4" />
            </span>
            <span className="text-sm sm:text-base md:text-lg tracking-tight leading-snug">
              Donate to the Government of Nepal Prime Minister&apos;s Disaster Relief Fund
            </span>
            <ExternalLink className="h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all shrink-0 hidden sm:block" />
          </a>
        </div>
        {children}
      </body>
    </html>
  );
}

