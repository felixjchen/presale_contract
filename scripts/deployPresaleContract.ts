// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const presaleContractFactory = await ethers.getContractFactory(
    "PresaleContract"
  );
  const presaleContract = await presaleContractFactory.deploy(
    200,
    // real ropsten uniswap address
    "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
  );
  await presaleContract.deployed();

  console.log("presaleContract deployed to:", presaleContract.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
