
import { ethers } from "hardhat";

async function main(): Promise<void> {
  // Hardhat always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await run("compile");
  const message = "[Etherscan.io 27/04/2021 15:58:37] I, hereby verify that I am the owner/creator of the address [0xd79311eb6c74c408e678b8364b69b4744a5778f4]";
  const signer = (await ethers.getSigners())[0];

  console.log((await signer.signMessage(message)));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
