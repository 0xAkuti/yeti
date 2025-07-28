import { JsonRpcProvider, Wallet, parseEther, parseUnits, Contract, getAddress } from 'ethers';
import {
    LimitOrder,
    LimitOrderContract,
    ExtensionBuilder,
    Address,
    TakerTraits,
    AmountMode,
    MakerTraits
} from '@1inch/limit-order-sdk';

// Contract addresses
const WEBHOOK_ORACLE_ADDRESS = '0x4dAd2cb11D49D21b77c7165F101B19f003F20C2D'; // From deployment
const WEBHOOK_PREDICATE_ADDRESS = '0x0EA531B186fdEA915e94AF8A93C6dfb85b407f5A'; // From deployment
const LIMIT_ORDER_PROTOCOL = getAddress('0x111111125421cA6dc452d289314280a0f8842A65');
const USDC = getAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
const WETH = getAddress('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');

const WEBHOOK_ORACLE_ABI = [
    'function submitAlert(bytes16 _alertId, uint8 _action) external',
    'function getAlert(bytes16 _alertId) external view returns (tuple(bytes16 alertId, uint32 timestamp, uint8 action))',
    'event AlertSubmitted(bytes16 indexed alertId, uint8 action, uint32 timestamp)'
];

const WEBHOOK_PREDICATE_ABI = [
    'function checkPredicate(bytes16 alertId, uint8 expectedAction) external view returns (bool)'
];

const ERC20_ABI = [
    'function balanceOf(address) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)'
];

enum Action {
    NONE = 0,
    SHORT = 1,
    LONG = 2
}

class YetiEndToEndTest {
    private provider: JsonRpcProvider;
    private maker: Wallet;
    private taker: Wallet;
    private webhookOracle: Contract;
    private webhookPredicate: Contract;
    private usdc: Contract;
    private weth: Contract;
    private alertId: string = '';
    private webhookId: string = '';
    private limitOrder!: LimitOrder;
    private signature!: string;
    private webhookServerUrl: string;

    constructor(webhookServerUrl: string = 'http://localhost:3001') {
        this.webhookServerUrl = webhookServerUrl;
        this.provider = new JsonRpcProvider('https://virtual.mainnet.eu.rpc.tenderly.co/4b423b82-a3ae-421e-b85d-da162319c33d');
        this.maker = new Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', this.provider);
        this.taker = new Wallet('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', this.provider);
        
        this.webhookOracle = new Contract(WEBHOOK_ORACLE_ADDRESS, WEBHOOK_ORACLE_ABI, this.provider);
        this.webhookPredicate = new Contract(WEBHOOK_PREDICATE_ADDRESS, WEBHOOK_PREDICATE_ABI, this.provider);
        this.usdc = new Contract(USDC, ERC20_ABI, this.provider);
        this.weth = new Contract(WETH, ERC20_ABI, this.provider);
    }

    async run() {
        console.log('🎯 Yeti End-to-End Test');
        console.log('======================');
        
        await this.setupTokenBalances();
        await this.registerWebhook();
        await this.createLimitOrder();
        await this.signOrder();
        this.instructTradingViewSetup();
        await this.waitForAlert();
        await this.fulfillOrder();
        
        console.log('\n✅ End-to-end test completed successfully!');
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
        
        await usdcWithMaker.approve(LIMIT_ORDER_PROTOCOL, parseUnits('10000', 6));
        await wethWithTaker.approve(LIMIT_ORDER_PROTOCOL, parseEther('10'));
        
        const makerUSDC = await this.usdc.balanceOf(this.maker.address);
        const takerWETH = await this.weth.balanceOf(this.taker.address);
        
        console.log(`✅ Maker USDC balance: ${Number(makerUSDC) / 1e6}`);
        console.log(`✅ Taker WETH balance: ${Number(takerWETH) / 1e18}`);
    }
    
    private async setupTokenBalancesTenderly() {
        console.log('   Using Tenderly RPC methods...');
        
        try {
            // Set ETH balances for gas
            await this.provider.send('tenderly_setBalance', [
                [this.maker.address, this.taker.address],
                '0x56BC75E2D630E000' // 100 ETH
            ]);
            
            // Set USDC balance for maker (10,000 USDC)
            await this.provider.send('tenderly_setErc20Balance', [
                USDC,
                this.maker.address,
                '0x' + (10000n * 10n**6n).toString(16) // 10,000 USDC
            ]);
            
            // Set WETH balance for taker (10 WETH)
            await this.provider.send('tenderly_setErc20Balance', [
                WETH,
                this.taker.address,
                '0x' + (10n * 10n**18n).toString(16) // 10 WETH
            ]);
            
            console.log('✅ Tenderly balance setup complete');
        } catch (error) {
            console.log('❌ Tenderly methods failed, falling back to whale impersonation...');
            await this.setupTokenBalancesAnvil();
        }
    }
    
