//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

struct Presale {
  uint256 start;
  uint256 end;
  bool alive;
  // price of eth per ERC20, this is a ratio
  uint256 price;
  uint256 amountMantissa;
  uint256 soldMantissa;
  IERC20 tokenAddress;
}

contract PresaleContract is Ownable {
  uint256 private feeBasisPoints;

  using Counters for Counters.Counter;
  Counters.Counter private nextPresaleID;
  mapping(uint256 => Presale) private presales;

  constructor(uint256 _feeBasisPoints) {
    feeBasisPoints = _feeBasisPoints;
  }

  function getNextPresaleID() private returns (uint256) {
    uint256 presaleID = nextPresaleID.current();
    nextPresaleID.increment();
    return presaleID;
  }

  function getPresale(uint256 presaleID) public view returns (Presale memory) {
    return presales[presaleID];
  }

  function startPresale(
    uint256[] memory starts,
    uint256[] memory ends,
    uint256[] memory prices,
    uint256[] memory amounts,
    IERC20[] memory tokenAddresses
  ) public {
    require(
      starts.length == ends.length &&
        starts.length == prices.length &&
        starts.length == amounts.length &&
        starts.length == tokenAddresses.length,
      "length mismatch"
    );

    for (uint256 i = 0; i < starts.length; i++) {
      // Get tokens first

      // TODO: What happens when this transferFrom fails on an interation?
      tokenAddresses[i].transferFrom(msg.sender, address(this), amounts[i]);

      // Register presale
      Presale memory p = Presale(
        starts[i],
        ends[i],
        true,
        prices[i],
        amounts[i],
        0,
        tokenAddresses[i]
      );
      uint256 presaleID = getNextPresaleID();
      presales[presaleID] = p;
    }
  }

  function buy(uint256 presaleID, uint256 amountMantissa) public payable {
    Presale memory p = presales[presaleID];
    require(p.alive, "presale ended");
    require(block.timestamp > p.start, "presale not started");
    uint256 availableMantissa = p.amountMantissa - p.soldMantissa;
    require(availableMantissa >= amountMantissa, "not enough tokens");
    uint256 totalPriceMantissa = amountMantissa * p.price;
    require(msg.value >= totalPriceMantissa, "not enough ETH");

    // assume we have enough ERC20 to send to client
    // assume client has enough ETH to pay
    // assume presale is alive

    // TODO: What happens if client sends too much ETH ?
    p.soldMantissa += amountMantissa;
    p.tokenAddress.transfer(msg.sender, amountMantissa);
  }
}
