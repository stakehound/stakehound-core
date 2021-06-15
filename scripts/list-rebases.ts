
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

  const filter = stakedToken.filters.LogTokenDistribution(null, null, null, null);
  const rebases = await stakedToken.queryFilter(filter, 0);

  console.log('block,timestamp,oldTotalSupply,newTotalSupply');

  for(const r of rebases) {
    const date =  new Date((await r.getBlock()).timestamp*1000);
    console.log(`${r.blockNumber},"${date.toUTCString()}",${r.args?.oldTotalSupply},${r.args?.newTotalSupply}`)
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