    private async setupTokenBalancesAnvil() {
        console.log('   Using whale account impersonation...');
        
        // Impersonate wealthy accounts to get tokens
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
        
        console.log('✅ Anvil whale impersonation complete');
    }

    private async registerWebhook() {
        console.log('\n2️⃣ Registering webhook...');
        
        // Check webhook server is running
        try {
            const healthUrl = `${this.webhookServerUrl}/health`;
            const response = await fetch(healthUrl);
            if (!response.ok) throw new Error('Webhook server not responding');
            console.log(`✅ Webhook server is running at ${this.webhookServerUrl}`);
        } catch (error) {
            console.log(`❌ Webhook server not running at ${this.webhookServerUrl}`);
            console.log('Please start the webhook server first:');
            console.log('  cd ../webhook-server');
            console.log('  docker compose up');
            process.exit(1);
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
            this.webhookId = webhookData.webhook_id;
            this.alertId = '0x' + this.webhookId.replace(/-/g, '');
            
            console.log(`✅ Webhook created:`);
            console.log(`   Webhook ID: ${this.webhookId}`);
            console.log(`   Alert ID: ${this.alertId}`);
            console.log(`   Webhook URL: ${this.webhookServerUrl}${webhookData.webhook_url}`);
            console.log(`   User: ${webhookData.user}`);
        } catch (error) {
            console.log(`❌ Failed to create webhook: ${error}`);
            process.exit(1);
        }
    }

    private async createLimitOrder() {
        console.log('\n3️⃣ Creating 1inch limit order with webhook predicate...');
        
        // Create predicate - this should be a staticcall to our WebhookPredicate contract
        // Format: swap.arbitraryStaticCall(contractAddress, functionCalldata)
        const predicateCalldata = this.webhookPredicate.interface.encodeFunctionData('checkPredicate', [
            this.alertId,
            Action.SHORT // We want this order to execute on SHORT signals
        ]);
        
        // Create the 1inch protocol staticcall predicate
        const limitOrderProtocol = new Contract(LIMIT_ORDER_PROTOCOL, [
            'function arbitraryStaticCall(address target, bytes calldata data) external view returns (uint256)'
        ], this.provider);
        
        const staticCallPredicate = limitOrderProtocol.interface.encodeFunctionData('arbitraryStaticCall', [
            WEBHOOK_PREDICATE_ADDRESS,
            predicateCalldata
        ]);
        
        console.log(`   Predicate contract: ${WEBHOOK_PREDICATE_ADDRESS}`);
        console.log(`   Predicate calldata: ${predicateCalldata}`);
        console.log(`   Static call predicate: ${staticCallPredicate}`);
        
        // Create extension with the predicate
        const extension = new ExtensionBuilder()
            .withPredicate(staticCallPredicate)
            .build();
        
        console.log(`   Extension encoded: ${extension.encode()}`);
        console.log(`   Extension has predicate: ${extension.hasPredicate}`);
        
        this.limitOrder = new LimitOrder(
            {
                maker: new Address(this.maker.address),
                makerAsset: new Address(USDC),
                takerAsset: new Address(WETH),
                makingAmount: parseUnits('1000', 6), // Sell 1000 USDC
                takingAmount: parseEther('0.5'), // For 0.5 WETH
                salt: LimitOrder.buildSalt(extension)
            },
            MakerTraits.default(),
            extension
        );
        
        console.log('✅ Limit order created:');
        console.log(`   Selling: 1000 USDC`);
        console.log(`   Buying: 0.5 WETH`);
        console.log(`   Predicate: calls checkPredicate(${this.alertId}, SHORT)`);
        console.log(`   Alert ID: ${this.alertId}`);
        console.log(`   Order has extension: ${!this.limitOrder.extension.isEmpty()}`);
    }

