'use client';

import { useWallet } from '../context/WalletContext';

export default function WalletButton() {
  const { address, connect, disconnect } = useWallet();

  if (address) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span title={address}>
          {address.slice(0, 8)}…{address.slice(-4)}
        </span>
        <button onClick={disconnect}>Disconnect</button>
      </div>
    );
  }

  return <button onClick={connect}>Connect Wallet</button>;
}
