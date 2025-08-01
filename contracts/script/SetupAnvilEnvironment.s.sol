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
        testRealOraclePrices();
        
        vm.stopBroadcast();
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