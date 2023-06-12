import hre, {ethers, network} from "hardhat";
import {getDeploymentFile, getDeploymentFilename, IDeployments, writeFile} from "../common/common";
import {accounts, isTargetNetwork} from "../common/blockchain-utils";
import {StakingPoolAddressesProvider, StableJumper, TransparentUpgradeableProxy} from "../typechain-types";
import {useEnv} from "../common/env";
import {STABLE_JUMPER, STAKING_POOL} from "../common/ProxyKey";
import {ZERO_ADDRESS} from "../common/constants";

async function main() {
    await isTargetNetwork(network)

    const deploymentFilename = getDeploymentFilename(network.name)
    const deployments = <IDeployments>getDeploymentFile(deploymentFilename)
    if (deployments.stableJumper != '') {
        console.log(`Skipped StableJumper`)
        return
    }

    console.log(`Deploying StableJumper`)

    const baseURI = useEnv("BASE_URI")
    if (baseURI == '') {
        console.log('Please set the "BASE_URI" environment variable')
        return;
    }
    const mintPrice = ethers.utils.parseEther("20")
    const maxSupply = 5000
    const publicMintUpperLimit = 5000

    const provider = <StakingPoolAddressesProvider>await ethers.getContractAt("StakingPoolAddressesProvider", deployments.provider)
    const stakingPoolProxy = await provider.getProxy('0x' + STAKING_POOL);
    if (stakingPoolProxy == ZERO_ADDRESS) {
        throw new Error(`Please deploy staking pool first ?`)
    }
    const whitelist = deployments.whitelist

    const StableJumperContract = await ethers.getContractFactory("StableJumper")
    const StableJumperImpl = <StableJumper>await StableJumperContract.deploy()
    await StableJumperImpl.deployed()

    const TransparentUpgradeableProxyContract = await ethers.getContractFactory("TransparentUpgradeableProxy")
    const StableJumperProxy = <TransparentUpgradeableProxy>await TransparentUpgradeableProxyContract.deploy(
        StableJumperImpl.address,
        deployments.provider,
        StableJumperContract.interface.encodeFunctionData("initialize", [deployments.provider, baseURI, mintPrice, maxSupply, publicMintUpperLimit, true, stakingPoolProxy, whitelist])
    )
    await StableJumperProxy.deployed()

    deployments.stableJumper = StableJumperProxy.address

    await writeFile(deploymentFilename, JSON.stringify(deployments, null, 2))

    console.log(`Deployed to ${network.name} (${network.config.chainId})
    StableJumper proxy:  ${StableJumperProxy.address}
    StableJumper impl:  ${StableJumperImpl.address}
    Deployment file: ${deploymentFilename}`)

    console.log(`Setting StableJumper Proxy to ${StableJumperProxy.address}`)
    const {contractsAdmin} = await accounts(hre);
    const tx = await provider
        .connect(contractsAdmin)
        .setProxy('0x' + STABLE_JUMPER, StableJumperProxy.address)
    await tx.wait()
    console.log(`Proxy successfully set
    tx hash:  ${tx.hash}`)
}

main().catch((error) => {
    console.log(error)
    process.exitCode = 1
})
