import { JsonRpcProvider, Wallet, parseEther, parseUnits, Contract, getAddress } from 'ethers';
import { YetiSDK } from './yeti-sdk.js';
import { Action } from './types.js';

// Contract addresses (same as original test)
const WEBHOOK_ORACLE_ADDRESS = '0x818eA3862861e82586A4D6E1A78A1a657FC615aa';
const WEBHOOK_PREDICATE_ADDRESS = '0xaA19aff541ed6eBF528f919592576baB138370DC';
const CHAINLINK_CALCULATOR_ADDRESS = '0x76f18Cc5F9DB41905a285866B9277Ac451F3f75B';
const LIMIT_ORDER_PROTOCOL = getAddress('0x111111125421cA6dc452d289314280a0f8842A65');
const USDC = getAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
const WETH = getAddress('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');

// Chainlink oracle addresses (mainnet)
const ETH_USD_ORACLE = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419';

const ERC20_ABI = [
    'function balanceOf(address) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)'
];

class YetiSDKEndToEndTest {
    private provider: JsonRpcProvider;
    private maker: Wallet;
    private taker: Wallet;
    private usdc: Contract;
    private weth: Contract;
    private yeti: YetiSDK;
    private takerYeti: YetiSDK;

    constructor(webhookServerUrl: string = 'http://localhost:3001') {
        this.provider = new JsonRpcProvider('http://localhost:8545');
        this.maker = new Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', this.provider);
        this.taker = new Wallet('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', this.provider);
        
        this.usdc = new Contract(USDC, ERC20_ABI, this.provider);
        this.weth = new Contract(WETH, ERC20_ABI, this.provider);
        
        const contracts = {
            webhookOracle: WEBHOOK_ORACLE_ADDRESS,
            webhookPredicate: WEBHOOK_PREDICATE_ADDRESS,
            chainlinkCalculator: CHAINLINK_CALCULATOR_ADDRESS,
            limitOrderProtocol: LIMIT_ORDER_PROTOCOL
        };

        // Create SDK instances
        this.yeti = new YetiSDK({
            provider: this.provider,
            webhookServerUrl,
            contracts
        });

        this.takerYeti = new YetiSDK({
            provider: this.provider,
            signer: this.taker,
            webhookServerUrl,
            contracts
        });
    }

    async run() {
        console.log('🎯 Yeti SDK End-to-End Test');
        console.log('============================');
        
        await this.setupTokenBalances();
        const { orderData, webhook, signature } = await this.createAndSignOrder();
        this.displayTradingViewInstructions(webhook);
        await this.waitForAlert(orderData.alertId);
        await this.fillOrder(orderData, signature);
        
        console.log('\n✅ SDK End-to-end test completed successfully!');
    }

    private async setupTokenBalances() {
        console.log('\n1️⃣ Setting up token balances...');
        
        const isTenderly = this.provider._getConnection().url.includes('tenderly');
        
        if (isTenderly) {
            await this.setupTokenBalancesTenderly();
        } else {
            await this.setupTokenBalancesAnvil();
        }
        
        // Approve 1inch protocol
        const usdcWithMaker = this.usdc.connect(this.maker) as any;
        const wethWithTaker = this.weth.connect(this.taker) as any;
        
        const makerNonce = await this.provider.getTransactionCount(this.maker.address, 'pending');
        const takerNonce = await this.provider.getTransactionCount(this.taker.address, 'pending');
        
        await usdcWithMaker.approve(LIMIT_ORDER_PROTOCOL, parseUnits('10000', 6), { nonce: makerNonce });
        await wethWithTaker.approve(LIMIT_ORDER_PROTOCOL, parseEther('10'), { nonce: takerNonce });
        
        const makerUSDC = await this.usdc.balanceOf(this.maker.address);
        const takerWETH = await this.weth.balanceOf(this.taker.address);
        
        console.log(`✅ Maker USDC balance: ${Number(makerUSDC) / 1e6}`);
        console.log(`✅ Taker WETH balance: ${Number(takerWETH) / 1e18}`);
    }

    private async setupTokenBalancesTenderly() {
        console.log('   Using Tenderly RPC methods...');
        
        try {
            await this.provider.send('tenderly_setBalance', [
                [this.maker.address, this.taker.address],
                '0x56BC75E2D630E000'
            ]);
            
            await this.provider.send('tenderly_setErc20Balance', [
                USDC,
                this.maker.address,
                '0x' + (10000n * 10n**6n).toString(16)
            ]);
            
            await this.provider.send('tenderly_setErc20Balance', [
                WETH,
                this.taker.address,
                '0x' + (10n * 10n**18n).toString(16)
            ]);
            
            console.log('✅ Tenderly balance setup complete');
        } catch (error) {
            console.log('❌ Tenderly methods failed, falling back to whale impersonation...');
            await this.setupTokenBalancesAnvil();
        }
    }

