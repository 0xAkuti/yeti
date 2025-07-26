// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {WebhookOracle} from "../src/WebhookOracle.sol";

contract DeployWebhookOracle is Script {
    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        WebhookOracle oracle = new WebhookOracle();
        
        console.log("WebhookOracle deployed to:", address(oracle));
        console.log("Owner:", oracle.owner());
        
        vm.stopBroadcast();
    }
}