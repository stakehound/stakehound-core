
import { ethers, upgrades } from "hardhat";
import { Contract, ContractFactory } from "ethers";

async function main(): Promise<void> {
  // Hardhat always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await run("compile");

  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    await deployer.getAddress()
  );
  console.log("Account balance:", (await deployer.getBalance()).toString());


  // We get the contract to deploy
  const StakedToken: ContractFactory = await ethers.getContractFactory("StakedTokenV2");
  const upgrade: Contract = await upgrades.upgradeProxy('0x5f389b55A999043b1CE0acaa8e66E62cb4c40eE1', StakedToken);
  await upgrade.deployed();

  console.log(`Upgrade deployed to: `, upgrade.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