    private async signOrder() {
        console.log('\n4️⃣ Signing limit order...');
        
        // Get the current chain ID from the provider
        const network = await this.provider.getNetwork();
        const chainId = Number(network.chainId);
        console.log(`   Chain ID: ${chainId}`);
        
        // Sign the order using the SDK's method with proper chain ID
        const orderHash = this.limitOrder.getOrderHash(chainId);
        
        // Use EIP-712 signing with correct domain from SDK
        const domain = {
            name: '1inch Aggregation Router',
            version: '6',
            chainId: chainId,
            verifyingContract: LIMIT_ORDER_PROTOCOL
        };
        
        const types = {
            Order: [
                { name: 'salt', type: 'uint256' },
                { name: 'maker', type: 'address' },
                { name: 'receiver', type: 'address' },
                { name: 'makerAsset', type: 'address' },
                { name: 'takerAsset', type: 'address' },
                { name: 'makingAmount', type: 'uint256' },
                { name: 'takingAmount', type: 'uint256' },
                { name: 'makerTraits', type: 'uint256' }
            ]
        };
        
        const orderStruct = this.limitOrder.build();
        const value = {
            salt: orderStruct.salt,
            maker: orderStruct.maker,
            receiver: orderStruct.receiver,
            makerAsset: orderStruct.makerAsset,
            takerAsset: orderStruct.takerAsset,
            makingAmount: orderStruct.makingAmount,
            takingAmount: orderStruct.takingAmount,
            makerTraits: orderStruct.makerTraits
        };
        
        this.signature = await this.maker.signTypedData(domain, types, value);
        
        console.log('✅ Order signed with EIP-712');
        console.log(`   Signature: ${this.signature.slice(0, 20)}...`);
        console.log(`   Order hash: ${orderHash}`);
        console.log(`   Domain: ${domain.name} v${domain.version}`);
    }

    private instructTradingViewSetup() {
        console.log('\n5️⃣ TradingView Setup Instructions');
        console.log('=====================================');
        console.log('\n🔸 PLEASE FOLLOW THESE STEPS:');
        console.log('\n1. Go to TradingView and create a new alert');
        console.log('2. Set the webhook URL to:');
        console.log(`   ${this.webhookServerUrl}/webhook/${this.webhookId}`);
        console.log('\n3. Set the alert message to:');
        console.log('   {');
        console.log('     "action": "SHORT"');
        console.log('   }');
        console.log('\n4. Set the alert condition to trigger when you want the order to execute');
        console.log('5. Save the alert');
        console.log('\n✅ Once you have set up the alert, trigger it to test the system');
        console.log('✅ This script will wait for the alert and automatically fulfill the order');
        console.log('\nWaiting for alert...');
    }

    private async waitForAlert(): Promise<void> {
        console.log('\n6️⃣ Waiting for TradingView alert...');
        
        return new Promise((resolve, reject) => {
            let resolved = false;
            
            // Listen for all AlertSubmitted events and filter manually
            this.webhookOracle.on('AlertSubmitted', async (alertId, action, timestamp, event) => {
                if (resolved) return;
                
                console.log('\n🚀 Alert received!');
                console.log(`   Raw Alert ID: ${alertId}`);
                console.log(`   Expected Alert ID: ${this.alertId}`);
                console.log(`   Action: ${action} (${Number(action) === Action.SHORT ? 'SHORT' : Number(action) === Action.LONG ? 'LONG' : 'NONE'})`);
                console.log(`   Timestamp: ${timestamp}`);
                
                if (event) {
                    console.log(`   Block: ${event.blockNumber}`);
                    console.log(`   Transaction: ${event.transactionHash}`);
                } else {
                    console.log('   Event object is undefined - using log data directly');
                }
                
                // Check if this is our alert ID (convert both to same format for comparison)
                const receivedAlertId = alertId.toString().toLowerCase();
                const expectedAlertId = this.alertId.toLowerCase();
                
                if (receivedAlertId === expectedAlertId) {
                    console.log('✅ Alert ID matches!');
                    
                    // Verify predicate now passes
                    try {
                        const predicateResult = await this.webhookPredicate.checkPredicate(this.alertId, Action.SHORT);
                        console.log(`✅ Predicate check: ${predicateResult}`);
                        
                        if (predicateResult) {
                            resolved = true;
                            resolve();
                        }
                    } catch (error) {
                        console.log(`❌ Predicate check failed: ${error}`);
                    }
                } else {
                    console.log('❌ Alert ID does not match, continuing to wait...');
                }
            });
            
            // Also poll in case events are missed
            const pollInterval = setInterval(async () => {
                if (resolved) {
                    clearInterval(pollInterval);
                    return;
                }
                
                try {
                    const alertData = await this.webhookOracle.getAlert(this.alertId);
                    if (Number(alertData.action) === Action.SHORT && Number(alertData.timestamp) > 0) {
                        clearInterval(pollInterval);
                        console.log('\n🚀 Alert detected via polling!');
                        console.log(`   Alert ID: ${alertData.alertId}`);
                        console.log(`   Action: ${alertData.action} (SHORT)`);
                        console.log(`   Timestamp: ${alertData.timestamp}`);
                        
                        // Verify predicate
                        const predicateResult = await this.webhookPredicate.checkPredicate(this.alertId, Action.SHORT);
                        console.log(`✅ Predicate check: ${predicateResult}`);
                        
                        if (predicateResult) {
                            resolved = true;
                            resolve();
                        }
                    }
                } catch (error) {
                    // Alert doesn't exist yet, continue polling
                    console.log(`⏳ Polling... (Alert not found yet)`);
                }
            }, 3000);
            
            // Add a timeout to prevent infinite waiting
            setTimeout(() => {
                if (!resolved) {
                    clearInterval(pollInterval);
                    this.webhookOracle.removeAllListeners('AlertSubmitted');
                    reject(new Error('Timeout waiting for alert after 5 minutes'));
                }
            }, 300000); // 5 minutes timeout
        });
    }

