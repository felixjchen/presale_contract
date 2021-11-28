import { expect } from "chai";
import { ethers } from "hardhat";

describe("FelixToken", () => {
  it("should have an intial balance of 0", async () => {
    const FelixToken = await ethers.getContractFactory("FelixToken");
    const FOK = await FelixToken.deploy();
    await FOK.deployed();

    const [owner] = await ethers.getSigners();

    const ownerBalance = await FOK.balanceOf(owner.address);
    expect(ownerBalance).to.equal(0);
  });

  it("should allow user to mint themself tokens", async () => {
    const FelixToken = await ethers.getContractFactory("FelixToken");
    const FOK = await FelixToken.deploy();
    await FOK.deployed();

    const [owner] = await ethers.getSigners();

    expect(await FOK.balanceOf(owner.address)).to.equal(0);
    FOK.mint(ethers.utils.parseEther("10012"));
    expect(await FOK.balanceOf(owner.address)).to.equal(
      ethers.utils.parseEther("10012")
    );
  });
});
