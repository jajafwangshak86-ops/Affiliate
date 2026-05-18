'use client';

interface EarningsProps {
  totalConversions: number;
  totalEarned: number;
  payoutAsset: string;
}

export default function EarningsDisplay({ totalConversions, totalEarned, payoutAsset }: EarningsProps) {
  const formatted = payoutAsset === 'sBTC'
    ? `${(totalEarned / 1e8).toFixed(8)} sBTC`
    : `$${(totalEarned / 1e6).toFixed(2)} USDC`;

  return (
    <section aria-label="Earnings Summary">
      <dl>
        <div>
          <dt>Total Conversions</dt>
          <dd>{totalConversions}</dd>
        </div>
        <div>
          <dt>Total Earned</dt>
          <dd>{formatted}</dd>
        </div>
        <div>
          <dt>Payout Asset</dt>
          <dd>{payoutAsset}</dd>
        </div>
      </dl>
    </section>
  );
}
