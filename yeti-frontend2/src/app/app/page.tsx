'use client';

import { useState } from 'react';
import { TradingInterface } from '@/components/TradingInterface';
import { Dashboard } from '@/components/Dashboard';
import { PrivyGuard } from '@/components/PrivyGuard';
import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import Link from 'next/link';

type AppTab = 'order' | 'dashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('order');

  // Handle navigation from TradingInterface
  const handleNavigateToDashboard = () => {
    setActiveTab('dashboard');
  };

  return (
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
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'order'
                      ? 'bg-[#006e4e] text-white'
                      : 'text-gray-300 hover:text-white hover:bg-black/20'
                  }`}
                >
                  Order
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'dashboard'
                      ? 'bg-[#006e4e] text-white'
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
      <main className="container mx-auto px-4 py-8">
        <PrivyGuard>
          {activeTab === 'order' && (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
              <div className="w-full max-w-md">
                <TradingInterface onNavigateToDashboard={handleNavigateToDashboard} />
              </div>
            </div>
          )}
          
          {activeTab === 'dashboard' && (
            <Dashboard />
          )}
        </PrivyGuard>
      </main>
    </BackgroundWrapper>
  );
}