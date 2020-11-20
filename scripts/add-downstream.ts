
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
  // const stakedTokenAddress = '0x0957C4D096dcb6DaF9C7B1A865b3ec9df0d12883';
  // stakedDASH
  // const stakedTokenAddress = '0x7E7A46FECeDAC72Eca55f762eD557c3756432489';
  // stakedETH
  const stakedTokenAddress = '0x09A33bE88094268360b9e340efD3657bBf351AA6';

  // Mainnet
  // stakedXZC
  // const stakedTokenAddress = '0x160B1E5aaBFD70B2FC40Af815014925D71CEEd7E';
  const StakedToken: ContractFactory = await ethers.getContractFactory("StakedToken");
  const stakedToken = StakedToken.attach(stakedTokenAddress) as StakedToken;

  const downstreamAddress  = "0xcfe1a96de8f00415cfbb6fe46138f2dc003d1421";

  let ABI = ["function sync()"];
  let iface = new ethers.utils.Interface(ABI);
  const data = iface.encodeFunctionData("sync", []);

  console.log(`Adding function call to downstream`);
  await stakedToken.addTransaction(downstreamAddress, data);

  console.log(`Added function call to downstream, total downstream transactions: ${await stakedToken.transactionsSize()}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
