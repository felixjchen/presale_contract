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

describe("PresaleContract", () => {
  const deployContracts = async () => {
    const presaleContractFactory = await ethers.getContractFactory(
      "PresaleContract"
    );
    const presaleContract = await presaleContractFactory.deploy(2);
    await presaleContract.deployed();

    const FelixToken = await ethers.getContractFactory("FelixToken");
    const FOK = await FelixToken.deploy();
    await FOK.deployed();

    return { FOK, presaleContract };
  };

  it("should let me add a presale", async () => {
    const { presaleContract, FOK } = await deployContracts();

    const starts = [0];
    const ends = [1];
    const prices = [20];
    const amounts = [0];
    const tokenAddresses = [FOK.address];

    await presaleContract.startPresale(
      starts,
      ends,
      prices,
      amounts,
      tokenAddresses
    );

    const presale = await presaleContract.getPresale(0);

    console.log(presale);
    console.log(presale.start);
  });
});
