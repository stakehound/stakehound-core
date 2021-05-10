import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { StakedToken } from "../typechain/StakedToken";
import { BigNumberish, BigNumber } from "ethers";
import { MockDownstream } from "../typechain/MockDownstream";
import { DownstreamCaller } from "../typechain/DownstreamCaller";
import DownstreamCallerArtifact from "../artifacts/contracts/DownstreamCaller.sol/DownstreamCaller.json";
import { deployContract } from "ethereum-waffle";

export function shouldBehaveLikeWrapper(_signers: Signer[], decimalsMultiplier: BigNumberish): void {
  function toTokenAmount(amount: BigNumberish): BigNumber {
    return ethers.BigNumber.from(amount).mul(decimalsMultiplier);
  }

  describe("Initialization", async function () {
    it("should be set up properly", async function () {
      const stakedToken: StakedToken = this.stakedToken;
      const owner = await _signers[0].getAddress();

      expect(await stakedToken.name()).to.equal(this.name);
      expect(await stakedToken.symbol()).to.equal(this.symbol);
      expect(await stakedToken.decimals()).to.equal(this.decimals);
      expect(await stakedToken.totalSupply()).to.equal(this.initialSupply);
      expect(await stakedToken.balanceOf(owner)).to.equal(this.initialSupply);
      expect(await stakedToken.owner()).to.equal(owner);
      expect(await stakedToken.supplyController()).to.equal(owner);
    });

    it("should reject ETH transfers", async function () {
      await expect(_signers[1].sendTransaction({ to: this.stakedToken.address, value: 1 })).to.be.reverted;
    });
  });


  describe("Upgrades", async function () {
    it("should be upgradeable", async function () {
      const StakedToken = await ethers.getContractFactory("StakedToken");
      const StakedTokenV2 = await ethers.getContractFactory("StakedTokenMockV2");
      const mockDownstream: MockDownstream = this.mockDownstream;

      const instance = await upgrades.deployProxy(StakedToken, [this.name, this.symbol, this.decimals, this.maxSupply, this.initialSupply]);

      //Check balance is preserved
      const recipient = await _signers[1].getAddress();
      const transferAmount = toTokenAmount(10);
      await instance.transfer(recipient, transferAmount);

      // Check downstream caller still works after upgrade
      let ABI = ["function updateOneArg(uint256 u)"];
      let iface = new ethers.utils.Interface(ABI);
      const data = iface.encodeFunctionData("updateOneArg", [12345]);
      await instance.addTransaction(mockDownstream.address, data);

      // Do the upgrade
      const upgraded = await upgrades.upgradeProxy(instance.address, StakedTokenV2);

      // Check values
      const name = await upgraded.name();
      expect(name).to.equal(this.name);
      expect(await upgraded.v2()).to.equal("hi");
      expect(await upgraded.balanceOf(recipient)).to.equal(transferAmount);
      expect(await upgraded.transactionsSize()).to.equal(1);
      await upgraded.addTransaction(mockDownstream.address, data);
      expect(await upgraded.transactionsSize()).to.equal(2);
    });
  });



  describe("Wrapping", async function () {
    it("should wrap inital tokens", async function () {
      const stakedToken: StakedToken = this.stakedToken;
      const wrapper: Wrapper = this.wrapper;
      const userAddress = await _signers[1].getAddress();

  });


}
