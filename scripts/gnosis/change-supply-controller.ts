
import { ethers } from "hardhat";
import { Contract, ContractFactory } from "ethers";

async function main(): Promise<void> {
  // Hardhat always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await run("compile");

  const stakedTokenAddress = process.env.STAKED_TOKEN_ADDRESS || '';

  // Ropsten - fireblocks
  const newSupplyController = '0x1beC1E14b766CD13e0a151653C8f7dA3DA3630af';

  // Mainnet
  // const newSupplyController = '0x314f8e805B347af013CD952e0929CB573abbf4d1';
  // FireBlocks
  // const newSupplyController = '0xE14ce18903B0d3678a098F3BdEDA0AAC3790Ac3B';

  const StakedToken: ContractFactory = await ethers.getContractFactory("StakedToken");
  const callData = StakedToken.interface.encodeFunctionData('setSupplyController', [newSupplyController]);

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
