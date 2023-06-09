// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import {IStakingPoolAddressesProvider} from '../../interfaces/IStakingPoolAddressesProvider.sol';
import {Ownable} from "../../dependencies/openzeppelin/contracts/access/Ownable.sol";
import {AccessControl} from "../../dependencies/openzeppelin/contracts/access/AccessControl.sol";
import {TransparentUpgradeableProxy} from "../../dependencies/openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import {Errors} from './libraries/Errors.sol';
import {Role} from '../../protocol/libraries/types/Role.sol';

/**
 * @title StakingPoolAddressesProvider contract
 * @dev Main registry of addresses part of or connected to the protocol, including permissioned roles
 * - Acting also as factory of proxies and admin of those, so with right to change its implementations
 * - Owned by the STFIL Governance
 * @author STFIL
 **/
contract StakingPoolAddressesProvider is AccessControl, IStakingPoolAddressesProvider {

  mapping(bytes32 => address) private _proxy_addresses;

  constructor(){
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

  /**
   * @dev Returns an address by proxy
   * @return The proxy key
   */
  function getProxy(bytes32 proxyKey) external view override returns (address) {
    return _proxy_addresses[proxyKey];
  }

  /**
   * @dev Sets an address for an proxy key replacing the address saved in the addresses map
   * IMPORTANT Use this function carefully, as it will do a hard replacement,
   * proxy address cannot be changed after setting
   * @param proxyKey The proxy key
   * @param newProxyAddress The address to set
  */
  function setProxy(bytes32 proxyKey, address newProxyAddress) external override onlyRole(Role.CONTRACTS_ADMIN_ROLE) {
    _proxy_addresses[proxyKey] = newProxyAddress;
    emit ProxyAddressSet(proxyKey, newProxyAddress);
  }

  /**
   * @dev Returns the current implementation of `proxy`.
   * @param proxyKey The proxy key
  */
  function getProxyImplementation(bytes32 proxyKey) external view returns (address) {
    // We need to manually run the static call since the getter cannot be flagged as view
    // bytes4(keccak256("implementation()")) == 0x5c60da1b
    address payable proxyAddress = payable(_proxy_addresses[proxyKey]);
    require(proxyAddress != address(0), Errors.VL_PROXY_CONTRACT_UNINITIALIZED);

    TransparentUpgradeableProxy proxy = TransparentUpgradeableProxy(proxyAddress);
    (bool success, bytes memory returnData) = address(proxy).staticcall(hex"5c60da1b");
    require(success, Errors.P_IMPL_GET_FAIL);
    return abi.decode(returnData, (address));
  }

  /**
   * @dev Upgrades `proxy` to `implementation`.
   * See {TransparentUpgradeableProxy-upgradeTo}.
   * @param proxyKey The proxy key
   * @param implementation The address of the new implementation
  */
  function upgrade(bytes32 proxyKey, address implementation) external onlyRole(Role.CONTRACTS_ADMIN_ROLE) {
    address payable proxyAddress = payable(_proxy_addresses[proxyKey]);
    require(proxyAddress != address(0), Errors.VL_PROXY_CONTRACT_UNINITIALIZED);

    TransparentUpgradeableProxy proxy = TransparentUpgradeableProxy(proxyAddress);
    proxy.upgradeTo(implementation);
  }

  /**
   * @dev Upgrades `proxy` to `implementation` and calls a function on the new implementation.
   * See {TransparentUpgradeableProxy-upgradeToAndCall}.
   * @param proxyKey The proxy key
   * @param implementation The address of the new implementation
   * @param data The data is an encoded function call
  */
  function upgradeAndCall(bytes32 proxyKey, address implementation, bytes memory data) external payable onlyRole(Role.CONTRACTS_ADMIN_ROLE) {
    address payable proxyAddress = payable(_proxy_addresses[proxyKey]);
    require(proxyAddress != address(0), Errors.VL_PROXY_CONTRACT_UNINITIALIZED);

    TransparentUpgradeableProxy proxy = TransparentUpgradeableProxy(proxyAddress);
    proxy.upgradeToAndCall{value : msg.value}(implementation, data);
  }

}
