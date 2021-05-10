
import { ethers } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import { StakedToken } from "../typechain/StakedToken";
import { DownstreamCaller } from "../typechain/DownstreamCaller";

async function main(): Promise<void> {
  // Hardhat always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await run("compile");

  const stakedTokenAddress = process.env.STAKED_TOKEN_ADDRESS || '';
  const StakedToken: ContractFactory = await ethers.getContractFactory("StakedToken");
  const stakedToken = StakedToken.attach(stakedTokenAddress) as StakedToken;

  const txs = await stakedToken.transactionsSize();
  console.log(`Total downstream transactions: ${txs}`);

  const downstreamCallerAddress = await stakedToken.downstreamCallerAddress();
  const DownstreamCaller: ContractFactory = await ethers.getContractFactory("DownstreamCaller");
  const downstreamCaller = DownstreamCaller.attach(downstreamCallerAddress) as DownstreamCaller;

  for (let i=0; i<txs.toNumber(); i++) {
    console.log(`Downstream transaction ${i}: ${await downstreamCaller.transactions(i)}`);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
