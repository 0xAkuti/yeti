// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {WebhookOracle} from "./WebhookOracle.sol";

contract WebhookPredicate {
    WebhookOracle public immutable oracle;
    uint256 public immutable maxAge;

    constructor(address _oracle, uint256 _maxAge) {
        oracle = WebhookOracle(_oracle);
        maxAge = _maxAge;
    }

    function checkPredicate(bytes16 alertId, WebhookOracle.Action expectedAction) external view returns (bool) {
        WebhookOracle.AlertData memory alert = oracle.getAlert(alertId);
        
        if (alert.timestamp == 0) {
            return false;
        }
        
        if (alert.action != expectedAction) {
            return false; 
        }
        
        if (block.timestamp > alert.timestamp + maxAge) {
            return false;
        }
        
        return true;
    }
}