    private async fulfillOrder() {
        console.log('\n7️⃣ Fulfilling 1inch limit order...');
        
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
            // Double check the predicate before filling
            const predicateCheck = await this.webhookPredicate.checkPredicate(this.alertId, Action.SHORT);
            console.log(`🔍 Pre-fill predicate check: ${predicateCheck}`);
            
            if (!predicateCheck) {
                throw new Error('Predicate check failed - order cannot be filled');
            }
            
            // Create fill order transaction - use getFillOrderArgsCalldata since we have an extension
            const fillOrderCalldata = LimitOrderContract.getFillOrderArgsCalldata(
                this.limitOrder.build(),
                this.signature,
                TakerTraits.default()
                    .setExtension(this.limitOrder.extension)
                    .setAmountMode(AmountMode.taker),
                this.limitOrder.takingAmount
            );
            
            console.log('🔄 Preparing transaction...');
            console.log(`   To: ${LIMIT_ORDER_PROTOCOL}`);
            console.log(`   Data length: ${fillOrderCalldata.length} bytes`);
            console.log(`   Taker: ${this.taker.address}`);
            
            // Execute the order as taker
            console.log('🔄 Executing order on 1inch protocol...');
            const fillTx = await this.taker.sendTransaction({
                to: LIMIT_ORDER_PROTOCOL,
                data: fillOrderCalldata,
                gasLimit: 800000 // Increased gas limit
            });
            
            const receipt = await fillTx.wait();
            console.log(`✅ Order executed! Gas used: ${receipt?.gasUsed?.toString()}`);
            
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
            
            if (Math.abs(makerUSDCChange - 1000) < 0.1 && Math.abs(makerWETHChange - 0.5) < 0.01) {
                console.log('✅ Trade executed with correct amounts!');
            } else {
                console.log('❌ Trade amounts incorrect');
            }
            
        } catch (error: any) {
            console.log('❌ Order execution failed:');
            console.log(`   Error: ${error.message}`);
            
            if (error.code === 'CALL_EXCEPTION' && error.receipt) {
                console.log(`   Transaction hash: ${error.receipt.hash}`);
                console.log(`   Gas used: ${error.receipt.gasUsed}`);
                console.log(`   Status: ${error.receipt.status}`);
                
                // Try to decode the revert reason
                if (error.data) {
                    console.log(`   Revert data: ${error.data}`);
                }
            }
            
            // Additional debugging - check predicate again
            try {
                const predicateResult = await this.webhookPredicate.checkPredicate(this.alertId, Action.SHORT);
                console.log(`   Final predicate check: ${predicateResult}`);
            } catch (predicateError) {
                console.log(`   Predicate check failed: ${predicateError}`);
            }
            
            throw error;
        }
    }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
    // Get webhook URL from command line argument or environment variable
    const webhookUrl = process.argv[2] || process.env.WEBHOOK_URL || 'http://localhost:8000';
    
    console.log(`🌐 Using webhook server: ${webhookUrl}`);
    
    const test = new YetiEndToEndTest(webhookUrl);
    test.run().catch(console.error);
}

export { YetiEndToEndTest };