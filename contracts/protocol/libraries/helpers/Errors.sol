// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

/**
 * @title Errors library
 * @author FrogHub
 * @notice Defines the error messages emitted by the different contracts of the NFT protocol
 * @dev Error messages prefix glossary:
 *  - WL = Whitelist
 *  - DF = DigitalFrogs
 *  - RS = ReferralStorage
 *  - MATH = Math libraries
 */
library Errors {
  //contract specific errors
  string public constant WL_INVALID_PERMISSIONS = '50';

  string public constant DF_INVALID_ADDRESS = '51';
  string public constant DF_ALREADY_MINT = '52';
  string public constant DF_MUST_BE_WHITELISTED = '53';
  string public constant DF_PUBLIC_SALE_NOT_OPEN = '54';
  string public constant DF_MINT_PRICE_ERROR = '55';
  string public constant DF_MINT_QUANTITY_EXCEEDED = '56';
  string public constant DF_MAX_SUPPLY_EXCEEDED = '57';
  string public constant DF_INVALID_POOL_ADDRESS = '58';
  string public constant DF_STFIL_POOL_CALL_FAILED = '59';
  string public constant DF_WRONG_PERCENTAGE_RANGE = '60';

  string public constant RS_INVALID_ADDRESS = '61';
  string public constant RS_REFERRAL_CODE_MUST_BE_IN_THE_RANGE = '62';
  string public constant RS_REFERRAL_CODE_ALREADY_EXIST = '63';
  string public constant RS_REFERRAL_CODE_NUM_LIMITED = '64';

  string public constant MATH_MULTIPLICATION_OVERFLOW = '65';
  string public constant MATH_DIVISION_BY_ZERO = '66';
}
