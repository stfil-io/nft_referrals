// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import {EnumerableSet} from '../../dependencies/openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import {Errors} from '../libraries/helpers/Errors.sol';
import {FilAddress} from '../libraries/utils/FilAddress.sol';

contract ReferralStorage {
    using EnumerableSet for EnumerableSet.UintSet;
    using FilAddress for address;

    uint32 public constant PER_MAX_REFERRAL_CODE_NUM = 10;

    uint32 public constant MIN_REFERRAL_CODE = 100000;

    uint32 public constant MAX_REFERRAL_CODE = 1000000000;

    mapping (uint32 => address) internal _codeOwners;

    mapping (address => EnumerableSet.UintSet) internal _ownerCodes;

    EnumerableSet.UintSet internal _collectionCodeSet;

    event RegisterReferralCode(address indexed account, uint32 referralCode);

    /**
     * @dev The register referral code
     * @param referralCode The specified referral code
     **/
    function registerReferralCode(uint32 referralCode) external {
        address sender = msg.sender.normalize();

        require(sender != address(0), Errors.RS_INVALID_ADDRESS);
        require(referralCode >= MIN_REFERRAL_CODE && referralCode <= MAX_REFERRAL_CODE, Errors.RS_REFERRAL_CODE_MUST_BE_IN_THE_RANGE);
        require(_codeOwners[referralCode] == address(0), Errors.RS_REFERRAL_CODE_ALREADY_EXIST);
        require(_ownerCodes[sender].length() <= PER_MAX_REFERRAL_CODE_NUM, Errors.RS_REFERRAL_CODE_NUM_LIMITED);

        _codeOwners[referralCode] = sender;

        _ownerCodes[sender].add(uint256(referralCode));

        _collectionCodeSet.add(uint256(referralCode));

        emit RegisterReferralCode(msg.sender, referralCode);
    }

    /**
     * @dev Returns the owner address of the referral code
     * @param referralCode The specified referral code
     * @return The returns the owner address 
     **/
    function getAddr(uint32 referralCode) external view returns(address) {
        return _codeOwners[referralCode];
    }

    /**
     * @dev View referral codes for all the collections From owner
     * @param cursor Selected starting position
     * @param size Size of the response
     **/
    function viewOwnerCollections(address owner, uint256 cursor, uint256 size) external view returns (uint32[] memory collectionCodes) {
        owner = owner.normalize();
        uint256 length = size;

        if (_ownerCodes[owner].length() > cursor) {
            if (length > _ownerCodes[owner].length() - cursor) {
                length = _ownerCodes[owner].length() - cursor;
            }
        } else {
            length = 0;
        }

        collectionCodes = new uint32[](length);

        for (uint256 i = 0; i < length; i++) {
            collectionCodes[i] = uint32(_ownerCodes[owner].at(cursor + i));
        }

        return collectionCodes;
    }

    /**
     * @dev Returns the size of the referral code collection From owner
     * @return The size of the referral code collection From owner
     **/
    function viewOwnerCollectionsSize(address owner) external view returns(uint256) {
        return _ownerCodes[owner.normalize()].length();
    }

    /**
     * @dev View referral codes for all the collections
     * @param cursor Selected starting position
     * @param size Size of the response
     **/
    function viewCollections(uint256 cursor, uint256 size) external view returns (uint32[] memory collectionCodes) {
        uint256 length = size;

        if (_collectionCodeSet.length() > cursor) {
            if (length > _collectionCodeSet.length() - cursor) {
                length = _collectionCodeSet.length() - cursor;
            }
        } else {
            length = 0;
        }

        collectionCodes = new uint32[](length);

        for (uint256 i = 0; i < length; i++) {
            collectionCodes[i] = uint32(_collectionCodeSet.at(cursor + i));
        }

        return collectionCodes;
    }

    /**
     * @dev Returns the size of the referral code collection
     * @return The size of the referral code collection
     **/
    function viewCollectionsSize() external view returns(uint256) {
        return _collectionCodeSet.length();
    }
}