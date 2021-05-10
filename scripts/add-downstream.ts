
import { ethers } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import { StakedToken } from "../typechain/StakedToken";

async function main(): Promise<void> {
  // Hardhat always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await run("compile");

  const stakedTokenAddress = process.env.STAKED_TOKEN_ADDRESS || '';

  const StakedToken: ContractFactory = await ethers.getContractFactory("StakedToken");
  const stakedToken = StakedToken.attach(stakedTokenAddress) as StakedToken;

  const downstreamAddress  = "0x70974f06338974d691fa38327ef25d1cf3e87ce6";

  let ABI = ["function sync()"];
  let iface = new ethers.utils.Interface(ABI);
  const data = iface.encodeFunctionData("sync", []);

  console.log(`Adding function call to downstream`);
  await stakedToken.addTransaction(downstreamAddress, data);

  console.log(`Added function call to downstream`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
