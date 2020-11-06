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
  // const stakedTokenAddress = '0x30183D8025Aa735ea96341b1A17bB1a175AF3608';
  // stakedXEM
  // const stakedTokenAddress = '0x0957C4D096dcb6DaF9C7B1A865b3ec9df0d12883';
  // stakedDASH
  // const stakedTokenAddress = '0x7E7A46FECeDAC72Eca55f762eD557c3756432489';

  // Mainnet
  // stakedXZC
  const stakedTokenAddress = '0x160B1E5aaBFD70B2FC40Af815014925D71CEEd7E';
  const StakedToken: ContractFactory = await ethers.getContractFactory("StakedToken");
  const stakedToken = StakedToken.attach(stakedTokenAddress) as StakedToken;

  const downstreamAddress  = "0x70a78cde9687e641e5e67b52fdecbb4739c26a32";

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
