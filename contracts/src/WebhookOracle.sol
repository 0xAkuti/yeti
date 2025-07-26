// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {OwnableRoles} from "solady/auth/OwnableRoles.sol";

contract WebhookOracle is OwnableRoles {
    struct AlertData {
        uint256 timestamp;
        string alertId;
        string action;
    }

    mapping(string => AlertData) public alerts;
    
    uint256 public constant SUBMITTER_ROLE = _ROLE_0;

    event AlertSubmitted(
        string indexed alertId,
        string action,
        uint256 timestamp
    );

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
        string calldata _alertId,
        string calldata _action
    ) external onlySubmitter {
        alerts[_alertId] = AlertData({
            timestamp: block.timestamp,
            alertId: _alertId,
            action: _action
        });

        emit AlertSubmitted(_alertId, _action, block.timestamp);
    }

    function getAlert(string calldata _alertId) external view returns (AlertData memory) {
        return alerts[_alertId];
    }
}