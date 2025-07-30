import { 
    LimitOrder, 
    ExtensionBuilder, 
    Address, 
    MakerTraits 
} from '@1inch/limit-order-sdk';
import { Contract, parseUnits, parseEther } from 'ethers';
import { ConditionalOrderParams, OrderData, Action, ContractAddresses } from './types.js';

export class ConditionalOrderBuilder {
    private contracts: ContractAddresses;

    constructor(contracts: ContractAddresses) {
        this.contracts = contracts;
    }

    buildWebhookOrder(params: ConditionalOrderParams, alertId: string, maker: string): OrderData {
        const actionValue = params.action === 'LONG' ? Action.LONG : Action.SHORT;
        
        // Create predicate for webhook condition
        const predicateCalldata = this.createPredicateCalldata(alertId, actionValue);
        
        // Create chainlink pricing data
        const takingAmountData = this.createChainlinkExtraData(
            params.sell.token,
            params.buy.token,
            params.oracle
        );
        
        // Build extension with predicate and dynamic pricing
        const extension = new ExtensionBuilder()
            .withPredicate(predicateCalldata)
            .withTakingAmountData(new Address(this.contracts.chainlinkCalculator), takingAmountData)
            .build();
        
        // Generate unique nonce from alert ID
        const alertIdNonce = BigInt(alertId) & ((1n << 40n) - 1n);
        const makerTraits = MakerTraits.default().withNonce(alertIdNonce);
        
        // Determine token decimals and amounts
        const { makingAmount, takingAmount } = this.parseAmounts(params);
        
        // Create the limit order
        const limitOrder = new LimitOrder(
            {
                maker: new Address(maker),
                makerAsset: new Address(params.sell.token),
                takerAsset: new Address(params.buy.token),
                makingAmount,
                takingAmount,
                salt: LimitOrder.buildSalt(extension)
            },
            makerTraits,
            extension
        );
        
        return {
            order: limitOrder,
            orderHash: limitOrder.getOrderHash(1), // Will be updated with actual chainId during signing
            alertId
        };
    }

    private createPredicateCalldata(alertId: string, action: Action): string {
        // ABI encode the checkPredicate function call
        const webhookPredicateAbi = [
            'function checkPredicate(bytes16 alertId, uint8 expectedAction) external view returns (bool)'
        ];
        
        const iface = new Contract(this.contracts.webhookPredicate, webhookPredicateAbi).interface;
        const predicateCalldata = iface.encodeFunctionData('checkPredicate', [alertId, action]);
        
        // Create 1inch protocol staticcall
        const limitOrderProtocolAbi = [
            'function arbitraryStaticCall(address target, bytes calldata data) external view returns (uint256)'
        ];
        
        const lopIface = new Contract(this.contracts.limitOrderProtocol, limitOrderProtocolAbi).interface;
        return lopIface.encodeFunctionData('arbitraryStaticCall', [
            this.contracts.webhookPredicate,
            predicateCalldata
        ]);
    }

    private createChainlinkExtraData(sellToken: string, buyToken: string, oracle: string): string {
        // For now, assume USDC(6) → WETH(18) conversion using ETH/USD oracle
        // This should be enhanced to detect token decimals automatically
        
        const INVERSE_FLAG = 0x80;
        const flags = INVERSE_FLAG.toString(16).padStart(2, '0');
        const oracleAddress = oracle.slice(2);
        
        // Spread calculation: (10^12 * 10^9) to convert USDC(6) to WETH(18) + spread denominator
        const spreadWithDecimals = (1e12 * 1e9).toString(16).padStart(64, '0');
        
        return '0x' + flags + oracleAddress + spreadWithDecimals;
    }

    private parseAmounts(params: ConditionalOrderParams): { makingAmount: bigint; takingAmount: bigint } {
        // Parse making amount based on sell token
        // For USDC (6 decimals), for WETH (18 decimals)
        const makingAmount = this.parseTokenAmount(params.sell.amount, params.sell.token);
        
        // Taking amount is an upper bound - actual amount calculated by ChainlinkCalculator
        // Set reasonable upper bound (e.g., 1 WETH for USDC orders)
        const takingAmount = parseEther('1');
        
        return { makingAmount, takingAmount };
    }

    private parseTokenAmount(amount: string, token: string): bigint {
        // This should be enhanced to automatically detect token decimals
        // For now, assume common token decimals
        const commonTokens: Record<string, number> = {
            // USDC addresses on different chains
            '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': 6, // Mainnet USDC
            '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': 6, // Polygon USDC
            // WETH addresses
            '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 18, // Mainnet WETH
            '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619': 18, // Polygon WETH
        };
        
        const decimals = commonTokens[token] || 18; // Default to 18 decimals
        return parseUnits(amount, decimals);
    }

    // Helper method to get order for frontend signing
    getOrderForSigning(orderData: OrderData, chainId: number) {
        // Use the same signing structure as the original test for compatibility
        const domain = {
            name: '1inch Aggregation Router',
            version: '6',
            chainId: chainId,
            verifyingContract: this.contracts.limitOrderProtocol
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
        
        const orderStruct = orderData.order.build();
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
        
        return {
            order: orderStruct,
            orderHash: orderData.order.getOrderHash(chainId),
            typedData: {
                domain,
                types,
                message: value
            }
        };
    }
}