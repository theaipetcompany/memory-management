import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner';
import { NavigationBar } from '@/components/navigation-bar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OpenAI Vision Fine-tuning GUI',
  description: 'Upload images with annotations for fine-tuning',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NavigationBar />
        {children}
        <Toaster
          position="top-right"
          expand={true}
          richColors={true}
          closeButton={true}
          duration={500}
        />
      </body>
    </html>
  );
}
