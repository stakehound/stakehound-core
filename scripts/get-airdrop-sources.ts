/* eslint-disable @typescript-eslint/no-explicit-any */

import { ethers } from "hardhat";
import { BigNumber, Contract } from "ethers";
import Axios from "axios";
import fs from "fs";

import stakedTokenABI from '../stakedTokenABI.json'; // This import style requires "esModuleInterop", see "side notes"
import poolTokenABI from '../poolTokenABI.json'; // This import style requires "esModuleInterop", see "side notes"


import * as cliProgress from 'cli-progress';
import * as  _colors from 'colors';

const alchemyUrl =  `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`;
const etherscanUrl = 'https://api.etherscan.io/api';

const tokenAddress = "0x0C63cAE5fcC2Ca3dDE60a35e50362220651eBEc8";
const UNISWAP_stXEM = '0xab2f9b13b4aca6884fdbb9e4a1f767c82c53688f'
const poolAddresses: string[] = [UNISWAP_stXEM];
const blockNumber = 12025294;

async function getTokenBalance(
  data: string,
  contractAddress: string,
  blockNumber?: number
): Promise<BigNumber> {
  const alchemyApi = Axios.create({
    baseURL: alchemyUrl,
    headers: {},
    timeout: 120000,
  });

  const params: any = [{
    data,
    "to": contractAddress
  }]

  if (blockNumber) {
    params.push('0x' + blockNumber.toString(16))
  }

  const result = await alchemyApi.post('', {
    "id": 1,
    "jsonrpc": "2.0",
    "method": "eth_call",
    params,
  })

  if (!result || !result.data || result.data.result === '0x') {
    return ethers.BigNumber.from(0);
  }

  return result.data.result;
}


async function getTokenLogs(address: string): Promise<any[]> {
  const ehterscanApi = Axios.create({
    baseURL: etherscanUrl,
    headers: {},
    params: {
      apiKey: process.env.ETHERSCAN_API_KEY,
      fromBlock: 0,
      toBlock: 'latest',
      module: 'logs',
      action: 'getLogs',
      address
    },
    timeout: 120000,
  });

  const result = await ehterscanApi.get('');

  if (!result || !result.data) {
    return []
  }

  return result.data.result;
}

function getAddressIndexes(events: any[], eventName: string): number[] {
  const eventData = events.filter((event: any) => eventName === event.name);

  if (!eventData || eventData.length === 0) {
    return []
  }

  return eventData[0].addressIndexes;
}

function getEventsFromAbi(abi: any[]) {
  const events = abi.filter((obj: any) => obj.type ? obj.type === "event" : false).map((event: any) => {
    const addressIndexes: number[] = [];
    event.inputs.forEach((input: { name: string, type: string }, i: number) => {
      if (input.type === 'address') {
        addressIndexes.push(i);
      }
    })
    return { ...event, addressIndexes }
  })

  return events;
}



