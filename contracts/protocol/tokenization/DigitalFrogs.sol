// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import '../../dependencies/openzeppelin/contracts/access/Ownable.sol';
import {ERC721} from '../../dependencies/openzeppelin/contracts/token/ERC721/ERC721.sol';
import {ERC721Enumerable} from '../../dependencies/openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import {Whitelist} from '../whitelist/Whitelist.sol';
import {Errors} from '../libraries/helpers/Errors.sol';
import {FilAddress} from '../libraries/utils/FilAddress.sol';

contract DigitalFrogs is ERC721Enumerable, Ownable {
    using FilAddress for address;

    // Base URI
    string internal baseURI;

    Whitelist internal _whitelist;

    mapping(address => bool) internal _wlAddrsMint;

    mapping(uint256 => uint256) internal _tokenIdsIntegral;

    uint256 public MAX_SUPPLY;

    uint256 public MINT_PRICE = 1 ether;

    bool public PUBLIC_SALE_ON = false;

    uint256 public MIN_INTEGRAL = 500;

    uint256 public MAX_INTEGRAL = 1000;

    constructor(string memory name, string memory symbol, uint256 maxSupply, Whitelist whitelist) ERC721(name, symbol) {
        _whitelist = whitelist;
        MAX_SUPPLY = maxSupply;
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
        require(totalSupply() + quantity <= MAX_SUPPLY, Errors.DF_MAX_SUPPLY_EXCEEDED);
        require(msg.value == quantity * MINT_PRICE, Errors.DF_MINT_PRICE_ERROR);

        for(uint i = 0; i < quantity; i++) {
            uint256 tokenId = totalSupply();
            _safeMint(sender, tokenId);
            _tokenIdsIntegral[tokenId] = _random(tokenId);
        }
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

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function _random(uint256 tokenId) internal view returns (uint256) {
        uint256 rand = uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), msg.sender, block.timestamp, tokenId)));
        uint256 val = rand % MAX_INTEGRAL;
        return val < MIN_INTEGRAL ? val + MIN_INTEGRAL : val;
    }
}