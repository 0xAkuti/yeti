// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {WebhookOracle} from "./WebhookOracle.sol";
import {StrategyExtension} from "./StrategyExtension.sol";
import "limit-order-protocol/interfaces/IPreInteraction.sol";
import "limit-order-protocol/interfaces/IOrderMixin.sol";

contract StrategyInteraction is IPreInteraction {
    StrategyExtension public immutable strategyExtension;
    WebhookOracle public immutable webhookOracle;

    error PreInteractionFailed(string reason);

    event StateRecorded(bytes16 indexed alertId, WebhookOracle.Action action, uint256 amount);

    constructor(address _strategyExtension, address _webhookOracle) {
        strategyExtension = StrategyExtension(_strategyExtension);
        webhookOracle = WebhookOracle(_webhookOracle);
    }

    function preInteraction(
        IOrderMixin.Order calldata order,
        bytes calldata extension,
        bytes32 orderHash,
        address taker,
        uint256 makingAmount,
        uint256 takingAmount,
        uint256 remainingMakingAmount,
        bytes calldata extraData
    ) external {
        // Strategy data is passed in the preInteractionData
        (bytes16 alertId, WebhookOracle.Action expectedAction,) = 
            abi.decode(extraData, (bytes16, WebhookOracle.Action, uint32));

        // Record all state changes BEFORE any token transfers (CEI pattern)
        // Record what the USER RECEIVES (makingAmount), not what taker takes
        try strategyExtension.recordExecution(alertId, expectedAction, makingAmount) {
            emit StateRecorded(alertId, expectedAction, makingAmount);
        } catch Error(string memory reason) {
            revert PreInteractionFailed(reason);
        } catch {
            revert PreInteractionFailed("Failed to record execution state");
        }
    }
}