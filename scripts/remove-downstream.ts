
import { ethers } from "hardhat";
import { ContractFactory } from "ethers";
import { StakedToken } from "../typechain/StakedToken";

async function main(): Promise<void> {
  // Hardhat always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await run("compile");

  const stakedTokenAddress = process.env.STAKED_TOKEN_ADDRESS || '';
  const StakedTokenFactory: ContractFactory = await ethers.getContractFactory("StakedToken");
  const stakedToken = StakedTokenFactory.attach(stakedTokenAddress) as StakedToken;

  console.log(`Removing function call from downstream`);
  await stakedToken.removeTransaction(0);

  console.log(`Removed function call from downsteam, total downstream transactions: ${await stakedToken.transactionsSize()}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
