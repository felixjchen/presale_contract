//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

struct Presale {
  uint256 start;
  uint256 end;
  // price of eth per ERC20
  uint256 price;
  uint256 amount;
  IERC20 token_address;
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
    IERC20[] memory token_addresses
  ) public {
    require(
      starts.length == ends.length &&
        starts.length == prices.length &&
        starts.length == amounts.length &&
        starts.length == token_addresses.length,
      "length mismatch"
    );

    for (uint256 i = 0; i < starts.length; i++) {
      // Get tokens first
      token_addresses[i].transferFrom(msg.sender, address(this), amounts[i]);
      // Register presale
      Presale memory p = Presale(
        starts[i],
        ends[i],
        prices[i],
        amounts[i],
        token_addresses[i]
      );
      uint256 presaleID = getNextPresaleID();
      presales[presaleID] = p;
    }
  }
}
