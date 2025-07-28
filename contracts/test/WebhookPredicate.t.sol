// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {WebhookOracle} from "../src/WebhookOracle.sol";
import {WebhookPredicate} from "../src/WebhookPredicate.sol";

contract WebhookPredicateTest is Test {
    WebhookOracle public oracle;
    WebhookPredicate public predicate;
    uint256 public constant MAX_AGE = 3600; // 1 hour

    function setUp() public {
        oracle = new WebhookOracle();
        predicate = new WebhookPredicate(address(oracle), MAX_AGE);
    }

    function test_ValidAlert() public {
        bytes16 alertId = 0x550e8400e29b41d4a716446655440000;
        WebhookOracle.Action action = WebhookOracle.Action.SHORT;
        
        oracle.submitAlert(alertId, action);
        
        assertTrue(predicate.checkPredicate(alertId, action));
    }

    function test_NonExistentAlert() public view {
        bytes16 alertId = 0x550e8400e29b41d4a716446655440000;
        WebhookOracle.Action action = WebhookOracle.Action.SHORT;
        
        assertFalse(predicate.checkPredicate(alertId, action));
    }

    function test_WrongAction() public {
        bytes16 alertId = 0x550e8400e29b41d4a716446655440000;
        WebhookOracle.Action submitAction = WebhookOracle.Action.SHORT;
        WebhookOracle.Action checkAction = WebhookOracle.Action.LONG;
        
        oracle.submitAlert(alertId, submitAction);
        
        assertFalse(predicate.checkPredicate(alertId, checkAction));
    }

    function test_ExpiredAlert() public {
        bytes16 alertId = 0x550e8400e29b41d4a716446655440000;
        WebhookOracle.Action action = WebhookOracle.Action.SHORT;
        
        oracle.submitAlert(alertId, action);
        
        vm.warp(block.timestamp + MAX_AGE + 1);
        
        assertFalse(predicate.checkPredicate(alertId, action));
    }

    function test_AlmostExpiredAlert() public {
        bytes16 alertId = 0x550e8400e29b41d4a716446655440000;
        WebhookOracle.Action action = WebhookOracle.Action.SHORT;
        
        oracle.submitAlert(alertId, action);
        
        vm.warp(block.timestamp + MAX_AGE);
        
        assertTrue(predicate.checkPredicate(alertId, action));
    }
}