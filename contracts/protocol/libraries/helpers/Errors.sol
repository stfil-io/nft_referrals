// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

/**
 * @title Errors library
 * @author FrogHub
 * @notice Defines the error messages emitted by the different contracts of the NFT protocol
 * @dev Error messages prefix glossary:
 *  - WL = Whitelist
 *  - DF = DigitalFrogs
 */
library Errors {
  //contract specific errors
  string public constant WL_INVALID_PERMISSIONS = '50';
  string public constant DF_INVALID_ADDRESS = '51';
  string public constant DF_ALREADY_MINT = '52';
  string public constant DF_MUST_BE_WHITELISTED = '53';
  string public constant DF_PUBLIC_SALE_NOT_OPEN = '54';
  string public constant DF_MINT_PRICE_ERROR = '55';
  string public constant DF_MAX_SUPPLY_EXCEEDED = '56';
}
