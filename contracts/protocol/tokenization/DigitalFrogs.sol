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

    string public BASE_URI;

    uint256 public MINT_PRICE;

    uint256 public immutable MAX_SUPPLY;

    uint256 public immutable PUBLIC_MINT_UPPER_LIMIT;

    // Every time the NFT supply increases by INCREASE_INTERVAL, the mint price will be idempotent by a percentage
    uint256 public immutable INCREASE_PERCENTAGE;

    uint256 public immutable INCREASE_INTERVAL;

    bool public PUBLIC_SALE_ON = false;

    uint256 public MIN_POWER = 100;

    uint256 public MAX_POWER = 1000;

    Whitelist internal _whitelist;
    
    // Mapping from address to wl mint state
    mapping(address => bool) internal _wlAddrsMint;

    // Mapping from address to mint quantity(Up to 3)
    mapping(address => uint256) internal _addrsMint;

    // Mapping from tokenId to power
    mapping(uint256 => uint256) internal _tokenIdsPower;

    // The address of the stFIL protocol pool, which discloses the risk reserve of mint funds directly entering the pool
    address public STFIL_POOL;

    address public constant STFIL_POOL_RISK_RESERVE = 0xff00000000000000000000000000000000000063;

    constructor(string memory name, string memory symbol, string memory baseURI, uint256 mintPrice, uint256 maxSupply, uint256 publicMintUpperLimit, uint256 increasePercentage, uint256 increaseInterval, address stFILPool, Whitelist whitelist) ERC721(name, symbol) {
        BASE_URI = baseURI;
        MINT_PRICE = mintPrice;
        MAX_SUPPLY = maxSupply;
        PUBLIC_MINT_UPPER_LIMIT = publicMintUpperLimit;
        INCREASE_PERCENTAGE = increasePercentage;
        INCREASE_INTERVAL = increaseInterval;

        require(stFILPool != address(0), Errors.DF_INVALID_POOL_ADDRESS);
        STFIL_POOL = stFILPool;

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

        (, uint256 newMintPrice) = _getActualMintPrice(1);
        MINT_PRICE = newMintPrice;

        uint256 tokenId = totalSupply();
        _safeMint(sender, tokenId);
        _tokenIdsPower[tokenId] = _random(tokenId);
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
        require(_addrsMint[sender] + quantity <= 3, Errors.DF_MINT_QUANTITY_EXCEEDED);
        require(totalSupply() + quantity <= PUBLIC_MINT_UPPER_LIMIT, Errors.DF_MAX_SUPPLY_EXCEEDED);

        (uint256 totalPrice, uint256 newMintPrice) = _getActualMintPrice(quantity);
        require(msg.value == totalPrice, Errors.DF_MINT_PRICE_ERROR);

        MINT_PRICE = newMintPrice;

        for(uint i = 0; i < quantity; i++) {
            uint256 tokenId = totalSupply();
            _safeMint(sender, tokenId);
            _tokenIdsPower[tokenId] = _random(tokenId);
        }

        _addrsMint[sender] += quantity;

        // Increase stFIL pool risk reserve
        bytes memory payload = abi.encodeWithSignature("stake(address,uint32)", STFIL_POOL_RISK_RESERVE, 0);
        (bool success, ) = STFIL_POOL.call{value: msg.value}(payload);
        require(success, Errors.DF_STFIL_POOL_CALL_FAILED);

    } 

    /**
     * @dev Get the power points according to the tokenId of the NFT
     **/
    function getPowerByTokenId(uint256 tokenId) external view returns(uint256) {
        return _tokenIdsPower[tokenId];
    }

    /**
     * @dev Get the actual mint price according to the mint quantity
     **/
    function getActualMintPrice(uint256 quantity) external view returns(uint256) { 
        (uint256 totalPrice, ) = _getActualMintPrice(quantity);
        return totalPrice;
    }

    /**
     * @dev Get the actual mint quantity of the owner address
     **/
    function getActualMintQuantity(address owner) external view returns(uint256) { 
        uint256 quantity = 3 - _addrsMint[owner.normalize()];

        return MAX_SUPPLY - totalSupply() > quantity ? quantity : MAX_SUPPLY - totalSupply();
    }

    /**
     * @dev Set the base URI address
     **/
    function setBaseURI(string memory baseURI) external onlyOwner {
        BASE_URI = baseURI;
    }

    /**
     * @dev Switch settings for public sale
     **/
    function setPublicSaleOn(bool state) external onlyOwner {
        PUBLIC_SALE_ON = state;
    }

    /**
     * @dev Set the random power range
     **/
    function setPowerRange(uint256 min, uint256 max) external onlyOwner {
        MIN_POWER = min;
        MAX_POWER = max;
    }

    function _baseURI() internal view override returns (string memory) {
        return BASE_URI;
    }

    function _random(uint256 tokenId) internal view returns (uint256) {
        uint256 rand = uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), msg.sender, block.timestamp, tokenId)));
        uint256 val = rand % MAX_POWER;
        return val < MIN_POWER ? val + MIN_POWER : val;
    }

    function _getActualMintPrice(uint256 quantity) internal view returns(uint256, uint256) { 
        uint256 totalPrice = 0;
        uint256 mintPrice = MINT_PRICE;
        for (uint256 i = 0; i < quantity; i++) {
            uint256 n = totalSupply() + i;
            if (n != 0 && n % INCREASE_INTERVAL == 0) {
                mintPrice = mintPrice.percentMul(PercentageMath.PERCENTAGE_FACTOR + INCREASE_PERCENTAGE);
            }
            totalPrice += mintPrice;
        }
        
        return (totalPrice, mintPrice);
    }

}