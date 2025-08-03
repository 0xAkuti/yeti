'use client';

import { useState } from 'react';
import { TradingInterface } from '@/components/TradingInterface';
import { Dashboard } from '@/components/Dashboard';
import { PrivyGuard } from '@/components/PrivyGuard';
import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { Footer } from '@/components/Footer';
import Link from 'next/link';

type AppTab = 'order' | 'dashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('order');

  // Handle navigation from TradingInterface
  const handleNavigateToDashboard = () => {
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <BackgroundWrapper>
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
              <div className="flex items-center space-x-6">
                <nav className="flex items-center space-x-4">
                  <button
                    onClick={() => setActiveTab('order')}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === 'order'
                        ? 'bg-gradient-to-r from-[#006e4e] to-[#008f6a] text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-black/20'
                    }`}
                  >
                    Create Order
                  </button>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === 'dashboard'
                        ? 'bg-gradient-to-r from-[#006e4e] to-[#008f6a] text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-black/20'
                    }`}
                  >
                    Dashboard
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 flex-1">
          <PrivyGuard>
            {activeTab === 'order' && (
              <div className="flex flex-col items-center justify-start min-h-[calc(100vh-300px)]">
                <div className="w-full flex flex-col items-center">
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-4">
                      Create Your <span className="text-[#00ff88]">YETI</span> Order
                    </h1>
                    <p className="text-gray-400">
                      Set up automated limit orders triggered by TradingView alerts
                    </p>
                  </div>
                  <div className="flex justify-center w-full">
                    <TradingInterface onNavigateToDashboard={handleNavigateToDashboard} />
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'dashboard' && (
              <div className="w-full">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-white mb-4">
                    Your <span className="text-[#00ff88]">YETI</span> Dashboard
                  </h1>
                  <p className="text-gray-400">
                    Monitor your active orders and trading performance
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="w-full max-w-6xl">
                    <Dashboard />
                  </div>
                </div>
              </div>
            )}
          </PrivyGuard>
        </main>
        
        <Footer />
      </BackgroundWrapper>
    </div>
  );
}