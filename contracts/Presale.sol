//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

struct presale {
  uint256 start;
  uint256 end;
  // price of eth per ERC20
  uint256 price;
  uint256 amount;
  uint256 token_address;
}

contract Presale is Ownable {
  uint256 feeBasisPoints;
  Counters.Counter nextPresaleID;

  constructor(uint256 _feeBasisPoints) {
    feeBasisPoints = _feeBasisPoints;
  }

  function startPresale(
    uint256[] memory starts,
    uint256[] memory ends,
    uint256[] memory prices,
    uint256[] memory amounts,
    uint256[] memory token_addresses
  ) public {}
}
