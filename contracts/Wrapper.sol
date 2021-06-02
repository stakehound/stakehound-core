// contracts/Wrapper.sol
// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import { StakedToken } from "./StakedToken.sol";

contract Wrapper is ERC20Upgradeable {
    using SafeMathUpgradeable for uint256;

    StakedToken token;

    function initialize(address _token, string memory name, string memory symbol) public initializer {
        __ERC20_init(name, symbol);

        token = StakedToken(token);
        _setupDecimals(token.decimals());
    }

    function balance() public view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function deposit(uint256 _amount) public {
        uint256 _before = balance();

        require(token.transferFrom(msg.sender, address(this), _amount));

        uint256 _after = balance();
        // Recompute amount in case of deflationary token
        _amount = _after.sub(_before);

        uint256 shares = 0;
        if ( totalSupply() == 0) {
            shares = _amount;
        } else {
            shares = _amount.mul(totalSupply()).div(_before);
        }

        _mint(msg.sender, shares);
    }

    function withdraw(uint256 _shares) public {
        uint256 _amountToRedeem = _shares.mul(balance()).div(totalSupply());
        _burn(msg.sender, _shares);

        token.transfer(msg.sender, _amountToRedeem);
    }
}
