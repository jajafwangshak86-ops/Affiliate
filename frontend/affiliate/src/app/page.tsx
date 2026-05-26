'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import WalletButton from '../components/WalletButton';
import RegisterForm from '../components/RegisterForm';
import EarningsDisplay from '../components/EarningsDisplay';
import { getAffiliateStats, isRegistered, updatePayoutAsset, buildReferralLink, AffiliateStats } from '../lib/contracts';

export default function AffiliatePage() {
  const { address } = useWallet();
  const [registered, setRegistered] = useState<boolean | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [merchantUrl, setMerchantUrl] = useState('https://your-merchant-store.com');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    Promise.all([isRegistered(address), getAffiliateStats(address)])
      .then(([reg, s]) => {
        setRegistered(reg);
        setStats(s);
      })
      .finally(() => setLoading(false));
  }, [address]);

  const referralLink = address ? buildReferralLink(merchantUrl, address) : '';

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAssetChange = async (asset: 'USDC' | 'sBTC') => {
    await updatePayoutAsset(asset);
  };

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Affiliate Portal</h1>
        <WalletButton />
      </header>

      {!address && <p>Connect your Stacks wallet to view your referral links and earnings.</p>}

      {address && loading && <p>Loading…</p>}

      {address && !loading && registered === false && (
        <section aria-label="Register" style={{ marginTop: '2rem' }}>
          <h2>Get Started</h2>
          <p>Register to receive your referral link and start earning.</p>
          <RegisterForm onSuccess={() => setRegistered(true)} />
        </section>
      )}

      {address && !loading && registered === true && stats && (
        <>
          <section aria-label="Earnings" style={{ marginTop: '2rem' }}>
            <h2>Earnings</h2>
            <EarningsDisplay
              totalConversions={stats.totalConversions}
              totalEarned={stats.totalEarned}
              payoutAsset={stats.payoutAsset}
            />
          </section>

          <section aria-label="Referral Link" style={{ marginTop: '2rem' }}>
            <h2>Referral Link</h2>
            <div style={{ marginBottom: '0.5rem' }}>
              <label htmlFor="merchant-url">Merchant Store URL</label>
              <input
                id="merchant-url"
                type="url"
                value={merchantUrl}
                onChange={(e) => setMerchantUrl(e.target.value)}
                style={{ display: 'block', width: '100%', marginTop: '0.25rem' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                readOnly
                value={referralLink}
                style={{ flex: 1 }}
                aria-label="Your referral link"
              />
              <button onClick={copyLink}>{copied ? 'Copied!' : 'Copy'}</button>
            </div>
          </section>

          <section aria-label="Payout Preference" style={{ marginTop: '2rem' }}>
            <h2>Payout Asset</h2>
            <p>Currently: <strong>{stats.payoutAsset}</strong></p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleAssetChange('USDC')}
                disabled={stats.payoutAsset === 'USDC'}
              >
                Switch to USDC
              </button>
              <button
                onClick={() => handleAssetChange('sBTC')}
                disabled={stats.payoutAsset === 'sBTC'}
              >
                Switch to sBTC
              </button>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
