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
    }

    function test_OverwriteAlert() public {
        // 12345678-1234-5678-1234-567812345678
        bytes16 alertId = 0x12345678123456781234567812345678;
        
        oracle.submitAlert(alertId, WebhookOracle.Action.SHORT);
        oracle.submitAlert(alertId, WebhookOracle.Action.LONG);
        
        WebhookOracle.AlertData memory alert = oracle.getAlert(alertId);
        assertEq(alert.alertId, alertId);
        assertTrue(alert.action == WebhookOracle.Action.LONG);
    }

    function test_AlertSubmittedEvent() public {
        // a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
        bytes16 alertId = 0xa0eebc999c0b4ef8bb6d6bb9bd380a11;
        WebhookOracle.Action action = WebhookOracle.Action.SHORT;
        
        vm.expectEmit(true, false, false, true);
        emit WebhookOracle.AlertSubmitted(alertId, action, uint32(block.timestamp));
        
        oracle.submitAlert(alertId, action);
    }
}