
import { ethers } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import { StakedToken } from "../typechain/StakedToken";

async function main(): Promise<void> {
  // Hardhat always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await run("compile");

  // stakedXZC
  // const stakedTokenAddress = '0x30183D8025Aa735ea96341b1A17bB1a175AF3608';
  // stakedXEM
  const stakedTokenAddress = '0x0957C4D096dcb6DaF9C7B1A865b3ec9df0d12883';
  // stakedDASH
  // const stakedTokenAddress = '0x7E7A46FECeDAC72Eca55f762eD557c3756432489';
  const amount = ethers.BigNumber.from(445084761000);
  const positive = true;

  const StakedToken: ContractFactory = await ethers.getContractFactory("StakedToken");
  const stakedToken = StakedToken.attach(stakedTokenAddress) as StakedToken;

  console.log(`Issuing ${amount.toString()} as rewards`);
  await stakedToken.distributeTokens(amount, positive);
  console.log(`Issued ${amount.toString()} as rewards, new total supply: ${await stakedToken.totalSupply()}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
