// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {WebhookOracle} from "./WebhookOracle.sol";
import {StrategyExtension} from "./StrategyExtension.sol";

contract StrategyPredicate {
    WebhookOracle public immutable webhookOracle;
    StrategyExtension public immutable strategyExtension;
    uint256 public immutable maxAlertAge;

    constructor(address _webhookOracle, address _strategyExtension, uint256 _maxAlertAge) {
        webhookOracle = WebhookOracle(_webhookOracle);
        strategyExtension = StrategyExtension(_strategyExtension);
        maxAlertAge = _maxAlertAge;
    }

    function checkStrategy(
        bytes16 alertId, 
        WebhookOracle.Action expectedAction,
        uint32 expectedNonce
    ) external view returns (bool) {
        // Get current alert and strategy state
        WebhookOracle.AlertData memory alert = webhookOracle.getAlert(alertId);
        StrategyExtension.StrategyState memory strategy = strategyExtension.getStrategyState(alertId);
        
        // Check all conditions that must be true for order execution:
        // 1. Strategy is active
        if (!strategy.isActive) return false;
        
        // 2. Alert exists (timestamp > 0)
        if (alert.timestamp == 0) return false;
        
        // 3. Alert action matches expected action
        if (alert.action != expectedAction) return false;
        
        // 4. Alert nonce matches expected nonce (sequence integrity)
        if (alert.nonce != expectedNonce) return false;
        
        // 5. Alert is not too old
        if (block.timestamp > alert.timestamp + maxAlertAge) return false;
        
        return true;
    }
}