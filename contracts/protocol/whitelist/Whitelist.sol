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

  bytes32 public highRoot;

  /**
   * @dev Emitted on setRoot()
   * @param root The new merkle tree root
   **/
  event MerkleRoot(bytes32 root);

  /**
   * @dev Emitted on setHighRoot()
   * @param root The new high merkle tree root
   **/
  event HighMerkleRoot(bytes32 root);

  constructor(bytes32 merkleroot, bytes32 highMerkleroot) {
    root = merkleroot;
    highRoot = highMerkleroot;
  }

  /**
   * @dev Update the root of the Merkle tree
   */
  function setRoot(bytes32 merkleroot) external onlyOwner {
    root = merkleroot;

    emit MerkleRoot(root);
  } 

  /**
   * @dev Update the root of the Merkle tree
   */
  function setHighRoot(bytes32 highMerkleroot) external onlyOwner {
    highRoot = highMerkleroot;

    emit HighMerkleRoot(highRoot);
  } 

  /**
   * @dev Update the root and high root of the Merkle tree
   */
  function setRootAndHighRoot(bytes32 merkleroot, bytes32 highMerkleroot) external onlyOwner {
    root = merkleroot;
    highRoot = highMerkleroot;

    emit MerkleRoot(root);
    emit HighMerkleRoot(highRoot);
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

  function highVerify(bytes32[] memory proof, bytes32 leaf) external view returns (bool) {
    return MerkleProof.verify(proof, highRoot, leaf);
  }
}