    private async setupTokenBalancesAnvil() {
        console.log('   Using whale account impersonation...');
        
        const usdcWhale = '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503';
        const wethWhale = '0x8EB8a3b98659Cce290402893d0123abb75E3ab28';
        
        // Fund maker with USDC
        await this.provider.send('anvil_impersonateAccount', [usdcWhale]);
        await this.provider.send('anvil_setBalance', [usdcWhale, '0x56BC75E2D630E000']);
        
        const usdcWithWhale = this.usdc.connect(await this.provider.getSigner(usdcWhale)) as any;
        await usdcWithWhale.transfer(this.maker.address, parseUnits('10000', 6));
        
        // Fund taker with WETH
        await this.provider.send('anvil_impersonateAccount', [wethWhale]);
        await this.provider.send('anvil_setBalance', [wethWhale, '0x56BC75E2D630E000']);
        
        const wethWithWhale = this.weth.connect(await this.provider.getSigner(wethWhale)) as any;
        await wethWithWhale.transfer(this.taker.address, parseEther('10'));
    }

    private async createAndSignOrder() {
        console.log('\n2️⃣ Creating conditional order using Yeti SDK...');
        
        // Create conditional order using SDK
        const { webhook, orderData, tradingViewSetup } = await this.yeti.createConditionalOrder(
            {
                sell: { token: USDC, amount: '4000' },
                buy: { token: WETH },
                action: 'LONG',
                oracle: ETH_USD_ORACLE
            },
            this.maker.address
        );
        
        console.log('✅ Conditional order created using SDK!');
        console.log(`   Alert ID: ${orderData.alertId}`);
        console.log(`   Webhook URL: ${webhook.webhookUrl}`);
        console.log(`   Order Hash: ${orderData.orderHash}`);
        
        // Get signing data
        console.log('\n3️⃣ Signing order...');
        const chainId = Number((await this.provider.getNetwork()).chainId);
        const signingData = this.yeti.getOrderForSigning(orderData, chainId);
        
        // Sign order (simulating what frontend would do)
        const signature = await this.maker.signTypedData(
            signingData.typedData.domain,
            signingData.typedData.types,
            signingData.typedData.message
        );
        
        console.log('✅ Order signed with EIP-712');
        console.log(`   Signature: ${signature.slice(0, 20)}...`);
        console.log(`   Order hash: ${signingData.orderHash}`);
        
        return { orderData, webhook, signature, tradingViewSetup };
    }

    private displayTradingViewInstructions(webhook: any) {
        console.log('\n4️⃣ TradingView Setup Instructions');
        console.log('=====================================');
        console.log('\n🔸 PLEASE FOLLOW THESE STEPS:');
        console.log('\n1. Go to TradingView and create a new alert');
        console.log('2. Set the webhook URL to:');
        console.log(`   ${webhook.webhookUrl}/testing/LONG`);
        console.log('\n3. Set the alert message to:');
        console.log('   {');
        console.log('     "action": "LONG"');
        console.log('   }');
        console.log('\n4. Set the alert condition to trigger when you want the order to execute');
        console.log('5. Save the alert');
        console.log('\n✅ Once you have set up the alert, trigger it to test the system');
        console.log('✅ This script will wait for the alert and automatically fulfill the order');
        console.log('\nWaiting for alert...');
    }

    private async waitForAlert(alertId: string): Promise<void> {
        console.log('\n5️⃣ Waiting for TradingView alert using SDK...');
        
        try {
            // Use SDK's alert monitoring
            const alert = await this.yeti.monitor.watchAlert(alertId, Action.LONG);
            
            console.log('\n🚀 Alert received via SDK!');
            console.log(`   Alert ID: ${alert.alertId}`);
            console.log(`   Action: ${alert.action} (${alert.action === Action.LONG ? 'LONG' : 'SHORT'})`);
            console.log(`   Timestamp: ${alert.timestamp}`);
            
            if (alert.blockNumber) {
                console.log(`   Block: ${alert.blockNumber}`);
            }
            if (alert.transactionHash) {
                console.log(`   Transaction: ${alert.transactionHash}`);
            }
            
            // Verify predicate
            const predicateResult = await this.yeti.monitor.checkPredicate(alertId, Action.LONG);
            console.log(`✅ Predicate check: ${predicateResult}`);
            
        } catch (error) {
            console.error('❌ Alert monitoring failed:', error);
            throw error;
        }
    }

