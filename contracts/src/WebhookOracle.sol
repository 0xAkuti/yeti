// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {OwnableRoles} from "solady/auth/OwnableRoles.sol";

contract WebhookOracle is OwnableRoles {
    enum Action {
        NONE,
        SHORT,
        LONG
    }

    struct AlertData {
        bytes16 alertId;    // 16 bytes - UUID raw bytes
        uint32 timestamp;   // 4 bytes - block timestamp
        Action action;      // 1 byte - NONE/SHORT/LONG
        uint32 nonce;       // 4 bytes - strategy sequence counter
        // 7 bytes remaining for future use
    }

    mapping(bytes16 => AlertData) public alerts;
    
    uint256 public constant SUBMITTER_ROLE = _ROLE_0;

    event AlertSubmitted(
        bytes16 indexed alertId,
        Action action,
        uint32 timestamp,
        uint32 nonce
    );

    event StrategyReset(bytes16 indexed alertId);

    modifier onlySubmitter() {
        _checkRolesOrOwner(SUBMITTER_ROLE);
        _;
    }

    constructor() {
        _initializeOwner(msg.sender);
        _grantRoles(msg.sender, SUBMITTER_ROLE);
    }

    function addAuthorizedSubmitter(address _submitter) external onlyOwner {
        _grantRoles(_submitter, SUBMITTER_ROLE);
    }

    function removeAuthorizedSubmitter(address _submitter) external onlyOwner {
        _removeRoles(_submitter, SUBMITTER_ROLE);
    }

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

    function getAlert(bytes16 _alertId) external view returns (AlertData memory) {
        return alerts[_alertId];
    }

    function getCurrentNonce(bytes16 _alertId) external view returns (uint32) {
        return alerts[_alertId].nonce;
    }
}