
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

  const newName = "stakedFiro";
  const newSymbol = "stFIRO"

  console.log("Set name call data", StakedToken.interface.encodeFunctionData('setName', [newName]));
  console.log("Set symbol call data", StakedToken.interface.encodeFunctionData('setSymbol', [newSymbol]));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
