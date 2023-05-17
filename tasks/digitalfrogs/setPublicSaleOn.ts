import {getDeploymentFile, getDeploymentFilename, IDeployments} from '../../common/common'
import {task} from "hardhat/config";
import {isTargetNetwork} from "../../common/blockchain-utils";
import {boolean} from "hardhat/internal/core/params/argumentTypes";
import {DigitalFrogs} from "../../typechain-types";

task("set-public-sale-on", "Set public sale on")
    .addParam("state", "Public sale state", undefined, boolean, false)
    .setAction(async (params, hre) => {
        await isTargetNetwork(hre.network)

        const deploymentFilename = getDeploymentFilename(hre.network.name)
        const deployments = <IDeployments>getDeploymentFile(deploymentFilename);
        
        const DigitalFrogsAddress = <DigitalFrogs>await hre.ethers.getContractAt("DigitalFrogs", deployments.digitalFrogs)
        const tx = await DigitalFrogsAddress.setPublicSaleOn(params.state)
        await tx.wait()
        console.log(`Successfully change whitelist merkle root
        tx hash:  ${tx.hash}`)

        const state = await DigitalFrogsAddress.PUBLIC_SALE_ON()
        console.log(`publicSaleOn: ${state}`)
    })
