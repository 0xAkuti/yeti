// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {WebhookOracle} from "../src/WebhookOracle.sol";

contract WebhookOracleTest is Test {
    WebhookOracle public oracle;
    address public owner;
    address public user1;
    address public user2;

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
        // 550e8400-e29b-41d4-a716-446655440000
        bytes16 alertId = 0x550e8400e29b41d4a716446655440000;
        WebhookOracle.Action action = WebhookOracle.Action.SHORT;
        
        oracle.submitAlert(alertId, action);
        
        WebhookOracle.AlertData memory alert = oracle.getAlert(alertId);
        assertEq(alert.alertId, alertId);
        assertTrue(alert.action == action);
        assertTrue(alert.timestamp > 0);
        assertEq(alert.nonce, 1);
    }

    function test_AddAuthorizedSubmitter() public {
        oracle.addAuthorizedSubmitter(user1);
        assertTrue(oracle.hasAnyRole(user1, oracle.SUBMITTER_ROLE()));
        
        // 6ba7b810-9dad-11d1-80b4-00c04fd430c8
        bytes16 alertId = 0x6ba7b8109dad11d180b400c04fd430c8;
        
        vm.prank(user1);
        oracle.submitAlert(alertId, WebhookOracle.Action.LONG);
        
        WebhookOracle.AlertData memory alert = oracle.getAlert(alertId);
        assertEq(alert.alertId, alertId);
        assertTrue(alert.action == WebhookOracle.Action.LONG);
        assertEq(alert.nonce, 1);
    }

    function test_RemoveAuthorizedSubmitter() public {
        oracle.addAuthorizedSubmitter(user1);
        oracle.removeAuthorizedSubmitter(user1);
        assertFalse(oracle.hasAnyRole(user1, oracle.SUBMITTER_ROLE()));
        
        // f47ac10b-58cc-4372-a567-0e02b2c3d479
        bytes16 alertId = 0xf47ac10b58cc4372a5670e02b2c3d479;
        
        vm.expectRevert();
        vm.prank(user1);
        oracle.submitAlert(alertId, WebhookOracle.Action.SHORT);
    }

    function test_UnauthorizedSubmission() public {
        // 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
        bytes16 alertId = 0x9b1deb4d3b7d4bad9bdd2b0d7b3dcb6d;
        
        vm.expectRevert();
        vm.prank(user1);
        oracle.submitAlert(alertId, WebhookOracle.Action.SHORT);
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
        // 12345678-1234-5678-1234-567812345678
        bytes16 alertId = 0x12345678123456781234567812345678;
        
        oracle.submitAlert(alertId, WebhookOracle.Action.SHORT);
        oracle.submitAlert(alertId, WebhookOracle.Action.LONG);
        
        WebhookOracle.AlertData memory alert = oracle.getAlert(alertId);
        assertEq(alert.alertId, alertId);
        assertTrue(alert.action == WebhookOracle.Action.LONG);
        assertEq(alert.nonce, 2); // Should be 2 after overwrite
    }

    function test_AlertSubmittedEvent() public {
        // a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
        bytes16 alertId = 0xa0eebc999c0b4ef8bb6d6bb9bd380a11;
        WebhookOracle.Action action = WebhookOracle.Action.SHORT;
        
        vm.expectEmit(true, false, false, true);
        emit WebhookOracle.AlertSubmitted(alertId, action, uint32(block.timestamp), 1);
        
        oracle.submitAlert(alertId, action);
    }

    // === Nonce Feature Tests ===

    function test_NonceIncrementsOnNewAlert() public {
        bytes16 alertId = 0x11111111111111111111111111111111;
        
        // First alert should have nonce 1
        oracle.submitAlert(alertId, WebhookOracle.Action.LONG);
        WebhookOracle.AlertData memory alert1 = oracle.getAlert(alertId);
        assertEq(alert1.nonce, 1);
        
        // Second alert should have nonce 2
        oracle.submitAlert(alertId, WebhookOracle.Action.SHORT);
        WebhookOracle.AlertData memory alert2 = oracle.getAlert(alertId);
        assertEq(alert2.nonce, 2);
        
        // Third alert should have nonce 3
        oracle.submitAlert(alertId, WebhookOracle.Action.LONG);
        WebhookOracle.AlertData memory alert3 = oracle.getAlert(alertId);
        assertEq(alert3.nonce, 3);
    }

    function test_NonceEmittedInEvent() public {
        bytes16 alertId = 0x22222222222222222222222222222222;
        
        // First alert - expect nonce 1
        vm.expectEmit(true, false, false, true);
        emit WebhookOracle.AlertSubmitted(alertId, WebhookOracle.Action.LONG, uint32(block.timestamp), 1);
        oracle.submitAlert(alertId, WebhookOracle.Action.LONG);
        
        // Second alert - expect nonce 2
        vm.expectEmit(true, false, false, true);
        emit WebhookOracle.AlertSubmitted(alertId, WebhookOracle.Action.SHORT, uint32(block.timestamp), 2);
        oracle.submitAlert(alertId, WebhookOracle.Action.SHORT);
    }

    function test_IndependentNoncesPerAlertId() public {
        bytes16 alertId1 = 0x33333333333333333333333333333333;
        bytes16 alertId2 = 0x44444444444444444444444444444444;
        
        // Submit alerts for different IDs
        oracle.submitAlert(alertId1, WebhookOracle.Action.LONG);
        oracle.submitAlert(alertId2, WebhookOracle.Action.SHORT);
        oracle.submitAlert(alertId1, WebhookOracle.Action.SHORT);
        oracle.submitAlert(alertId2, WebhookOracle.Action.LONG);
        
        // Check nonces are independent
        WebhookOracle.AlertData memory alert1 = oracle.getAlert(alertId1);
        WebhookOracle.AlertData memory alert2 = oracle.getAlert(alertId2);
        
        assertEq(alert1.nonce, 2); // alertId1 submitted twice
        assertEq(alert2.nonce, 2); // alertId2 submitted twice
    }




    function test_NonceConsistencyAfterActionChange() public {
        bytes16 alertId = 0x99999999999999999999999999999999;
        
        // Submit different actions - nonce should still increment
        oracle.submitAlert(alertId, WebhookOracle.Action.LONG);
        assertEq(oracle.getAlert(alertId).nonce, 1);
        assertTrue(oracle.getAlert(alertId).action == WebhookOracle.Action.LONG);
        
        oracle.submitAlert(alertId, WebhookOracle.Action.SHORT);
        assertEq(oracle.getAlert(alertId).nonce, 2);
        assertTrue(oracle.getAlert(alertId).action == WebhookOracle.Action.SHORT);
        
        oracle.submitAlert(alertId, WebhookOracle.Action.LONG);
        assertEq(oracle.getAlert(alertId).nonce, 3);
        assertTrue(oracle.getAlert(alertId).action == WebhookOracle.Action.LONG);
    }

    function test_NoncePreservesOtherAlertData() public {
        bytes16 alertId = 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa;
        
        // Submit first alert
        oracle.submitAlert(alertId, WebhookOracle.Action.LONG);
        WebhookOracle.AlertData memory alert1 = oracle.getAlert(alertId);
        uint32 firstTimestamp = alert1.timestamp;
        
        // Wait a bit and submit second alert
        vm.warp(block.timestamp + 100);
        oracle.submitAlert(alertId, WebhookOracle.Action.SHORT);
        WebhookOracle.AlertData memory alert2 = oracle.getAlert(alertId);
        
        // Verify nonce incremented but other data updated correctly
        assertEq(alert2.nonce, 2);
        assertEq(alert2.alertId, alertId);
        assertTrue(alert2.action == WebhookOracle.Action.SHORT);
        assertTrue(alert2.timestamp > firstTimestamp);
        assertEq(alert2.timestamp, uint32(block.timestamp));
    }
}