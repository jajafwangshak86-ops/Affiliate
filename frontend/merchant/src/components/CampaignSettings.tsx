'use client';

import { useState } from 'react';
import { setCommissionRate } from '../lib/contracts';

export default function CampaignSettings({ campaignId }: { campaignId: number }) {
  const [rate, setRate] = useState('500');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await setCommissionRate(campaignId, parseInt(rate));
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Campaign Settings">
      <div>
        <label htmlFor="commission">Commission Rate (basis points)</label>
        <input
          id="commission"
          type="number"
          min="0"
          max="10000"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          required
        />
      </div>
      <button type="submit">Update Rate</button>
    </form>
  );
}
