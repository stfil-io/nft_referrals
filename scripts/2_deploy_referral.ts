import {ethers, network} from "hardhat";
import {getDeploymentFile, getDeploymentFilename, IDeployments, writeFile} from "../common/common";
import {isTargetNetwork} from "../common/blockchain-utils";
import {ReferralStorage} from "../typechain-types";

async function main() {
    await isTargetNetwork(network)

    const deploymentFilename = getDeploymentFilename(network.name)
    const deployments = <IDeployments>getDeploymentFile(deploymentFilename)
    if (deployments.referral != '') {
        console.log(`Skipped Referral`)
        return
    }

    console.log(`Deploying Referral`)

    const ReferralContract = await ethers.getContractFactory("ReferralStorage")
    const ReferralAddress = <ReferralStorage>await ReferralContract.deploy()
    await ReferralAddress.deployed()
    deployments.referral = ReferralAddress.address

    await writeFile(deploymentFilename, JSON.stringify(deployments, null, 2))

    console.log(`Deployed to ${network.name} (${network.config.chainId})
    Referral:  ${ReferralAddress.address}
    Deployment file: ${deploymentFilename}`)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
