import {ethers, network} from "hardhat";
import {getDeploymentFile, getDeploymentFilename, IDeployments, writeFile} from "../common/common";
import {isTargetNetwork} from "../common/blockchain-utils";
import {StableJumper} from "../typechain-types";
import { useEnv } from "../common/env";

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
    const baseURI =  useEnv("BASE_URI")
    if (baseURI == '') {
        console.error('Please set the "BASE_URI" environment variable')
        return;
    }
    const mintPrice = ethers.utils.parseEther("10") 
    const maxSupply = 10000 
    const publicMintUpperLimit = 5000 
    const increasePercentage = 100 
    const increaseInterval = 100 
    const stFILPool = useEnv("STFIL_POOL")
    if (stFILPool == '') {
        console.error('Please set the "STFIL_POOL" environment variable')
        return;
    }
    const whitelist = deployments.whitelist

    const StableJumperContract = await ethers.getContractFactory("StableJumper")
    const StableJumperAddress = <StableJumper>await StableJumperContract.deploy(name, symbol, baseURI, mintPrice, maxSupply, publicMintUpperLimit, increasePercentage, increaseInterval, stFILPool, whitelist)
    await StableJumperAddress.deployed()
    deployments.stableJumper = StableJumperAddress.address

    await writeFile(deploymentFilename, JSON.stringify(deployments, null, 2))

    console.log(`Deployed to ${network.name} (${network.config.chainId})
    StableJumper:  ${StableJumperAddress.address}
    Deployment file: ${deploymentFilename}`)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
