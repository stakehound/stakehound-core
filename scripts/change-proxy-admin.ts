// We require the Buidler Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.
import { ethers, upgrades } from "@nomiclabs/buidler";
import { Contract, ContractFactory } from "ethers";
import { StakedToken } from "../typechain/StakedToken";

async function main(): Promise<void> {
  // Buidler always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await run("compile");

  const newOwner = '0x619bB406Eb26E27d056AB3DcEC64EBb66BEdC425';
  // const newOwner = '0x0b0B977facc378365E9AEdbe0bc28EE6Cd7f09Ed';


  // Proxy admin is loaded from .openzeppelin/network.json

  console.log("Changing proxy admin of stakedToken...");
  // @ts-ignore
  await upgrades.admin.transferProxyAdminOwnership(newOwner);
  console.log("Changed proxy admin of stakedToken to:", newOwner);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });