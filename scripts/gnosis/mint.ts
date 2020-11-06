// We require the Buidler Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.
import { ethers, upgrades } from "@nomiclabs/buidler";
import { Contract, ContractFactory } from "ethers";
import GnosisSafeSol from '@gnosis.pm/safe-contracts/build/contracts/GnosisSafe.json';
import { StakedToken } from "../../typechain/StakedToken";

async function main(): Promise<void> {
  // Buidler always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await run("compile");

  //Mainnet
  // testedTest
  // const stakedTokenAddress = '0x7DEfd41888692cDD14820266F70506990D7BD216';
  // stakedXZC
  const stakedTokenAddress = '0x160B1E5aaBFD70B2FC40Af815014925D71CEEd7E';
  const StakedToken: ContractFactory = await ethers.getContractFactory("StakedToken");
  const stakedToken = StakedToken.attach(stakedTokenAddress) as StakedToken;

  // Enter data HERE
  const recipient = '0x1e3f8878bBcc5945354c0974Fd1ae2Ca65b3991D';
  const amount = ethers.BigNumber.from("100871000000");


  const callData = stakedToken.interface.encodeFunctionData('mint', [recipient, amount]);
  console.log("Call data", callData);


  // const supplyControllerGnosisSafe = '0x8AC14Fca1aF782582e3F7c67783aE7825Cf8b173';

  // const [signer] = await ethers.getSigners();

  // console.log(`Deployer account: ${await signer.getAddress()}`);
  // console.log("Account balance:", (await signer.getBalance()).toString());

  // const gnosisSafe = new ethers.Contract(supplyControllerGnosisSafe, GnosisSafeSol.abi, signer);

  // console.log();


//   to:
// 0x7DEfd41888692cDD14820266F70506990D7BD216
// value:
// 0
// data:
// 0x40c10f19000000000000000000000000e206e5cb1fc643908a75906af6f919a487af76ac00000000000000000000000000000000000000000000000000000002540be400
// operation:
// 0
// safeTxGas:
// 93443
// baseGas:
// 0
// gasPrice:
// 0
// gasToken:
// 0x0000000000000000000000000000000000000000
// refundReceiver:
// 0x0000000000000000000000000000000000000000
// nonce:
// 0


  // const to = stakedTokenAddress;
  // const valueInWei = 0;
  // const data = ''; // TODO
  // const operation = 0; // Call
  // const safeTxGas = 0;
  // const baseGas = 0;
  // const gasPrice = 0;
  // const gasToken = 0
  // const refundReceiver = await signer.getAddress();
  // const sigs: string[] = [];


  // const response = gnosisSafe.execTransaction(
  //   to,
  //   valueInWei,
  //   data,
  //   operation,
  //   safeTxGas,
  //   baseGas,
  //   gasPrice,
  //   gasToken,
  //   refundReceiver,
  //   sigs,
  // )

  // console.log(response);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
