import {HardhatRuntimeEnvironment, Network} from 'hardhat/types'
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {HttpJsonRpcConnector, LotusClient, LotusWalletProvider} from 'filecoin.js';
import {useEnv} from "./env";
import {decode as dagCborDecode, encode as dagCborEncode} from '@ipld/dag-cbor';
import {base64Decode, base64Encode, hexDecode, hexEncode} from "./utils";
import {CID} from 'multiformats/cid'
import {
    CoinType,
    encode as addressToString,
    newAddress,
    newFromString,
    newIDAddress,
    Protocol
} from '@glif/filecoin-address';
import {BigNumber} from "ethers";
import {BigNumber as BigNumberJS} from 'bignumber.js';
import {MessagePartial, MsgLookup} from "filecoin.js/builds/dist/providers/Types";
import {ask} from "./common";

export const isValidContract = async (
    hre: HardhatRuntimeEnvironment,
    contractAddr: string
): Promise<boolean> => {
    return (await hre.ethers.provider.getCode(contractAddr)) != '0x'
}

export const getNetworkPrefix = (networkName: string): CoinType => {
    if (networkName == "hyperspace") {
        return CoinType.TEST
    } else if (networkName == "calibration") {
        return CoinType.TEST
    } else if (networkName == "mainnet") {
        return CoinType.MAIN
    } else {
        throw new Error(`${networkName} is not supported.`)
    }
}

export const isTargetNetwork = async (
    network: Network,
) => {
    if (network.config.chainId === 31337) {
        throw new Error(`Hardhat network is not supported.`)
    }
    const target = useEnv("TARGET_NETWORK");
    if (network.name !== target) {
        throw new Error(`The target network is inconsistent with the current network.`)
    }
}

export const accounts = async (
    hre: HardhatRuntimeEnvironment
): Promise<{
    deployer: SignerWithAddress,
    contractsAdmin: SignerWithAddress,
}> => {
    const [deployer, contractsAdmin] = await hre.ethers.getSigners()
    return {deployer, contractsAdmin};
}

export const getActorId = (id: number | string, networkPrefix: CoinType): string => {
    const multisigAddr = newIDAddress(id);
    return addressToString(networkPrefix, multisigAddr)
}

export interface Multisig {
    address: string;
    signers: Array<MultisigSigner>;
    approvalThreshold: number;
    members: number;
}

export interface MultisigSigner {
    address: string;
    robustAddress: string;
}

export const printMultisigMsg = async (actorId: string): Promise<Multisig> => {
    const httpConnector = new HttpJsonRpcConnector({
        url: useEnv("NETWORK_GATEWAY"),
    });
    const lotusClient = new LotusClient(httpConnector);
    const walletProvider = new LotusWalletProvider(lotusClient);
    const head = await walletProvider.getHead();
    const actor = await walletProvider.getActor(actorId, head.Cids);
    const multisigState = <Uint8Array>dagCborDecode(base64Decode(await walletProvider.readObj(actor.Head)));

    console.log("Signers:");
    let signersBytes = new Array(multisigState[0])[0];
    let signers = new Array<MultisigSigner>(signersBytes.length)
    console.log("ID", "\t", "Address");
    for (let i = 0; i < signersBytes.length; i++) {
        const si = signersBytes[i]
        let signerIdAddress = newAddress(Number.parseInt(si[0]), new Uint8Array(signersBytes[i].slice(1)));
        let addressStr = addressToString("t", signerIdAddress);
        let robustAddress = await walletProvider.accountKey(addressStr, head.Cids);// 测试网用t, 主网用f
        console.log(addressStr, "\t", robustAddress);
        signers[i] = {
            address: addressStr,
            robustAddress: robustAddress
        }
    }
    let approvalThreshold = Number(multisigState[1]);
    console.log("Approval Threshold:", approvalThreshold, "/", signersBytes.length);

    return {
        address: actorId,
        signers: signers,
        approvalThreshold: approvalThreshold,
        members: signersBytes.length
    }
}

export const lookupId = async (address: string) => {
    const httpConnector = new HttpJsonRpcConnector({
        url: useEnv("NETWORK_GATEWAY"),
    });
    const lotusClient = new LotusClient(httpConnector);
    return await lotusClient.state.lookupId(address)
}

