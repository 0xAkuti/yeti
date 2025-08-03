import { WebhookInfo } from './types.js';

export class WebhookManager {
    private webhookServerUrl: string;

    constructor(webhookServerUrl: string) {
        this.webhookServerUrl = webhookServerUrl;
    }

    async createWebhook(): Promise<WebhookInfo> {
        // Check webhook server is running
        try {
            const healthUrl = `${this.webhookServerUrl}/health`;
            const response = await fetch(healthUrl);
            if (!response.ok) throw new Error('Webhook server not responding');
        } catch (error) {
            throw new Error(`Webhook server not running at ${this.webhookServerUrl}`);
        }

        // Create webhook through the API
        try {
            const createWebhookUrl = `${this.webhookServerUrl}/create-webhook`;
            const response = await fetch(createWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to create webhook: ${response.statusText}`);
            }
            
            const webhookData = await response.json();
            const webhookId = webhookData.webhook_id;
            const alertId = '0x' + webhookId.replace(/-/g, '');
            
            return {
                webhookId,
                alertId,
                webhookUrl: `${this.webhookServerUrl}${webhookData.webhook_url}`,
                secret: webhookData.secret,
                buyMessage: webhookData.buy_message,
                sellMessage: webhookData.sell_message
            };
        } catch (error) {
            throw new Error(`Failed to create webhook: ${error}`);
        }
    }

    generateTradingViewSetup(webhookInfo: WebhookInfo, action: 'LONG' | 'SHORT' = 'LONG'): string {
        const message = action === 'LONG' ? webhookInfo.buyMessage : webhookInfo.sellMessage;
        
        return `
TradingView Alert Setup:
========================

1. Create a new alert in TradingView
2. Set the webhook URL to:
   ${webhookInfo.webhookUrl}

3. Set the alert message to:
   ${message}

   💡 This simple format replaces the old JSON:
   ✅ New: ${action.toLowerCase()}_secrethere (simple string)
   ❌ Old: {"action": "${action}", "secret": "secrethere"} (JSON)

4. Configure your alert condition and save
5. The order will execute automatically when the alert fires

📋 For manual testing, you can also use:
   GET ${webhookInfo.webhookUrl}/testing/${action.toLowerCase()}

Alert ID: ${webhookInfo.alertId}
Webhook ID: ${webhookInfo.webhookId}
Secret: ${webhookInfo.secret}
        `.trim();
    }
}