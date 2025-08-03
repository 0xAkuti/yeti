import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function DocsPage() {
  return (
    <BackgroundWrapper>
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-wide">
              How to use <span className="text-[#00ff88] relative">
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00ff88]/20 to-transparent animate-shine"></span>
                <span className="relative z-10 drop-shadow-[0_0_8px_#00ff88]">YETI</span>
              </span>?
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Get started with automated DeFi trading in just a few simple steps
            </p>
          </div>

          {/* Create your limit order */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-[#006e4e] to-[#008f6a] rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              Create your limit order
            </h2>
            <div className="bg-gradient-to-br from-black/40 to-black/20 p-8 rounded-xl border border-[#006e4e]/30 backdrop-blur-sm shadow-2xl">
              <div className="space-y-8">
                <div className="flex items-start space-x-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#006e4e] to-[#008f6a] rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Launch App</h3>
                    <p className="text-gray-400">Click the "Launch App" button to access the trading interface</p>
                  </div>
                </div>

                <div className="flex items-start space-x-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#006e4e] to-[#008f6a] rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Connect your wallet</h3>
                    <p className="text-gray-400">Connect your Web3 wallet securely to start trading</p>
                  </div>
                </div>

                <div className="flex items-start space-x-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#006e4e] to-[#008f6a] rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Configure your trade</h3>
                    <p className="text-gray-400">Choose your trading pair, set the price, specify the amount you want to trade, and set expiry time</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Automate on TradingView */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-[#006e4e] to-[#008f6a] rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              Automate on TradingView
            </h2>
            <div className="bg-gradient-to-br from-black/40 to-black/20 p-8 rounded-xl border border-[#006e4e]/30 backdrop-blur-sm shadow-2xl">
              <div className="space-y-8">
                <div className="flex items-start space-x-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#006e4e] to-[#008f6a] rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Copy your webhook URL</h3>
                    <p className="text-gray-400">After creating your order, you'll receive a unique webhook URL. Copy this for the next step</p>
                  </div>
                </div>

                <div className="flex items-start space-x-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#006e4e] to-[#008f6a] rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Set up TradingView alert</h3>
                    <p className="text-gray-400">In TradingView, create an alert for your Pine Script strategy. Set the alert action to "Webhook URL" and paste your YETI webhook URL</p>
                  </div>
                </div>

                <div className="flex items-start space-x-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#006e4e] to-[#008f6a] rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Trade like a YETI</h3>
                    <p className="text-gray-400">Sit back and relax, let your trades execute automatically like a true YETI master</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Pro Tips Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-[#006e4e] to-[#008f6a] rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              Pro Tips
            </h2>
            <div className="bg-gradient-to-br from-black/40 to-black/20 p-8 rounded-xl border border-[#006e4e]/30 backdrop-blur-sm shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Security Best Practices</h3>
                  <ul className="space-y-2 text-gray-400">
                    <li className="flex items-start space-x-2">
                      <span className="text-[#00ff88] font-bold">•</span>
                      <span>Always verify smart contract addresses</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-[#00ff88] font-bold">•</span>
                      <span>Start with small amounts to test</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-[#00ff88] font-bold">•</span>
                      <span>Set reasonable expiry times</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Trading Tips</h3>
                  <ul className="space-y-2 text-gray-400">
                    <li className="flex items-start space-x-2">
                      <span className="text-[#00ff88] font-bold">•</span>
                      <span>Monitor gas fees during execution</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-[#00ff88] font-bold">•</span>
                      <span>Check liquidity for your trading pairs</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-[#00ff88] font-bold">•</span>
                      <span>Use the dashboard to track active orders</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </BackgroundWrapper>
  );
} 