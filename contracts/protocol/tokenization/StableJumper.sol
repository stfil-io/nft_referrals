// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

/* ----------------------------------------------------------------------------
* ,---.   ,--.          ,--.   ,--.            ,--.                                           ,--.  ,--.,------.,--------.
*'   .-',-'  '-. ,--,--.|  |-. |  | ,---.      |  |,--.,--.,--,--,--. ,---.  ,---. ,--.--.    |  ,'.|  ||  .---''--.  .--',---.
*`.  `-.'-.  .-'' ,-.  || .-. '|  || .-. :,--. |  ||  ||  ||        || .-. || .-. :|  .--'    |  |' '  ||  `--,    |  |  (  .-'
*.-'    | |  |  \ '-'  || `-' ||  |\   --.|  '-'  /'  ''  '|  |  |  || '-' '\   --.|  |       |  | `   ||  |`      |  |  .-'  `)
*`-----'  `--'   `--`--' `---' `--' `----' `-----'  `----' `--`--`--'|  |-'  `----'`--'       `--'  `--'`--'       `--'  `----'                                                                     `--'
* Brave Leaps in the Journey of Stability!
/ -------------------------------------------------------------------------- */

import '../../dependencies/openzeppelin/contracts/access/Ownable.sol';
import {ERC721} from '../../dependencies/openzeppelin/contracts/token/ERC721/ERC721.sol';
import {ERC721Enumerable} from '../../dependencies/openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import {Whitelist} from '../whitelist/Whitelist.sol';
import {Errors} from '../libraries/helpers/Errors.sol';
import {FilAddress} from '../libraries/utils/FilAddress.sol';
import {PercentageMath} from '../libraries/math/PercentageMath.sol';

/**
 * @title StableJumper NFT miniting
 * @author STFIL
 **/
