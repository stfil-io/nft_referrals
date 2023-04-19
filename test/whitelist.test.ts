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
        const {proof, leaf} =  merkle.getLeafProof(user.address)
        expect(true).to.be.equal(await whitelist.verify(proof, leaf))
    })
    
    it('Should fail while verify deploy', async () => {
        const {whitelist, merkle, deployer} = env
        const {proof, leaf} =  merkle.getLeafProof(deployer.address)
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

        const {proof, leaf} =  merkle.getLeafProof(user.address)
        expect(false).to.be.equal(await whitelist.verify(proof, leaf))
    })

    it('Should success verify deployer when add deployer and update merkleTree', async () => {
        const {whitelist, users, deployer} = env

        const whitelistAddresses = users.map(user => user.address)
        whitelistAddresses.push(deployer.address)
        const merkle = new Merkle(whitelistAddresses)
        await whitelist.setRoot(merkle.getRoot())

        const {proof, leaf} =  merkle.getLeafProof(deployer.address)
        expect(true).to.be.equal(await whitelist.verify(proof, leaf))
    })
});
