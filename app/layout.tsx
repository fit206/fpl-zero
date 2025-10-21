// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Sora } from 'next/font/google';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: 'FPLZERO',
  description: 'FPLZERO — Auto Draft Suggestion',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ms">
      <body className={sora.className}>
        <NavBar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
