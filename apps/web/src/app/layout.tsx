import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Geist } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import './globals.css';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'NBOS — Business Operation System',
  description: 'Internal Business Operation System by Neetrino',
  icons: {
    icon: [{ url: '/logo/icon.png', type: 'image/png' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <html lang="en" suppressHydrationWarning className={cn('font-sans', geist.variable)}>
        <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
          {children}
        </body>
      </html>
    </SessionProvider>
  );
}
