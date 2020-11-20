
import { ethers } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import { StakedToken } from "../typechain/StakedToken";

async function main(): Promise<void> {
  // Hardhat always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await run("compile");

  // stakedXZC
  // const stakedTokenAddress = '0x30183D8025Aa735ea96341b1A17bB1a175AF3608';
  // const amount = ethers.BigNumber.from(10000000000);
  // stakedXEM
  const stakedTokenAddress = '0x0957C4D096dcb6DaF9C7B1A865b3ec9df0d12883';
  const amount = ethers.BigNumber.from(100000000);
  // stakedDASH
  // const stakedTokenAddress = '0x7E7A46FECeDAC72Eca55f762eD557c3756432489';
  // const amount = ethers.BigNumber.from(10000000000);
  // stakedETH
  // const stakedTokenAddress = '0x09A33bE88094268360b9e340efD3657bBf351AA6';
  // const amount = ethers.BigNumber.from('100000000000000000000000');


  // Rinkeby
  // stakedXZC
  // const stakedTokenAddress = '0x7DEfd41888692cDD14820266F70506990D7BD216';
  // const amount = ethers.BigNumber.from(1000000000000);


  // Mainnet
  // stakedXZC
  // const stakedTokenAddress = '0x160B1E5aaBFD70B2FC40Af815014925D71CEEd7E';
  // const amount = ethers.BigNumber.from(100000000);

  const recipient = '0x0D8C81966d7a47DD3961f3B79d2BA4306D87c6B9';

  const StakedToken: ContractFactory = await ethers.getContractFactory("StakedToken");
  const stakedToken = StakedToken.attach(stakedTokenAddress) as StakedToken;

  console.log(`Minting ${amount.toString()} to ${recipient}`);
  await stakedToken.mint(recipient, amount);
  console.log(`Minted ${amount.toString()} to ${recipient}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
