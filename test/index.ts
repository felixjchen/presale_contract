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
    const [owner] = await ethers.getSigners();

    FOK.mint(ethers.utils.parseEther("24"));
    FOK.approve(presaleContract.address, ethers.utils.parseEther("24"));

    const starts = [0];
    const ends = [1];
    const prices = [ethers.utils.parseEther("2")];
    const amounts = [ethers.utils.parseEther("24")];
    const tokenAddresses = [FOK.address];
    await presaleContract.startPresale(
      starts,
      ends,
      prices,
      amounts,
      tokenAddresses
    );

    const presale = await presaleContract.getPresale(0);
    expect(presale.userAddress).to.equal(owner.address);
    expect(presale.start).to.equal(0);
    expect(presale.end).to.equal(1);
    expect(presale.alive).to.equal(true);
    expect(presale.price).to.equal(ethers.utils.parseEther("2"));
    expect(presale.amountMantissa).to.equal(ethers.utils.parseEther("24"));
    expect(presale.soldMantissa).to.equal(ethers.utils.parseEther("0"));
    expect(presale.tokenAddress).to.equal(FOK.address);
  });

  it("should let me add a few presales", async () => {
    const { presaleContract, FOK } = await deployContracts();
    const [owner] = await ethers.getSigners();

    FOK.mint(ethers.utils.parseEther("24"));
    FOK.approve(presaleContract.address, ethers.utils.parseEther("24"));

    const starts = [0, 100];
    const ends = [1, 101];
    const prices = [
      ethers.utils.parseEther("2"),
      ethers.utils.parseEther("200"),
    ];
    const amounts = [
      ethers.utils.parseEther("4"),
      ethers.utils.parseEther("20"),
    ];
    const tokenAddresses = [FOK.address, FOK.address];
    await presaleContract.startPresale(
      starts,
      ends,
      prices,
      amounts,
      tokenAddresses
    );

    const presale0 = await presaleContract.getPresale(0);
    expect(presale0.userAddress).to.equal(owner.address);
    expect(presale0.start).to.equal(0);
    expect(presale0.end).to.equal(1);
    expect(presale0.alive).to.equal(true);
    expect(presale0.price).to.equal(ethers.utils.parseEther("2"));
    expect(presale0.amountMantissa).to.equal(ethers.utils.parseEther("4"));
    expect(presale0.soldMantissa).to.equal(ethers.utils.parseEther("0"));
    expect(presale0.tokenAddress).to.equal(FOK.address);

    const presale1 = await presaleContract.getPresale(1);
    expect(presale1.userAddress).to.equal(owner.address);
    expect(presale1.start).to.equal(100);
    expect(presale1.end).to.equal(101);
    expect(presale1.alive).to.equal(true);
    expect(presale1.price).to.equal(ethers.utils.parseEther("200"));
    expect(presale1.amountMantissa).to.equal(ethers.utils.parseEther("20"));
    expect(presale1.soldMantissa).to.equal(ethers.utils.parseEther("0"));
    expect(presale1.tokenAddress).to.equal(FOK.address);
  });

  it("shouldn't let me add a presale without proper amount", async () => {
    const { presaleContract, FOK } = await deployContracts();

    const starts = [0];
    const ends = [1];
    const prices = [20];
    const amounts = [1];
    const tokenAddresses = [FOK.address];

    await expect(
      presaleContract.startPresale(
        starts,
        ends,
        prices,
        amounts,
        tokenAddresses
      )
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
  });

  it("should let me buy from a presale", async () => {
    const { presaleContract, FOK } = await deployContracts();
    const [owner] = await ethers.getSigners();
    const provider = ethers.provider;

    FOK.mint(ethers.utils.parseEther("24"));
    FOK.approve(presaleContract.address, ethers.utils.parseEther("24"));

    const starts = [0];
    const ends = [1];
    const prices = [2];
    const amounts = [ethers.utils.parseEther("24")];
    const tokenAddresses = [FOK.address];
    await presaleContract.startPresale(
      starts,
      ends,
      prices,
      amounts,
      tokenAddresses
    );

    await presaleContract.buy(0, ethers.utils.parseEther("1"), {
      value: ethers.utils.parseEther("2"),
    });

    const balanceOwner = await FOK.balanceOf(owner.address);
    const balanceContractFOK = await FOK.balanceOf(presaleContract.address);
    const balanceContractETH = await provider.getBalance(
      presaleContract.address
    );

    await expect(balanceOwner).to.equal(ethers.utils.parseEther("1"));
    await expect(balanceContractFOK).to.equal(ethers.utils.parseEther("23"));
    await expect(balanceContractETH).to.equal(ethers.utils.parseEther("2"));
  });

  it("shouldnt let me buy from a presale before start", async () => {
    const { presaleContract, FOK } = await deployContracts();

    const block = await ethers.provider.getBlockNumber();
    const { timestamp } = await ethers.provider.getBlock(block);

    FOK.mint(ethers.utils.parseEther("24"));
    FOK.approve(presaleContract.address, ethers.utils.parseEther("24"));

    const starts = [timestamp + 70000];
    const ends = [timestamp + 70001];
    const prices = [2];
    const amounts = [ethers.utils.parseEther("24")];
    const tokenAddresses = [FOK.address];
    await presaleContract.startPresale(
      starts,
      ends,
      prices,
      amounts,
      tokenAddresses
    );

    await expect(
      presaleContract.buy(0, ethers.utils.parseEther("1"), {
        value: ethers.utils.parseEther("2"),
      })
    ).to.be.revertedWith("presale not started");
  });

  it("shouldnt let me buy if there aren't enough ERC20 tokens", async () => {
    const { presaleContract, FOK } = await deployContracts();

    FOK.mint(ethers.utils.parseEther("24"));
    FOK.approve(presaleContract.address, ethers.utils.parseEther("24"));
    const starts = [0];
    const ends = [1];
    const prices = [2];
    const amounts = [ethers.utils.parseEther("24")];
    const tokenAddresses = [FOK.address];
    await presaleContract.startPresale(
      starts,
      ends,
      prices,
      amounts,
      tokenAddresses
    );

    await expect(
      presaleContract.buy(0, ethers.utils.parseEther("25"), {
        value: ethers.utils.parseEther("2"),
      })
    ).to.be.revertedWith("not enough tokens");
  });

  it("shouldnt let me buy if I don't send enough ETH", async () => {
    const { presaleContract, FOK } = await deployContracts();

    FOK.mint(ethers.utils.parseEther("24"));
    FOK.approve(presaleContract.address, ethers.utils.parseEther("24"));
    const starts = [0];
    const ends = [1];
    const prices = [2];
    const amounts = [ethers.utils.parseEther("24")];
    const tokenAddresses = [FOK.address];
    await presaleContract.startPresale(
      starts,
      ends,
      prices,
      amounts,
      tokenAddresses
    );

    await expect(
      presaleContract.buy(0, ethers.utils.parseEther("24"), {
        value: ethers.utils.parseEther("2"),
      })
    ).to.be.revertedWith("not enough ETH");
  });
});
