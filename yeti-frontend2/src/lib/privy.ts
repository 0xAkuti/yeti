import { base } from 'viem/chains';

export const privyConfig = {
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
  clientId: process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID || '',
  config: {
    defaultChain: base,
    supportedChains: [base],
    appearance: {
      theme: 'dark' as const,
      accentColor: '#818CF8' as const,
    },
    embeddedWallets: {
      createOnLogin: 'users-without-wallets' as const,
    },
  },
};