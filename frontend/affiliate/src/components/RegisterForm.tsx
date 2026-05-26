'use client';

import { useState } from 'react';
import { registerAffiliate } from '../lib/contracts';

export default function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const [asset, setAsset] = useState<'USDC' | 'sBTC'>('USDC');
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    await registerAffiliate(asset);
    setPending(false);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Register as Affiliate">
      <fieldset>
        <legend>Preferred Payout Asset</legend>
        <label>
          <input type="radio" name="asset" value="USDC" checked={asset === 'USDC'} onChange={() => setAsset('USDC')} />
          {' '}USDC
        </label>
        {' '}
        <label>
          <input type="radio" name="asset" value="sBTC" checked={asset === 'sBTC'} onChange={() => setAsset('sBTC')} />
          {' '}sBTC (Bitcoin)
        </label>
      </fieldset>
      <button type="submit" disabled={pending}>{pending ? 'Registering…' : 'Register'}</button>
    </form>
  );
}
