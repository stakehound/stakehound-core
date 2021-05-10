import { HardhatUserConfig, HttpNetworkUserConfig } from "hardhat/types";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
dotenvConfig({ path: resolve(__dirname, "./.env") });

import "./tasks/accounts";
import "./tasks/clean";
import "./tasks/typechain";

import "@nomiclabs/hardhat-waffle";
// import "solidity-coverage";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-contract-sizer";
import "hardhat-typechain";
// import "hardhat-gas-reporter";
import "@nomiclabs/hardhat-etherscan";


/**
 * @dev You must have a `.env` file. Follow the example in `.env.example`.
 * @param {string} network The name of the testnet
 */
function createHDAccountConfig(network: string): HttpNetworkUserConfig {
  if (!process.env.MNEMONIC) {
    console.log("Please set your MNEMONIC in a .env file");
    process.exit(1);
  }

  if (!process.env.INFURA_API_KEY) {
    console.log("Please set your INFURA_API_KEY");
    process.exit(1);
  }

  return {
    accounts: {
      initialIndex: 0,
      mnemonic: process.env.MNEMONIC,
      path: "m/44'/60'/0'/0",
    },
    url: `https://${network}.infura.io/v3/${process.env.INFURA_API_KEY}`,
  };
}

const config: HardhatUserConfig  = {
  defaultNetwork: "hardhat",
  mocha: {
    delay: true,
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    local: {
      url: "http://127.0.0.1:7545"

    },
    coverage: {
      url: "http://127.0.0.1:8555",
    },
    goerli: {
      ...createHDAccountConfig("goerli"),
      chainId: 5,
    },
    kovan: {
      ...createHDAccountConfig("kovan"),
      chainId: 42,
    },
    rinkeby: {
      ...createHDAccountConfig("rinkeby"),
      chainId: 4,
    },
    ropsten: {
      ...createHDAccountConfig("ropsten"),
      chainId: 3,
    },
    mainnet: {
      ...createHDAccountConfig("mainnet"),
      chainId: 1,
      gasMultiplier: 1.2,
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    // coverage: "./coverage",
    // coverageJson: "./coverage.json",
    root: "./",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
    version: "0.6.10",
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
  // @ts-ignore
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