contract StableJumper is ERC721Enumerable, Ownable {
    using FilAddress for address;
    using PercentageMath for uint256;

    string public BASE_URI;

    uint256 public MINT_PRICE;

    uint256 public immutable MAX_SUPPLY;

    uint256 public immutable PUBLIC_MINT_UPPER_LIMIT;

    bool public PUBLIC_SALE_ON = false;

    Whitelist internal _whitelist;
    
    // Mapping from address to wl mint state
    mapping(address => bool) internal _wlAddrsMint;

    // Mapping from address to high wl mint state
    mapping(address => bool) internal _highWlAddrsMint;

    // Mapping from address to mint quantity(Up to 3)
    mapping(address => uint256) internal _addrsMint;

    // Mapping from tokenId to power
    mapping(uint256 => uint256) internal _tokenIdsPower;

    // The address of the stFIL protocol pool, which discloses the risk reserve of mint funds directly entering the pool
    address public STFIL_POOL;

    address public constant STFIL_POOL_RISK_RESERVE = 0xff00000000000000000000000000000000000063;

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

    constructor(string memory name, string memory symbol, string memory baseURI, uint256 mintPrice, uint256 maxSupply, uint256 publicMintUpperLimit, address stFILPool, Whitelist whitelist) ERC721(name, symbol) {
        BASE_URI = baseURI;
        MINT_PRICE = mintPrice;
        MAX_SUPPLY = maxSupply;
        PUBLIC_MINT_UPPER_LIMIT = publicMintUpperLimit;

        require(stFILPool != address(0), Errors.SJ_INVALID_POOL_ADDRESS);
        STFIL_POOL = stFILPool;

        _whitelist = whitelist;
    }

    /**
     * @dev Mints NFT tokens
     * @param quantity number of mints
     */
    function mint(uint256 quantity) external payable {
        address sender = msg.sender.normalize();

        require(sender != address(0), Errors.SJ_INVALID_ADDRESS);
        require(PUBLIC_SALE_ON, Errors.SJ_PUBLIC_SALE_NOT_OPEN);
        require(_addrsMint[sender] + quantity <= 3, Errors.SJ_MINT_QUANTITY_EXCEEDED);
        require(totalSupply() + quantity <= PUBLIC_MINT_UPPER_LIMIT, Errors.SJ_MAX_SUPPLY_EXCEEDED);
        require(msg.value >= MINT_PRICE * quantity, Errors.SJ_MINT_PRICE_ERROR);

        uint256[] memory tokenIds = new uint256[](quantity);
        for(uint i = 0; i < quantity; i++) {
            uint256 tokenId = totalSupply();
            _safeMint(sender, tokenId);
            _tokenIdsPower[tokenId] = _random(tokenId);
            tokenIds[i] = tokenId;
        }

        _addrsMint[sender] += quantity;

        // Increase stFIL pool risk reserve
        bytes memory payload = abi.encodeWithSignature("stake(address,uint32)", STFIL_POOL_RISK_RESERVE, 0);
        (bool success, ) = STFIL_POOL.call{value: msg.value}(payload);
        require(success, Errors.SJ_STFIL_POOL_CALL_FAILED);

        emit Mint(msg.sender, 0, quantity, tokenIds);
    }

    /**
     * @dev Only whitelist users are allowed to mint
     * @param proof Proof data of the caller's merkletree
     */
    function wlMint(bytes32[] memory proof) external payable {
        address sender = msg.sender.normalize();

        require(sender != address(0), Errors.SJ_INVALID_ADDRESS);
        require(!_wlAddrsMint[sender], Errors.SJ_ALREADY_MINT);
        require(totalSupply() + 1 <= MAX_SUPPLY, Errors.SJ_MAX_SUPPLY_EXCEEDED);
        require(_whitelist.verify(proof, keccak256(abi.encodePacked(msg.sender))), Errors.SJ_MUST_BE_WHITELISTED);

        uint256 tokenId = totalSupply();
        _safeMint(sender, tokenId);
        _tokenIdsPower[tokenId] = _random(tokenId);
        _wlAddrsMint[sender] = true;

        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = tokenId;

        emit Mint(msg.sender, 1, 1, tokenIds);
    }

    /**
     * @dev Only high whitelist users are allowed to mint
     * @param proof Proof data of the caller's merkletree
     */
    function highWlMint(bytes32[] memory proof) external payable {
        address sender = msg.sender.normalize();

        require(sender != address(0), Errors.SJ_INVALID_ADDRESS);
        require(!_highWlAddrsMint[sender], Errors.SJ_ALREADY_MINT);
        require(totalSupply() + 1 <= MAX_SUPPLY, Errors.SJ_MAX_SUPPLY_EXCEEDED);
        require(_whitelist.highVerify(proof, keccak256(abi.encodePacked(msg.sender))), Errors.SJ_MUST_BE_WHITELISTED);

        uint256 tokenId = totalSupply();
        _safeMint(sender, tokenId);
        _tokenIdsPower[tokenId] = _highRandom(tokenId);
        _highWlAddrsMint[sender] = true;

        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = tokenId;

        emit Mint(msg.sender, 2, 1, tokenIds);
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
        return MINT_PRICE * quantity;
    }

    /**
     * @dev Get the actual mint quantity of the owner address
     **/
    function getActualMintQuantity(address owner) external view returns(uint256) { 
        uint256 quantity = 3 - _addrsMint[owner.normalize()];

        return MAX_SUPPLY - totalSupply() > quantity ? quantity : MAX_SUPPLY - totalSupply();
    }

    /**
     * @dev Get whitelist mint status
     **/
    function getWlMintState(address owner) external view returns(bool) { 
        return _wlAddrsMint[owner.normalize()];
    }

    /**
     * @dev Get high whitelist mint status
     **/
    function getHighWlMintState(address owner) external view returns(bool) { 
        return _highWlAddrsMint[owner.normalize()];
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
     * @dev Set the mint price
     **/
    function setMintPrice(uint256 mintPrice) external onlyOwner {
        MINT_PRICE = mintPrice;
    }

    function _baseURI() internal view override returns (string memory) {
        return BASE_URI;
    }

    function _random(uint256 tokenId) internal view returns (uint256) {
        uint256 rand = uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), msg.sender, block.timestamp, tokenId)));
        uint256 val = rand % 900;
        return val < 100 ? val + 100 : val;
    }

    function _highRandom(uint256 tokenId) internal view returns (uint256) {
        uint256 rand = uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), msg.sender, block.timestamp, tokenId)));
        uint256 val = rand % 1000;
        if (val < 900) {
            return 900 + rand % 100;
        } 
        return val;
    }
}