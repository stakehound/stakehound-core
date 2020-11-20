
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

  const tokenName = "StakeHound stakedXZC";
  const tokenSymbol = "stakedXZC";
  const tokenDecimals = 8;
  const tokenMaxSupply = ethers.BigNumber.from(10).pow(9 + tokenDecimals + 6);
  // const tokenMaxSupply = ethers.BigNumber.from(10).pow(9 + tokenDecimals + 6); //Eth
  const tokenInitialSupply = ethers.BigNumber.from("0");

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
