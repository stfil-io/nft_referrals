import {expect} from 'chai';
import {Environment, initializeEnv} from "./helpers/environment";
import { DF_ALREADY_MINT, DF_MAX_SUPPLY_EXCEEDED, DF_MINT_PRICE_ERROR, DF_MINT_QUANTITY_EXCEEDED, DF_PUBLIC_SALE_NOT_OPEN } from '../common/Errors';
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
        const {digitalFrogs, users, deployer, merkle} = env

        const maxSupply = (await digitalFrogs.MAX_SUPPLY()).toNumber()
        for(let i=0; i<maxSupply; i++) {
            const proof =  merkle.getLeafProof(users[i].address)
            await digitalFrogs.connect(users[i]).wlMint(proof)
        }

        const user = users[0]
        const mintPrice = await digitalFrogs.getActualMintPrice(1)

        await digitalFrogs.connect(deployer).setPublicSaleOn(true)
        await expect(digitalFrogs.connect(user).mint(1, {value: mintPrice})).rejectedWith(DF_MAX_SUPPLY_EXCEEDED)
    })

    it('Should fail when user0 mint 3, user2 mint 2, user0 mint 1', async () => {
        const {digitalFrogs, users, merkle, deployer} = env

        await digitalFrogs.connect(deployer).setPublicSaleOn(true)
        
        await digitalFrogs.connect(users[0]).mint(3, {value: await digitalFrogs.getActualMintPrice(3)})
        await digitalFrogs.connect(users[1]).mint(2, {value: await digitalFrogs.getActualMintPrice(2)})
        await expect(digitalFrogs.connect(users[2]).mint(1, {value: await digitalFrogs.getActualMintPrice(1)})).rejectedWith(DF_MAX_SUPPLY_EXCEEDED)
    })

    it('Should fail when user0 mint 4', async () => {
        const {digitalFrogs, users, deployer} = env

        await digitalFrogs.connect(deployer).setPublicSaleOn(true)
        
        await expect(digitalFrogs.connect(users[0]).mint(4, {value: await digitalFrogs.getActualMintPrice(4)})).rejectedWith(DF_MINT_QUANTITY_EXCEEDED)
    })
    
    it('Should nft power when user0 mint quantity 2', async () => {
        const {digitalFrogs, users, deployer} = env
       
        const user = users[0]
        const quantity = 2
        const mintPrice = await digitalFrogs.MINT_PRICE()

        await digitalFrogs.connect(deployer).setPublicSaleOn(true)
        await digitalFrogs.connect(user).mint(quantity, {value: mintPrice.mul(quantity)})

        const indexs = (await digitalFrogs.balanceOf(user.address)).toNumber()

        for(let i=0; i<indexs; i++) {
            const tokenId = await digitalFrogs.tokenOfOwnerByIndex(user.address, i)
            const power = await digitalFrogs.getPowerByTokenId(tokenId)
            expect(power).to.gt(0)
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

    it('Set power range', async () => {
        const {digitalFrogs, deployer} = env

        const minPower = 1
        const maxPower = 10

        await digitalFrogs.connect(deployer).setPowerRange(minPower, maxPower)
        expect(minPower).to.be.equal(await digitalFrogs.MIN_POWER())
        expect(maxPower).to.be.equal(await digitalFrogs.MAX_POWER())
    })

    it('Mint price idempotent once when user0 mint quantity 3', async () => {
        const {digitalFrogs, users, deployer} = env
       
        const user = users[0]
        const quantity = 3
        
        await digitalFrogs.connect(deployer).setPublicSaleOn(true)

        const mintPrice = await digitalFrogs.getActualMintPrice(quantity)

        expect(ethers.utils.parseEther("30.1")).to.be.equal(mintPrice)

        await digitalFrogs.connect(user).mint(quantity, {value: mintPrice})

        expect(ethers.utils.parseEther("10.1")).to.be.equal(await digitalFrogs.MINT_PRICE())
    })

    it('Mint price idempotent twice when wlmint mint 4, user0 mint 1', async () => {
        const {digitalFrogs, users, merkle, deployer} = env

        await digitalFrogs.connect(deployer).setPublicSaleOn(true)
        
        for(let i=0; i<4; i++) {
            const proof =  merkle.getLeafProof(users[i].address)
            await digitalFrogs.connect(users[i]).wlMint(proof)
        }

        const user = users[0]
        await digitalFrogs.connect(user).mint(1, {value: await digitalFrogs.getActualMintPrice(1)})

        const mintPrice = await digitalFrogs.getActualMintPrice(1)
        expect(ethers.utils.parseEther("10.201")).to.be.equal(mintPrice)
    })

    it('User0 remaining mint quantity 2 when user0 mint 1', async () => {
        const {digitalFrogs, users, deployer} = env

        await digitalFrogs.connect(deployer).setPublicSaleOn(true)
        
        await digitalFrogs.connect(users[0]).mint(1, {value: await digitalFrogs.getActualMintPrice(1)})

        expect(2).to.be.equal(await digitalFrogs.getActualMintQuantity(users[0].address))
    })
    
});
