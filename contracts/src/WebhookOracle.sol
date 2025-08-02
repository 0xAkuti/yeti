// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {OwnableRoles} from "solady/auth/OwnableRoles.sol";

/**
 * @title WebhookOracle
 * @author akuti
 * @notice Oracle contract for receiving and storing trading alert data from external webhook sources.
 *   Built for EthGlobal Unite DeFi hackathon for use with 1inch limit order protocol.
 * @dev This contract serves as a trusted data source for trading strategies by storing timestamped
 *   trading alerts with actions (NONE, SHORT, LONG) and maintaining nonce-based sequencing.
 *   Uses role-based access control to restrict alert submission to authorized submitters.
 */
contract WebhookOracle is OwnableRoles {
    /**
     * @notice Represents the trading action associated with an alert.
     * @dev NONE indicates no action, SHORT indicates a short position, LONG indicates a long position.
     */
    enum Action {
        NONE,
        SHORT,
        LONG
    }

    /**
     * @notice Contains all data for a trading alert.
     * @dev Packed struct optimized for storage efficiency (32 bytes total).
     * @param alertId Unique identifier for the alert (16 bytes UUID)
     * @param timestamp Block timestamp when the alert was submitted
     * @param action Trading action type (NONE/SHORT/LONG)
     * @param nonce Sequence counter for this alert ID to prevent replay attacks
     */
    struct AlertData {
        bytes16 alertId;    // 16 bytes - UUID raw bytes
        uint32 timestamp;   // 4 bytes - block timestamp
        Action action;      // 1 byte - NONE/SHORT/LONG
        uint32 nonce;       // 4 bytes - strategy sequence counter
        // 7 bytes remaining for future use
    }

    /*  
    ┌──────────────────────────────────────────────────────────────────────────╮
    │                                 storage                                  │
    ╰──────────────────────────────────────────────────────────────────────────┘
    */

    /// @notice Mapping from alert ID to alert data
    mapping(bytes16 => AlertData) public alerts;
    
    /// @notice Role identifier for addresses authorized to submit alerts
    uint256 public constant SUBMITTER_ROLE = _ROLE_0;

    /*  
    ┌──────────────────────────────────────────────────────────────────────────╮
    │                                 events                                   │
    ╰──────────────────────────────────────────────────────────────────────────┘
    */

    /**
     * @notice Emitted when a new alert is successfully submitted.
     * @param alertId The unique identifier of the submitted alert
     * @param action The trading action associated with the alert
     * @param timestamp The block timestamp when the alert was submitted
     * @param nonce The sequence number for this alert ID
     */
    event AlertSubmitted(
        bytes16 indexed alertId,
        Action action,
        uint32 timestamp,
        uint32 nonce
    );

    /*  
    ┌──────────────────────────────────────────────────────────────────────────╮
    │                               modifiers                                 │
    ╰──────────────────────────────────────────────────────────────────────────┘
    */

    /**
     * @notice Restricts function access to addresses with SUBMITTER_ROLE or the contract owner.
     * @dev Uses OwnableRoles internal function to check permissions.
     */
    modifier onlySubmitter() {
        _checkRolesOrOwner(SUBMITTER_ROLE);
        _;
    }

    /*  
    ┌──────────────────────────────────────────────────────────────────────────╮
    │                               constructor                                │
    ╰──────────────────────────────────────────────────────────────────────────┘
    */

    /**
     * @notice Initializes the WebhookOracle contract.
     * @dev Sets the deployer as both owner.
     */
    constructor() {
        _initializeOwner(msg.sender);
    }

    /*  
    ┌──────────────────────────────────────────────────────────────────────────╮
    │                            external functions                            │
    ╰──────────────────────────────────────────────────────────────────────────┘
    */

    /**
     * @notice Grants SUBMITTER_ROLE to a new address.
     * @dev Only the contract owner can add new authorized submitters.
     * @param _submitter The address to grant submission privileges to
     */
    function addAuthorizedSubmitter(address _submitter) external onlyOwner {
        _grantRoles(_submitter, SUBMITTER_ROLE);
    }

    /**
     * @notice Revokes SUBMITTER_ROLE from an address.
     * @dev Only the contract owner can remove authorized submitters.
     * @param _submitter The address to revoke submission privileges from
     */
    function removeAuthorizedSubmitter(address _submitter) external onlyOwner {
        _removeRoles(_submitter, SUBMITTER_ROLE);
    }

    /**
     * @notice Submits a new trading alert to the oracle.
     * @dev Increments the nonce for the given alert ID and stores the alert data.
     *   The nonce provides protection against replay attacks and ensures proper sequencing.
     * 
     * Requirements:
     * - Caller must have SUBMITTER_ROLE or be the contract owner
     * 
     * @param _alertId Unique identifier for this alert (typically a UUID)
     * @param _action The trading action to associate with this alert
     */
    function submitAlert(
        bytes16 _alertId,
        Action _action
    ) external onlySubmitter {
        AlertData storage currentAlert = alerts[_alertId];
        uint32 newNonce = currentAlert.nonce + 1;
        
        alerts[_alertId] = AlertData({
            alertId: _alertId,
            timestamp: uint32(block.timestamp),
            action: _action,
            nonce: newNonce
        });

        emit AlertSubmitted(_alertId, _action, uint32(block.timestamp), newNonce);
    }

    /*  
    ┌──────────────────────────────────────────────────────────────────────────╮
    │                         external view functions                          │
    ╰──────────────────────────────────────────────────────────────────────────┘
    */

    /**
     * @notice Retrieves the complete alert data for a given alert ID.
     * @dev Returns the full AlertData struct. If the alert doesn't exist,
     *   returns a struct with zero values.
     * @param _alertId The unique identifier of the alert to retrieve
     * @return AlertData struct containing all alert information
     */
    function getAlert(bytes16 _alertId) external view returns (AlertData memory) {
        return alerts[_alertId];
    }

    /**
     * @notice Retrieves the current nonce for a given alert ID.
     * @dev Returns 0 if no alert has been submitted for this ID yet.
     *   The nonce increments with each new alert submission for the same ID.
     * @param _alertId The unique identifier of the alert
     * @return uint32 The current nonce value for this alert ID
     */
    function getCurrentNonce(bytes16 _alertId) external view returns (uint32) {
        return alerts[_alertId].nonce;
    }

}