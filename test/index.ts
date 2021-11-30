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
    const MockLPTokenFactory = await ethers.getContractFactory("MockLPToken");
    const MLP = await MockLPTokenFactory.deploy();
    await MLP.deployed();

    const MockRouterFactory = await ethers.getContractFactory("MockRouter");
    const mockRouter = await MockRouterFactory.deploy(MLP.address);
    await mockRouter.deployed();

    const FelixTokenFactory = await ethers.getContractFactory("FelixToken");
    const FOK = await FelixTokenFactory.deploy();
    await FOK.deployed();

    const presaleContractFactory = await ethers.getContractFactory(
      "PresaleContract"
    );
    const presaleContract = await presaleContractFactory.deploy(
      200,
      mockRouter.address
    );
    await presaleContract.deployed();

    return { FOK, presaleContract, MLP, mockRouter };
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

    const balance = await FOK.balanceOf(owner.address);
    expect(balance).to.equal(ethers.utils.parseEther("0"));
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

    const balance = await FOK.balanceOf(owner.address);
    expect(balance).to.equal(ethers.utils.parseEther("0"));
  });

  it("should have atomic startPresale (all or nothing)", async () => {
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
      ethers.utils.parseEther("12"),
      ethers.utils.parseEther("13"),
    ];
    const tokenAddresses = [FOK.address, FOK.address];

    await expect(
      presaleContract.startPresale(
        starts,
        ends,
        prices,
        amounts,
        tokenAddresses
      )
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

    const balance = await FOK.balanceOf(owner.address);
    await expect(balance).to.equal(ethers.utils.parseEther("24"));
  });

  it("shouldn't let me add a presale without proper amount approved", async () => {
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

  it("should let anyone end presale with no sales", async () => {
    const { presaleContract, FOK, mockRouter, MLP } = await deployContracts();
    const [owner, addr1] = await ethers.getSigners();
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
    await presaleContract.connect(addr1).endPresale(0);

    const presale = await presaleContract.getPresale(0);
    expect(presale.alive).to.be.equal(false);

    expect(await MLP.balanceOf(addr1.address)).to.be.equal(0);
    expect(await FOK.balanceOf(addr1.address)).to.be.equal(0);

    expect(await MLP.balanceOf(owner.address)).to.be.equal(0);
    expect(await FOK.balanceOf(owner.address)).to.be.equal(0);

    expect(await MLP.balanceOf(presaleContract.address)).to.be.equal(0);
    expect(await FOK.balanceOf(presaleContract.address)).to.be.equal(
      ethers.utils.parseEther("24")
    );
  });

  it("should let anyone end presale with some sales", async () => {
    const { presaleContract, FOK, mockRouter, MLP } = await deployContracts();
    const [owner, addr1] = await ethers.getSigners();
    const provider = ethers.provider;

    FOK.mint(ethers.utils.parseEther("25"));
    FOK.approve(presaleContract.address, ethers.utils.parseEther("25"));

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
    await presaleContract.connect(addr1).buy(0, ethers.utils.parseEther("1"), {
      value: ethers.utils.parseEther("2"),
    });
    await presaleContract.endPresale(0);

    const presale = await presaleContract.getPresale(0);
    expect(presale.alive).to.be.equal(false);

    expect(await MLP.balanceOf(addr1.address)).to.be.equal(0);
    expect(await FOK.balanceOf(addr1.address)).to.be.equal(
      ethers.utils.parseEther("1")
    );

    expect(
      await MLP.balanceOf(owner.address),
      "owner should have some LP"
    ).to.be.equal(0);
    expect(await FOK.balanceOf(owner.address)).to.be.equal(0);

    expect(await MLP.balanceOf(presaleContract.address)).to.be.equal(
      ethers.utils.parseEther("1")
    );
    expect(await FOK.balanceOf(presaleContract.address)).to.be.equal(
      ethers.utils.parseEther("23")
    );
    expect(await provider.getBalance(presaleContract.address)).to.be.equal(0);

    expect(await MLP.balanceOf(mockRouter.address)).to.be.equal(0);
    expect(await FOK.balanceOf(mockRouter.address)).to.be.equal(
      ethers.utils.parseEther("1")
    );
    expect(await provider.getBalance(mockRouter.address)).to.be.equal(
      ethers.utils.parseEther("1.96")
    );
  });

  it("should not let anyone end presale twice", async () => {
    const { presaleContract, FOK, mockRouter, MLP } = await deployContracts();
    const [owner, addr1] = await ethers.getSigners();
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
    await presaleContract.connect(addr1).endPresale(0);

    await expect(
      presaleContract.connect(addr1).endPresale(0)
    ).to.be.revertedWith("presale not alive");
  });

  it("should not let anyone end presale before end ", async () => {
    const { presaleContract, FOK, mockRouter, MLP } = await deployContracts();
    const [owner, addr1] = await ethers.getSigners();
    const provider = ethers.provider;

    const block = await ethers.provider.getBlockNumber();
    const { timestamp } = await ethers.provider.getBlock(block);

    FOK.mint(ethers.utils.parseEther("24"));
    FOK.approve(presaleContract.address, ethers.utils.parseEther("24"));

    const starts = [0];
    const ends = [timestamp + 3600];
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
      presaleContract.connect(addr1).endPresale(0)
    ).to.be.revertedWith("presale not ended");
  });

  it("should not let anyone buy from an ended presale", async () => {
    const { presaleContract, FOK, mockRouter, MLP } = await deployContracts();
    const [owner, addr1] = await ethers.getSigners();
    const provider = ethers.provider;

    const block = await ethers.provider.getBlockNumber();
    const { timestamp } = await ethers.provider.getBlock(block);

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
    await presaleContract.connect(addr1).endPresale(0);

    await expect(
      presaleContract.connect(addr1).buy(0, ethers.utils.parseEther("1"), {
        value: ethers.utils.parseEther("2"),
      })
    ).to.be.revertedWith("presale ended");
  });

  it("should let presale owner withdraw from ended presale", async () => {
    const { presaleContract, FOK, mockRouter, MLP } = await deployContracts();
    const [owner, addr1, addr2] = await ethers.getSigners();
    const provider = ethers.provider;

    FOK.connect(addr1).mint(ethers.utils.parseEther("24"));
    FOK.connect(addr1).approve(
      presaleContract.address,
      ethers.utils.parseEther("24")
    );

    const starts = [0];
    const ends = [1];
    const prices = [2];
    const amounts = [ethers.utils.parseEther("24")];
    const tokenAddresses = [FOK.address];
    await presaleContract
      .connect(addr1)
      .startPresale(starts, ends, prices, amounts, tokenAddresses);
    await presaleContract.connect(addr2).endPresale(0);
    await presaleContract.connect(addr1).withdraw(0);

    expect(await FOK.balanceOf(addr1.address)).to.be.equal(
      ethers.utils.parseEther("24")
    );
    expect(await FOK.balanceOf(presaleContract.address)).to.be.equal(
      ethers.utils.parseEther("0")
    );
  });

  it("should not let anyone withdraw from ended presale", async () => {
    const { presaleContract, FOK, mockRouter, MLP } = await deployContracts();
    const [owner, addr1, addr2] = await ethers.getSigners();
    const provider = ethers.provider;
    FOK.connect(addr1).mint(ethers.utils.parseEther("24"));
    FOK.connect(addr1).approve(
      presaleContract.address,
      ethers.utils.parseEther("24")
    );

    const starts = [0];
    const ends = [1];
    const prices = [2];
    const amounts = [ethers.utils.parseEther("24")];
    const tokenAddresses = [FOK.address];
    await presaleContract
      .connect(addr1)
      .startPresale(starts, ends, prices, amounts, tokenAddresses);
    await presaleContract.connect(addr2).endPresale(0);
    await expect(
      presaleContract.connect(addr2).withdraw(0)
    ).to.reverted.revertedWith("not presale owner");
  });

  it("should not let anyone withdraw from alive presale", async () => {
    const { presaleContract, FOK, mockRouter, MLP } = await deployContracts();
    const [owner, addr1, addr2] = await ethers.getSigners();
    const provider = ethers.provider;

    FOK.connect(addr1).mint(ethers.utils.parseEther("24"));
    FOK.connect(addr1).approve(
      presaleContract.address,
      ethers.utils.parseEther("24")
    );

    const starts = [0];
    const ends = [1];
    const prices = [2];
    const amounts = [ethers.utils.parseEther("24")];
    const tokenAddresses = [FOK.address];
    await presaleContract
      .connect(addr1)
      .startPresale(starts, ends, prices, amounts, tokenAddresses);
    await expect(
      presaleContract.connect(addr1).withdraw(0)
    ).to.reverted.revertedWith("presale alive");
  });

  it("should let owner adjust fee", async () => {
    const { presaleContract, FOK, mockRouter, MLP } = await deployContracts();
    const [owner, addr1] = await ethers.getSigners();
    const provider = ethers.provider;

    FOK.mint(ethers.utils.parseEther("25"));
    FOK.approve(presaleContract.address, ethers.utils.parseEther("25"));

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
    await presaleContract.changeFee(300);
    await presaleContract.connect(addr1).buy(0, ethers.utils.parseEther("1"), {
      value: ethers.utils.parseEther("2"),
    });
    await presaleContract.endPresale(0);

    const presale = await presaleContract.getPresale(0);
    expect(presale.alive).to.be.equal(false);

    expect(await MLP.balanceOf(addr1.address)).to.be.equal(0);
    expect(await FOK.balanceOf(addr1.address)).to.be.equal(
      ethers.utils.parseEther("1")
    );

    expect(
      await MLP.balanceOf(owner.address),
      "owner should have some LP"
    ).to.be.equal(0);
    expect(await FOK.balanceOf(owner.address)).to.be.equal(0);

    expect(await MLP.balanceOf(presaleContract.address)).to.be.equal(
      ethers.utils.parseEther("1")
    );
    expect(await FOK.balanceOf(presaleContract.address)).to.be.equal(
      ethers.utils.parseEther("23")
    );
    expect(await provider.getBalance(presaleContract.address)).to.be.equal(0);

    expect(await MLP.balanceOf(mockRouter.address)).to.be.equal(0);
    expect(await FOK.balanceOf(mockRouter.address)).to.be.equal(
      ethers.utils.parseEther("1")
    );
    expect(await provider.getBalance(mockRouter.address)).to.be.equal(
      ethers.utils.parseEther("1.94")
    );
  });

  it("should not let anyone adjust fee", async () => {
    const { presaleContract, FOK, mockRouter, MLP } = await deployContracts();
    const [owner, addr1] = await ethers.getSigners();

    FOK.mint(ethers.utils.parseEther("25"));
    FOK.approve(presaleContract.address, ethers.utils.parseEther("25"));

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
      presaleContract.connect(addr1).changeFee(300)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });
});
