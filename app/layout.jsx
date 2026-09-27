import { ClerkProvider } from '@clerk/nextjs';
import { GeistSans } from 'geist/font/sans';
import './globals.css';

export const metadata = {
  title: 'Threads & Gems Admin',
  description: 'Store management for Threads & Gems',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en-GB">
        <body className={`${GeistSans.variable} font-sans antialiased`}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
