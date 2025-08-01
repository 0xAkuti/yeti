// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {WebhookOracle} from "../src/WebhookOracle.sol";
import {WebhookPredicate} from "../src/WebhookPredicate.sol";

contract WebhookPredicateTest is Test {
    WebhookOracle public oracle;
    WebhookPredicate public predicate;
    uint256 public constant MAX_AGE = 3600; // 1 hour
    bytes16 constant ALERT_ID = 0x550e8400e29b41d4a716446655440000;

    function setUp() public {
        oracle = new WebhookOracle();
        predicate = new WebhookPredicate(address(oracle), MAX_AGE);
    }

    function test_ValidAlert() public {
        WebhookOracle.Action action = WebhookOracle.Action.SHORT;
        
        oracle.submitAlert(ALERT_ID, action);
        
        assertTrue(predicate.checkPredicate(ALERT_ID, action));
    }

    function test_NonExistentAlert() public view {
        // should fail for all action types
        assertFalse(predicate.checkPredicate(ALERT_ID, WebhookOracle.Action.NONE));       
        assertFalse(predicate.checkPredicate(ALERT_ID, WebhookOracle.Action.SHORT));
        assertFalse(predicate.checkPredicate(ALERT_ID, WebhookOracle.Action.LONG));

    }

    function test_WrongAction() public {
        WebhookOracle.Action submitAction = WebhookOracle.Action.SHORT;
        WebhookOracle.Action checkAction = WebhookOracle.Action.LONG;
        
        oracle.submitAlert(ALERT_ID, submitAction);
        
        assertFalse(predicate.checkPredicate(ALERT_ID, checkAction));
        // but correct one is true
        assertTrue(predicate.checkPredicate(ALERT_ID, submitAction));
    }

    function test_ExpiredAlert() public {
        WebhookOracle.Action action = WebhookOracle.Action.SHORT;
        
        oracle.submitAlert(ALERT_ID, action);
        
        vm.warp(block.timestamp + MAX_AGE + 1);
        
        assertFalse(predicate.checkPredicate(ALERT_ID, action));
    }

    function test_AlmostExpiredAlert() public {
        WebhookOracle.Action action = WebhookOracle.Action.SHORT;
        
        oracle.submitAlert(ALERT_ID, action);
        
        vm.warp(block.timestamp + MAX_AGE);
        
        assertTrue(predicate.checkPredicate(ALERT_ID, action));
    }
}