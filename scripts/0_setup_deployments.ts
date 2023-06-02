import {getDeploymentFilename, IDeployments, writeFile} from "../common/common";
import {network} from "hardhat";
import {isTargetNetwork} from "../common/blockchain-utils";

async function main() {
    await isTargetNetwork(network)

    console.log(`Creating Deployment file for network ${network.name} (${network.config.chainId})`)

    const deploymentFilename = getDeploymentFilename(network.name)
    const deployments: IDeployments = {
        provider: '',
        referral: '',
        whitelist: '',
        stableJumper: '',
    }

    await writeFile(deploymentFilename, JSON.stringify(deployments, null, 2))

    console.log(`Deployment file created for ${network.name} (${network.config.chainId})
    Deployment file: ${deploymentFilename}`)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
