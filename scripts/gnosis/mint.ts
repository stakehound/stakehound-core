
import { ethers, upgrades } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import GnosisSafeSol from '@gnosis.pm/safe-contracts/build/contracts/GnosisSafe.json';
import { StakedToken } from "../../typechain/StakedToken";

async function main(): Promise<void> {
  // Hardhat always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await run("compile");

  const StakedToken: ContractFactory = await ethers.getContractFactory("StakedToken");

  // Enter data HERE
  const recipient = '0x1e3f8878bBcc5945354c0974Fd1ae2Ca65b3991D';
  const amount = ethers.BigNumber.from("100871000000");

  const callData = StakedToken.interface.encodeFunctionData('mint', [recipient, amount]);
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
