// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

interface IStakingNFT {

  /**
   * @dev Emitted on stake()
   * @param user The address initiating the stake
   * @param tokenId The identifier of NFT
   **/
  event Stake(address indexed user, uint256 tokenId);

  /**
   * @dev Emitted on unstake()
   * @param user The address initiating the unstake
   * @param tokenId The identifier of NFT
   **/
  event Unstake(address indexed user, uint256 tokenId);

  /**
   * @dev Emitted when the pause is triggered.
   */
  event Paused();

  /**
   * @dev Emitted when the pause is lifted.
   */
  event Unpaused();

  /**
   * @dev Initializes the staking NFT, activating it, assigning an stableJumper NFTs
   **/
  function initStakingNFT() external;

  /**
   * @dev Set the _pause state of the staking NFT
   * @param val `true` to pause the staking pool, `false` to un-pause it
   */
  function setPause(bool val) external;

  /**
   * @dev Returns if the StakingNFT is paused
   */
  function paused() external view returns (bool);
}