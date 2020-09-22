import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import { ethers, upgrades } from "@nomiclabs/buidler";
import { StakedToken } from "../typechain/StakedToken";
import { BigNumberish, BigNumber } from "ethers";
import { MockDownstream } from "../typechain/MockDownstream";
import { DownstreamCaller } from "../typechain/DownstreamCaller";
import DownstreamCallerArtifact from "../artifacts/DownstreamCaller.json";
import { deployContract } from "ethereum-waffle";

export function shouldBehaveLikeStakedToken(_signers: Signer[], decimalsMultiplier: BigNumberish): void {
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

      const name = await upgraded.name();
      expect(name).to.equal(this.name);
      expect(await upgraded.v2()).to.equal("hi");
      expect(await upgraded.balanceOf(recipient)).to.equal(transferAmount);
      expect(await upgraded.transactionsSize()).to.equal(1);
      await upgraded.addTransaction(mockDownstream.address, data);
      expect(await upgraded.transactionsSize()).to.equal(2);

    });
  });



  describe("setSupplyController", async function () {
    it("should update supply controller", async function () {
      const stakedToken: StakedToken = this.stakedToken;
      const userAddress = await _signers[1].getAddress();

      await expect(stakedToken.setSupplyController(userAddress))
        .to.emit(stakedToken, "LogSupplyControllerUpdated")
        .withArgs(userAddress);

      const stakedTokenAsUser = stakedToken.connect(_signers[1]);
      const supplyIncrease = toTokenAmount(10);
      await expect(stakedTokenAsUser.distributeTokens(supplyIncrease))
        .to.emit(stakedTokenAsUser, "LogTokenDistribution")
        .withArgs(this.initialSupply, supplyIncrease, this.initialSupply.add(supplyIncrease));
    });

    it("should not be callable by others", async function () {
      const userAddress = await _signers[1].getAddress();
      const stakedTokenAsUser = this.stakedToken.connect(_signers[1]);
      await expect(stakedTokenAsUser.setSupplyController(userAddress)).to.be.reverted;
    });
  });

  describe("Transfers", async function () {
    it("should transfer tokens", async function () {
      const stakedToken: StakedToken = this.stakedToken;
      const recipient = await _signers[1].getAddress();

      const transferAmount = toTokenAmount(10);
      await expect(stakedToken.transfer(recipient, transferAmount))
        .to.emit(stakedToken, "Transfer")
        .withArgs(await _signers[0].getAddress(), recipient, transferAmount);

      expect(await stakedToken.balanceOf(await _signers[0].getAddress())).to.equal(
        this.initialSupply.sub(transferAmount),
      );
      expect(await stakedToken.balanceOf(recipient)).to.equal(transferAmount);
      expect(await stakedToken.totalSupply()).to.equal(this.initialSupply);
    });

    it("should fail to transfer too many tokens", async function () {
      const stakedToken: StakedToken = this.stakedToken;
      const recipient = await _signers[1].getAddress();

      const transferAmount = toTokenAmount(10000);
      await expect(stakedToken.transfer(recipient, transferAmount)).to.be.reverted;

      expect(await stakedToken.balanceOf(await _signers[0].getAddress())).to.equal(this.initialSupply);
      expect(await stakedToken.balanceOf(recipient)).to.equal(0);
      expect(await stakedToken.totalSupply()).to.equal(this.initialSupply);
    });
  });

  describe("Minting", async function () {
    it("should mint new tokens", async function () {
      const stakedToken: StakedToken = this.stakedToken;

      const amount = toTokenAmount(1);
      const recipient = await _signers[1].getAddress();
      await expect(stakedToken.mint(recipient, amount))
        .to.emit(stakedToken, "Transfer")
        .withArgs(ethers.constants.AddressZero, recipient, amount);

      expect(await stakedToken.balanceOf(recipient)).to.equal(amount);
    });

    it("should not be callable by others", async function () {
      const userAddress = await _signers[1].getAddress();
      const stakedTokenAsUser = this.stakedToken.connect(_signers[1]);
      const amount = toTokenAmount(1);
      await expect(stakedTokenAsUser.mint(userAddress, amount)).to.be.reverted;
    });
  });

  describe("Burning", async function () {
    it("should burn tokens", async function () {
      const stakedToken: StakedToken = this.stakedToken;

      const amount = toTokenAmount(1);
      const admin = await _signers[0].getAddress();

      await expect(stakedToken.burn(amount))
        .to.emit(stakedToken, "Transfer")
        .withArgs(admin, ethers.constants.AddressZero, amount);

      expect(await stakedToken.balanceOf(admin)).to.equal(this.initialSupply.sub(amount));
    });

    it("should fail to burn more than in account", async function () {
      const stakedToken: StakedToken = this.stakedToken;

      const amount = this.initialSupply.add(1);
      const admin = await _signers[0].getAddress();

      await expect(stakedToken.burn(amount)).to.be.reverted;
    });

    it("should not be callable by others", async function () {
      const stakedTokenAsUser = this.stakedToken.connect(_signers[1]);
      const amount = toTokenAmount(1);
      await expect(stakedTokenAsUser.burn(amount)).to.be.reverted;
    });
  });

  describe("Reward distribution", async function () {
    it("should distribute rewards", async function () {
      const stakedToken: StakedToken = this.stakedToken;

      // Set up other account
      const mintAmount = toTokenAmount(3000);
      const recipient = await _signers[1].getAddress();
      await stakedToken.mint(recipient, mintAmount);

      const preRebaseSupply = this.initialSupply.add(mintAmount);

      const supplyIncrease = toTokenAmount(10);
      await expect(stakedToken.distributeTokens(supplyIncrease))
        .to.emit(stakedToken, "LogTokenDistribution")
        .withArgs(preRebaseSupply, supplyIncrease, preRebaseSupply.add(supplyIncrease));

      expect(await stakedToken.balanceOf(await _signers[0].getAddress())).to.equal(this.initialSupply.mul(10025).div(10000));
      expect(await stakedToken.balanceOf(recipient)).to.equal(mintAmount.mul(10025).div(10000));
      expect(await stakedToken.totalSupply()).to.equal(preRebaseSupply.mul(10025).div(10000));
    });

    it("should maintain supply precision for 20 doublings", async function () {
      const stakedToken: StakedToken = this.stakedToken;

      let preRebaseSupply, postRebaseSupply;
      const doublings = 20;

      for(let i=0; i<doublings; i++) {
        preRebaseSupply = await stakedToken.totalSupply();
        await stakedToken.distributeTokens(1);
        postRebaseSupply = await stakedToken.totalSupply();
        console.log(`Increased supply by 1 to ${postRebaseSupply}, actually increased by ${postRebaseSupply.sub(preRebaseSupply)}`);

        expect(postRebaseSupply.sub(preRebaseSupply).toNumber()).to.eq(1);

        console.log(`Doubling supply ${i}`);
        await stakedToken.distributeTokens(postRebaseSupply);
      }

    });

    it("should not be callable by others", async function () {
      const stakedTokenAsUser = this.stakedToken.connect(_signers[1]);
      const amount = toTokenAmount(1);
      await expect(stakedTokenAsUser.distributeTokens(amount)).to.be.reverted;
    });
  });

  describe("Allowances", async function () {
    // Transfer + rebase ?

    const owner = _signers[0];
    const user = _signers[1];

    it("should transfer if allowance is big enough", async function () {
      const stakedToken: StakedToken = this.stakedToken;
      const stakedTokenAsUser = stakedToken.connect(user);
      const allowance = toTokenAmount(1000);
      const amount = toTokenAmount(10);

      await expect(stakedToken.approve(await user.getAddress(), allowance))
        .to.emit(stakedToken, "Approval")
        .withArgs(await owner.getAddress(), await user.getAddress(), allowance);

      await expect(stakedTokenAsUser.transferFrom(await owner.getAddress(), await user.getAddress(), amount))
        .to.emit(stakedTokenAsUser, "Transfer")
        .withArgs(await owner.getAddress(), await user.getAddress(), amount);

      expect(await stakedToken.balanceOf(await owner.getAddress())).to.equal(this.initialSupply.sub(amount));
      expect(await stakedToken.balanceOf(await user.getAddress())).to.equal(amount);
      expect(await stakedToken.totalSupply()).to.equal(this.initialSupply);
    });

    it("should fail to transfer if the allowance is too small", async function () {
      const stakedToken: StakedToken = this.stakedToken;
      const stakedTokenAsUser = stakedToken.connect(user);
      const allowance = toTokenAmount(10);
      const amount = toTokenAmount(100);

      await expect(stakedToken.approve(await user.getAddress(), allowance))
        .to.emit(stakedToken, "Approval")
        .withArgs(await owner.getAddress(), await user.getAddress(), allowance);

      await expect(stakedTokenAsUser.transferFrom(await owner.getAddress(), await user.getAddress(), amount)).to.be
        .reverted;
    });
  });

  describe("External calls", async function () {
    it("should register a downstream contract and call it on distribution", async function () {
      const stakedToken: StakedToken = this.stakedToken;
      const mockDownstream: MockDownstream = this.mockDownstream;

      let ABI = ["function updateOneArg(uint256 u)"];
      let iface = new ethers.utils.Interface(ABI);
      const data = iface.encodeFunctionData("updateOneArg", [12345]);

      await stakedToken.addTransaction(mockDownstream.address, data);
      expect(await stakedToken.transactionsSize()).to.equal(1);

      await expect(stakedToken.distributeTokens(123))
        .to.emit(mockDownstream, "FunctionCalled")
        .withArgs("MockDownstream", "updateOneArg", await stakedToken.downstreamCallerAddress());
    });

    it("should remove a downstream transaction", async function () {
      const stakedToken: StakedToken = this.stakedToken;
      const mockDownstream: MockDownstream = this.mockDownstream;

      let ABI = ["function updateOneArg(uint256 u)"];
      let iface = new ethers.utils.Interface(ABI);
      const data = iface.encodeFunctionData("updateOneArg", [12345]);

      await stakedToken.addTransaction(mockDownstream.address, data);
      expect(await stakedToken.transactionsSize()).to.equal(1);

      await stakedToken.removeTransaction(0);
      expect(await stakedToken.transactionsSize()).to.equal(0);

      await expect(stakedToken.distributeTokens(123))
        .to.not.emit(mockDownstream, "FunctionCalled");
    });


    it("should disable a downstream transaction", async function () {
      const stakedToken: StakedToken = this.stakedToken;
      const mockDownstream: MockDownstream = this.mockDownstream;

      let ABI = ["function updateOneArg(uint256 u)"];
      let iface = new ethers.utils.Interface(ABI);
      const data = iface.encodeFunctionData("updateOneArg", [12345]);

      await stakedToken.addTransaction(mockDownstream.address, data);
      expect(await stakedToken.transactionsSize()).to.equal(1);

      await stakedToken.setTransactionEnabled(0, false);
      expect(await stakedToken.transactionsSize()).to.equal(1);

      await expect(stakedToken.distributeTokens(123))
        .to.not.emit(mockDownstream, "FunctionCalled");
    });

    it("should change the downstream caller contract", async function () {
      const stakedToken: StakedToken = this.stakedToken;
      const mockDownstream: MockDownstream = this.mockDownstream;

      let ABI = ["function updateOneArg(uint256 u)"];
      let iface = new ethers.utils.Interface(ABI);
      const data = iface.encodeFunctionData("updateOneArg", [12345]);

      await stakedToken.addTransaction(mockDownstream.address, data);
      expect(await stakedToken.transactionsSize()).to.equal(1);

      const downstreamCaller = (await deployContract(_signers[0], DownstreamCallerArtifact, [])) as DownstreamCaller;
      await downstreamCaller.transferOwnership(stakedToken.address);

      await stakedToken.setDownstreamCaller(downstreamCaller.address);

      expect(await stakedToken.transactionsSize()).to.equal(0);
      await stakedToken.addTransaction(mockDownstream.address, data);
      expect(await stakedToken.transactionsSize()).to.equal(1);

      await expect(stakedToken.distributeTokens(123))
        .to.emit(mockDownstream, "FunctionCalled")
        .withArgs("MockDownstream", "updateOneArg", await stakedToken.downstreamCallerAddress());

    });

    it("should not be callable by others", async function () {
      const stakedTokenAsUser = this.stakedToken.connect(_signers[1]);
      const mockDownstream: MockDownstream = this.mockDownstream;

      let ABI = ["function updateOneArg(uint256 u)"];
      let iface = new ethers.utils.Interface(ABI);
      const data = iface.encodeFunctionData("updateOneArg", [12345]);

      await expect(stakedTokenAsUser.addTransaction(mockDownstream.address, data)).to.be.reverted;
    });
  });

}
