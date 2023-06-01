import {ethers} from "hardhat";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

import {
    Whitelist,
    StableJumper,
    ReferralStorage
} from "../../typechain-types";
import { Merkle } from "../../common/merkle";

export interface Environment {
    whitelist: Whitelist;
    stableJumper: StableJumper;
    referral: ReferralStorage;
    merkle: Merkle;
    highMerkle: Merkle;
    deployer: SignerWithAddress;
    users: SignerWithAddress[];
}

const testEnv: Environment = {
    whitelist: {} as Whitelist,
    stableJumper: {} as StableJumper,
    referral: {} as ReferralStorage,
    merkle: {} as Merkle,
    highMerkle: {} as Merkle,
    deployer: {} as SignerWithAddress,
    users: [] as SignerWithAddress[],
} as Environment

export const deployWhitelist = async () => {
    const Whitelist = await ethers.getContractFactory("Whitelist")
    const WhitelistAddress = await Whitelist.deploy(testEnv.merkle.getRoot(), testEnv.highMerkle.getRoot())
    await WhitelistAddress.deployed()

    return <Whitelist>WhitelistAddress
}

export const deployStableJumper = async () => {
    const STFILPool = await ethers.getContractFactory("StakingPool")
    const STFILPoolAddress = await STFILPool.deploy()
    await STFILPoolAddress.deployed()

    const StableJumper = await ethers.getContractFactory("StableJumper")

    const name = "StableJumper"
    const symbol = "StableJumper"
    const baseURI = ""
    const mintPrice = ethers.utils.parseEther("10") 
    const maxSupply = 10 
    const publicMintUpperLimit = 5 
    const stFILPool = STFILPoolAddress.address 
    const whitelist = testEnv.whitelist.address
    const StableJumperAddress = await StableJumper.deploy(name, symbol, baseURI, mintPrice, maxSupply, publicMintUpperLimit, stFILPool, whitelist)
    await StableJumperAddress.deployed()

    return <StableJumper>StableJumperAddress
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
    let highRestSigners = []
    for(let i = Math.floor(restSigners.length / 2); i < restSigners.length; i++) {
        highRestSigners.push(restSigners[i])
    }
    testEnv.highMerkle = new Merkle(highRestSigners.map(signer => signer.address))
    testEnv.whitelist = await deployWhitelist()

    for (const signer of restSigners) {
        testEnv.users.push(signer)
    }

    testEnv.deployer = _deployer

    testEnv.stableJumper = await deployStableJumper()

    testEnv.referral = await deployReferralStorage()
   
    return testEnv
}