async function main(): Promise<void> {
  // Hardhat always runs the compile task when running scripts through it.
  // If this runs in a standalone fashion you may want to call compile manually
  // to make sure everything is compiled
  // await run("compile");

  const provider = new ethers.providers.AlchemyProvider('homestead', process.env.ALCHEMY_API_KEY);
  let contractInterface = new ethers.utils.Interface(stakedTokenABI);
  console.log('Contract loaded');

  // Geting all transfers which i need to decode
  console.log("Getting all transfers for the provided smart contract address");
  const transfers = await getTokenLogs(tokenAddress);
  console.log(`Total of ${transfers.length} transfers found`);

  const tokenEvents = getEventsFromAbi(stakedTokenABI);
  const availableAddresses: { [key: string]: BigNumber } = {};
  const b1 = new cliProgress.SingleBar({
    format: 'Transfer Processing Progress |' + _colors.cyan('{bar}') + '| {value}/{total}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });

  // initialize the bar - defining payload token "speed" with the default value "N/A"
  let totalSupplyWithoutPools = ethers.BigNumber.from(0);
  b1.start(transfers.length, 0);
  for await (const [i, log] of transfers.entries()) {
    const parsedLog = contractInterface.parseLog(log);
    const indexes = getAddressIndexes(tokenEvents, parsedLog.name);
    if (indexes.length === 0) {
      b1.update(i + 1)
      continue;
    }

    for await (const index of indexes) {
      const address = parsedLog.args[indexes[index]].toLowerCase();
      if (!availableAddresses[address] && !poolAddresses.includes(address)) {
        const calldata = contractInterface.encodeFunctionData('balanceOf', [address]);
        const balance = await getTokenBalance(calldata, tokenAddress, blockNumber);
        if(address === '0xE14ce18903B0d3678a098F3BdEDA0AAC3790Ac3B'.toLowerCase()) {
          console.log('yo', ethers.BigNumber.from(balance).toString());
        }
        availableAddresses[address] = ethers.BigNumber.from(balance);
        totalSupplyWithoutPools = totalSupplyWithoutPools.add(balance);
      }
    }
    b1.update(i + 1)
  }
  b1.stop();
  console.log("Total supply exluding pools", totalSupplyWithoutPools.toString());

  // Processing pool address
  const b2 = new cliProgress.SingleBar({
    format: 'Pool Processing Progress |' + _colors.cyan('{bar}') + '| {value}/{total}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });

  contractInterface = new ethers.utils.Interface(poolTokenABI);

  for await (const poolAddress of poolAddresses) {
    // Get balance of the poolAddress
    const calldata = contractInterface.encodeFunctionData('balanceOf', [poolAddress]);
    // Amount of tokens held in LP
    const poolBalance = ethers.BigNumber.from(await getTokenBalance(calldata, tokenAddress, blockNumber));
    const logs = await getTokenLogs(poolAddress);
    // Get holders of the pool token
    const contract = new Contract(poolAddress, poolTokenABI, provider);
    // Total amount of LP tokens distributed between LP token holders
    const totalPoolSupply = await contract.totalSupply();

    console.log("Pool balance", poolBalance.toString());

    const poolHolderBalances: {[address: string]: BigNumber} = {};

    b2.start(logs.length, 0);
    for await (const [i, log] of logs.entries()) {
      const parsedLog = contractInterface.parseLog(log);
      const indexes = getAddressIndexes(tokenEvents, parsedLog.name);
      if (indexes.length === 0) {
        b2.update(i + 1)
        continue;
      }

      for await (const index of indexes) {
        const address = parsedLog.args[indexes[index]].toLowerCase();

        if (!(address in poolHolderBalances)) {
          const calldata = contractInterface.encodeFunctionData('balanceOf', [address]);
          const balance = await getTokenBalance(calldata, poolAddress, blockNumber);

          const balanceFromPool = ethers.BigNumber.from(balance).mul(poolBalance).div(totalPoolSupply);
          poolHolderBalances[address] = balanceFromPool;
        }
      }
      b2.update(i + 1);
    }

    for (const [address, balance] of Object.entries(poolHolderBalances)) {
      console.log(address, balance.toString());
      if (!availableAddresses[address]) {
        availableAddresses[address] = balance;
      } else {
        availableAddresses[address] = availableAddresses[address].add(balance);
      }
    }
  }

  b2.stop();

  const addressList: { address: string, balance: BigNumber }[] = [];
  let totalSupplyFromAddresses = ethers.BigNumber.from(0);
  console.log("address,balance");
  let fileContent = '';
  Object.keys(availableAddresses).forEach((address: string) => {
    if (availableAddresses[address].gt(0)) {
      totalSupplyFromAddresses = totalSupplyFromAddresses.add(availableAddresses[address]);
      console.log(address, availableAddresses[address].toString());
      fileContent += `${address},${availableAddresses[address].toString()}\n`;
      addressList.push({
        address,
        balance: availableAddresses[address]
      })
    }
  });

  fs.writeFileSync('airdop.csv', fileContent);

  console.log(`\n\nFound total ${addressList.length} unique addresses. Total token amount in addresses: ${totalSupplyFromAddresses}. `);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
