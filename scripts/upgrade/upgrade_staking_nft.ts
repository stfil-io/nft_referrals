import hre, {ethers, network} from "hardhat";
import {getDeploymentFile, getDeploymentFilename, IDeployments} from '../../common/common'
import {StakingNFT, StakingPoolAddressesProvider} from "../../typechain-types";
import {STAKING_NFT} from "../../common/ProxyKey";
import {accounts, isTargetNetwork} from "../../common/blockchain-utils";

async function main() {
    await isTargetNetwork(network)

    const deploymentFilename = getDeploymentFilename(network.name)
    const deployments = <IDeployments>getDeploymentFile(deploymentFilename)

    console.log(`Upgrading StakingNFT`)

    const StakingNFTContract = await ethers.getContractFactory("StakingNFT")
    const StakingNFTImpl = <StakingNFT>await StakingNFTContract.deploy()
    await StakingNFTImpl.deployed()

    console.log(`Deployed to ${network.name} (${network.config.chainId})
    StakingNFT impl:  ${StakingNFTImpl.address}`)

    console.log(`Setting StakingNFT Impl to ${StakingNFTImpl.address}`)
    const provider = <StakingPoolAddressesProvider>await ethers.getContractAt("StakingPoolAddressesProvider", deployments.provider)

    const {contractsAdmin} = await accounts(hre);
    const tx = await provider
        .connect(contractsAdmin)
        .upgrade('0x' + STAKING_NFT, StakingNFTImpl.address)
    await tx.wait()
    console.log(`Upgrade successfully
    tx hash:  ${tx.hash}`)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
