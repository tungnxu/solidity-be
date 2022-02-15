pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") public {
    }

    function mint(address account, uint256 amount) public virtual {
        _mint(account, amount);
    }
}