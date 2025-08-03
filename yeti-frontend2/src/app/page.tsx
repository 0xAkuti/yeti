'use client';

import Link from 'next/link';
import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <BackgroundWrapper>
      <Header />

      {/* Hero Section */}
      <main className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center justify-center min-h-[calc(100vh-200px)] py-12">
          {/* Left Content - Logo Icon */}
          <motion.div 
            className="lg:w-1/2 flex justify-center mb-12 lg:mb-0"
            initial={{ opacity: 0, x: -100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ 
              duration: 1.2, 
              ease: [0.25, 0.46, 0.45, 0.94],
              scale: { 
                type: "spring", 
                stiffness: 100, 
                damping: 15 
              }
            }}
          >
            <div className="relative">
              <motion.img 
                src="/logo.png" 
                alt="YETI Logo" 
                className="w-96 h-96 object-contain drop-shadow-2xl"
                style={{
                  filter: 'drop-shadow(0 25px 50px rgba(0, 110, 78, 0.4)) drop-shadow(0 15px 30px rgba(0, 255, 136, 0.2)) drop-shadow(0 5px 15px rgba(0, 0, 0, 0.3))'
                }}
                whileHover={{ 
                  scale: 1.05,
                  rotate: [0, -2, 2, 0],
                  transition: { duration: 0.3 }
                }}
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  y: {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              />
              {/* Floating particles with motion */}
              <motion.div 
                className="absolute -top-4 -right-4 w-3 h-3 bg-[#00ff88] rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.7, 1, 0.7],
                  y: [0, -20, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0
                }}
              />
              <motion.div 
                className="absolute top-1/4 -left-6 w-2 h-2 bg-[#006e4e] rounded-full"
                animate={{
                  scale: [1, 1.8, 1],
                  opacity: [0.5, 1, 0.5],
                  x: [-5, 5, -5],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              />
              <motion.div 
                className="absolute bottom-1/4 -right-8 w-4 h-4 bg-[#00ff88]/50 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.8, 0.3],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 2
                }}
              />
            </div>
          </motion.div>
          
          {/* Right Content - Text and Button */}
          <motion.div 
            className="lg:w-1/2 text-left lg:pl-12"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
          >
            <motion.h1 
              className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight tracking-wide"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Trade DeFi like a{' '}
              <motion.span 
                className="text-[#00ff88] relative inline-block"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  duration: 0.8, 
                  delay: 1.2,
                  type: "spring",
                  stiffness: 200
                }}
                whileHover={{
                  scale: 1.1,
                  textShadow: "0px 0px 20px rgba(0, 255, 136, 0.8)",
                  transition: { duration: 0.2 }
                }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00ff88]/40 to-transparent animate-shine"></span>
                <span className="absolute inset-0 bg-gradient-to-r from-[#00ff88]/20 via-[#00ff88]/60 via-[#00ff88]/20 to-transparent animate-shine-delayed"></span>
                <span className="relative z-10 drop-shadow-[0_0_10px_#00ff88]">YETI</span>
              </motion.span>
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-300 mb-8 max-w-lg leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              Transform your TradingView strategies into automated DeFi trades.
              <br />
              Connect alerts to secure, on-chain limit orders powered by 1inch.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.5 }}
            >
              <motion.div
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 20px 40px rgba(0, 110, 78, 0.4)"
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Link 
                  href="/app"
                  className="bg-gradient-to-r from-[#006e4e] to-[#008f6a] hover:from-[#005a42] hover:to-[#007055] text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-200 inline-block shadow-lg text-center"
                >
                  Start Trading
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ 
                  scale: 1.05,
                  borderColor: "#00ff88",
                  color: "#00ff88"
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Link 
                  href="/docs"
                  className="border-2 border-[#006e4e] text-[#006e4e] hover:bg-[#006e4e] hover:text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-200 inline-block text-center"
                >
                  Learn How
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Why TradingView Section */}
        <motion.div 
          className="max-w-4xl mx-auto mt-20"
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-white mb-8 text-center"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Your TradingView, Supercharged
          </motion.h2>
          <motion.div 
            className="bg-gradient-to-br from-black/40 to-black/20 p-8 rounded-xl border border-[#006e4e]/30 backdrop-blur-sm shadow-2xl"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ 
              scale: 1.02,
              borderColor: "rgba(0, 255, 136, 0.5)",
              transition: { duration: 0.3 }
            }}
          >
            <motion.p 
              className="text-xl text-gray-300 text-center leading-relaxed"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Keep using the strategies and indicators you already know and love. YETI bridges your TradingView alerts 
              to the DeFi world, giving you unlimited flexibility beyond simple DCA, TWAP, or grid trading bots.
            </motion.p>
          </motion.div>
        </motion.div>

        {/* Features Section */}
        <motion.div 
          className="max-w-6xl mx-auto mt-20 mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-white mb-8 text-center"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Built for Serious Traders
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              className="bg-gradient-to-br from-black/40 to-black/20 p-6 rounded-xl border border-[#006e4e]/30 backdrop-blur-sm shadow-xl group"
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ 
                scale: 1.05,
                borderColor: "rgba(0, 255, 136, 0.5)",
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                transition: { duration: 0.3 }
              }}
            >
              <motion.div 
                className="w-12 h-12 bg-gradient-to-br from-[#006e4e] to-[#008f6a] rounded-lg flex items-center justify-center mb-4"
                whileHover={{ 
                  scale: 1.2,
                  rotate: 360,
                  transition: { duration: 0.4 }
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-3">Non-Custodial Security</h3>
              <p className="text-gray-400">
                Your funds never leave your wallet. All trades execute through audited smart contracts with cryptographic verification.
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-gradient-to-br from-black/40 to-black/20 p-6 rounded-xl border border-[#006e4e]/30 backdrop-blur-sm shadow-xl group"
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
              whileHover={{ 
                scale: 1.05,
                borderColor: "rgba(0, 255, 136, 0.5)",
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                transition: { duration: 0.3 }
              }}
            >
              <motion.div 
                className="w-12 h-12 bg-gradient-to-br from-[#006e4e] to-[#008f6a] rounded-lg flex items-center justify-center mb-4"
                whileHover={{ 
                  scale: 1.2,
                  rotate: 360,
                  transition: { duration: 0.4 }
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-3">Professional Grade</h3>
              <p className="text-gray-400">
                Execute complex strategies with institutional-level precision. No API rate limits or server downtime.
              </p>
            </motion.div>
            
            <motion.div 
              className="bg-gradient-to-br from-black/40 to-black/20 p-6 rounded-xl border border-[#006e4e]/30 backdrop-blur-sm shadow-xl group"
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.8 }}
              whileHover={{ 
                scale: 1.05,
                borderColor: "rgba(0, 255, 136, 0.5)",
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                transition: { duration: 0.3 }
              }}
            >
              <motion.div 
                className="w-12 h-12 bg-gradient-to-br from-[#006e4e] to-[#008f6a] rounded-lg flex items-center justify-center mb-4"
                whileHover={{ 
                  scale: 1.2,
                  rotate: 360,
                  transition: { duration: 0.4 }
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-3">Open & Verifiable</h3>
              <p className="text-gray-400">
                Every trade is recorded on-chain with full transparency. Verify execution, audit smart contracts, track performance.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </main>
      
      <Footer />
    </BackgroundWrapper>
  );
}
