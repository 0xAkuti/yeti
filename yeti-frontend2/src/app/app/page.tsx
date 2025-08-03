'use client';

import { useState } from 'react';
import { TradingInterface } from '@/components/TradingInterface';
import { Dashboard } from '@/components/Dashboard';
import { PrivyGuard } from '@/components/PrivyGuard';
import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
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
        <motion.header 
          className="border-b border-[#006e4e]/30 bg-black/30 backdrop-blur-sm"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <motion.div 
                className="flex items-center space-x-3"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <motion.img 
                  src="/logo.png" 
                  alt="YETI Logo" 
                  className="w-12 h-12 rounded-lg object-cover"
                  style={{ width: '48px', height: '48px' }}
                  whileHover={{ 
                    scale: 1.1,
                    rotate: [0, -5, 5, 0],
                    transition: { duration: 0.3 }
                  }}
                />
                <Link href="/" className="text-xl font-black tracking-wider text-white uppercase" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  YETI
                </Link>
              </motion.div>
              
              {/* Navigation */}
              <motion.div 
                className="flex items-center space-x-6"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <nav className="flex items-center space-x-4">
                  <motion.button
                    onClick={() => setActiveTab('order')}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === 'order'
                        ? 'bg-gradient-to-r from-[#006e4e] to-[#008f6a] text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-black/20'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    Create Order
                  </motion.button>
                  <motion.button
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === 'dashboard'
                        ? 'bg-gradient-to-r from-[#006e4e] to-[#008f6a] text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-black/20'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    Dashboard
                  </motion.button>
                </nav>
              </motion.div>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 flex-1">
          <PrivyGuard>
            {activeTab === 'order' && (
              <motion.div 
                className="flex flex-col items-center justify-start min-h-[calc(100vh-300px)]"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                key="order-tab"
              >
                <div className="w-full flex flex-col items-center">
                  <motion.div 
                    className="text-center mb-8"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <motion.h1 
                      className="text-3xl font-bold text-white mb-4"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                    >
                      Create Your <motion.span 
                        className="text-[#00ff88]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        whileHover={{
                          textShadow: "0px 0px 20px rgba(0, 255, 136, 0.8)",
                          transition: { duration: 0.2 }
                        }}
                      >
                        YETI
                      </motion.span> Order
                    </motion.h1>
                    <motion.p 
                      className="text-gray-400"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.7 }}
                    >
                      Set up automated limit orders triggered by TradingView alerts
                    </motion.p>
                  </motion.div>
                  <motion.div 
                    className="flex justify-center w-full"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  >
                    <TradingInterface onNavigateToDashboard={handleNavigateToDashboard} />
                  </motion.div>
                </div>
              </motion.div>
            )}
            
            {activeTab === 'dashboard' && (
              <motion.div 
                className="w-full"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                key="dashboard-tab"
              >
                <motion.div 
                  className="text-center mb-8"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <motion.h1 
                    className="text-3xl font-bold text-white mb-4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    Your <motion.span 
                      className="text-[#00ff88]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                      whileHover={{
                        textShadow: "0px 0px 20px rgba(0, 255, 136, 0.8)",
                        transition: { duration: 0.2 }
                      }}
                    >
                      YETI
                    </motion.span> Dashboard
                  </motion.h1>
                  <motion.p 
                    className="text-gray-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                  >
                    Monitor your active orders and trading performance
                  </motion.p>
                </motion.div>
                <motion.div 
                  className="flex justify-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  <div className="w-full max-w-6xl">
                    <Dashboard />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </PrivyGuard>
        </main>
        
        <Footer />
      </BackgroundWrapper>
    </div>
  );
}