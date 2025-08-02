import Link from 'next/link';

export default function DocsPage() {
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
              <Link href="/docs" className="text-[#006e4e] font-medium">
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-wide">
              How to use <span className="text-[#006e4e]">YETI</span>?
            </h1>
          </div>

          {/* Create your limit order */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8">Create your limit order</h2>
            <div className="bg-black/30 p-8 rounded-xl border border-[#006e4e]/30 backdrop-blur-sm">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[#006e4e] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Launch App</h3>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[#006e4e] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Connect your wallet</h3>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[#006e4e] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Choose your trading pair, set the price, and specify the amount you want to trade, and time of expiry.</h3>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Automate on TradingView */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8">Automate on TradingView</h2>
            <div className="bg-black/30 p-8 rounded-xl border border-[#006e4e]/30 backdrop-blur-sm">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[#006e4e] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">After creating your order, you'll receive a unique webhook URL. Copy this.</h3>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[#006e4e] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">In TradingView, create an alert for your Pine Script strategy. Set the alert action to "Webhook URL" and paste your YETI webhook URL.</h3>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-[#006e4e] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Sit back and relax, let your trades execute automatically like a true YETI master.</h3>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
} 