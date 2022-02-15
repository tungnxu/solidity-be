pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockMATIC is ERC20 {
    constructor() ERC20("Mock Matic", "MATIC") public {
    }

    function mint(address account, uint256 amount) public virtual {
        _mint(account, amount);
    }
}