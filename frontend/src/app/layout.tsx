import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'VedaAI — AI Assessment Creator',
  description: 'Create AI-powered question papers in minutes',
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-brand-page text-brand-text antialiased">
        <div className="min-h-screen flex">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 md:ml-[260px]">
            <TopBar />
            <main className="flex-1 px-4 md:px-8 pt-6 pb-10">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
