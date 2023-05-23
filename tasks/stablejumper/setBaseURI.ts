import {getDeploymentFile, getDeploymentFilename, IDeployments} from '../../common/common'
import {task} from "hardhat/config";
import {isTargetNetwork} from "../../common/blockchain-utils";
import {string} from "hardhat/internal/core/params/argumentTypes";
import {StableJumper} from "../../typechain-types";

task("set-base-uri", "Set public sale on")
    .addParam("uri", "Base URI", undefined, string, false)
    .setAction(async (params, hre) => {
        await isTargetNetwork(hre.network)

        const deploymentFilename = getDeploymentFilename(hre.network.name)
        const deployments = <IDeployments>getDeploymentFile(deploymentFilename);
        
        const StableJumperAddress = <StableJumper>await hre.ethers.getContractAt("StableJumper", deployments.stableJumper)
        const tx = await StableJumperAddress.setBaseURI(params.uri)
        await tx.wait()
        console.log(`Successfully change BaseURI
        tx hash:  ${tx.hash}`)

        const baseURI = await StableJumperAddress.BASE_URI()
        console.log(`baseURI: ${baseURI}`)
    })
