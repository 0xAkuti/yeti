// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {WebhookOracle} from "../src/WebhookOracle.sol";
import {WebhookPredicate} from "../src/WebhookPredicate.sol";
import {ChainlinkCalculator} from "limit-order-protocol/extensions/ChainlinkCalculator.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract DeployWebhookOracle is Script {
    address constant TEE_SIMULATOR = 0xf3D21A3A689AD889541d993A51e3109aC3E36c12;
    
    // Real Chainlink oracles on mainnet
    address constant ETH_USD_ORACLE = 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419;  // ETH/USD
    address constant BTC_USD_ORACLE = 0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c;  // BTC/USD
    address constant USDC_USD_ORACLE = 0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6; // USDC/USD
    
    function run() public {
        vm.startBroadcast();

        payable(TEE_SIMULATOR).transfer(1 ether);
        
        WebhookOracle oracle = new WebhookOracle();
        oracle.addAuthorizedSubmitter(TEE_SIMULATOR);
        WebhookPredicate predicate = new WebhookPredicate(address(oracle), 300);
        ChainlinkCalculator chainlinkCalculator = new ChainlinkCalculator();
        
        console.log("WebhookOracle deployed to:", address(oracle));
        console.log("WebhookPredicate deployed to:", address(predicate));
        console.log("ChainlinkCalculator deployed to:", address(chainlinkCalculator));

        console.log("TEE account funded:", TEE_SIMULATOR);
        console.log("TEE balance:", TEE_SIMULATOR.balance / 1e18, "ETH");
        
        // Example: Test ChainlinkCalculator with real mainnet oracles
        console.log("\n=== ChainlinkCalculator Example ===");
        demoChainlinkCalculator(chainlinkCalculator);
        testRealOraclePrices();
        
        vm.stopBroadcast();
    }
    
    function demoChainlinkCalculator(ChainlinkCalculator calculator) internal view {
        console.log("ChainlinkCalculator enables dynamic pricing for 1inch limit orders using real Chainlink oracles");
        console.log("");
        
        // Example 1: ETH/USDC order with stop-loss at current price - 5%
        console.log("=== Example 1: ETH Stop-Loss Order ===");
        console.log("Scenario: Sell ETH for USDC when price drops 5% below current market");
        console.log("Oracle: ETH/USD at", ETH_USD_ORACLE);
        
        bytes memory ethStopLossData = abi.encodePacked(
            bytes1(0x00),  // No inverse (ETH/USD as-is)
            bytes20(ETH_USD_ORACLE),
            bytes32(uint256(950 * 1e6))  // 95% of market price (5% below)
        );
        console.log("ExtraData for 5% stop-loss:");
        console.logBytes(ethStopLossData);
        console.log("");
        
        // Example 2: BTC/ETH cross-pair using dual oracles
        console.log("=== Example 2: BTC/ETH Cross-Pair Order ===");
        console.log("Scenario: Trade BTC for ETH based on BTC/ETH ratio");
        console.log("Uses BTC/USD and ETH/USD oracles to calculate BTC/ETH price");
        
        bytes memory btcEthCrossData = abi.encodePacked(
            bytes1(0x40),  // Dual oracle flag
            bytes20(BTC_USD_ORACLE),
            bytes20(ETH_USD_ORACLE),
            bytes32(uint256(0)),  // No decimal scaling needed (both are USD pairs)
            bytes32(uint256(1000 * 1e6))  // 1:1 spread (no premium)
        );
        console.log("ExtraData for BTC/ETH cross-pair:");
        console.logBytes(btcEthCrossData);
        console.log("");
        
        // Example 3: USDC normalization (accounting for USDC depeg)
        console.log("=== Example 3: USDC Depeg Protection ===");
        console.log("Scenario: Only execute when USDC is close to $1.00");
        console.log("Oracle: USDC/USD at", USDC_USD_ORACLE);
        
        bytes memory usdcDepegData = abi.encodePacked(
            bytes1(0x00),  // No inverse
            bytes20(USDC_USD_ORACLE),
            bytes32(uint256(999 * 1e6))  // Only execute if USDC >= $0.999
        );
        console.log("ExtraData for USDC depeg protection:");
        console.logBytes(usdcDepegData);
        console.log("");
        
        console.log("=== Integration with Yeti Webhook System ===");
        console.log("Combine ChainlinkCalculator with WebhookPredicate for advanced strategies:");
        console.log("1. TradingView sends alert when technical conditions are met");
        console.log("2. WebhookPredicate validates the alert");
        console.log("3. ChainlinkCalculator ensures price conditions are still valid");
        console.log("4. Order executes only when both conditions are satisfied");
    }
    
    function testRealOraclePrices() internal view {
        console.log("\n=== Live Oracle Prices (Mainnet Fork) ===");
        
        // Test ETH/USD oracle
        AggregatorV3Interface ethOracle = AggregatorV3Interface(ETH_USD_ORACLE);
        (, int256 ethPrice,, uint256 ethUpdatedAt,) = ethOracle.latestRoundData();
        console.log("ETH/USD Price: $", uint256(ethPrice) / 1e8);
        console.log("Last updated:", ethUpdatedAt);
        console.log("Decimals:", ethOracle.decimals());
        console.log("");
        
        // Test BTC/USD oracle
        AggregatorV3Interface btcOracle = AggregatorV3Interface(BTC_USD_ORACLE);
        (, int256 btcPrice,, uint256 btcUpdatedAt,) = btcOracle.latestRoundData();
        console.log("BTC/USD Price: $", uint256(btcPrice) / 1e8);
        console.log("Last updated:", btcUpdatedAt);
        console.log("Decimals:", btcOracle.decimals());
        console.log("");
        
        // Calculate BTC/ETH ratio
        uint256 btcEthRatio = (uint256(btcPrice) * 1e18) / uint256(ethPrice);
        console.log("BTC/ETH Ratio:", btcEthRatio / 1e18, ".", (btcEthRatio % 1e18) / 1e14);
        console.log("");
        
        // Test USDC/USD oracle
        AggregatorV3Interface usdcOracle = AggregatorV3Interface(USDC_USD_ORACLE);
        (, int256 usdcPrice,, uint256 usdcUpdatedAt,) = usdcOracle.latestRoundData();
        
        // Display USDC price with proper decimals (avoid rounding to 0)
        uint256 usdcPriceUint = uint256(usdcPrice);
        uint256 dollars = usdcPriceUint / 1e8;
        uint256 decimals = (usdcPriceUint % 1e8) / 1e4; // Get 4 decimal places
        
        console.log("USDC/USD Price: $", dollars, ".", decimals);
        console.log("Raw price:", usdcPriceUint);
        console.log("Last updated:", usdcUpdatedAt);
        console.log("Decimals:", usdcOracle.decimals());
    }
}