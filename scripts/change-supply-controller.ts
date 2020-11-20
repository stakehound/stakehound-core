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



  // Rinkeby
  // stakedXZC
  const stakedTokenAddress = '0x7DEfd41888692cDD14820266F70506990D7BD216';


  //Mainnet
  // testedTest
  // const stakedTokenAddress = '0x7DEfd41888692cDD14820266F70506990D7BD216';
  // stakedXZC
  // const stakedTokenAddress = '0x160B1E5aaBFD70B2FC40Af815014925D71CEEd7E';




  const newSupplyController = '0xbBf527Fb69Df850Dc17983C42499A3b5529fB64e';

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
