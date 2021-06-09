import { ethers } from "hardhat";

async function main(): Promise<void> {
  // Hardhat always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await run("compile");

  const stakedTokenAddress = '0x30183D8025Aa735ea96341b1A17bB1a175AF3608'; //stakedXZC
  // const stakedTokenAddress = process.env.STAKED_TOKEN_ADDRESS || '';
  const amount = ethers.BigNumber.from(174424099302720);

  // A Human-Readable ABI; any supported ABI format could be used
  const abi = [
    "function distributeTokens(uint256 amount)",
  ];
  const signer = (await ethers.getSigners())[0];

  const stakedToken = new ethers.Contract(stakedTokenAddress, abi, signer);

  console.log(`Issuing ${amount.toString()} as rewards`);
  await stakedToken.distributeTokens(amount);
  console.log(`Issued ${amount.toString()} as rewards`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
