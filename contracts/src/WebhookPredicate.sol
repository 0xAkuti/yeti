// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {WebhookOracle} from "./WebhookOracle.sol";

/**
 * @title WebhookPredicate
 * @author akuti
 * @notice Predicate contract for validating webhook alert conditions in 1inch limit order protocol.
 *   Built for EthGlobal Unite DeFi hackathon.
 * @dev This contract serves as a validation layer that checks if webhook alerts meet specific
 *   criteria before allowing order execution. It validates alert existence, action matching,
 *   and freshness based on a configurable maximum age.
 */
contract WebhookPredicate {
    /*  
    ┌──────────────────────────────────────────────────────────────────────────╮
    │                               immutables                                 │
    ╰──────────────────────────────────────────────────────────────────────────┘
    */

    /// @notice The WebhookOracle contract that stores alert data
    WebhookOracle public immutable oracle;
    
    /// @notice Maximum age in seconds for alerts to be considered valid
    uint256 public immutable maxAge;

    /*  
    ┌──────────────────────────────────────────────────────────────────────────╮
    │                               constructor                                │
    ╰──────────────────────────────────────────────────────────────────────────┘
    */

    /**
     * @notice Initializes the WebhookPredicate contract.
     * @dev Sets the oracle address and maximum alert age for validation.
     * @param _oracle Address of the WebhookOracle contract to read alerts from
     * @param _maxAge Maximum age in seconds for alerts to be considered valid
     */
    constructor(address _oracle, uint256 _maxAge) {
        oracle = WebhookOracle(_oracle);
        maxAge = _maxAge;
    }

    /*  
    ┌──────────────────────────────────────────────────────────────────────────╮
    │                         external view functions                          │
    ╰──────────────────────────────────────────────────────────────────────────┘
    */

    /**
     * @notice Validates whether an alert meets the specified conditions for order execution.
     * @dev Performs comprehensive validation of alert data including existence, action matching,
     *   and freshness. All conditions must be satisfied for the predicate to return true.
     * 
     * Validation checks:
     * 1. Alert exists (timestamp > 0)
     * 2. Alert action matches expected action
     * 3. Alert is not older than maxAge seconds
     * 
     * @param alertId The unique identifier of the alert to validate
     * @param expectedAction The required trading action for validation to pass
     * @return bool True if all validation conditions are met, false otherwise
     */
    function checkPredicate(bytes16 alertId, WebhookOracle.Action expectedAction) external view returns (bool) {
        WebhookOracle.AlertData memory alert = oracle.getAlert(alertId);
        
        // Check if alert exists (timestamp of 0 indicates no alert submitted)
        if (alert.timestamp == 0) {
            return false;
        }
        
        // Check if alert action matches expected action
        if (alert.action != expectedAction) {
            return false; 
        }
        
        // Check if alert is still fresh (not older than maxAge)
        if (block.timestamp > alert.timestamp + maxAge) {
            return false;
        }
        
        return true;
    }
}