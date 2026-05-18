'use client';

import { useState } from 'react';
import { registerAffiliate } from '../lib/contracts';

export default function RegisterForm() {
  const [asset, setAsset] = useState<'USDC' | 'sBTC'>('USDC');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await registerAffiliate(asset);
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Register as Affiliate">
      <fieldset>
        <legend>Preferred Payout Asset</legend>
        <label>
          <input type="radio" name="asset" value="USDC" checked={asset === 'USDC'} onChange={() => setAsset('USDC')} />
          USDC
        </label>
        <label>
          <input type="radio" name="asset" value="sBTC" checked={asset === 'sBTC'} onChange={() => setAsset('sBTC')} />
          sBTC (Bitcoin)
        </label>
      </fieldset>
      <button type="submit">Register</button>
    </form>
  );
}
