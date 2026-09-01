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
        {/* Subtle Top Disaster Relief Donation Banner */}
        <div className="bg-red-50/70 text-neutral-800 border-b border-red-100/80 dark:bg-zinc-950 dark:text-neutral-200 dark:border-zinc-800/80 text-[11px] sm:text-xs py-1.5 px-3 text-center transition-colors">
          <a
            href="https://pmdrf.nchl.com.np/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-wrap items-center justify-center gap-1.5 font-medium text-neutral-700 hover:text-red-700 dark:text-neutral-300 dark:hover:text-white transition-colors group"
          >
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-100 text-red-600 dark:bg-red-950/70 dark:text-red-400 border border-red-200/80 dark:border-red-900/50 shadow-xs shrink-0">
              <HeartHandshake className="h-3 w-3" />
            </span>
            <span>Donate to the Government of Nepal Prime Minister&apos;s Disaster Relief Fund</span>
            <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
          </a>
        </div>
        {children}
      </body>
    </html>
  );
}

