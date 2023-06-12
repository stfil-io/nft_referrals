import {getDeploymentFile, getDeploymentFilename, IDeployments} from '../../common/common'
import {task} from "hardhat/config";
import {isTargetNetwork} from "../../common/blockchain-utils";
import {string} from "hardhat/internal/core/params/argumentTypes";
import {Whitelist} from "../../typechain-types";
import fs from 'fs'
import { Merkle } from '../../common/merkle';

task("set-whitelist-root", "Set a new whitelist/highWhitelist Root")
    .addParam("whitelist", "Whitelist JSON File Path", undefined, string, false)
    .addParam("highwhitelist", "High Whitelist JSON File Path", undefined, string, false)
    .setAction(async (params, hre) => {
        await isTargetNetwork(hre.network)

        const deploymentFilename = getDeploymentFilename(hre.network.name)
        const deployments = <IDeployments>getDeploymentFile(deploymentFilename);

        const whitelist = await JSON.parse(fs.readFileSync(params.whitelist, 'utf8'))
        const merkle = new Merkle(whitelist)

        const highWhitelist = await JSON.parse(fs.readFileSync(params.highwhitelist, 'utf8'))
        const highMerkle = new Merkle(highWhitelist)

        const WhitelistAddress = <Whitelist>await hre.ethers.getContractAt("Whitelist", deployments.whitelist)
        const tx = await WhitelistAddress.setRootAndHighRoot(merkle.getRoot(), highMerkle.getRoot())
        await tx.wait()
        console.log(`Successfully change whitelist merkle root
        tx hash:  ${tx.hash}`)
    })
