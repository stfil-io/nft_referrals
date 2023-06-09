import {getDeploymentFile, getDeploymentFilename, IDeployments} from '../common/common'
import {ethers, network} from "hardhat";
import {STABLE_JUMPER} from "../common/ProxyKey";
import {StakingPoolAddressesProvider, StakingNFT} from "../typechain-types";
import {isTargetNetwork} from "../common/blockchain-utils";
import {ZERO_ADDRESS} from "../common/constants";

async function main() {
    await isTargetNetwork(network)

    const deploymentFilename = getDeploymentFilename(network.name)
    const deployments = <IDeployments>getDeploymentFile(deploymentFilename)

    console.log(`Initializing StakingNFT`)

    const provider = <StakingPoolAddressesProvider>await ethers.getContractAt("StakingPoolAddressesProvider", deployments.provider)
    const stableJumperProxy = await provider.getProxy('0x' + STABLE_JUMPER);
    if (stableJumperProxy == ZERO_ADDRESS) {
        throw new Error(`Please deploy stable jumper first ?`)
    }

    const stakingNFT = <StakingNFT>await ethers.getContractAt("StakingNFT", deployments.stakingNFT)
    const tx = await stakingNFT.initStakingNFT()
    await tx.wait()
    console.log(`Initialized StakingNFT
     tx hash:  ${tx.hash}`)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
