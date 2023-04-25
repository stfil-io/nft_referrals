import {expect} from 'chai';
import {Environment, initializeEnv} from "./helpers/environment";
import { Merkle } from '../common/merkle';
import { DF_ALREADY_MINT, DF_MAX_SUPPLY_EXCEEDED, DF_MINT_PRICE_ERROR, DF_MUST_BE_WHITELISTED, DF_PUBLIC_SALE_NOT_OPEN } from '../common/Errors';
import { ethers } from 'hardhat';

describe('DigitalFrogs', () => {
    let env: Environment
    beforeEach(async () => {
        env = await initializeEnv();
    })

    it('Should success when user0 wlmint', async () => {
        const {digitalFrogs, users, merkle} = env
        const user = users[0]

        const proof =  merkle.getLeafProof(user.address)
        await digitalFrogs.connect(user).wlMint(proof)

        expect(1).to.be.equal(await digitalFrogs.balanceOf(user.address))
    })

    it('Should fail when user0 wlmint, please wlmint again', async () => {
        const {digitalFrogs, users, merkle} = env
        const user = users[0]
        
        const proof =  merkle.getLeafProof(user.address)
        await digitalFrogs.connect(user).wlMint(proof)
        await expect(digitalFrogs.connect(user).wlMint(proof)).rejectedWith(DF_ALREADY_MINT)
    })

    it('Should fail when max supply exceeded, wlmint again', async () => {
        const {digitalFrogs, users, merkle} = env

        const maxSupply = (await digitalFrogs.MAX_SUPPLY()).toNumber()
        for(let i=0; i<maxSupply; i++) {
            const proof =  merkle.getLeafProof(users[i].address)
            await digitalFrogs.connect(users[i]).wlMint(proof)
        }

        const user = users[maxSupply];
        const proof =  merkle.getLeafProof(user.address)
        await expect(digitalFrogs.connect(user).wlMint(proof)).rejectedWith(DF_MAX_SUPPLY_EXCEEDED)
    })

    it('Should fail when user0 mint quantity 1 but public sale close', async () => {
        const {digitalFrogs, users} = env
        const user = users[0]

        await expect(digitalFrogs.connect(user).mint(1)).rejectedWith(DF_PUBLIC_SALE_NOT_OPEN)
    })

    it('Should fail when user0 mint quantity 1 but price 0', async () => {
        const {digitalFrogs, users, deployer} = env
        const user = users[0]

        await digitalFrogs.connect(deployer).setPublicSaleOn(true)

        await expect(digitalFrogs.connect(user).mint(1)).rejectedWith(DF_MINT_PRICE_ERROR)
    })

    it('Should success when user0 mint quantity 1, price = mintPrice', async () => {
        const {digitalFrogs, users, deployer} = env
        const user = users[0]
        const mintPrice = await digitalFrogs.MINT_PRICE()

        await digitalFrogs.connect(deployer).setPublicSaleOn(true)
        await digitalFrogs.connect(user).mint(1, {value: mintPrice})
        expect(1).to.be.equal(await digitalFrogs.balanceOf(user.address))
    })

    it('Should success when user0 mint quantity 2', async () => {
        const {digitalFrogs, users, deployer} = env
        const user = users[0]
        const quantity = 2
        const mintPrice = await digitalFrogs.MINT_PRICE()

        await digitalFrogs.connect(deployer).setPublicSaleOn(true)
        await digitalFrogs.connect(user).mint(quantity, {value: mintPrice.mul(quantity)})
        expect(quantity).to.be.equal(await digitalFrogs.balanceOf(user.address))
    })

    it('Should fail when user0 mint quantity > maxSupply', async () => {
        const {digitalFrogs, users, deployer} = env
        const user = users[0]
        const mintPrice = await digitalFrogs.MINT_PRICE()
        const maxSupply = (await digitalFrogs.MAX_SUPPLY()).toNumber();

        await digitalFrogs.connect(deployer).setPublicSaleOn(true)
        await expect(digitalFrogs.connect(user).mint(maxSupply + 1, {value: mintPrice.mul(maxSupply)})).rejectedWith(DF_MAX_SUPPLY_EXCEEDED)
    })

    it('withdraw to deployer when user0 mint quantity 1', async () => {
        const {digitalFrogs, users, deployer} = env
        const user = users[0]
        const mintPrice = await digitalFrogs.MINT_PRICE()

        const prevBalance = await ethers.provider.getBalance(deployer.address)

        await digitalFrogs.connect(deployer).setPublicSaleOn(true)
        await digitalFrogs.connect(user).mint(1, {value: mintPrice})
        await digitalFrogs.connect(deployer).withdraw()
        expect(prevBalance).to.be.lt(await ethers.provider.getBalance(deployer.address))

    })
    
});
