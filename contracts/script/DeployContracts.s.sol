// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {WebhookOracle} from "../src/WebhookOracle.sol";
import {WebhookPredicate} from "../src/WebhookPredicate.sol";
import {ChainlinkCalculator} from "limit-order-protocol/extensions/ChainlinkCalculator.sol";

contract DeployContracts is Script {
    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        WebhookOracle oracle = new WebhookOracle();
        WebhookPredicate predicate = new WebhookPredicate(address(oracle), 300);
        ChainlinkCalculator chainlinkCalculator = new ChainlinkCalculator();
        
        console.log("WebhookOracle deployed to:", address(oracle));
        console.log("WebhookPredicate deployed to:", address(predicate));
        console.log("ChainlinkCalculator deployed to:", address(chainlinkCalculator));    
        
        console.log("Owner:", oracle.owner());
        vm.stopBroadcast();
    }
}