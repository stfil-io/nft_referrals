import {expect} from 'chai';
import {Environment, initializeEnv} from "./helpers/environment";
import { SJ_ALREADY_MINT, SJ_MAX_SUPPLY_EXCEEDED, SJ_MINT_PRICE_ERROR, SJ_MINT_QUANTITY_EXCEEDED, SJ_PUBLIC_SALE_NOT_OPEN } from '../common/Errors';
import { ethers } from 'hardhat';

describe('StableJumper', () => {
    let env: Environment
    beforeEach(async () => {
        env = await initializeEnv();
    })

    it('Should success when user0 wlmint', async () => {
        const {stableJumper, users, merkle} = env
        const user = users[0]

        const proof =  merkle.getLeafProof(user.address)
        await stableJumper.connect(user).wlMint(proof)

        expect(1).to.be.equal(await stableJumper.balanceOf(user.address))
    })

    it('Should fail when user0 wlmint, please wlmint again', async () => {
        const {stableJumper, users, merkle} = env
        const user = users[0]
        
        const proof =  merkle.getLeafProof(user.address)
        await stableJumper.connect(user).wlMint(proof)
        await expect(stableJumper.connect(user).wlMint(proof)).rejectedWith(SJ_ALREADY_MINT)
    })

    it('Should fail when max supply exceeded, wlmint again', async () => {
        const {stableJumper, users, merkle} = env
        
        const maxSupply = (await stableJumper.MAX_SUPPLY()).toNumber()
        for(let i=0; i<maxSupply; i++) {
            const proof =  merkle.getLeafProof(users[i].address)
            await stableJumper.connect(users[i]).wlMint(proof)
        }

        const user = users[maxSupply];
        const proof =  merkle.getLeafProof(user.address)
        await expect(stableJumper.connect(user).wlMint(proof)).rejectedWith(SJ_MAX_SUPPLY_EXCEEDED)
    })

    it('Should fail when user0 mint quantity 1 but public sale close', async () => {
        const {stableJumper, users} = env
        const user = users[0]

        await expect(stableJumper.connect(user).mint(1)).rejectedWith(SJ_PUBLIC_SALE_NOT_OPEN)
    })

    it('Should fail when user0 mint quantity 1 but price 0', async () => {
        const {stableJumper, users, deployer} = env
        const user = users[0]

        await stableJumper.connect(deployer).setPublicSaleOn(true)

        await expect(stableJumper.connect(user).mint(1)).rejectedWith(SJ_MINT_PRICE_ERROR)
    })

    it('Should success when user0 mint quantity 1, price = mintPrice', async () => {
        const {stableJumper, users, deployer} = env
        const user = users[0]
        const mintPrice = await stableJumper.MINT_PRICE()

        await stableJumper.connect(deployer).setPublicSaleOn(true)
        await stableJumper.connect(user).mint(1, {value: mintPrice})
        expect(1).to.be.equal(await stableJumper.balanceOf(user.address))
    })

    it('Should success when user0 mint quantity 2', async () => {
        const {stableJumper, users, deployer} = env
        const user = users[0]
        const quantity = 2
        const mintPrice = await stableJumper.MINT_PRICE()

        await stableJumper.connect(deployer).setPublicSaleOn(true)
        await stableJumper.connect(user).mint(quantity, {value: mintPrice.mul(quantity)})
        expect(quantity).to.be.equal(await stableJumper.balanceOf(user.address))
    })

    it('Should fail when user0 mint quantity > maxSupply', async () => {
        const {stableJumper, users, deployer, merkle} = env

        const maxSupply = (await stableJumper.MAX_SUPPLY()).toNumber()
        for(let i=0; i<maxSupply; i++) {
            const proof =  merkle.getLeafProof(users[i].address)
            await stableJumper.connect(users[i]).wlMint(proof)
        }

        const user = users[0]
        const mintPrice = await stableJumper.getActualMintPrice(1)

        await stableJumper.connect(deployer).setPublicSaleOn(true)
        await expect(stableJumper.connect(user).mint(1, {value: mintPrice})).rejectedWith(SJ_MAX_SUPPLY_EXCEEDED)
    })

    it('Should fail when user0 mint 3, user2 mint 2, user0 mint 1', async () => {
        const {stableJumper, users, merkle, deployer} = env

        await stableJumper.connect(deployer).setPublicSaleOn(true)
        
        await stableJumper.connect(users[0]).mint(3, {value: await stableJumper.getActualMintPrice(3)})
        await stableJumper.connect(users[1]).mint(2, {value: await stableJumper.getActualMintPrice(2)})
        await expect(stableJumper.connect(users[2]).mint(1, {value: await stableJumper.getActualMintPrice(1)})).rejectedWith(SJ_MAX_SUPPLY_EXCEEDED)
    })

    it('Should fail when user0 mint 4', async () => {
        const {stableJumper, users, deployer} = env

        await stableJumper.connect(deployer).setPublicSaleOn(true)
        
        await expect(stableJumper.connect(users[0]).mint(4, {value: await stableJumper.getActualMintPrice(4)})).rejectedWith(SJ_MINT_QUANTITY_EXCEEDED)
    })
    
    it('Should nft power when user0 mint quantity 2', async () => {
        const {stableJumper, users, deployer} = env
       
        const user = users[0]
        const quantity = 2
        const mintPrice = await stableJumper.MINT_PRICE()

        await stableJumper.connect(deployer).setPublicSaleOn(true)
        await stableJumper.connect(user).mint(quantity, {value: mintPrice.mul(quantity)})

        const indexs = (await stableJumper.balanceOf(user.address)).toNumber()

        for(let i=0; i<indexs; i++) {
            const tokenId = await stableJumper.tokenOfOwnerByIndex(user.address, i)
            const power = await stableJumper.getPowerByTokenId(tokenId)
            expect(power).to.gt(0)
        }
    })

    it('Set base URI', async () => {
        const {stableJumper, users, deployer, merkle} = env
        const user = users[0]

        const baseURI = "https://example.com/"
        await stableJumper.connect(deployer).setBaseURI(baseURI)

        const proof =  merkle.getLeafProof(user.address)
        await stableJumper.connect(user).wlMint(proof)
        const tokenId = await stableJumper.tokenOfOwnerByIndex(user.address, 0)

        const tokenURI = baseURI + tokenId
        expect(tokenURI).to.be.equal(await stableJumper.tokenURI(tokenId))
    })

    it('Set power range', async () => {
        const {stableJumper, deployer} = env

        const minPower = 1
        const maxPower = 10

        await stableJumper.connect(deployer).setPowerRange(minPower, maxPower)
        expect(minPower).to.be.equal(await stableJumper.MIN_POWER())
        expect(maxPower).to.be.equal(await stableJumper.MAX_POWER())
    })

    it('Mint price idempotent once when user0 mint quantity 3', async () => {
        const {stableJumper, users, deployer} = env
       
        const user = users[0]
        const quantity = 3
        
        await stableJumper.connect(deployer).setPublicSaleOn(true)

        const mintPrice = await stableJumper.getActualMintPrice(quantity)

        expect(ethers.utils.parseEther("30.1")).to.be.equal(mintPrice)

        await stableJumper.connect(user).mint(quantity, {value: mintPrice})

        expect(ethers.utils.parseEther("10.1")).to.be.equal(await stableJumper.MINT_PRICE())
    })

    it('Mint price idempotent twice when wlmint mint 4, user0 mint 1', async () => {
        const {stableJumper, users, merkle, deployer} = env

        await stableJumper.connect(deployer).setPublicSaleOn(true)
        
        for(let i=0; i<4; i++) {
            const proof =  merkle.getLeafProof(users[i].address)
            await stableJumper.connect(users[i]).wlMint(proof)
        }

        const user = users[0]
        await stableJumper.connect(user).mint(1, {value: await stableJumper.getActualMintPrice(1)})

        const mintPrice = await stableJumper.getActualMintPrice(1)
        expect(ethers.utils.parseEther("10.201")).to.be.equal(mintPrice)
    })

    it('User0 remaining mint quantity 2 when user0 mint 1', async () => {
        const {stableJumper, users, deployer} = env

        await stableJumper.connect(deployer).setPublicSaleOn(true)
        
        await stableJumper.connect(users[0]).mint(1, {value: await stableJumper.getActualMintPrice(1)})

        expect(2).to.be.equal(await stableJumper.getActualMintQuantity(users[0].address))
    })
    
});
