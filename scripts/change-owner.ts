
import { ethers } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import { StakedToken } from "../typechain/StakedToken";

async function main(): Promise<void> {
  // Hardhat always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await run("compile");

  // Testnet
  // const stakedTokenAddress = '0xEc1b213A3577f8d74e1d3970b8643D50C33C7BdE';

  //Mainnet
  // testedTest
  // const stakedTokenAddress = '0x7DEfd41888692cDD14820266F70506990D7BD216';
  // stakedXZC
  const stakedTokenAddress = '0x160B1E5aaBFD70B2FC40Af815014925D71CEEd7E';

  const newOwner = '0x619bB406Eb26E27d056AB3DcEC64EBb66BEdC425';
  // const newOwner = '0x0b0B977facc378365E9AEdbe0bc28EE6Cd7f09Ed';

  const StakedToken: ContractFactory = await ethers.getContractFactory("StakedToken");
  const stakedToken = StakedToken.attach(stakedTokenAddress) as StakedToken;

  console.log("Transferring ownership of stakedToken...");
  await stakedToken.transferOwnership(newOwner);
  console.log("Transferred ownership of stakedToken to:", newOwner);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
