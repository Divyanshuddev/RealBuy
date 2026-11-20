import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/context';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'RealBuy — Social Shopping & AI Product Review Platform',
  description: 'Discover real products shared by real buyers, verified with invoices, and synthesized by AI to turn thousands of customer experiences into one clear buying decision.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-[#080808] text-[#f4f4f5] antialiased selection:bg-[#ff6600] selection:text-black">
        <AuthProvider>
          <div className="min-h-screen flex flex-col md:flex-row bg-[#080808]">
            <Navbar />
            <main className="flex-1 md:ml-64 pt-14 md:pt-0 pb-20 md:pb-8 min-h-screen bg-[#080808]">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
