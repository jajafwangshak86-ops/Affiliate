import type { Metadata } from 'next';
import { WalletProvider } from '../context/WalletContext';

export const metadata: Metadata = {
  title: 'Affiliate Network — Merchant Dashboard',
  description: 'Manage your affiliate campaigns and escrow on Bitcoin',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
