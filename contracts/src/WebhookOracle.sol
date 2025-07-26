// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {OwnableRoles} from "solady/auth/OwnableRoles.sol";

contract WebhookOracle is OwnableRoles {
    struct AlertData {
        uint256 timestamp;
        string alertId;
        string action;
    }

    mapping(uint256 => AlertData) public alerts;
    uint256 public alertCount;
    
    uint256 public constant SUBMITTER_ROLE = _ROLE_0;

    event AlertSubmitted(
        uint256 indexed index,
        string alertId,
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
        alerts[alertCount] = AlertData({
            timestamp: block.timestamp,
            alertId: _alertId,
            action: _action
        });

        emit AlertSubmitted(alertCount, _alertId, _action, block.timestamp);
        alertCount++;
    }

    function getAlert(uint256 _index) external view returns (AlertData memory) {
        require(_index < alertCount, "Alert does not exist");
        return alerts[_index];
    }

    function getLatestAlert() external view returns (AlertData memory) {
        require(alertCount > 0, "No alerts submitted");
        return alerts[alertCount - 1];
    }

    function getAllAlerts() external view returns (AlertData[] memory) {
        AlertData[] memory allAlerts = new AlertData[](alertCount);
        for (uint256 i = 0; i < alertCount; i++) {
            allAlerts[i] = alerts[i];
        }
        return allAlerts;
    }
}