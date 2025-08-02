import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/logo.png" 
                alt="Yeti DEX Logo" 
                className="w-12 h-12 rounded-lg object-cover"
                style={{ width: '48px', height: '48px' }}
              />
              <h1 className="text-xl font-black tracking-wider text-white uppercase" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>YETI</h1>
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/app" className="text-white hover:text-blue-400 transition-colors">
                Trade
              </Link>
              <Link href="/docs" className="text-white hover:text-blue-400 transition-colors">
                Docs
              </Link>
              <Link href="/app" className="text-white hover:text-blue-400 transition-colors">
                Dashboard
              </Link>
            </nav>
            
            <Link 
              href="/app"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
            >
              Launch App
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center justify-between min-h-[calc(100vh-200px)] py-12">
          {/* Left Content */}
          <div className="lg:w-1/2 text-left mb-12 lg:mb-0">
            <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight tracking-wide">
              Trade DeFi like a <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent font-black tracking-wide">YETI</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-lg">
              Climb higher with our powerful DeFi trading platform. Connect TradingView alerts to automated limit orders on 1inch.
            </p>
            
            <Link 
              href="/app"
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 inline-block"
            >
              Start Climbing
            </Link>
          </div>
          
          {/* Right Hero Image */}
          <div className="lg:w-1/2 flex justify-center">
            <div className="relative">
              <div className="w-96 h-96 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                <img 
                  src="/hero-yeti.png" 
                  alt="Yeti Hero" 
                  className="w-80 h-80 object-contain"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="max-w-6xl mx-auto mt-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 backdrop-blur-sm hover:bg-gray-800/70 transition-all duration-200">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Best 1inch rates</h3>
              <p className="text-gray-400">
                Optimize your trades for minimal slippage with aggregated DEX liquidity
              </p>
            </div>
            
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 backdrop-blur-sm hover:bg-gray-800/70 transition-all duration-200">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Gas savings</h3>
              <p className="text-gray-400">
                Reduce costs with gas-efficient transactions on Base network
              </p>
            </div>
            
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 backdrop-blur-sm hover:bg-gray-800/70 transition-all duration-200">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Aggregated liquidity</h3>
              <p className="text-gray-400">
                Get access to deep liquidity from multiple sources across Base ecosystem
              </p>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="max-w-4xl mx-auto mt-20">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Set Limit Order</h3>
              <p className="text-gray-400">Choose your trading pair and set your desired price and amount</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Connect TradingView</h3>
              <p className="text-gray-400">Copy the webhook URL to your TradingView alert settings</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Auto Execute</h3>
              <p className="text-gray-400">Your orders execute automatically when alerts trigger</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
