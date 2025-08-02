import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { Header } from '@/components/Header';

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
    </BackgroundWrapper>
  );
} 