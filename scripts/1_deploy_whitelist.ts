import {ethers, network} from "hardhat";
import {getDeploymentFile, getDeploymentFilename, IDeployments, writeFile} from "../common/common";
import {isTargetNetwork} from "../common/blockchain-utils";
import {Whitelist} from "../typechain-types";
import { useEnv } from "../common/env";
import fs, {readFileSync} from 'fs'
import { Merkle } from "../common/merkle";

async function main() {
    await isTargetNetwork(network)

    const deploymentFilename = getDeploymentFilename(network.name)
    const deployments = <IDeployments>getDeploymentFile(deploymentFilename)
    if (deployments.whitelist != '') {
        console.log(`Skipped Whitelist`)
        return
    }

    console.log(`Deploying Whitelist`)

    const whitelistJSONPath = useEnv("WHITELIST_JSON_PATH");
    if (whitelistJSONPath == '') {
        console.error('Please set the "WHITELIST_JSON_PATH" environment variable')
        return;
    }
    
    const whitelist = await JSON.parse(fs.readFileSync(whitelistJSONPath, 'utf8'))
    const merkle = new Merkle(whitelist)
    console.log("whitelist: ", whitelist)

    const WhitelistContract = await ethers.getContractFactory("Whitelist")
    const WhitelistAddress = <Whitelist>await WhitelistContract.deploy(merkle.getRoot())
    await WhitelistAddress.deployed()
    deployments.whitelist = WhitelistAddress.address

    await writeFile(deploymentFilename, JSON.stringify(deployments, null, 2))

    console.log(`Deployed to ${network.name} (${network.config.chainId})
    Whitelist:  ${WhitelistAddress.address}
    Deployment file: ${deploymentFilename}`)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
