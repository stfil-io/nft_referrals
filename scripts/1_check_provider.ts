import {network} from "hardhat";
import {getDeploymentFile, getDeploymentFilename, IDeployments, writeFile} from "../common/common";
import {isTargetNetwork} from "../common/blockchain-utils";
import { useEnv } from "../common/env";

async function main() {
    await isTargetNetwork(network)

    const deploymentFilename = getDeploymentFilename(network.name)
    const deployments = <IDeployments>getDeploymentFile(deploymentFilename)
    if (deployments.provider != '') {
        console.log(`Skipped AddressesProvider`)
        return
    }

    const provider = useEnv("ADDRESSES_PROVIDER");
    if (provider == '') {
        console.log('Please set the "ADDRESSES_PROVIDER" environment variable')
        return;
    }
    console.log(`Checked AddressesProvider`)

    deployments.provider = provider

    await writeFile(deploymentFilename, JSON.stringify(deployments, null, 2))
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
