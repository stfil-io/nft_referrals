import {expect} from 'chai';
import {Environment, initializeEnv} from "./helpers/environment";
import { Merkle } from '../common/merkle';
import { SN_NFT_TOKENID_NOT_EXIST } from '../common/Errors';

describe('StakingNFT', () => {
    let env: Environment
    beforeEach(async () => {
        env = await initializeEnv();
    })

    it('Should stake fail when user0 not approve', async () => {
        const {stableJumper, users, merkle, stakingNFT} = env
        const user = users[0]

        const proof =  merkle.getLeafProof(user.address)
        await stableJumper.connect(user).wlMint(proof)

        await expect(stakingNFT.connect(user).stake(0)).rejectedWith("ERC721: caller is not token owner or approved")
    })

    it('Should stake success when user0 approve tokenId 0', async () => {
        const {stableJumper, users, merkle, stakingNFT} = env
        const user = users[0]

        const proof =  merkle.getLeafProof(user.address)
        await stableJumper.connect(user).wlMint(proof)
        await stableJumper.connect(user).approve(stakingNFT.address, 0)

        await expect(stakingNFT.connect(user).stake(0)).to.emit(stakingNFT, "Stake").withArgs(user.address, 0)
        expect(1).to.be.equal(await stakingNFT.viewOwnerCollectionsSize(user.address))

        const nfts = await stakingNFT.viewOwnerCollections(user.address, 0, 10);
        expect(0).to.be.equal(nfts[0].tokenId)
        expect(await stableJumper.getPowerByTokenId(0)).to.be.equal(nfts[0].power)
        expect(0).to.be.equal(await stableJumper.balanceOf(user.address))
    })

    it('Should unstake fail when user0 have not token0', async () => {
        const {users, stakingNFT} = env
        const user = users[0]

        await expect(stakingNFT.connect(user).unstake(0)).rejectedWith(SN_NFT_TOKENID_NOT_EXIST)
    })

    it('Should unstake success when user0 have token0', async () => {
        const {stableJumper, users, merkle, stakingNFT} = env
        const user = users[0]

        const proof =  merkle.getLeafProof(user.address)
        await stableJumper.connect(user).wlMint(proof)
        await stableJumper.connect(user).approve(stakingNFT.address, 0)
        
        await expect(stakingNFT.connect(user).stake(0)).to.emit(stakingNFT, "Stake").withArgs(user.address, 0)
        expect(0).to.be.equal(await stableJumper.balanceOf(user.address))
        expect(1).to.be.equal(await stakingNFT.viewOwnerCollectionsSize(user.address))

        await expect(stakingNFT.connect(user).unstake(0)).to.emit(stakingNFT, "Unstake").withArgs(user.address, 0)
        expect(1).to.be.equal(await stableJumper.balanceOf(user.address))
        expect(0).to.be.equal(await stakingNFT.viewOwnerCollectionsSize(user.address))
    })
});
