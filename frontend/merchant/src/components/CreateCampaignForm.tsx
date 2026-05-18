'use client';

import { useState } from 'react';
import { createCampaign } from '../lib/contracts';

export default function CreateCampaignForm() {
  const [rate, setRate] = useState('500');
  const [floor, setFloor] = useState('1000000');
  const [token, setToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCampaign(parseInt(rate), parseInt(floor), token);
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Create Campaign">
      <div>
        <label htmlFor="rate">Commission Rate (basis points)</label>
        <input id="rate" type="number" value={rate} onChange={(e) => setRate(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="floor">Escrow Floor (token units)</label>
        <input id="floor" type="number" value={floor} onChange={(e) => setFloor(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="token">Token Contract Address</label>
        <input id="token" type="text" value={token} onChange={(e) => setToken(e.target.value)} required />
      </div>
      <button type="submit">Create Campaign</button>
    </form>
  );
}
