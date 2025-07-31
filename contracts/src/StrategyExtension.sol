// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {WebhookOracle} from "./WebhookOracle.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "limit-order-protocol/interfaces/IOrderMixin.sol";
import "limit-order-protocol/interfaces/IAmountGetter.sol";
import "limit-order-protocol/libraries/MakerTraitsLib.sol";
import "@1inch/solidity-utils/contracts/libraries/AddressLib.sol";

contract StrategyExtension is IAmountGetter {
    using SafeCast for int256;
    using AddressLib for Address;

    error StrategyInactive();
    error InvalidNonceSequence();
    error StaleAlert();
    error WrongActionType();
    error StaleOraclePrice();
    error InvalidExecutionHistory();

    struct StrategyState {
        uint32 lastExecutedNonce;
        bool isActive;
        uint256 lastBuyAmount;     // ETH amount received from last BUY execution
        uint256 lastSellAmount;    // USDC amount received from last SELL execution
    }

    struct ChainlinkConfig {
        AggregatorV3Interface oracle;
        bool inverse;
        uint256 spread;
        uint256 decimalsScale;
    }

    WebhookOracle public immutable webhookOracle;
    uint256 public immutable maxAlertAge;
    uint256 private constant _SPREAD_DENOMINATOR = 1e9;
    uint256 private constant _ORACLE_TTL = 4 hours;

    mapping(bytes16 => StrategyState) public strategies;
    mapping(bytes16 => ChainlinkConfig) public chainlinkConfigs;

    event StrategyActivated(bytes16 indexed alertId);
    event StrategyDeactivated(bytes16 indexed alertId, string reason);
    event OrderExecuted(bytes16 indexed alertId, WebhookOracle.Action action, uint256 amount, uint256 price);

    constructor(address _webhookOracle, uint256 _maxAlertAge) {
        webhookOracle = WebhookOracle(_webhookOracle);
        maxAlertAge = _maxAlertAge;
    }

    function initializeStrategy(
        bytes16 alertId,
        AggregatorV3Interface oracle,
        bool inverse,
        uint256 spread,
        uint256 decimalsScale
    ) external {
        strategies[alertId] = StrategyState({
            lastExecutedNonce: 0,
            isActive: true,
            lastBuyAmount: 0,
            lastSellAmount: 0
        });

        chainlinkConfigs[alertId] = ChainlinkConfig({
            oracle: oracle,
            inverse: inverse,
            spread: spread,
            decimalsScale: decimalsScale
        });

        emit StrategyActivated(alertId);
    }

    function getMakingAmount(
        IOrderMixin.Order calldata order,
        bytes calldata extension,
        bytes32 orderHash,
        address taker,
        uint256 takingAmount,
        uint256 remainingMakingAmount,
        bytes calldata extraData
    ) external view returns (uint256) {
        (bytes16 alertId, WebhookOracle.Action expectedAction, uint32 expectedNonce) = 
            abi.decode(extraData, (bytes16, WebhookOracle.Action, uint32));
            
        _validateExecution(alertId, expectedAction, expectedNonce);
        
        // Calculate makingAmount based on Chainlink pricing and current takingAmount
        return _getChainlinkAmount(takingAmount, chainlinkConfigs[alertId]);
    }

    function getTakingAmount(
        IOrderMixin.Order calldata order,
        bytes calldata extension,
        bytes32 orderHash,
        address taker,
        uint256 makingAmount,
        uint256 remainingMakingAmount,
        bytes calldata extraData
    ) external view returns (uint256) {
        (bytes16 alertId, WebhookOracle.Action expectedAction, uint32 expectedNonce) = 
            abi.decode(extraData, (bytes16, WebhookOracle.Action, uint32));
            
        _validateExecution(alertId, expectedAction, expectedNonce);
        
        StrategyState storage strategy = strategies[alertId];
        
        // Return the exact amount from previous execution
        if (expectedAction == WebhookOracle.Action.LONG && strategy.lastSellAmount > 0) {
            // BUY: spend exactly what we got from previous SELL
            return strategy.lastSellAmount;
        } else if (expectedAction == WebhookOracle.Action.SHORT && strategy.lastBuyAmount > 0) {
            // SELL: sell exactly what we got from previous BUY
            return strategy.lastBuyAmount;
        }
        
        // First execution: use order's base takingAmount
        return order.takingAmount;
    }

    function validateExecution(
        bytes16 alertId,
        WebhookOracle.Action expectedAction,
        uint32 expectedNonce
    ) external view returns (bool) {
        try this._validateExecution(alertId, expectedAction, expectedNonce) {
            return true;
        } catch {
            return false;
        }
    }

    function _validateExecution(
        bytes16 alertId,
        WebhookOracle.Action expectedAction,
        uint32 expectedNonce
    ) public view {
        StrategyState storage strategy = strategies[alertId];
        
        if (!strategy.isActive) revert StrategyInactive();
        
        WebhookOracle.AlertData memory alert = webhookOracle.getAlert(alertId);
        
        if (alert.nonce != expectedNonce) revert InvalidNonceSequence();
        if (alert.action != expectedAction) revert WrongActionType();
        if (block.timestamp > alert.timestamp + maxAlertAge) revert StaleAlert();
    }


    function _getChainlinkAmount(uint256 amount, ChainlinkConfig memory config) internal view returns (uint256) {
        (, int256 latestAnswer,, uint256 updatedAt,) = config.oracle.latestRoundData();
        
        if (updatedAt + _ORACLE_TTL < block.timestamp) revert StaleOraclePrice();
        
        if (config.inverse) {
            return config.spread * amount * (10 ** config.oracle.decimals()) / latestAnswer.toUint256() / _SPREAD_DENOMINATOR;
        } else {
            return config.spread * amount * latestAnswer.toUint256() / (10 ** config.oracle.decimals()) / _SPREAD_DENOMINATOR;
        }
    }

    function recordExecution(
        bytes16 alertId,
        WebhookOracle.Action action,
        uint256 amount
    ) external {
        StrategyState storage strategy = strategies[alertId];
        
        if (!strategy.isActive) revert StrategyInactive();
        
        WebhookOracle.AlertData memory alert = webhookOracle.getAlert(alertId);
        
        if (alert.nonce != strategy.lastExecutedNonce + 1) {
            strategy.isActive = false;
            emit StrategyDeactivated(alertId, "Nonce sequence broken");
            revert InvalidNonceSequence();
        }
        
        strategy.lastExecutedNonce = alert.nonce;
        
        // Record execution amounts - price can be calculated if needed but not required for state
        if (action == WebhookOracle.Action.LONG) {
            strategy.lastBuyAmount = amount;
        } else if (action == WebhookOracle.Action.SHORT) {
            strategy.lastSellAmount = amount;
        }
        
        emit OrderExecuted(alertId, action, amount, 0); // Price can be calculated elsewhere if needed
    }

    function deactivateStrategy(bytes16 alertId, string calldata reason) external {
        strategies[alertId].isActive = false;
        emit StrategyDeactivated(alertId, reason);
    }

    function getStrategyState(bytes16 alertId) external view returns (StrategyState memory) {
        return strategies[alertId];
    }
}