// contracts/Wrapper.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.6.10;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { StakedToken } from "./StakedToken.sol";

//contract Wrapper is ERC20PausableUpgradeable, OwnableUpgradeable {
contract Wrapper is ERC20Upgradeable, OwnableUpgradeable {
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

    function initialize(address _token, string memory name_, string memory symbol_) public initializer {
        __ERC20_init(name_, symbol_);
        __Ownable_init();

        _name = name_;
        _symbol = symbol_;

        token = StakedToken(_token);
        _setupDecimals(token.decimals());
    }

    function balance() public view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function deposit(uint256 _amount) public whenNotPaused {
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
        require(!token.isBlacklisted(msg.sender), "sender blacklisted");

        return super.transferFrom(from, to, value);
    }

    function approve(address spender, uint256 value) public override returns (bool) {
        require(!token.isBlacklisted(msg.sender), "owner blacklisted");
        require(!token.isBlacklisted(spender), "spender blacklisted");

        return super.approve(spender, value);
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public override view returns (string memory) {
        return _name;
    }

    /**
     * Set the name of the token
     * @param name_ the new name of the token.
     */
    function setName(string calldata name_) external onlyOwner {
        _name = name_;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public override view returns (string memory) {
        return _symbol;
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
}
