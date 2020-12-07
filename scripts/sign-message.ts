
import { ethers } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import { StakedToken } from "../typechain/StakedToken";

async function main(): Promise<void> {
  // Hardhat always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await run("compile");
  const message = "[Etherscan.io 30/11/2020 17:04:59] I, hereby verify that I am the owner/creator of the address [0xdfe66b14d37c77f4e9b180ceb433d1b164f0281d]";
  const signer = (await ethers.getSigners())[0];

  console.log((await signer.signMessage(message)));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
