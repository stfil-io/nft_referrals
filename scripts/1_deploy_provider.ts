import {ethers, network} from "hardhat";
import {getDeploymentFile, getDeploymentFilename, IDeployments, writeFile} from "../common/common";
import {isTargetNetwork} from "../common/blockchain-utils";
import {AddressesProvider} from "../typechain-types";

async function main() {
    await isTargetNetwork(network)

    const deploymentFilename = getDeploymentFilename(network.name)
    const deployments = <IDeployments>getDeploymentFile(deploymentFilename)
    if (deployments.provider != '') {
        console.log(`Skipped AddressesProvider`)
        return
    }

    console.log(`Deploying AddressesProvider`)

    const AddressesProviderContract = await ethers.getContractFactory("AddressesProvider")
    const ProviderAddress = <AddressesProvider>await AddressesProviderContract.deploy()
    await ProviderAddress.deployed()
    deployments.provider = ProviderAddress.address

    await writeFile(deploymentFilename, JSON.stringify(deployments, null, 2))

    console.log(`Deployed to ${network.name} (${network.config.chainId})
    AddressesProvider:  ${ProviderAddress.address}
    Deployment file: ${deploymentFilename}`)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
