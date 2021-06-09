import chai from "chai";
import { Signer } from "@ethersproject/abstract-signer";
import { deployContract, solidity } from "ethereum-waffle";
import { ethers, upgrades } from "hardhat";

import MockDownstreamArtifact from "../artifacts/contracts/mocks/MockDownstream.sol/MockDownstream.json";

import { StakedToken } from "../typechain/StakedToken";
import { MockDownstream } from "../typechain/MockDownstream";
import { shouldBehaveLikeStakedToken } from "./StakedToken.behavior";
import { Contract, ContractFactory } from "ethers";

chai.use(solidity);

setTimeout(async function () {
  const signers = await ethers.getSigners();
  const admin = signers[0] as Signer;
  const decimals = 18;
  const decimalsMultiplier = ethers.BigNumber.from(10).pow(decimals);

  describe("StakedToken", function () {
    beforeEach(async function () {
      this.name = "Staked Test Coin";
      this.symbol = "stakedTST";
      this.decimals = decimals;
      this.decimalsMultiplier = decimalsMultiplier;
      // A token with 18 decimals, current supply of 10^15 and anticipated 10^6 maximum possible increase in supply (far exceeds any exisitng token)
      this.maxSupply = ethers.BigNumber.from(10).pow(15 + decimals + 6);
      this.initialSupply = ethers.BigNumber.from(1000).mul(this.decimalsMultiplier);

      const StakedTokenFactory: ContractFactory = await ethers.getContractFactory("StakedToken");
      const stakedToken: Contract = await upgrades.deployProxy(StakedTokenFactory, [this.name, this.symbol, this.decimals, this.maxSupply, this.initialSupply]);
      await stakedToken.deployed();
      this.stakedToken = stakedToken as StakedToken;

      this.mockDownstream = (await deployContract(admin, MockDownstreamArtifact, [])) as unknown as MockDownstream;
    });

    shouldBehaveLikeStakedToken(signers, decimalsMultiplier);
  });

  run();
}, 1000);
