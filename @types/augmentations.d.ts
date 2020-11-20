import { Greeter } from "../typechain/Greeter";

export interface TypechainConfig {
  outDir?: string;
  target?: "ethers-v4" | "ethers-v5" | "truffle-v4" | "truffle-v5" | "web3-v1";
}

declare module "hardhat/types" {
  interface HardhatUserConfig {
    typechain?: TypechainConfig;
  }

  interface ProjectPaths {
    coverage: string;
    coverageJson: string;
    typechain: string;
  }
}
