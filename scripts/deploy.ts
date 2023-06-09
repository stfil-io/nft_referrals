/* eslint-disable no-process-exit */
import {sh} from "../common/common";
import hre, {network} from "hardhat";
import {accounts} from "../common/blockchain-utils";

async function main() {
    const {deployer} = await accounts(hre);

    console.log(`Starting full deployment on network ${network.name} (${network.config.chainId})`)
    console.log(`Deployer account: ${deployer.address}`)

    const scripts = [
        '0_setup_deployments.ts',
        '1_check_provider.ts',
        '2_deploy_referral.ts',
        '3_deploy_whitelist.ts',
        '4_deploy_stable_jumper.ts',
        '5_deploy_staking_nft.ts',
        '6_init_staking_nft.ts',
    ]

    for (const script of scripts) {
        console.log('\n===========================================\n', script, '')
        await sh(`npx hardhat run scripts/${script}`)
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })