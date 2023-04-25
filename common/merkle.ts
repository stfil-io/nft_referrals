import { keccak256 } from "ethers/lib/utils";
import MerkleTree from "merkletreejs";

export class Merkle {
    merkleTree: MerkleTree

    constructor(whitelistAddresses: string[]) {
        const leafNodes = whitelistAddresses.map(addr => keccak256(addr))
        this.merkleTree = new MerkleTree(leafNodes, keccak256, {sortPairs: true})
    }

    getRoot(): Buffer {
        return this.merkleTree.getRoot()
    }

    getLeafProof(addr: string) {
        const leaf = keccak256(addr)
        const proof = this.merkleTree.getHexProof(leaf)
        return proof
    }

    getLeafProofAndLeaf(addr: string) {
        const leaf = keccak256(addr)
        const proof = this.merkleTree.getHexProof(leaf)
        return {proof, leaf}
    }
} 