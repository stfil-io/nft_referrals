// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

interface IStableJumper { 

  /**
   * @dev Emitted on mint() / wlMint() / highWlMint()
   * @param account The address of the user
   * @param action The mint action
     - 0: mint
     - 1: whitelist mint
     - 2: high whitelist mint
   * @param quantity The quantity of user mint 
   * @param tokenIds The tokenIds of user mint
   **/
  event Mint(address indexed account, uint256 action, uint256 quantity, uint256[] tokenIds);

  /**
   * @dev Mints NFT tokens
   * @param quantity number of mints
   */
  function mint(uint256 quantity) external payable;

  /**
   * @dev Only whitelist users are allowed to mint
   * @param proof Proof data of the caller's merkletree
   */
  function wlMint(bytes32[] memory proof) external;

  /**
   * @dev Only high whitelist users are allowed to mint
   * @param proof Proof data of the caller's merkletree
   */
  function highWlMint(bytes32[] memory proof) external;

  /**
   * @dev Get the total power
   */
  function totalPower() external view returns (uint256);
  
  /**
   * @dev Get the power points according to the tokenId of the NFT
   **/
  function getPowerByTokenId(uint256 tokenId) external view returns(uint256);

  /**
   * @dev Get the actual mint price according to the mint quantity
   **/
  function getActualMintPrice(uint256 quantity) external view returns(uint256);

  /**
   * @dev Get the actual mint quantity of the owner address
   **/
  function getActualMintQuantity(address owner) external view returns(uint256);

  /**
   * @dev Get whitelist mint status
   **/
  function getWlMintState(address owner) external view returns(bool);

  /**
   * @dev Get high whitelist mint status
   **/
  function getHighWlMintState(address owner) external view returns(bool);
}