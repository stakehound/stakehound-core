
import { ethers } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import { StakedToken } from "../typechain/StakedToken";

async function main(): Promise<void> {
  // Hardhat always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await run("compile");

  const stakedTokenAddress = process.env.STAKED_TOKEN_ADDRESS || '';

  // Ropsten - fireblocks
  // const newSupplyController = '0x1beC1E14b766CD13e0a151653C8f7dA3DA3630af';
  // ropsten - deployer
  // const newSupplyController = '0x0b0B977facc378365E9AEdbe0bc28EE6Cd7f09Ed';

  // Mainnet - fireblocks
  const newSupplyController = '0xE14ce18903B0d3678a098F3BdEDA0AAC3790Ac3B';


  const StakedToken: ContractFactory = await ethers.getContractFactory("StakedToken");
  const stakedToken = StakedToken.attach(stakedTokenAddress) as StakedToken;

  console.log("Changing supply controller of stakedToken...");
  await stakedToken.setSupplyController(newSupplyController);
  console.log("Changed supply controller of stakedToken to:", newSupplyController);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
