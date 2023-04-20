// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import '../../dependencies/openzeppelin/contracts/access/Ownable.sol';
import {MerkleProof} from '../../dependencies/openzeppelin/contracts/utils/MerkleProof.sol';
import {Errors} from '../libraries/helpers/Errors.sol';

/**
 * @title Whitelist
 * @notice Implement whitelist update and verification
 * @author STFIL
 **/
contract Whitelist is Ownable {
  bytes32 public root;

  /**
   * @dev Emitted on setRoot()
   * @param root The new merkle tree root
   **/
  event MerkleRoot(bytes32 root);

  constructor(bytes32 merkleroot) {
    root = merkleroot;
  }

  /**
   * @dev Update the root of the Merkle tree
   */
  function setRoot(bytes32 merkleroot) external onlyOwner {
    root = merkleroot;

    emit MerkleRoot(root);
  } 

  /**
   * @dev Returns true if a `leaf` can be proved to be a part of a Merkle tree
   * defined by `root`. For this, a `proof` must be provided, containing
   * sibling hashes on the branch from the leaf to the root of the tree. Each
   * pair of leaves and each pair of pre-images are assumed to be sorted.
   */
  function verify(bytes32[] memory proof, bytes32 leaf) external view returns (bool) {
    return MerkleProof.verify(proof, root, leaf);
  }
}