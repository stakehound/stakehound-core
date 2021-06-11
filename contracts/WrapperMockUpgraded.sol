// contracts/Wrapper.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.6.10;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { StakedToken } from "./StakedToken.sol";

contract WrapperMockUpgraded is ERC20Upgradeable, OwnableUpgradeable {
    using SafeMathUpgradeable for uint256;

    StakedToken token;
    string private _name;
    string private _symbol;

    modifier validRecipient(address to) {
        require(to != address(0x0));
        require(to != address(this));
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        require(!token.paused(), "Pausable: paused");
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        require(token.paused(), "Pausable: not paused");
        _;
    }

    function initialize(address _token, string memory name, string memory symbol) public initializer {
        __ERC20_init(name, symbol);

        token = StakedToken(_token);
        _setupDecimals(token.decimals());
    }

    function balance() public view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function deposit(uint256 _amount) public whenNotPaused{
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

    function withdraw(uint256 _shares) public whenNotPaused {
        uint256 _amountToRedeem = _shares.mul(balance()).div(totalSupply());
        _burn(msg.sender, _shares);

        token.transfer(msg.sender, _amountToRedeem);
    }

    /**
     * @dev Transfer tokens to a specified address.
     * @param to The address to transfer to.
     * @param value The amount to be transferred.
     * @return True on success, false otherwise.
     */
    function transfer(address to, uint256 value) public override validRecipient(to) whenNotPaused returns (bool) {
        require(!token.isBlacklisted(msg.sender), "from blacklisted");
        require(!token.isBlacklisted(to), "to blacklisted");

        return super.transfer(to, value);
    }

    /**
     * @dev Transfer tokens from one address to another.
     * @param from The address you want to send tokens from.
     * @param to The address you want to transfer to.
     * @param value The amount of tokens to be transferred.
     */
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public override validRecipient(to) whenNotPaused returns (bool) {
        require(!token.isBlacklisted(from), "from blacklisted");
        require(!token.isBlacklisted(to), "to blacklisted");

        return super.transferFrom(from, to, value);
    }

    /**
     * Set the name of the token
     * @param name_ the new name of the token.
     */
    function setName(string calldata name_) external onlyOwner {
        _name = name_;
    }

    /**
     * Set the symbol of the token
     * @param symbol_ the new symbol of the token.
     */
    function setSymbol(string calldata symbol_) external onlyOwner {
        _symbol = symbol_;
    }

    function stakedTokenBalanceOf(address who) external view returns (uint256) {
        return balanceOf(who).mul(balance()).div(totalSupply());
    }

    function sayHi() public view returns (string memory) {
        return "hi";
    }
}
