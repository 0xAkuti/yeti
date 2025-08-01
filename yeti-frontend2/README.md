# Yeti DEX Frontend

A TradingView-triggered limit order DEX built with Next.js 15, Privy, and the Yeti SDK.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup Privy:**
   - Go to [https://dashboard.privy.io](https://dashboard.privy.io)
   - Create a new app
   - Copy your App ID and Client ID
   - Update `.env.local` with your values:
   ```bash
   NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
   NEXT_PUBLIC_PRIVY_CLIENT_ID=your-privy-client-id
   NEXT_PUBLIC_WEBHOOK_SERVER_URL=http://localhost:3001
   ```

3. **Configure Privy App:**
   - In the Privy dashboard, add `http://localhost:3000` to your allowed domains
   - Configure Base network support
   - Enable wallet connections

4. **Start development server:**
   ```bash
   npm run dev
   ```

## Features

- Connect wallet with Privy
- Select trading pairs (USDC, USDT, WETH, WBTC on Base)
- Create limit orders using Yeti SDK
- TradingView webhook integration
- Copy webhook URLs and alert messages

## Architecture

- **Frontend**: Next.js 15 with Tailwind CSS
- **Web3**: Privy for authentication and wallet management
- **Trading**: Yeti SDK for limit orders
- **Chain**: Base network
- **Token Data**: 1inch SDK for prices and balances

## Environment Variables

```bash
NEXT_PUBLIC_PRIVY_APP_ID=     # From Privy dashboard
NEXT_PUBLIC_PRIVY_CLIENT_ID=  # From Privy dashboard  
NEXT_PUBLIC_WEBHOOK_SERVER_URL=http://localhost:3001
```

## Development

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```
