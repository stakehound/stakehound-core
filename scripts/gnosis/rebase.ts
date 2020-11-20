
import { ethers, upgrades } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import GnosisSafeSol from '@gnosis.pm/safe-contracts/build/contracts/GnosisSafe.json';
import { StakedToken } from "../../typechain/StakedToken";

async function main(): Promise<void> {
  // Hardhat always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await run("compile");

  //Mainnet
  // testedTest
  // const stakedTokenAddress = '0x7DEfd41888692cDD14820266F70506990D7BD216';
  // stakedXZC
  const stakedTokenAddress = '0x160B1E5aaBFD70B2FC40Af815014925D71CEEd7E';
  const StakedToken: ContractFactory = await ethers.getContractFactory("StakedToken");
  const stakedToken = StakedToken.attach(stakedTokenAddress) as StakedToken;

  const amount = ethers.BigNumber.from(216314102);
  const positive = true;


  const callData = stakedToken.interface.encodeFunctionData('distributeTokens', [amount, positive]);
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
