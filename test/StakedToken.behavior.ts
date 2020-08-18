import { Signer } from "@ethersproject/abstract-signer";
import { expect } from "chai";
import { ethers } from "@nomiclabs/buidler";
import { StakedToken } from "../typechain/StakedToken";
import { BigNumberish } from "ethers";

export function shouldBehaveLikeStakedToken(_signers: Signer[], decimalsMultiplier: BigNumberish): void {
  function toTokenAmount(amount: BigNumberish): BigNumberish {
    return ethers.BigNumber.from(amount).mul(decimalsMultiplier)
  }


  it("should be set up properly", async function () {
    expect(await this.stakedToken.name()).to.equal(this.name);
    expect(await this.stakedToken.symbol()).to.equal(this.symbol);
    expect(await this.stakedToken.decimals()).to.equal(this.decimals);
    expect(await this.stakedToken.totalSupply()).to.equal(this.initialSupply);
    expect(await this.stakedToken.balanceOf(_signers[0].getAddress())).to.equal(this.initialSupply);
  });

  it("should reject ETH transfers", async function () {
    await expect(_signers[1].sendTransaction({to: this.stakedToken.address, value: 1})).to.be.reverted;
  });

  it("should transfer tokens", async function () {
    const stakedToken: StakedToken = this.stakedToken

    const recipient = await _signers[1].getAddress();

    const transferAmount = toTokenAmount(10);
    await expect(stakedToken.transfer(recipient, transferAmount))
      .to.emit(stakedToken, 'Transfer')
      .withArgs(await _signers[0].getAddress(), recipient, transferAmount);

    expect(await stakedToken.balanceOf(await _signers[0].getAddress())).to.equal(this.initialSupply.sub(transferAmount));
    expect(await stakedToken.balanceOf(recipient)).to.equal(transferAmount);
    expect(await stakedToken.totalSupply()).to.equal(this.initialSupply);
  });

   it("should mint new tokens", async function () {
    const stakedToken: StakedToken = this.stakedToken;

    const mintAmount = toTokenAmount(1);
    const recipient = await _signers[1].getAddress();
    await expect(stakedToken.mint(recipient, mintAmount))
      .to.emit(stakedToken, 'Transfer')
      .withArgs(ethers.constants.AddressZero, recipient, mintAmount);

    expect(await stakedToken.balanceOf(recipient)).to.equal(mintAmount)
  });
  // Should fail to mint by not supply controller


  it("should burn tokens", async function () {
    const stakedToken: StakedToken = this.stakedToken;

    const burnAmount = toTokenAmount(1);
    const admin = await _signers[0].getAddress();

    await expect(stakedToken.burn(burnAmount))
      .to.emit(stakedToken, 'Transfer')
      .withArgs(admin, ethers.constants.AddressZero, burnAmount);

    expect(await stakedToken.balanceOf(admin)).to.equal(this.initialSupply.sub(burnAmount));
  });

  // Should fail to burn more than in account
  // Should fail to burn by not supply controller


  it("should update supply controller", async function () {
    const stakedToken: StakedToken = this.stakedToken
  });

  it("should distribute rewards", async function () {
    const stakedToken: StakedToken = this.stakedToken

    // Set up other account
    const mintAmount = toTokenAmount(2000);
    const recipient = await _signers[1].getAddress();
    await stakedToken.mint(recipient, mintAmount);

    const supplyIncrease = toTokenAmount(10);
    await expect(stakedToken.distributeTokens(supplyIncrease))
      .to.emit(stakedToken, 'LogTokenDistribution')
      .withArgs(toTokenAmount(3010));

    expect(await stakedToken.balanceOf(await _signers[0].getAddress())).to.equal(100333333333);
    expect(await stakedToken.balanceOf(recipient)).to.equal(200666666666);
    expect(await stakedToken.totalSupply()).to.equal(toTokenAmount(3010));
  });

  it("should update supply controller", async function () {
    // const stakedToken: StakedToken = this.stakedToken
    // await stakedToken.setSupplyController(await _signers[1].getAddress()).
  });

  // max supply?
  // should set allowances
  // should call dependent contracts on reward distribution
}
