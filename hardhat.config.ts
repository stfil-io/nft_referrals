import {HardhatUserConfig} from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-contract-sizer"
import {useEnv} from "./common/env";
import 'solidity-coverage'
import 'hardhat-gas-reporter'
import "./tasks";

const DEPLOYER = useEnv("DEPLOYER");
const CONTRACTS_ADMIN_KEY = useEnv("CONTRACTS_ADMIN_KEY");

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
        calibration: {
            chainId: 314159,
            url: useEnv("NETWORK_GATEWAY"),
            accounts: [DEPLOYER, CONTRACTS_ADMIN_KEY],
        },
        mainnet: {
            chainId: 314,
            url: useEnv("NETWORK_GATEWAY"),
            accounts: [DEPLOYER, CONTRACTS_ADMIN_KEY],
        }
    },
    gasReporter: {
        enabled: true,
    },
};

export default config;

