import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
dotenvConfig({ path: resolve(__dirname, "./.env") });

import { BuidlerConfig, usePlugin } from "@nomiclabs/buidler/config";
import { HDAccountsConfig } from "@nomiclabs/buidler/types";
import "./tasks/accounts";
import "./tasks/clean";
import "./tasks/typechain";

usePlugin("@nomiclabs/buidler-waffle");
usePlugin("solidity-coverage");
usePlugin('@openzeppelin/buidler-upgrades');
usePlugin('buidler-contract-sizer');
// usePlugin("buidler-gas-reporter");

interface NetworkConfig {
  accounts: HDAccountsConfig,
  url: string;
}

/**
 * @dev You must have a `.env` file. Follow the example in `.env.example`.
 * @param {string} network The name of the testnet
 */
function createHDAccountConfig(network: string): NetworkConfig {
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

const config: BuidlerConfig = {
  defaultNetwork: "buidlerevm",
  mocha: {
    delay: true,
  },
  networks: {
    buidlerevm: {
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
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    coverage: "./coverage",
    coverageJson: "./coverage.json",
    root: "./",
    sources: "./contracts",
    tests: "./test",
  },
  solc: {
    /* https://buidler.dev/buidler-evm/#solidity-optimizer-support */
    optimizer: {
      enabled: true,
      runs: 200,
    },
    version: "0.6.10",
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
};

export default config;
