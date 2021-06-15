
import { ethers } from "hardhat";
import * as hre from "hardhat";
import { getProxyAdminFactory, getProxyFactory } from "@openzeppelin/hardhat-upgrades/dist/proxy-factory"
import { ContractFactory } from "ethers";

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

  // Wrapper params
  const wrapperName = "wTEST";
  const wrapperSymbol = "wTST";
  // Staked token address needs to exist before running this script
  const stakedTokenAddress = "";
  // Wrapper implementation address. Leave this as an empty string and a new implementation will be deployed.
  let implementationAddress = "";

  if (!stakedTokenAddress) {
    throw new Error("Missing stakedTokenAddress");
  }

  const WrapperFactory: ContractFactory = await ethers.getContractFactory("Wrapper");

  // Deploy a new implementation if implementationAddress is empty
  if (!implementationAddress) {
    const wrapper = await WrapperFactory.deploy();
    implementationAddress = wrapper.address;
    await wrapper.deployed();

    console.log(`Wrapper implementation deployed to:`, implementationAddress, `at:`, wrapper.deployTransaction.hash);
  }

  // Deploy a new proxy admin'
  const AdminFactory = await getProxyAdminFactory(hre, WrapperFactory.signer);
  const admin = await AdminFactory.deploy();
  const adminAddress = admin.address;
  await admin.deployed();

  console.log(`Proxy admin deployed to:`, adminAddress, `at:`, admin.deployTransaction.hash);

  // Deploy wrapper proxy
  const fragment = WrapperFactory.interface.getFunction('initialize');
  const args = [stakedTokenAddress, wrapperName, wrapperSymbol];
  const data = WrapperFactory.interface.encodeFunctionData(fragment, args);
  const ProxyFactory = await getProxyFactory(hre, WrapperFactory.signer);
  const proxy = await ProxyFactory.deploy(implementationAddress, adminAddress, data);
  await proxy.deployed();

  console.log(`Proxy deployed to:`, proxy.address, `at:`, proxy.deployTransaction.hash);

  const wrapper = WrapperFactory.attach(proxy.address);

  console.log(`${await wrapper.name()} deployed to:`, wrapper.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
