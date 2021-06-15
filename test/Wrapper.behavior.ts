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

   async function distributeWrappedTokens(distribution: [number, number][], context: any) {
     const WrapperFactory = await ethers.getContractFactory("Wrapper");
     const StakedTokenFactory = await ethers.getContractFactory("StakedToken");

     for (const d of distribution) {
        const [addressIndex, amount] = d;

        const transferData = StakedTokenFactory.interface.encodeFunctionData('transfer', [_signers[addressIndex].address, toTokenAmount(amount)]);
        await _signers[0].sendTransaction({ to: context.stakedToken.address, value: 0, data: transferData });

        const approveData = StakedTokenFactory.interface.encodeFunctionData('approve', [context.wrapper.address, toTokenAmount(amount)]);
        await _signers[addressIndex].sendTransaction({ to: context.stakedToken.address, value: 0, data: approveData });
     }

     for (const d of distribution) {
        const [addressIndex, amount] = d;
        const depositData = WrapperFactory.interface.encodeFunctionData('deposit', [toTokenAmount(amount)]);
        await _signers[addressIndex].sendTransaction({ to: context.wrapper.address, value: 0, data: depositData });
     }
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

  describe("Wrapper deposits/withdrawals", async function () {
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
      await distributeWrappedTokens([[1, 10], [2, 25]], this);

      expect(await this.wrapper.totalSupply()).to.equal(toTokenAmount(35));
      expect(await this.wrapper.balanceOf(_signers[1].address)).to.equal(toTokenAmount(10));
      expect(await this.wrapper.balanceOf(_signers[2].address)).to.equal(toTokenAmount(25));
    });

    it("should calculate shares correctly after a rebase", async function () {
      const WrapperFactory = await ethers.getContractFactory("Wrapper");
      const StakedTokenFactory = await ethers.getContractFactory("StakedToken");
      await distributeWrappedTokens([[1, 100], [2, 50], [3, 850]], this);

      // Increase supply by 10%
      const rebaseData = StakedTokenFactory.interface.encodeFunctionData('distributeTokens', [toTokenAmount(100), true]);
      await _signers[0].sendTransaction({ to: this.stakedToken.address, value: 0, data: rebaseData });

      // Everybody should still have the same balance
      expect(await this.wrapper.totalSupply()).to.equal(toTokenAmount(1000));
      expect(await this.wrapper.balanceOf(_signers[1].address)).to.equal(toTokenAmount(100));
      expect(await this.wrapper.balanceOf(_signers[2].address)).to.equal(toTokenAmount(50));
      expect(await this.wrapper.balanceOf(_signers[3].address)).to.equal(toTokenAmount(850));

      // User1 Perform withdrawal
      const withdrawalData = WrapperFactory.interface.encodeFunctionData('withdraw', [toTokenAmount(50)]);
      await _signers[1].sendTransaction({ to: this.wrapper.address, value: 0, data: withdrawalData });

      // Everybody should be able to withdraw 10% more
      expect(await this.wrapper.totalSupply()).to.equal(toTokenAmount(950));
      expect(await this.stakedToken.balanceOf(_signers[1].address)).to.equal(toTokenAmount(55));
      expect(await this.wrapper.balanceOf(_signers[1].address)).to.equal(toTokenAmount(50));
    });

    it("should calculate shares correctly after a tokens depletion", async function () {
      const WrapperFactory = await ethers.getContractFactory("Wrapper");
      const StakedTokenFactory = await ethers.getContractFactory("StakedToken");
      await distributeWrappedTokens([[1, 100], [2, 50], [3, 850]], this);

      // Increase supply by 10%
      const rebaseData = StakedTokenFactory.interface.encodeFunctionData('distributeTokens', [toTokenAmount(100), true]);
      await _signers[0].sendTransaction({ to: this.stakedToken.address, value: 0, data: rebaseData });

      // User1 Perform withdrawal
      const user1WithdrawalData = WrapperFactory.interface.encodeFunctionData('withdraw', [toTokenAmount(100)]);
      await _signers[1].sendTransaction({ to: this.wrapper.address, value: 0, data: user1WithdrawalData });

      // User2 Perform withdrawal
      const user2WithdrawalData = WrapperFactory.interface.encodeFunctionData('withdraw', [toTokenAmount(50)]);
      await _signers[2].sendTransaction({ to: this.wrapper.address, value: 0, data: user2WithdrawalData });

      // User3 Perform withdrawal
      const user3WithdrawalData = WrapperFactory.interface.encodeFunctionData('withdraw', [toTokenAmount(850)]);
      await _signers[3].sendTransaction({ to: this.wrapper.address, value: 0, data: user3WithdrawalData });

      // totalSupply and users balances should be 0
      expect(await this.wrapper.totalSupply()).to.equal(toTokenAmount(0));
      expect(await this.wrapper.balanceOf(_signers[1].address)).to.equal(toTokenAmount(0));
      expect(await this.wrapper.balanceOf(_signers[2].address)).to.equal(toTokenAmount(0));
      expect(await this.wrapper.balanceOf(_signers[3].address)).to.equal(toTokenAmount(0));

      // User1 should be able to deposit 10% more
      const user1ApproveData = StakedTokenFactory.interface.encodeFunctionData('approve', [this.wrapper.address, toTokenAmount(110)]);
      const user1DepositData = WrapperFactory.interface.encodeFunctionData('deposit', [toTokenAmount(110)]);
      await _signers[1].sendTransaction({ to: this.stakedToken.address, value: 0, data: user1ApproveData });
      await _signers[1].sendTransaction({ to: this.wrapper.address, value: 0, data: user1DepositData });

      // User2 should be able to deposit 10% more
      const user2ApproveData = StakedTokenFactory.interface.encodeFunctionData('approve', [this.wrapper.address, toTokenAmount(55)]);
      const user2DepositData = WrapperFactory.interface.encodeFunctionData('deposit', [toTokenAmount(55)]);
      await _signers[2].sendTransaction({ to: this.stakedToken.address, value: 0, data: user2ApproveData });
      await _signers[2].sendTransaction({ to: this.wrapper.address, value: 0, data: user2DepositData });

      expect(await this.wrapper.totalSupply()).to.equal(toTokenAmount(165));
      expect(await this.wrapper.balanceOf(_signers[1].address)).to.equal(toTokenAmount(110));
      expect(await this.wrapper.balanceOf(_signers[2].address)).to.equal(toTokenAmount(55));
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
      await distributeWrappedTokens([[1, 10]], this);

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

    it("should expose staked token amount", async function() {
      const StakedTokenFactory = await ethers.getContractFactory("StakedToken");
      await distributeWrappedTokens([[1, 1000]], this);

      // Increase supply by 10%
      const rebaseData = StakedTokenFactory.interface.encodeFunctionData('distributeTokens', [toTokenAmount(100), true]);
      await _signers[0].sendTransaction({ to: this.stakedToken.address, value: 0, data: rebaseData });

      expect(await this.stakedToken.balanceOf(_signers[1].address)).to.equal(toTokenAmount(0));
      expect(await this.wrapper.totalSupply()).to.equal(toTokenAmount(1000));
      expect(await this.wrapper.balanceOf(_signers[1].address)).to.equal(toTokenAmount(1000));

      // StakedToken balance
      expect(await this.wrapper.stakedTokenBalanceOf(_signers[1].address)).to.equal(toTokenAmount(1100));
    });
  });

  describe("Wrapper transfers", async function () {
    it("should prevent transfers when staked token is paused", async function() {
      const WrapperFactory = await ethers.getContractFactory("Wrapper");
      const StakedTokenFactory = await ethers.getContractFactory("StakedToken");
      await distributeWrappedTokens([[1, 850], [2, 50]], this);

      // Pause staked token
      const pauseData = StakedTokenFactory.interface.encodeFunctionData('pause');
      await _signers[0].sendTransaction({ to: this.stakedToken.address, value: 0, data: pauseData });

      // Try to execute a transfer on the wrapper token
      const wrapperTransferData = WrapperFactory.interface.encodeFunctionData('transfer', [_signers[2].address, toTokenAmount(450)]);
      // Expect transfer to fail
      await expect(_signers[1].sendTransaction({ to: this.wrapper.address, value: 0, data: wrapperTransferData })).to.be.reverted;

      // Unpause staked token
      const unpauseData = StakedTokenFactory.interface.encodeFunctionData('unpause');
      await _signers[0].sendTransaction({ to: this.stakedToken.address, value: 0, data: unpauseData });

      // Execute a transfer on the wrapper token
      await _signers[1].sendTransaction({ to: this.wrapper.address, value: 0, data: wrapperTransferData })

      // Expect transfer to succeed
      expect(await this.wrapper.balanceOf(_signers[1].address)).to.equal(toTokenAmount(400));
      expect(await this.wrapper.balanceOf(_signers[2].address)).to.equal(toTokenAmount(500));
    });

    it("should prevent transferFrom when staked token is paused", async function() {
      const WrapperFactory = await ethers.getContractFactory("Wrapper");
      const StakedTokenFactory = await ethers.getContractFactory("StakedToken");
      await distributeWrappedTokens([[1, 100]], this);

      // User1 approves User2 to spend 100 tokens
      const wrapperTokenApproveData = StakedTokenFactory.interface.encodeFunctionData('approve', [_signers[2].address, toTokenAmount(100)]);
      await _signers[1].sendTransaction({ to: this.wrapper.address, value: 0, data: wrapperTokenApproveData });

      // Pause staked token
      const pauseData = StakedTokenFactory.interface.encodeFunctionData('pause');
      await _signers[0].sendTransaction({ to: this.stakedToken.address, value: 0, data: pauseData });

      // User2 tries to transferFrom User1 to User3 to fail
      const wrapperTransferFromData = WrapperFactory.interface.encodeFunctionData('transferFrom', [_signers[1].address, _signers[3].address, toTokenAmount(100)]);
      // Expect transferFrom to fail
      await expect(_signers[2].sendTransaction({ to: this.wrapper.address, value: 0, data: wrapperTransferFromData })).to.be.reverted;

      // Unpause staked token
      const unpauseData = StakedTokenFactory.interface.encodeFunctionData('unpause');
      await _signers[0].sendTransaction({ to: this.stakedToken.address, value: 0, data: unpauseData });

      // User2 executes transferFrom User1 to User3
      await _signers[2].sendTransaction({ to: this.wrapper.address, value: 0, data: wrapperTransferFromData });

      // Expect transferFrom to succeed
      expect(await this.wrapper.balanceOf(_signers[3].address)).to.equal(toTokenAmount(100));
    });

    it("should prevent transfer and transferFrom when recipient is blacklisted", async function() {
      const WrapperFactory = await ethers.getContractFactory("Wrapper");
      const StakedTokenFactory = await ethers.getContractFactory("StakedToken");
      await distributeWrappedTokens([[1, 100]], this);

      // User1 allows User3 to transfer up to 50 tokens
      const wrapperTokenApproveData = StakedTokenFactory.interface.encodeFunctionData('approve', [_signers[3].address, toTokenAmount(50)]);
      await _signers[1].sendTransaction({ to: this.wrapper.address, value: 0, data: wrapperTokenApproveData });

      // Blacklist User2
      const blacklistRecipientData = StakedTokenFactory.interface.encodeFunctionData('setBlacklisted', [_signers[2].address, true]);
      await _signers[0].sendTransaction({ to: this.stakedToken.address, value: 0, data: blacklistRecipientData });

      // User1 tries to transfer 50 tokens to User2
      const wrapperTransferData = WrapperFactory.interface.encodeFunctionData('transfer', [_signers[2].address, toTokenAmount(50)]);
      // Expect transfer to fail
      await expect(_signers[1].sendTransaction({ to: this.wrapper.address, value: 0, data: wrapperTransferData })).to.be.reverted;

      // Approved User3 tries to transferFrom User1 to blacklisted User2
      const wrapperTransferFromData = WrapperFactory.interface.encodeFunctionData('transferFrom', [_signers[1].address, _signers[2].address, toTokenAmount(50)]);
      // Expect transferFrom to fail
      await expect(_signers[3].sendTransaction({ to: this.wrapper.address, value: 0, data: wrapperTransferFromData })).to.be.reverted;

      // Remove User2 from blacklist
      const unblacklistRecipientData = StakedTokenFactory.interface.encodeFunctionData('setBlacklisted', [_signers[2].address, false]);
      await _signers[0].sendTransaction({ to: this.stakedToken.address, value: 0, data: unblacklistRecipientData });

      // User1 transfer 50 tokens to User2
      await _signers[1].sendTransaction({ to: this.wrapper.address, value: 0, data: wrapperTransferData });
      // Approved User3 transferFrom User1 to no longer blacklisted User2 an amount of 50 tokens
      await _signers[3].sendTransaction({ to: this.wrapper.address, value: 0, data: wrapperTransferFromData });

      // Expect User2 to have a balanceOf 100 tokens
      expect(await this.wrapper.balanceOf(_signers[2].address)).to.equal(toTokenAmount(100));
    });

    it("should prevent transfer and transferFrom when sender is blacklisted", async function() {
      const WrapperFactory = await ethers.getContractFactory("Wrapper");
      const StakedTokenFactory = await ethers.getContractFactory("StakedToken");
      await distributeWrappedTokens([[1, 100]], this);

      // User1 allows User2 to spend 50 tokens
      const wrapperTokenApproveData = StakedTokenFactory.interface.encodeFunctionData('approve', [_signers[2].address, toTokenAmount(50)]);
      await _signers[1].sendTransaction({ to: this.wrapper.address, value: 0, data: wrapperTokenApproveData });

      // Blacklist User1
      const blacklistSenderData = StakedTokenFactory.interface.encodeFunctionData('setBlacklisted', [_signers[1].address, true]);
      await _signers[0].sendTransaction({ to: this.stakedToken.address, value: 0, data: blacklistSenderData });

      // Blacklisted User1 tries to transfer 50 tokens to User2
      const wrapperTransferData = WrapperFactory.interface.encodeFunctionData('transfer', [_signers[2].address, toTokenAmount(50)]);
      // Expect transfer to fail
      await expect(_signers[1].sendTransaction({ to: this.wrapper.address, value: 0, data: wrapperTransferData })).to.be.reverted;

      // Approved User2 tries to transferFrom blacklisted User1 to User3 an amount of 50 tokens
      const wrapperTransferFromData = WrapperFactory.interface.encodeFunctionData('transferFrom', [_signers[1].address, _signers[3].address, toTokenAmount(50)]);
      // Expect transferFrom to fail
      await expect(_signers[2].sendTransaction({ to: this.wrapper.address, value: 0, data: wrapperTransferFromData })).to.be.reverted;

      // Remove User1 from blacklist
      const unblacklistSenderData = StakedTokenFactory.interface.encodeFunctionData('setBlacklisted', [_signers[1].address, false]);
      await _signers[0].sendTransaction({ to: this.stakedToken.address, value: 0, data: unblacklistSenderData });

      // No longer blacklisted User1 transfer 50 tokens to User2
      await _signers[1].sendTransaction({ to: this.wrapper.address, value: 0, data: wrapperTransferData });
      // Approved User2 transferFrom no longer blacklisted User1 to User3 an amount of 50 tokens
      await _signers[2].sendTransaction({ to: this.wrapper.address, value: 0, data: wrapperTransferFromData });

      // Expect User2 and User3 to have balanceOf 50 tokens
      expect(await this.wrapper.balanceOf(_signers[2].address)).to.equal(toTokenAmount(50));
      expect(await this.wrapper.balanceOf(_signers[3].address)).to.equal(toTokenAmount(50));
    });

    it("should prevent transferFrom when spender is blacklisted", async function() {
      const WrapperFactory = await ethers.getContractFactory("Wrapper");
      const StakedTokenFactory = await ethers.getContractFactory("StakedToken");
      await distributeWrappedTokens([[1, 100]], this);

      // User1 allows User2 to spend 50 tokens
      const wrapperTokenApproveData = StakedTokenFactory.interface.encodeFunctionData('approve', [_signers[2].address, toTokenAmount(50)]);
      await _signers[1].sendTransaction({ to: this.wrapper.address, value: 0, data: wrapperTokenApproveData });

      // Blacklist User2
      const blacklistSenderData = StakedTokenFactory.interface.encodeFunctionData('setBlacklisted', [_signers[2].address, true]);
      await _signers[0].sendTransaction({ to: this.stakedToken.address, value: 0, data: blacklistSenderData });

      // Approved and blacklisted User2 tries to transferFrom User1 to User3 an amount of 50 tokens
      const wrapperTransferFromData = WrapperFactory.interface.encodeFunctionData('transferFrom', [_signers[1].address, _signers[3].address, toTokenAmount(50)]);
      // Expect transferFrom to fail
      await expect(_signers[2].sendTransaction({ to: this.wrapper.address, value: 0, data: wrapperTransferFromData })).to.be.reverted;

      // Remove User2 from blacklist
      const unblacklistSenderData = StakedTokenFactory.interface.encodeFunctionData('setBlacklisted', [_signers[2].address, false]);
      await _signers[0].sendTransaction({ to: this.stakedToken.address, value: 0, data: unblacklistSenderData });

      // Approved and no longer blacklisted User2 transferFrom User1 to User3 an amount of 50 tokens
      await _signers[2].sendTransaction({ to: this.wrapper.address, value: 0, data: wrapperTransferFromData });

      // Expect User3 to have balanceOf 50 tokens
      expect(await this.wrapper.balanceOf(_signers[3].address)).to.equal(toTokenAmount(50));
    });

    it("should prevent approving a blacklisted spender", async function() {
      const WrapperFactory = await ethers.getContractFactory("Wrapper");
      const StakedTokenFactory = await ethers.getContractFactory("StakedToken");
      await distributeWrappedTokens([[1, 100]], this);

      // Blacklist User2
      const blacklistSenderData = StakedTokenFactory.interface.encodeFunctionData('setBlacklisted', [_signers[2].address, true]);
      await _signers[0].sendTransaction({ to: this.stakedToken.address, value: 0, data: blacklistSenderData });

      // User1 allows User2 to spend 50 tokens
      const wrapperTokenApproveData = StakedTokenFactory.interface.encodeFunctionData('approve', [_signers[2].address, toTokenAmount(50)]);
      await expect(_signers[1].sendTransaction({ to: this.wrapper.address, value: 0, data: wrapperTokenApproveData })).to.be.reverted;

      // Remove User2 from blacklist
      const unblacklistSenderData = StakedTokenFactory.interface.encodeFunctionData('setBlacklisted', [_signers[2].address, false]);
      await _signers[0].sendTransaction({ to: this.stakedToken.address, value: 0, data: unblacklistSenderData });

      await _signers[1].sendTransaction({ to: this.wrapper.address, value: 0, data: wrapperTokenApproveData });

      // User2 transferFrom User1 to User3 an amount of 50 tokens
      const wrapperTransferFromData = WrapperFactory.interface.encodeFunctionData('transferFrom', [_signers[1].address, _signers[3].address, toTokenAmount(50)]);
      // Approved and no longer blacklisted User2 transferFrom User1 to User3 an amount of 50 tokens
      await _signers[2].sendTransaction({ to: this.wrapper.address, value: 0, data: wrapperTransferFromData });

      // Expect User3 to have balanceOf 50 tokens
      expect(await this.wrapper.balanceOf(_signers[3].address)).to.equal(toTokenAmount(50));
    });

    it("should prevent a blacklisted spender from performing transferFrom", async function() {
      const WrapperFactory = await ethers.getContractFactory("Wrapper");
      const StakedTokenFactory = await ethers.getContractFactory("StakedToken");
      await distributeWrappedTokens([[1, 100]], this);

      // User1 allows User2 to spend 50 tokens
      const wrapperTokenApproveData = StakedTokenFactory.interface.encodeFunctionData('approve', [_signers[2].address, toTokenAmount(50)]);
      await _signers[1].sendTransaction({ to: this.wrapper.address, value: 0, data: wrapperTokenApproveData });

      // Blacklist User2
      const blacklistSenderData = StakedTokenFactory.interface.encodeFunctionData('setBlacklisted', [_signers[2].address, true]);
      await _signers[0].sendTransaction({ to: this.stakedToken.address, value: 0, data: blacklistSenderData });

      // User2 tries to transferFrom User1 to User3 an amount of 50 tokens
      const wrapperTransferFromData = WrapperFactory.interface.encodeFunctionData('transferFrom', [_signers[1].address, _signers[3].address, toTokenAmount(50)]);
      // Approved and blacklisted User2 tries to transferFrom User1 to User3 an amount of 50 tokens
      await expect(_signers[2].sendTransaction({ to: this.wrapper.address, value: 0, data: wrapperTransferFromData })).to.be.reverted;

      // Remove User2 from blacklist
      const unblacklistSenderData = StakedTokenFactory.interface.encodeFunctionData('setBlacklisted', [_signers[2].address, false]);
      await _signers[0].sendTransaction({ to: this.stakedToken.address, value: 0, data: unblacklistSenderData });

      // Approved and no longer blacklisted User2 transferFrom User1 to User3 an amount of 50 tokens
      await _signers[2].sendTransaction({ to: this.wrapper.address, value: 0, data: wrapperTransferFromData });

      // Expect User3 to have balanceOf 50 tokens
      expect(await this.wrapper.balanceOf(_signers[3].address)).to.equal(toTokenAmount(50));
    });
  });

  describe("Wrapper admin", async function() {
    it("token owner should able to change name and symbol", async function() {
      const WrapperFactory = await ethers.getContractFactory("Wrapper");

      const setNameData = WrapperFactory.interface.encodeFunctionData('setName', ['Foo']);
      await _signers[0].sendTransaction({ to: this.wrapper.address, value: 0, data: setNameData });

      const setSymbolData = WrapperFactory.interface.encodeFunctionData('setSymbol', ['Bar']);
      await _signers[0].sendTransaction({ to: this.wrapper.address, value: 0, data: setSymbolData });

      expect(await this.wrapper.name()).to.equal('Foo');
      expect(await this.wrapper.symbol()).to.equal('Bar');
    });
  });
}