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
  title: 'TU Coverify - Make TU Lab Report Cover Pages Online',
  description: 'Tribhuvan University (TU) lab report cover pages, index tables, notices, and official B.Sc. CSIT SGPA & CGPA calculator with IoST grading formulas.',
  keywords: [
    'TU Cover Page', 
    'Tribhuvan University', 
    'Lab Report Cover', 
    'Lab Index Maker',
    'BSc CSIT Cover Page', 
    'TU Assignment Front Page',
    'TU Format',
    'Nepal',
    'Coverify'
  ],
  authors: [{ name: 'Ankit Khatri KC', url: 'https://github.com/ankitkhatrik6' }],
  creator: 'Ankit Khatri KC',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tucoverify.ankitak.com.np/',
    title: 'TU Coverify - Make TU Lab Report Cover Pages Online',
    description: 'Create your Tribhuvan University (TU) lab report cover pages and index tables online for free. It is simple, fast, and uses the exact format required by TU.',
    siteName: 'TU Coverify',
    images: [
      {
        url: '/preview.png',
        width: 1200,
        height: 630,
        alt: 'TU Coverify Site Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TU Coverify - Make TU Lab Report Cover Pages Online',
    description: 'Create your Tribhuvan University (TU) lab report cover pages and index tables online for free. Simple, fast, and accurately formatted.',
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
        <div className="bg-red-50/90 text-neutral-800 border-b border-red-100 dark:bg-zinc-950/90 dark:text-neutral-200 dark:border-zinc-800/80 text-[11px] sm:text-xs py-1.5 sm:py-2 px-3 flex justify-center transition-colors">
          <a
            href="https://pmdrf.nchl.com.np/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 sm:gap-2 font-medium text-neutral-700 hover:text-red-700 dark:text-neutral-300 dark:hover:text-white transition-colors group max-w-3xl"
          >
            <span className="shrink-0 hidden sm:flex items-center justify-center h-5 w-5 rounded-full bg-red-100 text-red-600 dark:bg-red-950/70 dark:text-red-400 border border-red-200/80 dark:border-red-900/50 shadow-xs">
              <HeartHandshake className="h-3 w-3" />
            </span>
            <span className="leading-snug text-center line-clamp-2">
              Donate to the Government of Nepal Prime Minister&apos;s Disaster Relief Fund
              <ExternalLink className="inline-block ml-1 mb-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </span>
          </a>
        </div>
        {children}
      </body>
    </html>
  );
}

