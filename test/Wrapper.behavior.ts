import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { BigNumberish, BigNumber } from "ethers";
import { Wrapper } from "../typechain/Wrapper";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { WrapperMockUpgraded } from "../typechain/WrapperMockUpgraded";

export function shouldBehaveLikeWrapper(_signers: SignerWithAddress[], decimalsMultiplier: BigNumberish): void {
  function toTokenAmount(amount: BigNumberish): BigNumber {
    return ethers.BigNumber.from(amount).mul(decimalsMultiplier);
  }

  describe("Initialization", async function () {
    it("should be set up properly", async function () {
      const wrapper: Wrapper = this.wrapper;

      expect(await wrapper.name()).to.equal(this.wrapperName);
      expect(await wrapper.symbol()).to.equal(this.wrapperSymbol);
      expect(await wrapper.decimals()).to.equal(this.decimals);
      expect(await wrapper.totalSupply()).to.equal(0);
    });

    it("should reject ETH transfers", async function () {
      await expect(_signers[1].sendTransaction({ to: this.wrapper.address, value: 1 })).to.be.reverted;
    });
  });

  describe.only("Upgrades", async function () {
    it("should be upgradeable", async function () {
      const WrapperFactory = await ethers.getContractFactory("Wrapper");
      const WrapperUpgradedFactory = await ethers.getContractFactory("WrapperMockUpgraded");
      const StakedTokenFactory = await ethers.getContractFactory("StakedToken");

      const instance = await upgrades.deployProxy(WrapperFactory, [this.stakedToken.address, this.wrapperName, this.wrapperSymbol]);

      //Check balance is preserved
      const depositAmount = toTokenAmount(100);

      const approveData = StakedTokenFactory.interface.encodeFunctionData('approve', [instance.address, depositAmount]);
      await _signers[0].sendTransaction({ to: this.stakedToken.address, value: 0, data: approveData });

      const depositData = WrapperFactory.interface.encodeFunctionData('deposit', [depositAmount]);
      await _signers[0].sendTransaction({ to: instance.address, value: 0, data: depositData });

      expect(await instance.balance()).to.equal(depositAmount);

      // Do the upgrade
      const upgraded = await upgrades.upgradeProxy(instance.address, WrapperUpgradedFactory) as WrapperMockUpgraded;

      // Check values
      expect(await upgraded.balance()).to.equal(depositAmount);
      expect(await upgraded.sayHi()).to.equal('hi');
    });
  });

  describe("Wrapper deposits", async function () {
    it("should mint shares to the first depositing user", async function () {
      const WrapperFactory = await ethers.getContractFactory("Wrapper");
      const StakedTokenFactory = await ethers.getContractFactory("StakedToken");
      const depositAmount = toTokenAmount(10);
      const user = _signers[0];

      expect(await this.wrapper.totalSupply()).to.equal(0);

      const approveData = StakedTokenFactory.interface.encodeFunctionData('approve', [this.wrapper.address, depositAmount]);
      await user.sendTransaction({ to: this.stakedToken.address, value: 0, data: approveData });

      const depositData = WrapperFactory.interface.encodeFunctionData('deposit', [depositAmount]);
      await user.sendTransaction({ to: this.wrapper.address, value: 0, data: depositData });

      expect(await this.wrapper.totalSupply()).to.equal(depositAmount);
      expect(await this.wrapper.balanceOf(user.address)).to.equal(depositAmount);
    });

    it("should fail minting unavailable balance", async function () {
      const WrapperFactory = await ethers.getContractFactory("Wrapper");
      const StakedTokenFactory = await ethers.getContractFactory("StakedToken");
      const depositAmount = toTokenAmount(10);
      const user = _signers[1];

      const approveData = StakedTokenFactory.interface.encodeFunctionData('approve', [this.wrapper.address, depositAmount]);
      await user.sendTransaction({ to: this.stakedToken.address, value: 0, data: approveData });

      const depositData = WrapperFactory.interface.encodeFunctionData('deposit', [depositAmount]);
      await expect(user.sendTransaction({ to: this.wrapper.address, value: 0, data: depositData })).to.be.reverted;
    });

    it("should fail burning when no supply is available", async function () {
      const WrapperFactory = await ethers.getContractFactory("Wrapper");

      const depositData = WrapperFactory.interface.encodeFunctionData('withdraw', [toTokenAmount(10)]);
      await expect(_signers[1].sendTransaction({ to: this.wrapper.address, value: 0, data: depositData })).to.be.reverted;
    });

    it("should calculate shares correctly", async function () {
      const WrapperFactory = await ethers.getContractFactory("Wrapper");
      const StakedTokenFactory = await ethers.getContractFactory("StakedToken");
      const transferAmount = toTokenAmount(100);

      const deposits = [10, 25];

      // Transfer some staked tokens to depositors
      for (let i = 1; i <= 2; i++) {
        const transferData = StakedTokenFactory.interface.encodeFunctionData('transfer', [_signers[i].address, transferAmount]);
        await _signers[0].sendTransaction({ to: this.stakedToken.address, value: 0, data: transferData });

        const approveData = StakedTokenFactory.interface.encodeFunctionData('approve', [this.wrapper.address, transferAmount]);
        await _signers[i].sendTransaction({ to: this.stakedToken.address, value: 0, data: approveData });
      }

      // Perform deposits
      for (let i = 1; i <= 2; i++) {
        const depositData = WrapperFactory.interface.encodeFunctionData('deposit', [toTokenAmount(deposits[i - 1])]);
        await _signers[i].sendTransaction({ to: this.wrapper.address, value: 0, data: depositData });
      }

      expect(await this.wrapper.totalSupply()).to.equal(toTokenAmount(deposits.reduce((a, c) => a + c, 0)));
      expect(await this.wrapper.balanceOf(_signers[1].address)).to.equal(toTokenAmount(10));
      expect(await this.wrapper.balanceOf(_signers[2].address)).to.equal(toTokenAmount(25));
    });

    it("should calculate shares correctly after a rebase", async function () {
      const WrapperFactory = await ethers.getContractFactory("Wrapper");
      const StakedTokenFactory = await ethers.getContractFactory("StakedToken");
      const deposits = [100, 50, 850];

      // Transfer some staked tokens to depositors
      for (let i = 1; i <= 3; i++) {
        const transferData = StakedTokenFactory.interface.encodeFunctionData('transfer', [_signers[i].address, toTokenAmount(deposits[i-1])]);
        await _signers[0].sendTransaction({ to: this.stakedToken.address, value: 0, data: transferData });

        const approveData = StakedTokenFactory.interface.encodeFunctionData('approve', [this.wrapper.address, toTokenAmount(deposits[i-1])]);
        await _signers[i].sendTransaction({ to: this.stakedToken.address, value: 0, data: approveData });
      }

      // Perform deposits
      for (let i = 1; i <= 3; i++) {
        const depositData = WrapperFactory.interface.encodeFunctionData('deposit', [toTokenAmount(deposits[i - 1])]);
        await _signers[i].sendTransaction({ to: this.wrapper.address, value: 0, data: depositData });
      }

      // Increase supply by 10%
      const rebaseData = StakedTokenFactory.interface.encodeFunctionData('distributeTokens', [toTokenAmount(100), true]);
      await _signers[0].sendTransaction({ to: this.stakedToken.address, value: 0, data: rebaseData });

      // Everybody should still have the same balance
      expect(await this.wrapper.totalSupply()).to.equal(toTokenAmount(deposits.reduce((a, c) => a + c, 0)));
      expect(await this.wrapper.balanceOf(_signers[1].address)).to.equal(toTokenAmount(100));
      expect(await this.wrapper.balanceOf(_signers[2].address)).to.equal(toTokenAmount(50));
      expect(await this.wrapper.balanceOf(_signers[3].address)).to.equal(toTokenAmount(850));

      // user1 Perform withdrawal
      const withdrawalData = WrapperFactory.interface.encodeFunctionData('withdraw', [toTokenAmount(50)]);
      await _signers[1].sendTransaction({ to: this.wrapper.address, value: 0, data: withdrawalData });

      // Everybody should be able to withdraw 10% more
      expect(await this.wrapper.totalSupply()).to.equal(toTokenAmount(deposits.reduce((a, c) => a + c, -50)));
      expect(await this.stakedToken.balanceOf(_signers[1].address)).to.equal(toTokenAmount(55));
      expect(await this.wrapper.balanceOf(_signers[1].address)).to.equal(toTokenAmount(50));
    });

    it("should revert deposits from blacklisted accounts", async function () {
      const WrapperFactory = await ethers.getContractFactory("Wrapper");
      const StakedTokenFactory = await ethers.getContractFactory("StakedToken");

      // Transfer some staked tokens to depositor
      const transferData = StakedTokenFactory.interface.encodeFunctionData('transfer', [_signers[1].address, toTokenAmount(100)]);
      await _signers[0].sendTransaction({ to: this.stakedToken.address, value: 0, data: transferData });

      const approveData = StakedTokenFactory.interface.encodeFunctionData('approve', [this.wrapper.address, toTokenAmount(100)]);
      await _signers[1].sendTransaction({ to: this.stakedToken.address, value: 0, data: approveData });

      // Blacklist user
      const blacklistData = StakedTokenFactory.interface.encodeFunctionData('setBlacklisted', [_signers[1].address, true]);
      await _signers[0].sendTransaction({ to: this.stakedToken.address, value: 0, data: blacklistData });

      const depositData = WrapperFactory.interface.encodeFunctionData('deposit', [toTokenAmount(10)]);
      await expect(_signers[1].sendTransaction({ to: this.wrapper.address, value: 0, data: depositData })).to.be.reverted;

      // Whitelist user
      const whitelistData = StakedTokenFactory.interface.encodeFunctionData('setBlacklisted', [_signers[1].address, false]);
      await _signers[0].sendTransaction({ to: this.stakedToken.address, value: 0, data: whitelistData });

      await expect(_signers[1].sendTransaction({ to: this.wrapper.address, value: 0, data: depositData })).not.to.be.reverted;
    });

    it("should revert withdrawals from blacklisted accounts", async function () {
      const WrapperFactory = await ethers.getContractFactory("Wrapper");
      const StakedTokenFactory = await ethers.getContractFactory("StakedToken");

      // Transfer some staked tokens to depositor
      const transferData = StakedTokenFactory.interface.encodeFunctionData('transfer', [_signers[1].address, toTokenAmount(100)]);
      await _signers[0].sendTransaction({ to: this.stakedToken.address, value: 0, data: transferData });

      const approveData = StakedTokenFactory.interface.encodeFunctionData('approve', [this.wrapper.address, toTokenAmount(100)]);
      await _signers[1].sendTransaction({ to: this.stakedToken.address, value: 0, data: approveData });

      // Let user deposit before blacklisting
      const depositData = WrapperFactory.interface.encodeFunctionData('deposit', [toTokenAmount(10)]);
      await _signers[1].sendTransaction({ to: this.wrapper.address, value: 0, data: depositData });

      // Blacklist user
      const blacklistData = StakedTokenFactory.interface.encodeFunctionData('setBlacklisted', [_signers[1].address, true]);
      await _signers[0].sendTransaction({ to: this.stakedToken.address, value: 0, data: blacklistData });

      const withdrawData = WrapperFactory.interface.encodeFunctionData('withdraw', [toTokenAmount(10)]);
      await expect(_signers[1].sendTransaction({ to: this.wrapper.address, value: 0, data: withdrawData })).to.be.reverted;

      // Whitelist user
      const whitelistData = StakedTokenFactory.interface.encodeFunctionData('setBlacklisted', [_signers[1].address, false]);
      await _signers[0].sendTransaction({ to: this.stakedToken.address, value: 0, data: whitelistData });

      await expect(_signers[1].sendTransaction({ to: this.wrapper.address, value: 0, data: withdrawData })).not.to.be.reverted;
    });
  });
}
