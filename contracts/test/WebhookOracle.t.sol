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
        assertEq(oracle.alertCount(), 0);
        assertTrue(oracle.hasAnyRole(owner, oracle.SUBMITTER_ROLE()));
    }

    function test_SubmitAlert() public {
        string memory alertId = "alert_123";
        string memory action = "block_transaction";
        
        oracle.submitAlert(alertId, action);
        
        assertEq(oracle.alertCount(), 1);
        
        WebhookOracle.AlertData memory alert = oracle.getAlert(0);
        assertEq(alert.alertId, alertId);
        assertEq(alert.action, action);
        assertTrue(alert.timestamp > 0);
    }

    function test_AddAuthorizedSubmitter() public {
        oracle.addAuthorizedSubmitter(user1);
        assertTrue(oracle.hasAnyRole(user1, oracle.SUBMITTER_ROLE()));
        
        vm.prank(user1);
        oracle.submitAlert("test_alert", "test_action");
        
        assertEq(oracle.alertCount(), 1);
    }

    function test_RemoveAuthorizedSubmitter() public {
        oracle.addAuthorizedSubmitter(user1);
        oracle.removeAuthorizedSubmitter(user1);
        assertFalse(oracle.hasAnyRole(user1, oracle.SUBMITTER_ROLE()));
        
        vm.expectRevert();
        vm.prank(user1);
        oracle.submitAlert("test_alert", "test_action");
    }

    function test_UnauthorizedSubmission() public {
        vm.expectRevert();
        vm.prank(user1);
        oracle.submitAlert("test_alert", "test_action");
    }

    function test_GetLatestAlert() public {
        oracle.submitAlert("alert_1", "action_1");
        oracle.submitAlert("alert_2", "action_2");
        
        WebhookOracle.AlertData memory latest = oracle.getLatestAlert();
        assertEq(latest.alertId, "alert_2");
        assertEq(latest.action, "action_2");
    }

    function test_GetAllAlerts() public {
        oracle.submitAlert("alert_1", "action_1");
        oracle.submitAlert("alert_2", "action_2");
        
        WebhookOracle.AlertData[] memory allAlerts = oracle.getAllAlerts();
        assertEq(allAlerts.length, 2);
        assertEq(allAlerts[0].alertId, "alert_1");
        assertEq(allAlerts[1].alertId, "alert_2");
    }

    function test_AlertSubmittedEvent() public {
        string memory alertId = "event_test";
        string memory action = "test_action";
        
        vm.expectEmit(true, false, false, true);
        emit WebhookOracle.AlertSubmitted(0, alertId, action, block.timestamp);
        
        oracle.submitAlert(alertId, action);
    }
}