import {getDeploymentFile, getDeploymentFilename, IDeployments} from '../../common/common'
import {task} from "hardhat/config";
import {
    bigNumberToBytes, getActorId,
    getNetworkPrefix,
    interactMultisigMessage,
    isTargetNetwork,
    lookupId, printMultisigMsg
} from "../../common/blockchain-utils";
import {encode as dagCborEncode} from '@ipld/dag-cbor';
import {int, string} from "hardhat/internal/core/params/argumentTypes";
import {Whitelist} from "../../typechain-types";
import fs from 'fs'
import {Merkle} from '../../common/merkle';
import {base64Encode, hexDecode} from "../../common/utils";
import {delegatedFromEthAddress, newFromString} from "@glif/filecoin-address";
import {BigNumber} from "ethers";

task("set-whitelist-root", "Set a new whitelist/highWhitelist Root")
    .addParam("adminactor", "The actor id of the pool administrator's multisig wallet", undefined, int, false)
    .addParam("whitelist", "Whitelist JSON File Path", undefined, string, false)
    .addParam("highwhitelist", "High Whitelist JSON File Path", undefined, string, false)
    .setAction(async (params, hre) => {
        await isTargetNetwork(hre.network)

        const deploymentFilename = getDeploymentFilename(hre.network.name)
        const deployments = <IDeployments>getDeploymentFile(deploymentFilename);

        const whitelist = await JSON.parse(fs.readFileSync(params.whitelist, 'utf8'))
        const merkle = new Merkle(whitelist)
        console.log(merkle.getHexRoot())

        const highWhitelist = await JSON.parse(fs.readFileSync(params.highwhitelist, 'utf8'))
        const highMerkle = new Merkle(highWhitelist)
        console.log(highMerkle.getHexRoot())

        const networkPrefix = getNetworkPrefix(hre.network.name)
        const actorId = getActorId(params.adminactor, networkPrefix)
        console.log(`Address: ${actorId}`);

        const multisig = await printMultisigMsg(actorId)

        const WhitelistAddress = <Whitelist>await hre.ethers.getContractAt("Whitelist", deployments.whitelist)
        const methodCalldata = hexDecode(
            WhitelistAddress.interface.encodeFunctionData("setRootAndHighRoot", [merkle.getRoot(), highMerkle.getRoot()])
        )
        const stakingPoolConfiguratorId = await lookupId(delegatedFromEthAddress(deployments.whitelist, networkPrefix))
        let proposeParams = [
            newFromString(stakingPoolConfiguratorId).bytes,
            bigNumberToBytes(BigNumber.from(0)),
            3844450837,
            dagCborEncode(methodCalldata)
        ];
        await interactMultisigMessage(multisig, base64Encode(dagCborEncode(proposeParams)), networkPrefix)

        console.log(`Successfully change whitelist merkle root`)
    })
