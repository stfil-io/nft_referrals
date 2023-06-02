import {ethers, upgrades} from "hardhat";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

import {
    Whitelist,
    StableJumper,
    ReferralStorage,
    AddressesProvider,
    StakingNFT
} from "../../typechain-types";
import { Merkle } from "../../common/merkle";
import { STABLE_JUMPER, STAKING_NFT } from "../../common/ProxyKey";

export interface Environment {
    provider: AddressesProvider;
    whitelist: Whitelist;
    stableJumper: StableJumper;
    stakingNFT: StakingNFT;
    referral: ReferralStorage;
    merkle: Merkle;
    highMerkle: Merkle;
    deployer: SignerWithAddress;
    users: SignerWithAddress[];
}

const testEnv: Environment = {
    provider: {} as AddressesProvider,
    whitelist: {} as Whitelist,
    stableJumper: {} as StableJumper,
    stakingNFT: {} as StakingNFT,
    referral: {} as ReferralStorage,
    merkle: {} as Merkle,
    highMerkle: {} as Merkle,
    deployer: {} as SignerWithAddress,
    users: [] as SignerWithAddress[],
} as Environment

export const deployAddressesProvider = async () => {
    const AddressesProvider = await ethers.getContractFactory("AddressesProvider")
    const ProviderAddress = await AddressesProvider.deploy()
    await ProviderAddress.deployed()
    return <AddressesProvider>ProviderAddress
}

export const deployReferralStorage = async () => {
    const ReferralStorage = await ethers.getContractFactory("ReferralStorage")
    const ReferralStorageAddress = await ReferralStorage.deploy()
    await ReferralStorageAddress.deployed()

    return <ReferralStorage>ReferralStorageAddress
}

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
    const publicSaleOn = false
    const stFILPool = STFILPoolAddress.address 
    const whitelist = testEnv.whitelist.address
    const StableJumperAddress = await upgrades.deployProxy(StableJumper, [name, symbol, baseURI, mintPrice, maxSupply, publicMintUpperLimit, publicSaleOn, stFILPool, whitelist])
    await StableJumperAddress.deployed()

    return <StableJumper>StableJumperAddress
}

export const deployStakingNFT = async () => {
    const StakingNFT = await ethers.getContractFactory("StakingNFT")
    const StakingNFTAddress = await upgrades.deployProxy(StakingNFT, [testEnv.provider.address])
    await StakingNFTAddress.deployed()

    return <StakingNFT>StakingNFTAddress
}

export async function initializeEnv(): Promise<Environment> {
    const [_deployer, ...restSigners] = await ethers.getSigners()

    testEnv.provider = await deployAddressesProvider();

    testEnv.referral = await deployReferralStorage()

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

    testEnv.stakingNFT = await deployStakingNFT()

    await testEnv.provider.setProxy("0x" + STABLE_JUMPER, testEnv.stableJumper.address)
    await testEnv.provider.setProxy("0x" + STAKING_NFT, testEnv.stakingNFT.address)
   
    await testEnv.stakingNFT.initStakingNFT()

    return testEnv
}
