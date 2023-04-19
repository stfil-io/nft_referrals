import {ethers} from "hardhat";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

import {
    Whitelist
} from "../../typechain-types";
import { Merkle } from "../../common/merkle";
import MerkleTree from "merkletreejs";

export interface Environment {
    whitelist: Whitelist;
    merkle: Merkle;
    deployer: SignerWithAddress;
    users: SignerWithAddress[];
}

const testEnv: Environment = {
    whitelist: {} as Whitelist,
    merkle: {} as Merkle,
    deployer: {} as SignerWithAddress,
    users: [] as SignerWithAddress[],
} as Environment

export const deployWhitelist = async () => {
    const Whitelist = await ethers.getContractFactory("Whitelist")
    const WhitelistAddress = await Whitelist.deploy(testEnv.merkle.getRoot())
    await WhitelistAddress.deployed()

    return <Whitelist>WhitelistAddress
}

export async function initializeEnv(): Promise<Environment> {
    const [_deployer, ...restSigners] = await ethers.getSigners()

    testEnv.merkle = new Merkle(restSigners.map(signer => signer.address))
    testEnv.whitelist = await deployWhitelist()

    for (const signer of restSigners) {
        testEnv.users.push(signer)
    }

    testEnv.deployer = _deployer
   
    return testEnv
}
