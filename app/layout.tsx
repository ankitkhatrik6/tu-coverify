import type {Metadata} from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
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
    url: 'https://tu-coverify.onrender.com',
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
  metadataBase: new URL('https://tu-coverify.onrender.com'),
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning className="antialiased font-sans transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}

