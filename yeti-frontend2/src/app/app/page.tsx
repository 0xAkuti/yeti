import { TradingInterface } from '@/components/TradingInterface';
import { PrivyGuard } from '@/components/PrivyGuard';
import Link from 'next/link';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Y</span>
              </div>
              <h1 className="text-xl font-bold text-white">Yeti DEX</h1>
            </Link>
            <div className="text-sm text-gray-400">
              TradingView Triggered Limit Orders
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="w-full max-w-md">
            <PrivyGuard>
              <TradingInterface />
            </PrivyGuard>
          </div>
          
          {/* Info Section */}
          <div className="mt-8 text-center max-w-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">
              Connect TradingView to DeFi
            </h2>
            <p className="text-gray-400 mb-6">
              Create limit orders that execute automatically when your TradingView alerts trigger. 
              Perfect for automated trading strategies on Base network.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                <div className="text-blue-400 font-semibold mb-2">1. Set Limit Order</div>
                <div className="text-gray-300">Choose your assets and amount</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                <div className="text-blue-400 font-semibold mb-2">2. Connect TradingView</div>
                <div className="text-gray-300">Copy webhook URL to your alerts</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                <div className="text-blue-400 font-semibold mb-2">3. Auto Execute</div>
                <div className="text-gray-300">Orders fill when alerts trigger</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}