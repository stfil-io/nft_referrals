// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

/**
 * @title Errors library
 * @author FrogHub
 * @notice Defines the error messages emitted by the different contracts of the NFT protocol
 * @dev Error messages prefix glossary:
 *  - WL = Whitelist
 */
library Errors {

  //common errors
  string public constant CALLER_NOT_POOL_ADMIN = '50'; // 'The caller must be the pool admin'

  //contract specific errors
  string public constant WL_INVALID_PERMISSIONS = '51';

}
