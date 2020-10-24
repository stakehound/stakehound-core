// We require the Buidler Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.
import { ethers } from "@nomiclabs/buidler";
import { Contract, ContractFactory } from "ethers";
import { StakedToken } from "../typechain/StakedToken";

async function main(): Promise<void> {
  // Buidler always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await run("compile");

  // stakedXZC
  const stakedTokenAddress = '0x30183D8025Aa735ea96341b1A17bB1a175AF3608';
  const amount = ethers.BigNumber.from(10000000000);
  // stakedXEM
  // const stakedTokenAddress = '0x0957C4D096dcb6DaF9C7B1A865b3ec9df0d12883';
  // const amount = ethers.BigNumber.from(100000000);
  // stakedDASH
  // const stakedTokenAddress = '0x7E7A46FECeDAC72Eca55f762eD557c3756432489';
  // const amount = ethers.BigNumber.from(10000000000);
  const recipient = '0xAE6E74473d3F754d56fc9C1b0d2F870552e58422';

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
