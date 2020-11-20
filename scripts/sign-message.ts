
import { ethers } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import { StakedToken } from "../typechain/StakedToken";

async function main(): Promise<void> {
  // Hardhat always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await run("compile");
  const message = "[Etherscan.io 30/10/2020 13:11:00] I, hereby verify that I am the owner/creator of the address [0x160B1E5aaBFD70B2FC40Af815014925D71CEEd7E]";
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
