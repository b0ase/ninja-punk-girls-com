import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AssetProvider } from "@/context/AssetContext";
import { AppProviders } from "@/context/AppProviders";
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ninja Punk Girls', 
  description: 'Official website for Ninja Punk Girls NFT collection.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} text-white`}>
        <AppProviders>
          <AssetProvider>
            <Navbar />
            <main className="pt-8">
              {children}
            </main>
            <Toaster
              position="bottom-center"
              reverseOrder={false}
            />
          </AssetProvider>
        </AppProviders>
        <div className="fixed bottom-0 left-0 right-0 h-4 bg-black z-10"></div>
      </body>
    </html>
  );
}
