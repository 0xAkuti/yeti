import Link from 'next/link';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
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
              <Link href="/app" className="text-white hover:text-blue-400 transition-colors">
                Trade
              </Link>
              <Link href="/docs" className="text-blue-400 font-medium">
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-wide">
              YETI <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Documentation</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Learn how to connect your TradingView alerts to automated DeFi trading on Base network
            </p>
          </div>

          {/* Quick Start */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8">Quick Start Guide</h2>
            <div className="bg-gray-800/50 p-8 rounded-xl border border-gray-700">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
                    <p className="text-gray-300 mb-4">
                      Connect your Web3 wallet (MetaMask, WalletConnect, etc.) to the YETI platform. Make sure you have some ETH on Base network for gas fees.
                    </p>
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                      <code className="text-blue-400 text-sm">
                        Network: Base<br/>
                        Chain ID: 8453<br/>
                        RPC URL: https://mainnet.base.org
                      </code>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Create a Limit Order</h3>
                    <p className="text-gray-300 mb-4">
                      Navigate to the trading interface and set up your limit order. Choose your trading pair, set the price, and specify the amount you want to trade.
                    </p>
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                      <code className="text-blue-400 text-sm">
                        Example: Buy 100 USDC worth of ETH at $2,000
                      </code>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Get Your Webhook URL</h3>
                    <p className="text-gray-300 mb-4">
                      After creating your order, you'll receive a unique webhook URL. Copy this URL - you'll need it for your TradingView alert.
                    </p>
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                      <code className="text-blue-400 text-sm">
                        https://webhook.yeti.com/execute/abc123...
                      </code>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">
                    4
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Set Up TradingView Alert</h3>
                    <p className="text-gray-300 mb-4">
                      In TradingView, create an alert for your Pine Script strategy. Set the alert action to "Webhook URL" and paste your YETI webhook URL.
                    </p>
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                      <code className="text-blue-400 text-sm">
                        Alert Action: Webhook URL<br/>
                        URL: [Your YETI webhook URL]<br/>
                        Message: {"{}"}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Pine Script Integration */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8">Pine Script Integration</h2>
            <div className="bg-gray-800/50 p-8 rounded-xl border border-gray-700">
              <p className="text-gray-300 mb-6">
                YETI works seamlessly with TradingView's Pine Script alerts. Here's how to integrate your custom strategies:
              </p>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Basic Alert Setup</h3>
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <code className="text-blue-400 text-sm">
                      //@version=5<br/>
                      strategy("YETI Trading Strategy")<br/><br/>
                      
                      // Your strategy logic here<br/>
                      longCondition = crossover(sma(close, 20), sma(close, 50))<br/>
                      shortCondition = crossunder(sma(close, 20), sma(close, 50))<br/><br/>
                      
                      // Alert conditions<br/>
                      alertcondition(longCondition, title="Buy Signal", message="BUY")<br/>
                      alertcondition(shortCondition, title="Sell Signal", message="SELL")
                    </code>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Advanced Alert with Custom Data</h3>
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                                         <code className="text-blue-400 text-sm">
                       //@version=5<br/>
                       strategy("YETI Advanced Strategy")<br/><br/>
                       
                       // Custom variables<br/>
                       rsi = ta.rsi(close, 14)<br/>
                       volume = volume<br/><br/>
                       
                       // Complex condition<br/>
                       buySignal = rsi &lt; 30 and volume &gt; ta.sma(volume, 20) * 1.5<br/><br/>
                       
                       // Alert with custom message<br/>
                       alertcondition(buySignal, title="Volume RSI Buy", message="BUY:RSI:&#123;rsi&#125;:VOL:&#123;volume&#125;")
                     </code>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Security & Best Practices */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8">Security & Best Practices</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-4">🔒 Security</h3>
                <ul className="text-gray-300 space-y-2">
                  <li>• Webhook URLs are cryptographically signed</li>
                  <li>• Orders can only be executed by authorized alerts</li>
                  <li>• Non-custodial - you always control your funds</li>
                  <li>• All transactions are on-chain and verifiable</li>
                </ul>
              </div>
              
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-4">⚡ Best Practices</h3>
                <ul className="text-gray-300 space-y-2">
                  <li>• Test your strategy with small amounts first</li>
                  <li>• Set reasonable stop-losses and take-profits</li>
                  <li>• Monitor your webhook execution history</li>
                  <li>• Keep your TradingView alerts active</li>
                </ul>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center">
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-8 rounded-xl border border-blue-500/30">
              <h2 className="text-2xl font-bold text-white mb-4">Ready to Start Trading?</h2>
              <p className="text-gray-300 mb-6">
                Connect your TradingView alerts to automated DeFi trading today
              </p>
              <Link 
                href="/app"
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 inline-block"
              >
                Launch YETI App
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
} 