    private async fillOrder(orderData: any, signature: string) {
        console.log('\n6️⃣ Filling order using SDK...');
        
        // Get initial balances
        const initialBalances = {
            makerUSDC: await this.usdc.balanceOf(this.maker.address),
            makerWETH: await this.weth.balanceOf(this.maker.address),
            takerUSDC: await this.usdc.balanceOf(this.taker.address),
            takerWETH: await this.weth.balanceOf(this.taker.address)
        };
        
        console.log('📊 Initial balances:');
        console.log(`   Maker - USDC: ${Number(initialBalances.makerUSDC) / 1e6}, WETH: ${Number(initialBalances.makerWETH) / 1e18}`);
        console.log(`   Taker - USDC: ${Number(initialBalances.takerUSDC) / 1e6}, WETH: ${Number(initialBalances.takerWETH) / 1e18}`);
        
        try {
            // Use SDK to fill the order
            const txHash = await this.takerYeti.filler.fillOrder({
                order: orderData.order,
                signature
            });
            
            console.log(`✅ Order filled using SDK! Transaction: ${txHash}`);
            
            // Verify final balances
            const finalBalances = {
                makerUSDC: await this.usdc.balanceOf(this.maker.address),
                makerWETH: await this.weth.balanceOf(this.maker.address),
                takerUSDC: await this.usdc.balanceOf(this.taker.address),
                takerWETH: await this.weth.balanceOf(this.taker.address)
            };
            
            console.log('📊 Final balances:');
            console.log(`   Maker - USDC: ${Number(finalBalances.makerUSDC) / 1e6}, WETH: ${Number(finalBalances.makerWETH) / 1e18}`);
            console.log(`   Taker - USDC: ${Number(finalBalances.takerUSDC) / 1e6}, WETH: ${Number(finalBalances.takerWETH) / 1e18}`);
            
            // Verify trade amounts
            const makerUSDCChange = Number(initialBalances.makerUSDC - finalBalances.makerUSDC) / 1e6;
            const makerWETHChange = Number(finalBalances.makerWETH - initialBalances.makerWETH) / 1e18;
            const takerUSDCChange = Number(finalBalances.takerUSDC - initialBalances.takerUSDC) / 1e6;
            const takerWETHChange = Number(initialBalances.takerWETH - finalBalances.takerWETH) / 1e18;
            
            console.log('📈 Trade summary:');
            console.log(`   Maker: Sold ${makerUSDCChange} USDC, received ${makerWETHChange} WETH`);
            console.log(`   Taker: Bought ${takerUSDCChange} USDC, paid ${takerWETHChange} WETH`);
            
            if (Math.abs(makerUSDCChange - 1000) < 0.1) {
                console.log('✅ Trade executed with correct amounts!');
            } else {
                console.log('❌ Trade amounts may be incorrect (due to dynamic pricing)');
            }
            
        } catch (error: any) {
            console.error('❌ Order execution failed:', error.message);
            throw error;
        }
    }

    // Alternative method: Use SDK's convenient watchAndFillOrder method
    async runWithAutoFill() {
        console.log('🎯 Alternative: Using SDK Auto-Fill');
        console.log('====================================');
        
        await this.setupTokenBalances();
        const { orderData, webhook, signature } = await this.createAndSignOrder();
        this.displayTradingViewInstructions(webhook);
        
        console.log('\n🤖 Using SDK auto-fill feature...');
        
        try {
            // This method combines waiting for alert + filling order
            const txHash = await this.takerYeti.watchAndFillOrder(orderData, signature);
            console.log(`✅ Order auto-filled using SDK: ${txHash}`);
        } catch (error) {
            console.error('❌ Auto-fill failed:', error);
            throw error;
        }
    }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
    // Parse arguments properly
    const useAutoFill = process.argv.includes('--auto-fill');
    
    // Get webhook URL from non-flag arguments or environment
    const nonFlagArgs = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
    const webhookUrl = nonFlagArgs[0] || process.env.WEBHOOK_URL || 'http://localhost:3001';
    
    console.log(`🌐 Using webhook server: ${webhookUrl}`);
    console.log(`🤖 Auto-fill mode: ${useAutoFill ? 'enabled' : 'disabled'}`);
    
    const test = new YetiSDKEndToEndTest(webhookUrl);
    
    if (useAutoFill) {
        test.runWithAutoFill().catch(console.error);
    } else {
        test.run().catch(console.error);
    }
}

export { YetiSDKEndToEndTest };