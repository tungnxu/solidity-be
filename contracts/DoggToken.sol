// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract DoggToken is ERC20, Ownable {
    using SafeMath for uint256;
    uint256 private _maxtotalSupply;
    
    mapping(address => uint256) public minters; // minter's address => minter's max cap
    mapping(address => uint256) public minters_minted;

    modifier onlyMinter() {
        require(minters[msg.sender] > 0, "Only minter can interact");
        _;
    }

    constructor(uint256 maxtotalSupply) ERC20("Dogg Token", "DOGG") public {
        _maxtotalSupply = maxtotalSupply;
    }

    function mint(address _recipient, uint256 _amount) public onlyMinter {
        minters_minted[_msgSender()] = minters_minted[_msgSender()].add(_amount);
        require(minters[_msgSender()] >= minters_minted[_msgSender()], "Minting amount exceeds minter cap");
        _mint(_recipient, _amount);
    }

    function setMinter(address _account, uint256 _minterCap) external onlyOwner {
        require(_account != address(0), "invalid address");
        require(minters_minted[_account] <= _minterCap, "Minter already minted a larger amount than new cap");
        minters[_account] = _minterCap;
    }

    function maxTotalSupply() public view returns (uint256) {
        return _maxtotalSupply;
    }

    function setMaxTotalSupply(uint256 newTotalSupply) public onlyOwner {
        _maxtotalSupply = newTotalSupply;
    }

}
