// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

/**
 * @title Errors library
 * @author STFIL
 * @notice Defines the error messages emitted by the different contracts of the NFT protocol
 * @dev Error messages prefix glossary:
 *  - WL = Whitelist
 *  - SJ = StableJumper
 *  - RS = ReferralStorage
 *  - MATH = Math libraries
 *  - P = Provider
 */
library Errors {
  //contract specific errors
  string public constant WL_INVALID_PERMISSIONS = '300';

  string public constant SJ_INVALID_ADDRESS = '301';
  string public constant SJ_ALREADY_MINT = '302';
  string public constant SJ_MUST_BE_WHITELISTED = '303';
  string public constant SJ_PUBLIC_SALE_NOT_OPEN = '304';
  string public constant SJ_MINT_PRICE_ERROR = '305';
  string public constant SJ_MINT_QUANTITY_EXCEEDED = '306';
  string public constant SJ_MAX_SUPPLY_EXCEEDED = '307';
  string public constant SJ_INVALID_POOL_ADDRESS = '308';
  string public constant SJ_STFIL_POOL_CALL_FAILED = '309';
  string public constant SJ_WRONG_PERCENTAGE_RANGE = '310';
  string public constant SJ_MIN_POWER_MORE_HALF_MAX_POWER = '311';

  string public constant RS_INVALID_ADDRESS = '312';
  string public constant RS_REFERRAL_CODE_MUST_BE_IN_THE_RANGE = '313';
  string public constant RS_REFERRAL_CODE_ALREADY_EXIST = '314';
  string public constant RS_REFERRAL_CODE_NUM_LIMITED = '315';

  string public constant MATH_MULTIPLICATION_OVERFLOW = '316';
  string public constant MATH_DIVISION_BY_ZERO = '317';

  string public constant VL_PROXY_CONTRACT_UNINITIALIZED = '318';
  string public constant P_IMPL_GET_FAIL = '319';
}
