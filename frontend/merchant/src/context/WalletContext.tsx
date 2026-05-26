'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppConfig, UserSession, showConnect, UserData } from '@stacks/connect';

const appConfig = new AppConfig(['store_write', 'publish_data']);
export const userSession = new UserSession({ appConfig });

interface WalletContextType {
  userData: UserData | null;
  address: string | null;
  connect: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  userData: null,
  address: null,
  connect: () => {},
  disconnect: () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (userSession.isSignInPending()) {
      userSession.handlePendingSignIn().then(setUserData);
    } else if (userSession.isUserSignedIn()) {
      setUserData(userSession.loadUserData());
    }
  }, []);

  const connect = () =>
    showConnect({
      appDetails: { name: 'Affiliate Network', icon: '/logo.png' },
      userSession,
      onFinish: () => setUserData(userSession.loadUserData()),
      onCancel: () => {},
    });

  const disconnect = () => {
    userSession.signUserOut();
    setUserData(null);
  };

  const address = userData?.profile?.stxAddress?.testnet ?? null;

  return (
    <WalletContext.Provider value={{ userData, address, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
