// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {WebhookOracle} from "../src/WebhookOracle.sol";

contract DeployWebhookOracle is Script {
    address constant TEE_SIMULATOR = 0xf3D21A3A689AD889541d993A51e3109aC3E36c12;
    
    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        // Fund the TEE account with 10 ETH (this works in scripts)
        payable(TEE_SIMULATOR).transfer(10 ether);

        // Deploy the oracle contract
        WebhookOracle oracle = new WebhookOracle();
        oracle.addAuthorizedSubmitter(TEE_SIMULATOR);
        
        console.log("WebhookOracle deployed to:", address(oracle));
        console.log("Owner:", oracle.owner());
        console.log("TEE account funded with 10 ETH:", TEE_SIMULATOR);
        console.log("TEE account balance:", TEE_SIMULATOR.balance / 1e18, "ETH");
        
        vm.stopBroadcast();
    }
}