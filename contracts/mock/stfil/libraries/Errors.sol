// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

/**
 * @title Errors library
 * @author STFIL
 * @notice Defines the error messages emitted by the different contracts of the STFIL protocol
 * @dev Error messages prefix glossary:
 *  - VL = ValidationLogic
 *  - MATH = Math libraries
 *  - CT = Common errors between tokens (STFIL, VariableDebtToken and StableDebtToken)
 *  - SDT = StableDebtToken
 *  - VDT = VariableDebtToken
 *  - LP = StakingPool
 *  - LPC = StakingPoolConfiguration
 *  - RL = PoolReserveLogic
 *  - NC = NodeConfiguration
 *  - PC = PoolConfiguration
 *  - N = Storage Provider Node
 *  - P = Provider
 */
library Errors {

  //common errors
  string public constant CALLER_NOT_POOL_ADMIN = '50'; // 'The caller must be the pool admin'

  //contract specific errors
  string public constant VL_INVALID_AMOUNT = '51'; // 'Amount must be greater than 0'
  string public constant VL_INVALID_AVAILABLE_AMOUNT = '52'; // 'Node available amount must be greater than 0'
  string public constant VL_INVALID_ACTUAL_WITHDRAW_AMOUNT = '53'; // 'Node actual withdraw amount must be greater than 0'
  string public constant VL_AMOUNT_AT_LEAST_MIN_STAKE_FIL = '54';
  string public constant VL_AMOUNT_AT_LEAST_MIN_FIL_BORROW_AMOUNT = '55';
  string public constant VL_AMOUNT_NOT_EXCEED_ASSET = '56';
  string public constant VL_AMOUNT_NOT_EXCEED_MAX_BORROWING_AMOUNT = '57';
  string public constant VL_SAFETY_BUFFER_LIMIT = '58';
  string public constant VL_INVALID_BORROWING_AUTHENTICATION = '59';
  string public constant VL_NOT_ENOUGH_AVAILABLE_USER_BALANCE = '60';
  string public constant VL_INVALID_INTEREST_RATE_MODE_SELECTED = '61';
  string public constant VL_DEBT_RATE_MORE_THAN_LIQUIDATION_THRESHOLD = '62';
  string public constant VL_NO_DEBT = '63';
  string public constant VL_PROXY_CONTRACT_UNINITIALIZED = '64';
  string public constant VL_NON_CONTRACT_CALL = '65';
  string public constant VL_AVAILABLE_QUOTA_AT_LEAST_MAX_FIL_SUPPLY = '66';
  string public constant VL_EXIST_DEBT = '67';
  string public constant VL_DEBT_RATIO_TOO_HIGH = '68';
  string public constant VL_POSITION_EMPTY = '69';

  string public constant SP_IS_PAUSED = '70'; // 'Pool is paused'
  string public constant SP_CALLER_NOT_LENDING_POOL_CONFIGURATOR = '71'; // 'The caller of the function is not the staking pool configurator'

  string public constant SPC_CALLER_NOT_EMERGENCY_ADMIN = '72'; // 'The caller must be the emergency admin'

  string public constant MATH_MULTIPLICATION_OVERFLOW = '73';
  string public constant MATH_ADDITION_OVERFLOW = '74';
  string public constant MATH_DIVISION_BY_ZERO = '75';

  string public constant NC_INVALID_LEVERAGE = '76';
  string public constant NC_INVALID_LIQ_THRESHOLD = '77';

  string public constant PC_INVALID_FEE = '78';
  string public constant PC_INVALID_LIQUIDATION_FACTOR = '79';

  string public constant RL_LIQUIDITY_INDEX_OVERFLOW = '80'; //  Liquidity index overflows uint128
  string public constant RL_VARIABLE_BORROW_INDEX_OVERFLOW = '81'; //  Variable borrow index overflows uint128
  string public constant RL_LIQUIDITY_RATE_OVERFLOW = '82'; //  Liquidity rate overflows uint128
  string public constant RL_VARIABLE_BORROW_RATE_OVERFLOW = '83'; //  Variable borrow rate overflows uint128
  string public constant RL_STABLE_BORROW_RATE_OVERFLOW = '84'; //  Stable borrow rate overflows uint128
  string public constant RL_LIQUIDITY_INDEX_LESS_THEN_RAY = '85';

  string public constant CT_CALLER_MUST_BE_LENDING_POOL = '86'; // 'The caller of this function must be a staking pool'
  string public constant CT_INVALID_MINT_AMOUNT = '87';
  string public constant CT_INVALID_BURN_AMOUNT = '88';
  string public constant CT_INVALID_TREASURY_ADDRESS = '89';

  string public constant SDT_STABLE_DEBT_OVERFLOW = '90';

  string public constant N_SENDER_NOT_OWNER = '91';
  string public constant N_INVALID_BENEFICIARY_PROPOSAL = '92';
  string public constant N_INVALID_OWNER = '93';
  string public constant N_NOT_DELEGATED = '94';
  string public constant N_DELEGATED = '95';
  string public constant N_SENDER_NOT_OPERATOR = '96';
  string public constant N_EXIST_OTHER_BENEFICIARY = '97';
  string public constant N_INVALID_OWNER_PROPOSAL = '98';
  string public constant N_MUST_OWNER_ROLE = '99';

  string public constant P_IMPL_GET_FAIL = '100';

}
