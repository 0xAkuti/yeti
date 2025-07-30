import { JsonRpcProvider, Wallet } from 'ethers';
import { LimitOrderContract, TakerTraits, AmountMode } from '@1inch/limit-order-sdk';
import { FillOrderParams, ContractAddresses } from './types.js';

export class OrderFiller {
    private provider: JsonRpcProvider;
    private signer: Wallet;
    private contracts: ContractAddresses;

    constructor(provider: JsonRpcProvider, signer: Wallet, contracts: ContractAddresses) {
        this.provider = provider;
        this.signer = signer;
        this.contracts = contracts;
    }

    async fillOrder(params: FillOrderParams): Promise<string> {
        const { order, signature, amount } = params;
        
        try {
            // Verify predicate before filling (if order has extension)
            if (!order.extension.isEmpty()) {
                console.log('Order has extension, predicate should be satisfied');
            }
            
            // Determine fill amount
            const fillAmount = amount || order.makingAmount;
            
            // Create fill order transaction using getFillOrderArgsCalldata for extension support
            const fillOrderCalldata = LimitOrderContract.getFillOrderArgsCalldata(
                order.build(),
                signature,
                TakerTraits.default()
                    .setExtension(order.extension)
                    .setAmountMode(AmountMode.maker), // Use maker amount mode
                fillAmount
            );
            
            console.log('Preparing order fill transaction...');
            console.log(`To: ${this.contracts.limitOrderProtocol}`);
            console.log(`Fill amount: ${fillAmount.toString()}`);
            
            // Execute the transaction
            const tx = await this.signer.sendTransaction({
                to: this.contracts.limitOrderProtocol,
                data: fillOrderCalldata,
                gasLimit: 800000 // Conservative gas limit
            });
            
            console.log(`Order fill transaction sent: ${tx.hash}`);
            
            // Wait for confirmation
            const receipt = await tx.wait();
            console.log(`Order filled successfully! Gas used: ${receipt?.gasUsed?.toString()}`);
            
            return tx.hash;
            
        } catch (error: any) {
            console.error('Order fill failed:', error.message);
            
            if (error.code === 'CALL_EXCEPTION' && error.receipt) {
                console.error(`Transaction hash: ${error.receipt.hash}`);
                console.error(`Gas used: ${error.receipt.gasUsed}`);
                console.error(`Status: ${error.receipt.status}`);
                
                if (error.data) {
                    console.error(`Revert data: ${error.data}`);
                }
            }
            
            throw new Error(`Failed to fill order: ${error.message}`);
        }
    }

    async fillOrderPartial(params: FillOrderParams, fillAmount: bigint): Promise<string> {
        return this.fillOrder({
            ...params,
            amount: fillAmount
        });
    }

    async estimateGas(params: FillOrderParams): Promise<bigint> {
        const { order, signature, amount } = params;
        const fillAmount = amount || order.makingAmount;
        
        try {
            const fillOrderCalldata = LimitOrderContract.getFillOrderArgsCalldata(
                order.build(),
                signature,
                TakerTraits.default()
                    .setExtension(order.extension)
                    .setAmountMode(AmountMode.maker),
                fillAmount
            );
            
            const gasEstimate = await this.provider.estimateGas({
                to: this.contracts.limitOrderProtocol,
                data: fillOrderCalldata,
                from: this.signer.address
            });
            
            return gasEstimate;
            
        } catch (error) {
            console.error('Gas estimation failed:', error);
            return 800000n; // Fallback gas limit
        }
    }

    async canFillOrder(params: FillOrderParams): Promise<boolean> {
        try {
            // Try to estimate gas - if it fails, order probably can't be filled
            await this.estimateGas(params);
            return true;
        } catch (error) {
            console.error('Order cannot be filled:', error);
            return false;
        }
    }
}