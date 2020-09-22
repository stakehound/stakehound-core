// We require the Buidler Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.
import { ethers, upgrades } from "@nomiclabs/buidler";
import { Contract, ContractFactory } from "ethers";

async function main(): Promise<void> {
  // Buidler always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await run("compile");

  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    await deployer.getAddress()
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const tokenName = "StakeHound stakedXZC";
  const tokenSymbol = "stakedXZC";
  const tokenDecimals = 8;
  const tokenMaxSupply = ethers.BigNumber.from(10).pow(8 + 8 + 6);
  const tokenInitialSupply = ethers.BigNumber.from("100000000000");

  // We get the contract to deploy
  const StakedToken: ContractFactory = await ethers.getContractFactory("StakedToken");
  const stakedToken: Contract = await upgrades.deployProxy(StakedToken, [tokenName, tokenSymbol, tokenDecimals, tokenMaxSupply, tokenInitialSupply]);
  await stakedToken.deployed();

  console.log(`${tokenName} deployed to: `, stakedToken.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
