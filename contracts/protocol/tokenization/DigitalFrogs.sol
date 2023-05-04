// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import '../../dependencies/openzeppelin/contracts/access/Ownable.sol';
import {ERC721} from '../../dependencies/openzeppelin/contracts/token/ERC721/ERC721.sol';
import {ERC721Enumerable} from '../../dependencies/openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import {Whitelist} from '../whitelist/Whitelist.sol';
import {Errors} from '../libraries/helpers/Errors.sol';
import {FilAddress} from '../libraries/utils/FilAddress.sol';
import {PercentageMath} from '../libraries/math/PercentageMath.sol';

contract DigitalFrogs is ERC721Enumerable, Ownable {
    using FilAddress for address;
    using PercentageMath for uint256;

    uint256 public MAX_SUPPLY;

    uint256 public MINT_PRICE = 10 ether;

    uint256 public PUBLIC_MINT_UPPER_LIMIT;

    bool public PUBLIC_SALE_ON = false;

    uint256 public MIN_INTEGRAL = 500;

    uint256 public MAX_INTEGRAL = 1000;

    // Every time the number of NFT mint increases by 100, the price will increase by a percentage
    uint256 public PRICE_INCREASE_PERCENTAGE = 0;

    string internal baseURI;

    Whitelist internal _whitelist;
    
    mapping(address => bool) internal _wlAddrsMint;

    mapping(uint256 => uint256) internal _tokenIdsIntegral;

    // The address of the stFIL protocol pool, which discloses the risk reserve of mint funds directly entering the pool
    address internal _stFILPool;

    address public constant STFIL_POOL_RISK_RESERVE = 0xff00000000000000000000000000000000000063;

    constructor(string memory name, string memory symbol, uint256 maxSupply, uint256 publicMintUpperLimit, uint256 priceIncreasePercentage, address stFILPool, Whitelist whitelist) ERC721(name, symbol) {
        require(publicMintUpperLimit <= maxSupply, Errors.DF_MAX_SUPPLY_EXCEEDED);
        MAX_SUPPLY = maxSupply;
        PUBLIC_MINT_UPPER_LIMIT = publicMintUpperLimit;

        require(priceIncreasePercentage >= 0 && priceIncreasePercentage <= PercentageMath.PERCENTAGE_FACTOR, Errors.DF_WRONG_PERCENTAGE_RANGE);
        PRICE_INCREASE_PERCENTAGE = priceIncreasePercentage;

        require(stFILPool != address(0), Errors.DF_INVALID_POOL_ADDRESS);
        _stFILPool = stFILPool;

        _whitelist = whitelist;
    }

    /**
     * @dev Only whitelist users are allowed to mint
     * @param proof Proof data of the caller's merkletree
     */
    function wlMint(bytes32[] memory proof) external payable {
        address sender = msg.sender.normalize();

        require(sender != address(0), Errors.DF_INVALID_ADDRESS);
        require(!_wlAddrsMint[sender], Errors.DF_ALREADY_MINT);
        require(totalSupply() + 1 <= MAX_SUPPLY, Errors.DF_MAX_SUPPLY_EXCEEDED);
        require(_whitelist.verify(proof, keccak256(abi.encodePacked(msg.sender))), Errors.DF_MUST_BE_WHITELISTED);

        uint256 tokenId = totalSupply();
        _safeMint(sender, tokenId);
        _tokenIdsIntegral[tokenId] = _random(tokenId);
        _wlAddrsMint[sender] = true;
    }

    /**
     * @dev Mints NFT tokens
     * @param quantity number of mints
     */
    function mint(uint256 quantity) external payable {
        address sender = msg.sender.normalize();

        require(sender != address(0), Errors.DF_INVALID_ADDRESS);
        require(PUBLIC_SALE_ON, Errors.DF_PUBLIC_SALE_NOT_OPEN);
        require(totalSupply() + quantity <= PUBLIC_MINT_UPPER_LIMIT, Errors.DF_MAX_SUPPLY_EXCEEDED);
        require(msg.value == _calcPrice(quantity), Errors.DF_MINT_PRICE_ERROR);

        for(uint i = 0; i < quantity; i++) {
            uint256 tokenId = totalSupply();
            _safeMint(sender, tokenId);
            _tokenIdsIntegral[tokenId] = _random(tokenId);
        }

        // Increase stFIL pool risk reserve
        bytes memory payload = abi.encodeWithSignature("stake(address onBehalfOf, uint32 referralCode)", STFIL_POOL_RISK_RESERVE, 0);
        (bool success, ) = _stFILPool.call{value: msg.value}(payload);
        require(success, Errors.DF_STFIL_POOL_CALL_FAILED);

    } 

    /**
     * @dev Obtain the corresponding points according to the tokenId of the NFT
     **/
    function getIntegralByTokenId(uint256 tokenId) external view returns(uint256) {
        return _tokenIdsIntegral[tokenId];
    }

    /**
     * @dev Withdraw the amount in the contract to the administrator
     **/
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }

    /**
     * @dev Set the base URI address
     * @param baseURI_ The current base URI
     **/
    function setBaseURI(string memory baseURI_) external onlyOwner {
        baseURI = baseURI_;
    }

    /**
     * @dev Set mint price
     * @param price The current price
     **/
    function setMintPrice(uint256 price) external onlyOwner {
        MINT_PRICE = price;
    }

    /**
     * @dev Switch settings for public sale
     * @param state 'true' is enabled, otherwise
     **/
    function setPublicSaleOn(bool state) external onlyOwner {
        PUBLIC_SALE_ON = state;
    }

    /**
     * @dev Set the integration range
     * @param min The minimum value of the integral
     * @param max The maximum value of the integral
     **/
    function setIntegralRange(uint256 min, uint256 max) external onlyOwner {
        MIN_INTEGRAL = min;
        MAX_INTEGRAL = max;
    }

    /**
     * @dev Returns the address of the staking pool where this stFIL
     **/
    function STFIL_POOL() external view returns (address) {
        return _stFILPool;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function _random(uint256 tokenId) internal view returns (uint256) {
        uint256 rand = uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), msg.sender, block.timestamp, tokenId)));
        uint256 val = rand % MAX_INTEGRAL;
        return val < MIN_INTEGRAL ? val + MIN_INTEGRAL : val;
    }

    function _calcPrice(uint256 quantity) internal view returns(uint256) {
        uint256 totalPrice = 0;
        for(uint256 i=0; i<quantity; i++) {
            uint256 n = (totalSupply() + i) / 100;
            totalPrice += MINT_PRICE.percentMul((PercentageMath.PERCENTAGE_FACTOR + PRICE_INCREASE_PERCENTAGE)**n);
        }
        return totalPrice;
    }
}