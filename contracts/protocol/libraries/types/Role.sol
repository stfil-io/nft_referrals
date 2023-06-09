// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

/**
 * @title Role library
 * @author STFIL
 */
library Role {

  //This role is used to manage the pool, it is better to adjust the configuration, etc.
  bytes32 internal constant POOL_ADMIN_ROLE = keccak256("POOL_ADMIN");

  //This role is used to manage contract initialization and upgrades
  bytes32 internal constant CONTRACTS_ADMIN_ROLE = keccak256("CONTRACTS_ADMIN");
}
