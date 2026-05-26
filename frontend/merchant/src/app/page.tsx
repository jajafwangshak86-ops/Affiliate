'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import WalletButton from '../components/WalletButton';
import CreateCampaignForm from '../components/CreateCampaignForm';
import CampaignSettings from '../components/CampaignSettings';
import { getCampaign, Campaign } from '../lib/contracts';

export default function DashboardPage() {
  const { address } = useWallet();
  const [campaignId, setCampaignId] = useState('1');
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    setError('');
    getCampaign(parseInt(campaignId), address)
      .then(setCampaign)
      .catch(() => setError('Campaign not found'))
      .finally(() => setLoading(false));
  }, [address, campaignId]);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Merchant Dashboard</h1>
        <WalletButton />
      </header>

      {!address && (
        <p>Connect your Stacks wallet to manage campaigns and escrow.</p>
      )}

      {address && (
        <>
          <section aria-label="Campaign Lookup" style={{ marginTop: '2rem' }}>
            <h2>Campaign</h2>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <label htmlFor="campaign-id">Campaign ID</label>
              <input
                id="campaign-id"
                type="number"
                min="1"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                style={{ width: 80 }}
              />
            </div>

            {loading && <p>Loading…</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {campaign && (
              <dl style={{ lineHeight: 2 }}>
                <div><dt>Status</dt><dd>{campaign.active ? '🟢 Active' : '🔴 Paused'}</dd></div>
                <div><dt>Commission Rate</dt><dd>{campaign.commissionRate / 100}%</dd></div>
                <div>
                  <dt>Escrow Balance</dt>
                  <dd>{(campaign.escrowBalance / 1_000_000).toFixed(2)} USDC</dd>
                </div>
                <div>
                  <dt>Escrow Floor</dt>
                  <dd>{(campaign.escrowFloor / 1_000_000).toFixed(2)} USDC</dd>
                </div>
                <div><dt>Token</dt><dd style={{ wordBreak: 'break-all' }}>{campaign.token}</dd></div>
              </dl>
            )}
          </section>

          {campaign && (
            <section aria-label="Update Commission" style={{ marginTop: '2rem' }}>
              <h2>Update Commission Rate</h2>
              <CampaignSettings campaignId={parseInt(campaignId)} />
            </section>
          )}

          <section aria-label="Create Campaign" style={{ marginTop: '2rem' }}>
            <h2>Create New Campaign</h2>
            <CreateCampaignForm />
          </section>
        </>
      )}
    </main>
  );
}
