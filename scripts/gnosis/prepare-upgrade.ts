
import { ethers, upgrades } from "hardhat";
import { Contract, ContractFactory } from "ethers";

async function main(): Promise<void> {
  // Hardhat always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await run("compile");

  const stakedTokenAddress = process.env.STAKED_TOKEN_ADDRESS || '';

  const proxyAdminAddress = '';
  const proxyAddress = stakedTokenAddress;

  const StakedToken: ContractFactory = await ethers.getContractFactory("StakedTokenV2");
  const newImplementationAddress = await upgrades.prepareUpgrade(proxyAddress, StakedToken);

  // Prepare gnosis call data
  const proxyAdminABI = [
    "function upgrade(address proxy, address implementation)",
  ];

  const proxyAdmin = new ethers.Contract(proxyAdminAddress, proxyAdminABI);
  const callData = proxyAdmin.interface.encodeFunctionData('upgrade', [proxyAddress, newImplementationAddress]);

  console.log("Call data for Gnosis", callData);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
