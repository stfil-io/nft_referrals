import {expect} from 'chai';
import {Environment, initializeEnv} from "./helpers/environment";
import { RS_REFERRAL_CODE_ALREADY_EXIST, RS_REFERRAL_CODE_MUST_BE_IN_THE_RANGE, RS_REFERRAL_CODE_NUM_LIMITED } from '../common/Errors';

describe('StableJumper', () => {
    let env: Environment
    beforeEach(async () => {
        env = await initializeEnv();
    })

    it('User0 register referral code 666888', async () => {
        const {referral, users} = env
        const user = users[0]
        const referralCode = 666888
        await expect(referral.connect(user).registerReferralCode(referralCode)).to.emit(referral, "RegisterReferralCode").withArgs(user.address, referralCode)

        expect(await referral.getAddrByReferralCode(referralCode)).to.be.equal(user.address)
    })

    it('Shound fail when user0 register referral code 999', async () => {
        const {referral, users} = env
        const user = users[0]

        const referralCode = 999

        await expect(referral.connect(user).registerReferralCode(referralCode)).rejectedWith(RS_REFERRAL_CODE_MUST_BE_IN_THE_RANGE)
    })

    it('Shound fail when user0 register referral code 1000000001', async () => {
        const {referral, users} = env
        const user = users[0]

        const referralCode = 1000000001

        await expect(referral.connect(user).registerReferralCode(referralCode)).rejectedWith(RS_REFERRAL_CODE_MUST_BE_IN_THE_RANGE)
    })

    it('Shound fail when user0 has 10 referral codes, please register again', async () => {
        const {referral, users} = env
        const user = users[0]

        for(let i=0; i<10; i++) {
            const referralCode = 100000 + i
            await referral.connect(user).registerReferralCode(referralCode)
        }

        const referralCode = 100100
        await expect(referral.connect(user).registerReferralCode(referralCode)).rejectedWith(RS_REFERRAL_CODE_NUM_LIMITED)
    })

    it('Shound fail when user0 has 10 referral codes, please register again', async () => {
        const {referral, users} = env
        const user = users[0]

        for(let i=0; i<10; i++) {
            const referralCode = 100000 + i
            await referral.connect(user).registerReferralCode(referralCode)
        }

        const referralCode = 100100
        await expect(referral.connect(user).registerReferralCode(referralCode)).rejectedWith(RS_REFERRAL_CODE_NUM_LIMITED)
    })

    it('Shound fail when user0 has already registered referral code 666888, user1 will register again', async () => {
        const {referral, users} = env
        const user = users[0]
        const referralCode = 666888
        await expect(referral.connect(user).registerReferralCode(referralCode)).to.emit(referral, "RegisterReferralCode").withArgs(user.address, referralCode)


        const user1 = users[1]
        await expect(referral.connect(user1).registerReferralCode(referralCode)).rejectedWith(RS_REFERRAL_CODE_ALREADY_EXIST)
    })

    it('View collection when user0 registers 1 referral codes user1 registers 5 referral codes user2 registers 10 referral code', async () => {
        const {referral, users} = env

        const user0 = users[0]
        for(let i=0; i<1; i++) {
            const referralCode = 100000 + i
            await referral.connect(user0).registerReferralCode(referralCode)
        }
        expect(1).to.be.equal(await referral.viewOwnerCollectionsSize(user0.address))
        expect(1).to.be.equal((await referral.viewOwnerCollections(user0.address, 0, 10)).length)
        expect(1).to.be.equal(await referral.viewCollectionsSize())
        expect(1).to.be.equal((await referral.viewCollections(0, 10)).length)

        const user1 = users[1]
        for(let i=1; i<6; i++) {
            const referralCode = 100000 + i
            await referral.connect(user1).registerReferralCode(referralCode)
        }
        expect(5).to.be.equal(await referral.viewOwnerCollectionsSize(user1.address))
        expect(5).to.be.equal((await referral.viewOwnerCollections(user1.address, 0, 10)).length)
        expect(6).to.be.equal(await referral.viewCollectionsSize())
        expect(6).to.be.equal((await referral.viewCollections(0, 10)).length)

        const user2 = users[2]
        for(let i=6; i<16; i++) {
            const referralCode = 100000 + i
            await referral.connect(user2).registerReferralCode(referralCode)
        }
        expect(10).to.be.equal(await referral.viewOwnerCollectionsSize(user2.address))
        expect(10).to.be.equal((await referral.viewOwnerCollections(user2.address, 0, 10)).length)
        expect(16).to.be.equal(await referral.viewCollectionsSize())
        expect(10).to.be.equal((await referral.viewCollections(0, 10)).length)
        
    })
});
