'use client';

import { useState } from 'react';
import { TradingInterface } from '@/components/TradingInterface';
import { Dashboard } from '@/components/Dashboard';
import { PrivyGuard } from '@/components/PrivyGuard';
import Link from 'next/link';

type AppTab = 'order' | 'dashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('order');

  // Handle navigation from TradingInterface
  const handleNavigateToDashboard = () => {
    setActiveTab('dashboard');
  };

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
            
            {/* Navigation */}
            <div className="flex items-center space-x-6">
              <nav className="flex items-center space-x-4">
                <button
                  onClick={() => setActiveTab('order')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'order'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  Order
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'dashboard'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
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
    </div>
  );
}