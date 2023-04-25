import {ethers} from "hardhat";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

import {
    Whitelist,
    DigitalFrogs,
    ReferralStorage
} from "../../typechain-types";
import { Merkle } from "../../common/merkle";
import MerkleTree from "merkletreejs";

export interface Environment {
    whitelist: Whitelist;
    digitalFrogs: DigitalFrogs;
    referral: ReferralStorage;
    merkle: Merkle;
    deployer: SignerWithAddress;
    users: SignerWithAddress[];
}

const testEnv: Environment = {
    whitelist: {} as Whitelist,
    digitalFrogs: {} as DigitalFrogs,
    referral: {} as ReferralStorage,
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

export const deployDigitalFrogs = async () => {
    const DigitalFrogs = await ethers.getContractFactory("DigitalFrogs")
    const DigitalFrogsAddress = await DigitalFrogs.deploy("DigitalFrogs", "DigitalFrogs", 5, testEnv.whitelist.address)
    await DigitalFrogsAddress.deployed()

    return <DigitalFrogs>DigitalFrogsAddress
}

export const deployReferralStorage = async () => {
    const ReferralStorage = await ethers.getContractFactory("ReferralStorage")
    const ReferralStorageAddress = await ReferralStorage.deploy()
    await ReferralStorageAddress.deployed()

    return <ReferralStorage>ReferralStorageAddress
}

export async function initializeEnv(): Promise<Environment> {
    const [_deployer, ...restSigners] = await ethers.getSigners()

    testEnv.merkle = new Merkle(restSigners.map(signer => signer.address))
    testEnv.whitelist = await deployWhitelist()

    for (const signer of restSigners) {
        testEnv.users.push(signer)
    }

    testEnv.deployer = _deployer

    testEnv.digitalFrogs = await deployDigitalFrogs()

    testEnv.referral = await deployReferralStorage()
   
    return testEnv
}
