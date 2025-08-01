'use client';

import { useState } from 'react';
import { Copy, X, Check, ExternalLink } from 'lucide-react';

interface TradingViewSetupProps {
  isOpen: boolean;
  onClose: () => void;
  orderResult?: {
    webhook: {
      webhookUrl: string;
      webhookId: string;
      alertId: string;
      secret: string;
      buyMessage: string;
      sellMessage: string;
    };
    tradingViewSetup: string;
    orderHash: string;
  };
}

export function TradingViewSetup({ 
  isOpen, 
  onClose,
  orderResult
}: TradingViewSetupProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  // Use real webhook data if available, otherwise show defaults
  const webhookUrl = orderResult?.webhook?.webhookUrl || 'https://your-webhook-url.com/webhook/abc123';
  const alertMessage = orderResult?.webhook?.buyMessage || '{"action": "LONG", "symbol": "{{ticker}}", "price": "{{close}}"}';
  const orderHash = orderResult?.orderHash || 'Order not created yet';

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">TradingView Setup</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Success Message */}
          <div className="bg-green-900/20 border border-green-800 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <Check className="text-green-400" size={20} />
              <span className="text-green-200 font-semibold">
                {orderResult ? 'Limit Order Created & Signed!' : 'Setup TradingView Alert'}
              </span>
            </div>
            <p className="text-green-300 text-sm mt-1">
              {orderResult 
                ? 'Your limit order has been signed and stored. Follow the steps below to connect it to TradingView.'
                : 'Follow the steps below to set up your TradingView alert.'
              }
            </p>
            {orderResult && (
              <div className="mt-2 text-xs text-green-400 font-mono break-all">
                Order Hash: {orderHash}
              </div>
            )}
          </div>

          {/* Step 1: Webhook URL */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-white">Copy Webhook URL</h3>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-300">Webhook URL</label>
                <button
                  onClick={() => copyToClipboard(webhookUrl, 'url')}
                  className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
                >
                  {copiedField === 'url' ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedField === 'url' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <code className="text-blue-200 text-sm break-all">{webhookUrl}</code>
            </div>
          </div>

          {/* Step 2: Alert Message */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold text-white">Copy Alert Message</h3>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-300">Message Body</label>
                <button
                  onClick={() => copyToClipboard(alertMessage, 'message')}
                  className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
                >
                  {copiedField === 'message' ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedField === 'message' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <code className="text-blue-200 text-sm break-all font-mono">
                {alertMessage}
              </code>
            </div>
          </div>

          {/* Step 3: TradingView Instructions */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold text-white">Setup TradingView Alert</h3>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4 space-y-3">
              <ol className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-400 font-bold">1.</span>
                  <span>Open TradingView and navigate to your chart</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-400 font-bold">2.</span>
                  <span>Click the "Alert" button (bell icon) or press Alt + A</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-400 font-bold">3.</span>
                  <span>Set your alert condition (price level, indicator, etc.)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-400 font-bold">4.</span>
                  <span>In the "Notifications" tab, enable "Webhook URL"</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-400 font-bold">5.</span>
                  <span>Paste the webhook URL from step 1</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-400 font-bold">6.</span>
                  <span>Paste the alert message from step 2</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-400 font-bold">7.</span>
                  <span>Click "Create" to activate your alert</span>
                </li>
              </ol>
              
              <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-gray-600">
                <ExternalLink size={16} className="text-blue-400" />
                <a 
                  href="https://www.tradingview.com/chart/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Open TradingView
                </a>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-4">
            <h4 className="text-yellow-200 font-semibold mb-2">⚠️ Important Notes</h4>
            <ul className="text-yellow-300 text-sm space-y-1">
              <li>• Your limit order will execute automatically when the alert triggers</li>
              <li>• Make sure you have sufficient balance in connected wallet</li>
              <li>• Test with small amounts first to verify the setup works</li>
              <li>• Keep this tab open until your alert is properly configured</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}