export const bigNumberToBytes = (value: BigNumber) => {
    let valueBytes;
    if (!value.isZero()) {
        if (!value.isNegative()) {
            let valueBigNumberBytes = Uint8Array.from(Buffer.from(value.toHexString().replace(/0x/g, ''), 'hex'))
            valueBytes = new Uint8Array(valueBigNumberBytes.length + 1);
            valueBytes[0] = 0;
            valueBytes.set(valueBigNumberBytes, 1);
        } else {
            let valueBigNumberBytes = Uint8Array.from(Buffer.from(value.toHexString().replace(/-0x/g, ''), 'hex'))
            valueBytes = new Uint8Array(valueBigNumberBytes.length + 1);
            valueBytes[0] = 1;
            valueBytes.set(valueBigNumberBytes, 1);
        }
    } else {
        valueBytes = Uint8Array.from(Buffer.from(value.toHexString().replace(/0x/g, ''), 'hex'));
    }
    return valueBytes;
}

export const interactCommitMessage = async (msg: MessagePartial, msgTag: string): Promise<string> => {
    const httpConnector = new HttpJsonRpcConnector({
        url: useEnv("NETWORK_GATEWAY"),
    });
    const lotusClient = new LotusClient(httpConnector);
    const walletProvider = new LotusWalletProvider(lotusClient);

    let message = await walletProvider.createMessage(msg);
    console.log(msgTag, "message to be sent:\n", JSON.stringify(message, null, 2));

    const fromAddr = newFromString(message.From);
    if (fromAddr.protocol() == Protocol.DELEGATED) {
        throw new Error(`DELEGATED addresses are not supported`);
    }

    // @ts-ignore
    const bytesToBeSign = CID.parse(message.CID['/']).bytes;
    console.log("Sign messages with lotus:")
    console.log(`lotus wallet sign ${message['From']} ${hexEncode(bytesToBeSign)}`)

    let signHexStr = await ask("Please input sign result: ");
    let signBytes = new Uint8Array(hexDecode(signHexStr));

    let sign = {
        Type: signBytes[0],
        Data: base64Encode(signBytes.slice(1))
    };
    let pendingMsgCid = await walletProvider.sendSignedMessage({
        Message: message,
        Signature: sign
    });

    console.log(msgTag, "message committed, message cid:", pendingMsgCid["/"]);
    return pendingMsgCid["/"];
}

export const wait = async (cid: string): Promise<MsgLookup> => {
    const httpConnector = new HttpJsonRpcConnector({
        url: useEnv("NETWORK_GATEWAY"),
    });
    const lotusClient = new LotusClient(httpConnector);

    console.log("Waiting message", cid, "on chain");
    let res = await lotusClient.conn.request({method: 'Filecoin.StateWaitMsg', params: [{"/": cid}, 1, 1, true]});
    console.log("Message on chain");
    return res;
}


export const interactMultisigMessage = async (
    multisig: Multisig,
    proposeParams: string,
    networkPrefix: CoinType
) => {
    //create proposal message
    let proposalAddr = newFromString(await ask("Input proposal address: "));

    const proposeMsg: MessagePartial = {
        From: addressToString(networkPrefix, proposalAddr),
        To: multisig.address,
        Value: new BigNumberJS(0),
        Method: 2,
        Params: proposeParams,
    }
    const proposeMsgCid = await interactCommitMessage(proposeMsg, "Propose")
    const msgLookUp = await wait(proposeMsgCid);

    let proposeReturn = dagCborDecode(base64Decode(msgLookUp.Receipt.Return));
    // @ts-ignore
    const txId = Number.parseInt(proposeReturn[0]);
    console.log("Propose txId:", txId);

    let approveAddr = newFromString(await ask("Input approve address: "));

    for (let i = 0; i < multisig.approvalThreshold - 1; i++) {
        const msgCid = await interactCommitMessage({
            "From": addressToString(networkPrefix, approveAddr),
            "To": multisig.address,
            "Value": new BigNumberJS(0),
            "Method": 3,
            "Params": Buffer.from(dagCborEncode([txId, new Uint8Array()])).toString('base64')
        }, "Approve")
        await wait(msgCid);
    }

}
