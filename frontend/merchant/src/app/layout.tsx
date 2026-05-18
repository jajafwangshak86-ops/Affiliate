import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Affiliate Network — Merchant Dashboard',
  description: 'Manage your affiliate campaigns and escrow on Bitcoin',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
