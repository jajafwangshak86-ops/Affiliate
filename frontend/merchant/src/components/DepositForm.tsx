'use client';

import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { depositEscrow } from '../lib/contracts';

export default function DepositForm() {
  const { address } = useWallet();
  const [campaignId, setCampaignId] = useState('1');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState(process.env.NEXT_PUBLIC_TOKEN_CONTRACT ?? '');
  const [pending, setPending] = useState(false);

  if (!address) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    // amount in USDC micro-units (6 decimals)
    await depositEscrow(parseInt(campaignId), Math.round(parseFloat(amount) * 1_000_000), token);
    setPending(false);
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Deposit Escrow">
      <div>
        <label htmlFor="deposit-campaign">Campaign ID</label>
        <input
          id="deposit-campaign"
          type="number"
          min="1"
          value={campaignId}
          onChange={(e) => setCampaignId(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="deposit-amount">Amount (USDC)</label>
        <input
          id="deposit-amount"
          type="number"
          min="1"
          step="0.000001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="deposit-token">Token Contract</label>
        <input
          id="deposit-token"
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
        />
      </div>
      <button type="submit" disabled={pending}>
        {pending ? 'Depositing…' : 'Deposit'}
      </button>
    </form>
  );
}
