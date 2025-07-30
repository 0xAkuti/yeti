// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {WebhookOracle} from "../src/WebhookOracle.sol";
import {WebhookPredicate} from "../src/WebhookPredicate.sol";
import {ChainlinkCalculator} from "limit-order-protocol/extensions/ChainlinkCalculator.sol";

contract DeployWebhookOracle is Script {
    address constant TEE_SIMULATOR = 0xf3D21A3A689AD889541d993A51e3109aC3E36c12;
    
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
        
        vm.stopBroadcast();
    }
}