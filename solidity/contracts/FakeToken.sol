// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FakeToken is ERC20 {
    constructor(string memory symbol, uint256 initialSupply) ERC20(symbol, symbol) {
        _mint(msg.sender, initialSupply);
    }
}
