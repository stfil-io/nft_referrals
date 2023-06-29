import {ethers, network} from "hardhat";
import {getDeploymentFile, getDeploymentFilename, IDeployments} from '../../common/common'
import {StakingPoolAddressesProvider} from "../../typechain-types";
import {
    STABLE_JUMPER,
    STAKING_NFT,
} from "../../common/ProxyKey";
import {isTargetNetwork} from "../../common/blockchain-utils";

async function main() {
    await isTargetNetwork(network)

    const deploymentFilename = getDeploymentFilename(network.name)
    const deployments = <IDeployments>getDeploymentFile(deploymentFilename)

    const provider = <StakingPoolAddressesProvider>await ethers.getContractAt("StakingPoolAddressesProvider", deployments.provider)
    const stakingNFTImpl = await provider.getProxyImplementation('0x' + STAKING_NFT)
    const stableJumperImpl = await provider.getProxyImplementation('0x' + STABLE_JUMPER)

    console.log(`Results:
    Staking NFT impl: ${stakingNFTImpl}
    Stable Jumper Pool impl: ${stableJumperImpl}`)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
