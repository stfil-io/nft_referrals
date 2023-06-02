// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

/**
 * @title NFTReferralsAddressesProvider contract
 * @dev Main registry of addresses part of or connected to the protocol, including permissioned roles
 * - Acting also as factory of proxies and admin of those, so with right to change its implementations
 * - Owned by the STFIL Governance
 * @author STFIL
 **/
interface INFTReferralsAddressesProvider {

  event ProxyAddressSet(bytes32 proxyKey, address indexed newProxyAddress);

  /**
   * @dev Returns an address by proxy
   * @return The proxy key
   */
  function getProxy(bytes32 proxyKey) external view returns (address);

  /**
   * @dev Sets an address for an proxy key replacing the address saved in the addresses map
   * IMPORTANT Use this function carefully, as it will do a hard replacement
   * @param proxyKey The proxy key
   * @param newProxyAddress The address to set
  */
  function setProxy(bytes32 proxyKey, address newProxyAddress) external;

  /**
   * @dev Returns the current implementation of `proxy`.
   * @param proxyKey The proxy key
  */
  function getProxyImplementation(bytes32 proxyKey) external view returns (address);

  /**
   * @dev Upgrades `proxy` to `implementation`.
   * See {TransparentUpgradeableProxy-upgradeTo}.
   * @param proxyKey The proxy key
   * @param implementation The address of the new implementation
  */
  function upgrade(bytes32 proxyKey, address implementation) external;

  /**
   * @dev Upgrades `proxy` to `implementation` and calls a function on the new implementation.
   * See {TransparentUpgradeableProxy-upgradeToAndCall}.
   * @param proxyKey The proxy key
   * @param implementation The address of the new implementation
   * @param data The data is an encoded function call
  */
  function upgradeAndCall(bytes32 proxyKey, address implementation, bytes memory data) external payable;

}
