'use client';

interface ConversionHistoryProps {
  saleId: string;
  amount: number;
  campaignId: number;
  payoutAsset: string;
}

export default function ConversionHistory({ saleId, amount, campaignId, payoutAsset }: ConversionHistoryProps) {
  const formatted = payoutAsset === 'sBTC'
    ? `${(amount / 1e8).toFixed(8)} sBTC`
    : `$${(amount / 1e6).toFixed(2)} USDC`;

  return (
    <article aria-label={`Conversion ${saleId.slice(0, 8)}`} style={{ borderBottom: '1px solid #eee', padding: '0.75rem 0' }}>
      <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem 1rem' }}>
        <div>
          <dt style={{ fontSize: '0.75rem', color: '#666' }}>Sale ID</dt>
          <dd style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{saleId.slice(0, 16)}…</dd>
        </div>
        <div>
          <dt style={{ fontSize: '0.75rem', color: '#666' }}>Amount</dt>
          <dd style={{ fontWeight: 600 }}>{formatted}</dd>
        </div>
        <div>
          <dt style={{ fontSize: '0.75rem', color: '#666' }}>Campaign</dt>
          <dd>#{campaignId}</dd>
        </div>
        <div>
          <dt style={{ fontSize: '0.75rem', color: '#666' }}>Asset</dt>
          <dd>{payoutAsset}</dd>
        </div>
      </dl>
    </article>
  );
}
