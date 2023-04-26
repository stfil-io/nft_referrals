import {ethers, network} from "hardhat";
import {getDeploymentFile, getDeploymentFilename, IDeployments, writeFile} from "../common/common";
import {isTargetNetwork} from "../common/blockchain-utils";
import {DigitalFrogs} from "../typechain-types";

async function main() {
    await isTargetNetwork(network)

    const deploymentFilename = getDeploymentFilename(network.name)
    const deployments = <IDeployments>getDeploymentFile(deploymentFilename)
    if (deployments.digitalFrogs != '') {
        console.log(`Skipped DigitalFrogs`)
        return
    }

    console.log(`Deploying DigitalFrogs`)
    
    const name = "DigitalFrogs"
    const symbol = "DigitalFrogs"
    const maxSupply = 10000n

    const DigitalFrogsContract = await ethers.getContractFactory("DigitalFrogs")
    const DigitalFrogsAddress = <DigitalFrogs>await DigitalFrogsContract.deploy(name, symbol, maxSupply, deployments.whitelist)
    await DigitalFrogsAddress.deployed()
    deployments.digitalFrogs = DigitalFrogsAddress.address

    await writeFile(deploymentFilename, JSON.stringify(deployments, null, 2))

    console.log(`Deployed to ${network.name} (${network.config.chainId})
    DigitalFrogs:  ${DigitalFrogsAddress.address}
    Deployment file: ${deploymentFilename}`)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
