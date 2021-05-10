
import { ethers } from "hardhat";
import { Contract, ContractFactory } from "ethers";

async function main(): Promise<void> {
  // Hardhat always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await run("compile");

  const stakedTokenAddress = process.env.STAKED_TOKEN_ADDRESS || '';

  const StakedToken: ContractFactory = await ethers.getContractFactory("StakedToken");
  const callData = StakedToken.interface.encodeFunctionData('pause');

  console.log("Call data", callData);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
