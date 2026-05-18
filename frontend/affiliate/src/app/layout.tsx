import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Affiliate Network — Affiliate Portal',
  description: 'Track your referrals and Bitcoin earnings',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
