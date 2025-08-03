'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth';

export function ConnectButton() {
  const { login, logout, authenticated, ready, user } = usePrivy();
  const { wallets } = useWallets();

  const handleConnect = () => {
    if (authenticated) {
      logout();
    } else {
      login();
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Show loading state while Privy initializes
  if (!ready) {
    return (
      <button 
        disabled
        className="w-full bg-gray-600 text-white font-semibold py-4 rounded-xl"
      >
        Loading...
      </button>
    );
  }

  // Get the first connected wallet address
  const walletAddress = wallets[0]?.address;

  return (
    <button
      onClick={handleConnect}
      className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc6a] hover:from-[#00dd77] hover:to-[#00aa55] text-black font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg disabled:from-gray-600 disabled:to-gray-600 disabled:text-white"
      disabled={!ready}
    >
      {authenticated && walletAddress ? (
        <span>Connected: {formatAddress(walletAddress)}</span>
      ) : authenticated && user ? (
        <span>Connected: {user.id.slice(0, 8)}...</span>
      ) : (
        'Connect Wallet'
      )}
    </button>
  );
}