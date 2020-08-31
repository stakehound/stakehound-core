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

  const stakedTokenAddress = '0x30183D8025Aa735ea96341b1A17bB1a175AF3608';
  const StakedToken: ContractFactory = await ethers.getContractFactory("StakedToken");
  const stakedToken = StakedToken.attach(stakedTokenAddress) as StakedToken;

  const downstreamAddress  = "0x7a250d5630b4cf539739df2c5dacb4c659f2488d";

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
