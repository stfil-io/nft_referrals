// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import '../../dependencies/openzeppelin/contracts/access/Ownable.sol';
import {ERC721} from '../../dependencies/openzeppelin/contracts/token/ERC721/ERC721.sol';
import {Whitelist} from '../whitelist/Whitelist.sol';
import {Errors} from '../libraries/helpers/Errors.sol';
import {FilAddress} from '../libraries/utils/FilAddress.sol';

contract DigitalFrogs is ERC721, Ownable {
    using FilAddress for address;

    // Base URI
    string internal baseURI;

    uint256 internal _totalSupply; 

    Whitelist internal _whitelist;

    mapping(address => bool) internal _wlAddrsMint;

    uint256 public MAX_SUPPLY;

    uint256 public MINT_PRICE = 1 ether;

    bool public PUBLIC_SALE_ON = false;

    constructor(string memory name, string memory symbol, uint256 maxSupply, Whitelist whitelist) ERC721(name, symbol) {
        _whitelist = whitelist;
        MAX_SUPPLY = maxSupply;
    }

    function wlMint(bytes32[] memory proof) external payable {
        address sender = msg.sender.normalize();
        require(sender != address(0), Errors.DF_INVALID_ADDRESS);
        require(!_wlAddrsMint[sender], Errors.DF_ALREADY_MINT);
        require(_totalSupply + 1 <= MAX_SUPPLY, Errors.DF_MAX_SUPPLY_EXCEEDED);
        require(_whitelist.verify(proof, keccak256(abi.encode(sender))), Errors.DF_MUST_BE_WHITELISTED);
        _safeMint(sender, _totalSupply);
        _wlAddrsMint[sender] = true;
        _totalSupply += 1;
    }

    function mint(uint256 quantity) external payable {
        address sender = msg.sender.normalize();
        require(sender != address(0), Errors.DF_INVALID_ADDRESS);
        require(PUBLIC_SALE_ON, Errors.DF_PUBLIC_SALE_NOT_OPEN);
        require(_totalSupply + quantity <= MAX_SUPPLY, Errors.DF_MAX_SUPPLY_EXCEEDED);
        require(msg.value == quantity * MINT_PRICE, Errors.DF_MINT_PRICE_ERROR);
        for(uint i = 0; i < quantity; i++) {
            _safeMint(sender, _totalSupply + i);
        }
        _totalSupply += quantity;
    } 

    function totalSupply() external view  returns (uint256) {
       return _totalSupply;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }

    function setBaseURI(string memory baseURI_) external onlyOwner {
        baseURI = baseURI_;
    }

    function setMintPrice(uint256 mintPrice) external onlyOwner {
        MINT_PRICE = mintPrice;
    }

    function setPublicSaleOn(bool state) external onlyOwner {
        PUBLIC_SALE_ON = state;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

}