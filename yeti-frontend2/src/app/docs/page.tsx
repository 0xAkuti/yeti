'use client';

import { BackgroundWrapper } from '@/components/BackgroundWrapper';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';

export default function DocsPage() {
  return (
    <BackgroundWrapper>
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <motion.div 
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Page Header */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.h1 
              className="text-4xl md:text-5xl font-black text-white mb-6 tracking-wide"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              How to use <motion.span 
                className="text-[#00ff88] relative"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                whileHover={{
                  scale: 1.1,
                  textShadow: "0px 0px 20px rgba(0, 255, 136, 0.8)",
                  transition: { duration: 0.2 }
                }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00ff88]/20 to-transparent animate-shine"></span>
                <span className="relative z-10 drop-shadow-[0_0_8px_#00ff88]">YETI</span>
              </motion.span>?
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-300 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              Get started with automated DeFi trading in just a few simple steps
            </motion.p>
          </motion.div>

          {/* Create your limit order */}
          <motion.section 
            className="mb-16"
            initial={{ opacity: 0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.h2 
              className="text-3xl font-bold text-white mb-8 flex items-center"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.div 
                className="w-10 h-10 bg-gradient-to-br from-[#006e4e] to-[#008f6a] rounded-lg flex items-center justify-center mr-4"
                whileHover={{ 
                  scale: 1.1,
                  rotate: 90,
                  transition: { duration: 0.3 }
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </motion.div>
              Create your limit order
            </motion.h2>
            <motion.div 
              className="bg-gradient-to-br from-black/40 to-black/20 p-8 rounded-xl border border-[#006e4e]/30 backdrop-blur-sm shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ 
                borderColor: "rgba(0, 255, 136, 0.4)",
                transition: { duration: 0.3 }
              }}
            >
              <div className="space-y-8">
                <motion.div 
                  className="flex items-start space-x-6"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <motion.div 
                    className="w-10 h-10 bg-gradient-to-br from-[#006e4e] to-[#008f6a] rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg"
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ duration: 0.3 }}
                  >
                    1
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Launch App</h3>
                    <p className="text-gray-400">Click the "Launch App" button to access the trading interface</p>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex items-start space-x-6"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <motion.div 
                    className="w-10 h-10 bg-gradient-to-br from-[#006e4e] to-[#008f6a] rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg"
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ duration: 0.3 }}
                  >
                    2
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Connect your wallet</h3>
                    <p className="text-gray-400">Connect your Web3 wallet securely to start trading</p>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex items-start space-x-6"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 1.0 }}
                >
                  <motion.div 
                    className="w-10 h-10 bg-gradient-to-br from-[#006e4e] to-[#008f6a] rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg"
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ duration: 0.3 }}
                  >
                    3
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Configure your trade</h3>
                    <p className="text-gray-400">Choose your trading pair, set the price, specify the amount you want to trade, and set expiry time</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.section>

          {/* Automate on TradingView */}
          <motion.section 
            className="mb-16"
            initial={{ opacity: 0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.h2 
              className="text-3xl font-bold text-white mb-8 flex items-center"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.div 
                className="w-10 h-10 bg-gradient-to-br from-[#006e4e] to-[#008f6a] rounded-lg flex items-center justify-center mr-4"
                whileHover={{ 
                  scale: 1.1,
                  rotate: [0, -10, 10, 0],
                  transition: { duration: 0.5 }
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </motion.div>
              Automate on TradingView
            </motion.h2>
            <motion.div 
              className="bg-gradient-to-br from-black/40 to-black/20 p-8 rounded-xl border border-[#006e4e]/30 backdrop-blur-sm shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ 
                borderColor: "rgba(0, 255, 136, 0.4)",
                transition: { duration: 0.3 }
              }}
            >
              <div className="space-y-8">
                <motion.div 
                  className="flex items-start space-x-6"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <motion.div 
                    className="w-10 h-10 bg-gradient-to-br from-[#006e4e] to-[#008f6a] rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg"
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ duration: 0.3 }}
                  >
                    1
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Copy your webhook URL</h3>
                    <p className="text-gray-400">After creating your order, you'll receive a unique webhook URL. Copy this for the next step</p>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex items-start space-x-6"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <motion.div 
                    className="w-10 h-10 bg-gradient-to-br from-[#006e4e] to-[#008f6a] rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg"
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ duration: 0.3 }}
                  >
                    2
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Set up TradingView alert</h3>
                    <p className="text-gray-400">In TradingView, create an alert for your Pine Script strategy. Set the alert action to "Webhook URL" and paste your YETI webhook URL</p>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex items-start space-x-6"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 1.0 }}
                >
                  <motion.div 
                    className="w-10 h-10 bg-gradient-to-br from-[#006e4e] to-[#008f6a] rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg"
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ duration: 0.3 }}
                  >
                    3
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Trade like a YETI</h3>
                    <p className="text-gray-400">Sit back and relax, let your trades execute automatically like a true YETI master</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.section>

          {/* Pro Tips Section */}
          <motion.section 
            className="mb-16"
            initial={{ opacity: 0, y: 80 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.h2 
              className="text-3xl font-bold text-white mb-8 flex items-center"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.div 
                className="w-10 h-10 bg-gradient-to-br from-[#006e4e] to-[#008f6a] rounded-lg flex items-center justify-center mr-4"
                whileHover={{ 
                  scale: 1.1,
                  rotateY: 180,
                  transition: { duration: 0.6 }
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </motion.div>
              Pro Tips
            </motion.h2>
            <motion.div 
              className="bg-gradient-to-br from-black/40 to-black/20 p-8 rounded-xl border border-[#006e4e]/30 backdrop-blur-sm shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ 
                borderColor: "rgba(0, 255, 136, 0.4)",
                transition: { duration: 0.3 }
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div 
                  className="space-y-4"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <h3 className="text-lg font-semibold text-white">Security Best Practices</h3>
                  <ul className="space-y-2 text-gray-400">
                    <motion.li 
                      className="flex items-start space-x-2"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.8 }}
                    >
                      <span className="text-[#00ff88] font-bold">•</span>
                      <span>Always verify smart contract addresses</span>
                    </motion.li>
                    <motion.li 
                      className="flex items-start space-x-2"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.9 }}
                    >
                      <span className="text-[#00ff88] font-bold">•</span>
                      <span>Start with small amounts to test</span>
                    </motion.li>
                    <motion.li 
                      className="flex items-start space-x-2"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 1.0 }}
                    >
                      <span className="text-[#00ff88] font-bold">•</span>
                      <span>Set reasonable expiry times</span>
                    </motion.li>
                  </ul>
                </motion.div>
                <motion.div 
                  className="space-y-4"
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <h3 className="text-lg font-semibold text-white">Trading Tips</h3>
                  <ul className="space-y-2 text-gray-400">
                    <motion.li 
                      className="flex items-start space-x-2"
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.8 }}
                    >
                      <span className="text-[#00ff88] font-bold">•</span>
                      <span>Monitor gas fees during execution</span>
                    </motion.li>
                    <motion.li 
                      className="flex items-start space-x-2"
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.9 }}
                    >
                      <span className="text-[#00ff88] font-bold">•</span>
                      <span>Check liquidity for your trading pairs</span>
                    </motion.li>
                    <motion.li 
                      className="flex items-start space-x-2"
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 1.0 }}
                    >
                      <span className="text-[#00ff88] font-bold">•</span>
                      <span>Use the dashboard to track active orders</span>
                    </motion.li>
                  </ul>
                </motion.div>
              </div>
            </motion.div>
          </motion.section>
        </motion.div>
      </main>

      <Footer />
    </BackgroundWrapper>
  );
} 