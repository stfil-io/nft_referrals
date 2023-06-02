import {ethers, network} from "hardhat";
import {getDeploymentFile, getDeploymentFilename, IDeployments, writeFile} from "../common/common";
import {isTargetNetwork} from "../common/blockchain-utils";
import {AddressesProvider, StableJumper, TransparentUpgradeableProxy} from "../typechain-types";
import {useEnv} from "../common/env";
import {STABLE_JUMPER} from "../common/ProxyKey";

async function main() {
    await isTargetNetwork(network)

    const deploymentFilename = getDeploymentFilename(network.name)
    const deployments = <IDeployments>getDeploymentFile(deploymentFilename)
    if (deployments.stableJumper != '') {
        console.log(`Skipped StableJumper`)
        return
    }

    console.log(`Deploying StableJumper`)

    const name = "StableJumper"
    const symbol = "StableJumper"
    const baseURI = useEnv("BASE_URI")
    if (baseURI == '') {
        console.log('Please set the "BASE_URI" environment variable')
        return;
    }
    const mintPrice = ethers.utils.parseEther("10")
    const maxSupply = 10000
    const publicMintUpperLimit = 5000
    const stFILPool = useEnv("STFIL_POOL")
    if (stFILPool == '') {
        console.log('Please set the "STFIL_POOL" environment variable')
        return;
    }
    const whitelist = deployments.whitelist

    const StableJumperContract = await ethers.getContractFactory("StableJumper")
    const StableJumperImpl = <StableJumper>await StableJumperContract.deploy()
    await StableJumperImpl.deployed()

    const TransparentUpgradeableProxyContract = await ethers.getContractFactory("TransparentUpgradeableProxy")
    const StableJumperProxy = <TransparentUpgradeableProxy>await TransparentUpgradeableProxyContract.deploy(
        StableJumperImpl.address,
        deployments.provider,
        StableJumperContract.interface.encodeFunctionData("initialize", [name, symbol, baseURI, mintPrice, maxSupply, publicMintUpperLimit, stFILPool, whitelist])
    )
    await StableJumperProxy.deployed()

    deployments.stableJumper = StableJumperProxy.address

    await writeFile(deploymentFilename, JSON.stringify(deployments, null, 2))

    console.log(`Deployed to ${network.name} (${network.config.chainId})
    StableJumper proxy:  ${StableJumperProxy.address}
    StableJumper impl:  ${StableJumperImpl.address}
    Deployment file: ${deploymentFilename}`)

    console.log(`Setting StableJumper Proxy to ${StableJumperProxy.address}`)
    const provider = <AddressesProvider>await ethers.getContractAt("AddressesProvider", deployments.provider)
    const tx = await provider
        .setProxy('0x' + STABLE_JUMPER, StableJumperProxy.address)
    await tx.wait()
    console.log(`Proxy successfully set
    tx hash:  ${tx.hash}`)
}

main().catch((error) => {
    console.log(error)
    process.exitCode = 1
})
