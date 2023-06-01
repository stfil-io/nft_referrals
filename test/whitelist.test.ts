import {expect} from 'chai';
import {Environment, initializeEnv} from "./helpers/environment";
import { Merkle } from '../common/merkle';

describe('Whitelist', () => {
    let env: Environment
    beforeEach(async () => {
        env = await initializeEnv();
    })

    it('Should success while verify user0', async () => {
        const {whitelist, merkle, users} = env
        const user = users[0]
        const {proof, leaf} =  merkle.getLeafProofAndLeaf(user.address)
        expect(true).to.be.equal(await whitelist.verify(proof, leaf))
    })
    
    it('Should fail while verify deploy', async () => {
        const {whitelist, merkle, deployer} = env
        const {proof, leaf} =  merkle.getLeafProofAndLeaf(deployer.address)
        expect(false).to.be.equal(await whitelist.verify(proof, leaf))
    })

    it('Should fail verify user0 when remove user0 and update merkleTree', async () => {
        const {whitelist, users} = env

        const user = users[0]
        const whitelistAddresses = []
        for(let i=0; i<users.length; i++) {
            if (user.address == users[i].address) {
                continue
            }
            whitelistAddresses.push(users[i].address)
        }
        const merkle = new Merkle(whitelistAddresses)
        await whitelist.setRoot(merkle.getRoot())

        const {proof, leaf} =  merkle.getLeafProofAndLeaf(user.address)
        expect(false).to.be.equal(await whitelist.verify(proof, leaf))
    })

    it('Should success verify deployer when add deployer and update merkleTree', async () => {
        const {whitelist, users, deployer} = env

        const whitelistAddresses = users.map(user => user.address)
        whitelistAddresses.push(deployer.address)
        const merkle = new Merkle(whitelistAddresses)
        await whitelist.setRoot(merkle.getRoot())

        const {proof, leaf} =  merkle.getLeafProofAndLeaf(deployer.address)
        expect(true).to.be.equal(await whitelist.verify(proof, leaf))
    })

    it('Should like merkleroot when whitelist inconsistent order', async () => {
        const whitelistAddresses1 = [
            "0x9afa3feBDc382a94493a85103d763d09B5112aBC",
            "0x4c462E41b8027b1eC348aC0318a43bF68c41EFfE"
        ]
        const whitelistAddresses2 = [
            "0x4c462E41b8027b1eC348aC0318a43bF68c41EFfE",
            "0x9afa3feBDc382a94493a85103d763d09B5112aBC"
        ]
        const merkle1 = new Merkle(whitelistAddresses1)
        const merkle2 = new Merkle(whitelistAddresses2)
        expect(merkle1.getHexRoot()).to.be.equal(merkle2.getHexRoot())
    })

    it('Should unlike when compare white root to high white root', async () => {
        const {whitelist} = env

        expect(false).to.be.equal(await whitelist.highRoot() == await whitelist.root())
    })

    it('Should success verify when user0 whilelist, but should fail verify high whitelist', async () => {
        const {whitelist, users, merkle, highMerkle} = env

        const user = users[0]
        const {proof, leaf} =  merkle.getLeafProofAndLeaf(user.address)
        expect(true).to.be.equal(await whitelist.verify(proof, leaf))

        const high =  highMerkle.getLeafProofAndLeaf(user.address)
        expect(false).to.be.equal(await whitelist.highVerify(high.proof, high.leaf))

    })

    it('Should success verify when user0 whilelist, but should success verify high whitelist', async () => {
        const {whitelist, users, merkle, highMerkle} = env

        const user = users[0]
        const merkle2 = new Merkle([user.address])
        whitelist.setHighRoot(merkle2.getRoot())

        const {proof, leaf} =  merkle.getLeafProofAndLeaf(user.address)
        expect(true).to.be.equal(await whitelist.verify(proof, leaf))

        const high =  highMerkle.getLeafProofAndLeaf(user.address)
        expect(true).to.be.equal(await whitelist.highVerify(high.proof, high.leaf))

        expect(false).to.be.equal(await whitelist.highRoot() == await whitelist.root())
    })
});
