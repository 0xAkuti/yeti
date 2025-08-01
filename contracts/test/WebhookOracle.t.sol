// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {WebhookOracle} from "../src/WebhookOracle.sol";

contract WebhookOracleTest is Test {
    WebhookOracle public oracle;
    address public owner;
    address public user1;
    address public user2;
    bytes16 constant ALERT_ID = 0x550e8400e29b41d4a716446655440000;

    error Unauthorized();

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        
        oracle = new WebhookOracle();
    }

    function test_InitialState() public view {
        assertEq(oracle.owner(), owner);
        assertTrue(oracle.hasAnyRole(owner, oracle.SUBMITTER_ROLE()));
    }

    function test_SubmitAlert() public {
        WebhookOracle.Action action = WebhookOracle.Action.SHORT;
        
        oracle.submitAlert(ALERT_ID, action);
        
        WebhookOracle.AlertData memory alert = oracle.getAlert(ALERT_ID);
        assertEq(alert.alertId, ALERT_ID);
        assertTrue(alert.action == action);
        assertTrue(alert.timestamp > 0);
        assertEq(alert.nonce, 1);
    }

    function test_AddAuthorizedSubmitter() public {
        oracle.addAuthorizedSubmitter(user1);
        assertTrue(oracle.hasAnyRole(user1, oracle.SUBMITTER_ROLE()));
                
        vm.prank(user1);
        oracle.submitAlert(ALERT_ID, WebhookOracle.Action.LONG);
        
        WebhookOracle.AlertData memory alert = oracle.getAlert(ALERT_ID);
        assertEq(alert.alertId, ALERT_ID);
        assertTrue(alert.action == WebhookOracle.Action.LONG);
        assertEq(alert.nonce, 1);
    }

    function test_RemoveAuthorizedSubmitter() public {
        oracle.addAuthorizedSubmitter(user1);
        oracle.removeAuthorizedSubmitter(user1);
        assertFalse(oracle.hasAnyRole(user1, oracle.SUBMITTER_ROLE()));
                
        vm.expectRevert(Unauthorized.selector);
        vm.prank(user1);
        oracle.submitAlert(ALERT_ID, WebhookOracle.Action.SHORT);
    }

    function test_UnauthorizedSubmission() public {
        vm.expectRevert(Unauthorized.selector);
        vm.prank(user1);
        oracle.submitAlert(ALERT_ID, WebhookOracle.Action.SHORT);
    }

    function test_GetNonExistentAlert() public view {
        // 00000000-0000-4000-8000-000000000000 (minimal valid UUID)
        bytes16 nonExistentId = 0x00000000000040008000000000000000;
        WebhookOracle.AlertData memory alert = oracle.getAlert(nonExistentId);
        assertEq(alert.alertId, bytes16(0));
        assertTrue(alert.action == WebhookOracle.Action.NONE);
        assertEq(alert.timestamp, 0);
        assertEq(alert.nonce, 0);
    }

    function test_OverwriteAlert() public {
        oracle.submitAlert(ALERT_ID, WebhookOracle.Action.SHORT);
        oracle.submitAlert(ALERT_ID, WebhookOracle.Action.LONG);
        
        WebhookOracle.AlertData memory alert = oracle.getAlert(ALERT_ID);
        assertEq(alert.alertId, ALERT_ID);
        assertTrue(alert.action == WebhookOracle.Action.LONG);
        assertEq(alert.nonce, 2); // Should be 2 after overwrite
    }

    function test_AlertSubmittedEvent() public {
        WebhookOracle.Action action = WebhookOracle.Action.SHORT;
        
        vm.expectEmit(true, false, false, true);
        emit WebhookOracle.AlertSubmitted(ALERT_ID, action, uint32(block.timestamp), 1);
        
        oracle.submitAlert(ALERT_ID, action);
    }

    // === Nonce Feature Tests ===

    function test_NonceIncrementsOnNewAlert() public {
        // First alert should have nonce 1
        oracle.submitAlert(ALERT_ID, WebhookOracle.Action.LONG);
        WebhookOracle.AlertData memory alert1 = oracle.getAlert(ALERT_ID);
        assertEq(alert1.nonce, 1);
        
        // Second alert should have nonce 2
        oracle.submitAlert(ALERT_ID, WebhookOracle.Action.SHORT);
        WebhookOracle.AlertData memory alert2 = oracle.getAlert(ALERT_ID);
        assertEq(alert2.nonce, 2);
        
        // Third alert should have nonce 3
        oracle.submitAlert(ALERT_ID, WebhookOracle.Action.LONG);
        WebhookOracle.AlertData memory alert3 = oracle.getAlert(ALERT_ID);
        assertEq(alert3.nonce, 3);
    }

    function test_NonceEmittedInEvent() public {        
        // First alert - expect nonce 1
        vm.expectEmit(true, false, false, true);
        emit WebhookOracle.AlertSubmitted(ALERT_ID, WebhookOracle.Action.LONG, uint32(block.timestamp), 1);
        oracle.submitAlert(ALERT_ID, WebhookOracle.Action.LONG);
        
        // Second alert - expect nonce 2
        vm.expectEmit(true, false, false, true);
        emit WebhookOracle.AlertSubmitted(ALERT_ID, WebhookOracle.Action.SHORT, uint32(block.timestamp), 2);
        oracle.submitAlert(ALERT_ID, WebhookOracle.Action.SHORT);
    }

    function test_IndependentNoncesPerAlertId() public {
        bytes16 alertId2 = 0x44444444444444444444444444444444;
        
        // Submit alerts for different IDs
        oracle.submitAlert(ALERT_ID, WebhookOracle.Action.LONG);
        oracle.submitAlert(alertId2, WebhookOracle.Action.SHORT);
        oracle.submitAlert(ALERT_ID, WebhookOracle.Action.SHORT);
        oracle.submitAlert(alertId2, WebhookOracle.Action.LONG);
        
        // Check nonces are independent
        WebhookOracle.AlertData memory alert1 = oracle.getAlert(ALERT_ID);
        WebhookOracle.AlertData memory alert2 = oracle.getAlert(alertId2);
        
        assertEq(alert1.nonce, 2); // alertId1 submitted twice
        assertEq(alert2.nonce, 2); // alertId2 submitted twice
    }

    function test_NoncePreservesOtherAlertData() public {
        // Submit first alert
        oracle.submitAlert(ALERT_ID, WebhookOracle.Action.LONG);
        WebhookOracle.AlertData memory alert1 = oracle.getAlert(ALERT_ID);
        uint32 firstTimestamp = alert1.timestamp;
        
        // Wait a bit and submit second alert
        vm.warp(block.timestamp + 100);
        oracle.submitAlert(ALERT_ID, WebhookOracle.Action.SHORT);
        WebhookOracle.AlertData memory alert2 = oracle.getAlert(ALERT_ID);
        
        // Verify nonce incremented but other data updated correctly
        assertEq(alert2.nonce, 2);
        assertEq(alert2.alertId, ALERT_ID);
        assertTrue(alert2.action == WebhookOracle.Action.SHORT);
        assertTrue(alert2.timestamp > firstTimestamp);
        assertEq(alert2.timestamp, uint32(block.timestamp));
    }
}