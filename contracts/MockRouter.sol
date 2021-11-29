pragma solidity ^0.8.4;

import "./MockRouterInterface.sol";
import "./MockLPToken.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockRouter is MockRouterInterface {
  MockLPToken mockLPToken;

  constructor(address LPTokenAddress) {
    mockLPToken = MockLPToken(LPTokenAddress);
  }

  function addLiquidityETH(
    address tokenAddress,
    uint256 amountTokenDesired,
    uint256 amountTokenMin,
    uint256 amountETHMin,
    address to,
    uint256 deadline
  )
    external
    payable
    override
    returns (
      uint256 amountToken,
      uint256 amountETH,
      uint256 liquidity
    )
  {
    require(amountETHMin <= msg.value, "less ETH then ETHmin");
    require(amountTokenMin <= amountTokenDesired, "less token then tokenmin");

    IERC20 token = IERC20(tokenAddress);
    token.transferFrom(msg.sender, address(this), amountTokenDesired);

    mockLPToken.mint(1000000000000000000);
    mockLPToken.transfer(to, 1000000000000000000);
    return (amountTokenDesired, msg.value, 1000000000000000000);
  }
}
