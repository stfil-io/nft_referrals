// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import '../libraries/utils/FilAddress.sol';
import '../../dependencies/openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import {Errors} from '../libraries/helpers/Errors.sol';
import {Initializable} from '../../dependencies/openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import {IStakingNFT} from '../../interfaces/IStakingNFT.sol';
import {IERC721} from '../../dependencies/openzeppelin/contracts/token/ERC721/IERC721.sol';
import {IERC721Receiver} from '../../dependencies/openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';
import {IAddressesProvider} from '../../interfaces/IAddressesProvider.sol';
import {ProxyKey} from '../libraries/types/ProxyKey.sol';
import {EnumerableSet} from '../../dependencies/openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import {IStableJumper} from '../../interfaces/IStableJumper.sol';

/**
 * @title StakingNFT contract
 * @dev Main point of interaction with an Staking NFT
 * - Stake
 * - Unstake
 * @author STFIL
 **/
contract StakingNFT is IStakingNFT, IERC721Receiver, Initializable, OwnableUpgradeable{
  using FilAddress for address;
  using EnumerableSet for EnumerableSet.UintSet;

  IAddressesProvider internal _addressesProvider;   

  bool internal _paused;

  address internal _stableJumperAddress;

  uint256 internal _totalPower;

  mapping (address => EnumerableSet.UintSet) internal _ownerTokenIds;

  EnumerableSet.UintSet internal _collectionTokenIdSet;

  struct StableJumperNFT {
    uint256 tokenId;
    uint256 power;
  }

  modifier whenNotPaused() {
    _whenNotPaused();
    _;
  }

  function _whenNotPaused() internal view {
    require(!_paused, Errors.SN_IS_PAUSED);
  }

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(IAddressesProvider provider) external initializer {
    _addressesProvider = provider;

    __Ownable_init();
  }

  /**
   * @dev Initializes the staking NFT, activating it, assigning an stableJumper NFTs
   **/
  function initStakingNFT() external override {
    _stableJumperAddress = _addressesProvider.getProxy(ProxyKey.STABLE_JUMPER);
  }

  /**
   * @dev Stakes an `NFT` into the StakingNFT.
   * @param tokenId The identifier of NFT
   **/
  function stake(uint256 tokenId) external whenNotPaused {
    address sender = msg.sender.normalize();
    require(_ownerTokenIds[sender].add(tokenId), Errors.SN_NFT_TOKENID_EXIST);
    require(_collectionTokenIdSet.add(tokenId), Errors.SN_NFT_TOKENID_EXIST);

    _totalPower += IStableJumper(_stableJumperAddress).getPowerByTokenId(tokenId);
    IERC721(_stableJumperAddress).safeTransferFrom(msg.sender, address(this), tokenId);

    emit Stake(msg.sender, tokenId);
  }

  /**
   * @dev Unstakes an `NFT` from the StakingNFT
   * @param tokenId The identifier of NFT
   **/
  function unstake(uint256 tokenId) external whenNotPaused {
    address sender = msg.sender.normalize();
    require(_ownerTokenIds[sender].remove(tokenId), Errors.SN_NFT_TOKENID_NOT_EXIST);
    require(_collectionTokenIdSet.remove(tokenId), Errors.SN_NFT_TOKENID_NOT_EXIST);
   
    _totalPower -= IStableJumper(_stableJumperAddress).getPowerByTokenId(tokenId);
    IERC721(_stableJumperAddress).approve(sender, tokenId);
    IERC721(_stableJumperAddress).safeTransferFrom(address(this), sender, tokenId);

    emit Unstake(msg.sender, tokenId);
  }

  /**
   * @dev Whenever an {IERC721} `tokenId` token is transferred to this contract via {IERC721-safeTransferFrom}
   * by `operator` from `from`, this function is called.
   *
   * It must return its Solidity selector to confirm the token transfer.
   * If any other value is returned or the interface is not implemented by the recipient, the transfer will be reverted.
   *
   * The selector can be obtained in Solidity with `IERC721Receiver.onERC721Received.selector`.
   */
  function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes calldata data
  ) external returns (bytes4) {
    return IERC721Receiver.onERC721Received.selector;
  }

  /**
   * @dev View nfts for all the collections From owner
   * @param cursor Selected starting position
   * @param size Size of the response
   **/
  function viewOwnerCollections(address owner, uint256 cursor, uint256 size) external view returns (StableJumperNFT[] memory collectionCodes) {
    owner = owner.normalize();
    uint256 length = size;

    if (_ownerTokenIds[owner].length() > cursor) {
        if (length > _ownerTokenIds[owner].length() - cursor) {
            length = _ownerTokenIds[owner].length() - cursor;
        }
    } else {
        length = 0;
    }

    collectionCodes = new StableJumperNFT[](length);
    IStableJumper stableJumper =  IStableJumper(_stableJumperAddress);

    for (uint256 i = 0; i < length; i++) {
        uint256 tokenId = _ownerTokenIds[owner].at(cursor + i);
        uint256 power = stableJumper.getPowerByTokenId(tokenId);
        collectionCodes[i] = StableJumperNFT(tokenId, power);
    }

    return collectionCodes;
  }

  /**
   * @dev Returns the size of the nft collection From owner
   **/
  function viewOwnerCollectionsSize(address owner) external view returns(uint256) {
    return _ownerTokenIds[owner.normalize()].length();
  }

  /**
   * @dev Returns the nft stake status and power
   **/
  function getNFTInfo(uint256 tokenId) external view returns(bool, uint256) {
    if (!_collectionTokenIdSet.contains(tokenId)) {
      return (false, 0);
    }
    return (true, IStableJumper(_stableJumperAddress).getPowerByTokenId(tokenId));
  }

  /**
   * @dev Returns if the StakingNFT is paused
   */
  function paused() external view override returns (bool) {
    return _paused;
  }

  /**
   * @dev Set the _pause state of the staking NFT
   * @param val `true` to pause the staking NFT, `false` to un-pause it
   */
  function setPause(bool val) external override onlyOwner {
    _paused = val;
    if (_paused) {
      emit Paused();
    } else {
      emit Unpaused();
    }
  }

}
