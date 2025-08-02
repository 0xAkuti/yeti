import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen custom-bg relative">
      {/* Header */}
      <header className="border-b border-[#006e4e]/30 bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/logo.png" 
                alt="YETI Logo" 
                className="w-12 h-12 rounded-lg object-cover"
                style={{ width: '48px', height: '48px' }}
              />
              <Link href="/" className="text-xl font-black tracking-wider text-white uppercase" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                YETI
              </Link>
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/app" className="text-white hover:text-[#006e4e] transition-colors">
                Trade
              </Link>
              <Link href="/docs" className="text-white hover:text-[#006e4e] transition-colors">
                Docs
              </Link>
              <Link href="/app" className="text-white hover:text-[#006e4e] transition-colors">
                Dashboard
              </Link>
            </nav>
            
            <Link 
              href="/app"
              className="bg-[#006e4e] hover:bg-[#005a42] text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
            >
              Launch App
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center justify-center min-h-[calc(100vh-200px)] py-12">
          {/* Left Content - Large Circular Graphic */}
          <div className="lg:w-1/2 flex justify-center mb-12 lg:mb-0">
            <div className="relative">
              <div className="w-96 h-96 bg-gradient-to-br from-[#1a2036] to-[#0f1419] rounded-full flex items-center justify-center border-4 border-[#006e4e] shadow-2xl">
                <div className="w-80 h-80 bg-gradient-to-br from-[#006e4e]/10 to-[#008f6a]/10 rounded-full flex items-center justify-center">
                  <img 
                    src="/hero-yeti.png" 
                    alt="Yeti Hero" 
                    className="w-72 h-72 object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Content - Text and Button */}
          <div className="lg:w-1/2 text-left lg:pl-12">
            <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight tracking-wide">
              Trade DeFi like a{' '}
              <span className="text-[#00ff88] animate-pulse relative inline-block">
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00ff88]/40 to-transparent animate-shine"></span>
                <span className="absolute inset-0 bg-gradient-to-r from-[#00ff88]/20 via-[#00ff88]/60 via-[#00ff88]/20 to-transparent animate-shine-delayed"></span>
                <span className="relative z-10 drop-shadow-[0_0_10px_#00ff88]">YETI</span>
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-lg leading-relaxed">
              Supercharge your DeFi trading.
              <br />
              Connect TradingView alerts to automated limit orders on 1inch.
            </p>
            
            <Link 
              href="/app"
              className="bg-[#006e4e] hover:bg-[#005a42] text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-200 inline-block shadow-lg"
            >
              Start Trading
            </Link>
          </div>
        </div>
        
        {/* Why TradingView Section */}
        <div className="max-w-4xl mx-auto mt-20">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Why TradingView?</h2>
          <div className="bg-black/30 p-8 rounded-xl border border-[#006e4e]/30 backdrop-blur-sm">
            <p className="text-xl text-gray-300 text-center leading-relaxed">
              Automate your favourite strategies you already use, and the trading tools you already love. 
              Allow you to have maximum flexibility in your trading strategies, not limited to DCA, TWAP, and grid trading.
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto mt-20">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Why YETI?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-black/30 p-6 rounded-xl border border-[#006e4e]/30 backdrop-blur-sm hover:bg-black/40 transition-all duration-200">
              <div className="w-12 h-12 bg-[#006e4e] rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Smart Contract Security</h3>
              <p className="text-gray-400">
                Your private keys stay in your wallet. Uses predicates and on-chain verification for maximum security.
              </p>
            </div>
            
            <div className="bg-black/30 p-6 rounded-xl border border-[#006e4e]/30 backdrop-blur-sm hover:bg-black/40 transition-all duration-200">
              <div className="w-12 h-12 bg-[#006e4e] rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Full Control</h3>
              <p className="text-gray-400">
                You maintain complete control of your funds. No centralized servers or third-party custody.
              </p>
            </div>
            
            <div className="bg-black/30 p-6 rounded-xl border border-[#006e4e]/30 backdrop-blur-sm hover:bg-black/40 transition-all duration-200">
              <div className="w-12 h-12 bg-[#006e4e] rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Transparent & Auditable</h3>
              <p className="text-gray-400">
                Every trade is cryptographically verified on-chain. Audit the smart contract code yourself.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
