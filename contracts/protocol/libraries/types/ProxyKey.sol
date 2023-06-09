// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

/**
 * @title ProxyKey library
 * @author STFIL
 */
library ProxyKey {

  bytes32 internal constant STAKING_NFT = keccak256('STAKING_NFT');
  bytes32 internal constant STABLE_JUMPER = keccak256('STABLE_JUMPER');
}
