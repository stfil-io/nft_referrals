import {ethers, network} from "hardhat";
import {getDeploymentFile, getDeploymentFilename, IDeployments, writeFile} from "../common/common";
import {isTargetNetwork} from "../common/blockchain-utils";
import {AddressesProvider, StakingNFT, TransparentUpgradeableProxy} from "../typechain-types";
import {STAKING_NFT} from "../common/ProxyKey";

async function main() {
    await isTargetNetwork(network)

    const deploymentFilename = getDeploymentFilename(network.name)
    const deployments = <IDeployments>getDeploymentFile(deploymentFilename)
    if (deployments.stakingNFT != '') {
        console.log(`Skipped StakingNFT`)
        return
    }

    console.log(`Deploying StakingNFT`)

    const StakingNFTContract = await ethers.getContractFactory("StakingNFT")
    const StakingNFTImpl = <StakingNFT>await StakingNFTContract.deploy()
    await StakingNFTImpl.deployed()

    const TransparentUpgradeableProxyContract = await ethers.getContractFactory("TransparentUpgradeableProxy")
    const StakingNFTProxy = <TransparentUpgradeableProxy>await TransparentUpgradeableProxyContract.deploy(
        StakingNFTImpl.address,
        deployments.provider,
        StakingNFTContract.interface.encodeFunctionData("initialize", [deployments.provider])
    )
    await StakingNFTProxy.deployed()

    deployments.stakingNFT = StakingNFTProxy.address

    await writeFile(deploymentFilename, JSON.stringify(deployments, null, 2))

    console.log(`Deployed to ${network.name} (${network.config.chainId})
    StakingNFT proxy:  ${StakingNFTProxy.address}
    StakingNFT impl:  ${StakingNFTImpl.address}
    Deployment file: ${deploymentFilename}`)

    console.log(`Setting StakingNFT Proxy to ${StakingNFTProxy.address}`)
    const provider = <AddressesProvider>await ethers.getContractAt("AddressesProvider", deployments.provider)
    const tx = await provider
        .setProxy('0x' + STAKING_NFT, StakingNFTProxy.address)
    await tx.wait()
    console.log(`Proxy successfully set
    tx hash:  ${tx.hash}`)
}

main().catch((error) => {
    console.log(error)
    process.exitCode = 1
})
