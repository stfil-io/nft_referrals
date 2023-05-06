// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

contract StakingPool {

  event Stake(address indexed user, address indexed onBehalfOf, uint256 amount, uint32 referral);
    
  function stake(address onBehalfOf, uint32 referralCode) external payable {
    emit Stake(msg.sender, onBehalfOf, msg.value, referralCode);
  }
}
