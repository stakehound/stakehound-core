import chai from "chai";
import { Signer } from "@ethersproject/abstract-signer";
import { deployContract, solidity } from "ethereum-waffle";
import { ethers } from "@nomiclabs/buidler";

import StakedTokenArtifact from "../artifacts/StakedToken.json";
import MockDownstreamArtifact from "../artifacts/MockDownstream.json";

import { StakedToken } from "../typechain/StakedToken";
import { MockDownstream } from "../typechain/MockDownstream";
import { shouldBehaveLikeStakedToken } from "./StakedToken.behavior";

chai.use(solidity);

setTimeout(async function () {
  const signers: Signer[] = await ethers.getSigners();
  const admin: Signer = signers[0];
  const decimals = 8;
  const decimalsMultiplier = ethers.BigNumber.from(10).pow(decimals);

  describe("StakedToken", function () {
    beforeEach(async function () {
      this.name = "Staked Test Coin";
      this.symbol = "stakedTST";
      this.decimals = 8;
      this.decimalsMultiplier = decimalsMultiplier;
      this.initialSupply = ethers.BigNumber.from(1000).mul(this.decimalsMultiplier);

      this.stakedToken = (await deployContract(admin, StakedTokenArtifact, [
        this.name,
        this.symbol,
        this.decimals,
        this.initialSupply,
      ])) as StakedToken;
      this.mockDownstream = (await deployContract(admin, MockDownstreamArtifact, [])) as MockDownstream;
    });

    shouldBehaveLikeStakedToken(signers, decimalsMultiplier);
  });

  run();
}, 1000);
