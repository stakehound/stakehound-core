# StakeHound stakedToken

[https://stakehound.com](StakeHound) is a tokenized staking platform that enables the use of staked Proof-of-Stake tokens within the Decentralized Finance (DeFi) ecosystem. Stakehound aims to bring Staking and Defi together.

This repository contains the stakedToken ERC20 smart contract, which allows for distribution staking rewards to all holders of the token proportionally using dynamic reballancing functionality.

## Testnet

It is live on the Ropset testnet, see [this guide](https://stakehound.com/docs/testnet) to try it out. The contract address is 0x30183D8025Aa735ea96341b1A17bB1a175AF3608

## Setup

Install the dependencies by running `yarn install`

## Running the tests

`yarn test`

## Notes about Supply Precision

Shares as well as the `sharesPerToken` values are stored as integers.
We select the maximum possible granularity from the maximum supply provided in the constructor. This supply should be selected to be more than it could ever possibly even get close to.
There is a limit of how much you can increase the supply via reward distributiin before you start losing precision (you can only increase the supply by some integer > 1).
For all reaslistic tokens this limit is somewhere after 30 doublings of the supply via the rewards distribtuion(not affected by issuing new tokens to holders).

## Audit

The current version of the Solidity smart contract code has been audity by Quantstamp - [report](audits/StakeHound-Quantstamp-audit-report.pdf)

## Attributions

The dynamic balance functionality is inspired by Ampleforth https://github.com/ampleforth/uFragments
Project structure was forked from https://github.com/PaulRBerg/solidity-template

## License

[GNU General Public License v3.0 (c) 2020 StakeHound SA](./LICENSE)
