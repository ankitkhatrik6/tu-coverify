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
  title: 'TU Coverify - Tribhuvan University Lab Report Cover Page Generator',
  description: 'Generate pixel-perfect, print-ready Tribhuvan University (TU) Lab Report Cover Pages with real-time live preview. No more fixing margins in Word — just type, preview, and download.',
  keywords: [
    'TU Cover Page', 
    'Tribhuvan University', 
    'Lab Report', 
    'BSc CSIT Cover Page', 
    'TU Assignment Front Page',
    'TU Lab Report Format',
    'Nepal',
    'Cover Page Generator'
  ],
  authors: [{ name: 'Ankit Khatri KC', url: 'https://github.com/ankitkhatrik6' }],
  creator: 'Ankit Khatri KC',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tu-coverify.onrender.com',
    title: 'TU Coverify - Tribhuvan University Lab Report Cover Page Generator',
    description: 'Generate pixel-perfect, print-ready Tribhuvan University (TU) Lab Report Cover Pages with real-time live preview.',
    siteName: 'TU Coverify',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TU Coverify - TU Lab Report Cover Page Generator',
    description: 'Generate pixel-perfect, print-ready Tribhuvan University (TU) Lab Report Cover Pages with real-time live preview.',
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

