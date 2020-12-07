
import { ethers } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import { StakedToken } from "../typechain/StakedToken";

async function main(): Promise<void> {
  // Hardhat always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await run("compile");

  const stakedTokenAddress = process.env.STAKED_TOKEN_ADDRESS || '';

  // Ropsten
  // stakedXZC
  // const amount = ethers.BigNumber.from(10000000000);
  // stakedXEM
  const amount = ethers.BigNumber.from(100000000);
  // stakedDASH
  // const amount = ethers.BigNumber.from(10000000000);
  // stakedETH
  // const amount = ethers.BigNumber.from('100000000000000000000000');


  // Rinkeby
  // stakedXZC
  // const amount = ethers.BigNumber.from(1000000000000);

  // Mainnet
  // stakedXZC
  // const amount = ethers.BigNumber.from(100000000);

  const recipient = '0x0D8C81966d7a47DD3961f3B79d2BA4306D87c6B9';

  const StakedToken: ContractFactory = await ethers.getContractFactory("StakedToken");
  const stakedToken = StakedToken.attach(stakedTokenAddress) as StakedToken;

  console.log(`Minting ${amount.toString()} to ${recipient}`);
  await stakedToken.mint(recipient, amount);
  console.log(`Minted ${amount.toString()} to ${recipient}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
