import { task } from "hardhat/config";

import { TASK_ACCOUNTS } from "./task-names";

task(TASK_ACCOUNTS, "Prints the list of accounts", async (_taskArgs, bre) => {
  const accounts = await bre.ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.getAddress());
  }
});
