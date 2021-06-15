import { EtherscanConfig } from "@nomiclabs/hardhat-etherscan/dist/src/types";
import { TypechainConfig } from "hardhat-typechain/dist/src/types";

declare module "hardhat/types" {
  interface HardhatUserConfig {
    typechain?: TypechainConfig;
    etherscan?: EtherscanConfig
  }

  interface ProjectPaths {
    coverage: string;
    coverageJson: string;
    typechain: string;
  }
}
