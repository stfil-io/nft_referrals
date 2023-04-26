import {expect} from 'chai';
import {Environment, initializeEnv} from "./helpers/environment";
import { DF_ALREADY_MINT, DF_MAX_SUPPLY_EXCEEDED, DF_MINT_PRICE_ERROR, DF_PUBLIC_SALE_NOT_OPEN } from '../common/Errors';
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

    
    it('Should nft integral when user0 mint quantity 2', async () => {
        const {digitalFrogs, users, deployer} = env
       
        const user = users[0]
        const quantity = 2
        const mintPrice = await digitalFrogs.MINT_PRICE()

        await digitalFrogs.connect(deployer).setPublicSaleOn(true)
        await digitalFrogs.connect(user).mint(quantity, {value: mintPrice.mul(quantity)})

        const indexs = (await digitalFrogs.balanceOf(user.address)).toNumber()

        for(let i=0; i<indexs; i++) {
            const tokenId = await digitalFrogs.tokenOfOwnerByIndex(user.address, i)
            const integral = await digitalFrogs.getIntegralByTokenId(tokenId)
            expect(integral).to.gt(0)
        }
    })

    it('Set base URI', async () => {
        const {digitalFrogs, users, deployer, merkle} = env
        const user = users[0]

        const baseURI = "https://example.com/"
        await digitalFrogs.connect(deployer).setBaseURI(baseURI)

        const proof =  merkle.getLeafProof(user.address)
        await digitalFrogs.connect(user).wlMint(proof)
        const tokenId = await digitalFrogs.tokenOfOwnerByIndex(user.address, 0)

        const tokenURI = baseURI + tokenId
        expect(tokenURI).to.be.equal(await digitalFrogs.tokenURI(tokenId))
    })

    it('Set mint price', async () => {
        const {digitalFrogs, deployer} = env

        const mintPrice = ethers.utils.parseEther("50")

        await digitalFrogs.connect(deployer).setMintPrice(mintPrice)
        expect(mintPrice).to.be.equal(await digitalFrogs.MINT_PRICE())

    })

    it('Set integral range', async () => {
        const {digitalFrogs, deployer} = env

        const minIntegral = 1
        const maxIntegral = 10

        await digitalFrogs.connect(deployer).setIntegralRange(minIntegral, maxIntegral)
        expect(minIntegral).to.be.equal(await digitalFrogs.MIN_INTEGRAL())
        expect(maxIntegral).to.be.equal(await digitalFrogs.MAX_INTEGRAL())
    })
    
});
