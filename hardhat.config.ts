import {HardhatUserConfig} from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-contract-sizer"
import {useEnv} from "./common/env";
import 'solidity-coverage'
import 'hardhat-gas-reporter'

const DEPLOYER = useEnv("DEPLOYER");
const EMERGENCY_ADMIN_KEY = useEnv("EMERGENCY_ADMIN_KEY");
const CONTRACTS_ADMIN_KEY = useEnv("CONTRACTS_ADMIN_KEY");
const TREASURY_KEY = useEnv("TREASURY_KEY");

const config: HardhatUserConfig = {
    solidity: {
        version: '0.8.17',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    defaultNetwork: "hardhat",
    networks: {
        hyperspace: {
            chainId: 3141,
            url: useEnv("NETWORK_GATEWAY"),
            accounts: [DEPLOYER, EMERGENCY_ADMIN_KEY, CONTRACTS_ADMIN_KEY, TREASURY_KEY],
        },
        mainnet: {
            chainId: 314,
            url: useEnv("NETWORK_GATEWAY"),
            accounts: [DEPLOYER, EMERGENCY_ADMIN_KEY, CONTRACTS_ADMIN_KEY, TREASURY_KEY],
        }
    },
    gasReporter: {
        enabled: true,
    },
};

export default config;

