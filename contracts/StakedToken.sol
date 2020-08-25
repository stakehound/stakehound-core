// contracts/StakedToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract StakedToken is IERC20, Ownable {
    using SafeMath for uint256;

    event LogSupplyControllerUpdated(address supplyController);
    event LogTokenDistribution(uint256 oldTotalSupply, uint256 supplyIncrease, uint256 newTotalSupply);

    address public supplyController;

    uint256 private constant MAX_UINT256 = ~uint256(0);

    // See discussion here https://github.com/ethereum/EIPs/issues/1726#issuecomment-472352728
    uint256 internal constant SHARE_MULTIPLIER = 2**128;
    // Defines the multiplier applied to shares to arrive at the underlying balance
    uint256 private _sharesPerToken;
    uint256 private _totalSupply;
    uint256 private _totalShares;

    mapping(address => uint256) private _shareBalances;
    //Denominated in tokens not shares, to align with user expectations
    mapping(address => mapping(address => uint256)) private _allowedTokens;

    string private _name;
    string private _symbol;
    uint8 private _decimals;

    struct Transaction {
        bool enabled;
        address destination;
        bytes data;
    }

    event TransactionFailed(address indexed destination, uint256 index, bytes data);

    // Stable ordering is not guaranteed.
    Transaction[] public transactions;

    modifier onlySupplyController() {
        require(msg.sender == supplyController);
        _;
    }

    modifier validRecipient(address to) {
        require(to != address(0x0));
        require(to != address(this));
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 initialSupply_
    ) public Ownable() {
        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;

        supplyController = msg.sender;

        _totalSupply = initialSupply_;
        _sharesPerToken = SHARE_MULTIPLIER;
        _totalShares = initialSupply_.mul(_sharesPerToken);
        _shareBalances[msg.sender] = _totalShares;

        emit Transfer(address(0x0), msg.sender, _totalSupply);
    }

    /**
     * Set the address that can mint, burn and rebase
     *
     * @param supplyController_ Address of the new supply controller
     */
    function setSupplyController(address supplyController_) external onlyOwner {
        supplyController = supplyController_;
        emit LogSupplyControllerUpdated(supplyController);
    }

    /**
     * Distribute a supply increase to all token holders proportionally
     *
     * @param supplyChange_ Increase of supply in token units
     * @return The updated total supply
     */
    function distributeTokens(uint256 supplyChange_) external onlySupplyController returns (uint256) {
        uint256 newTotalSupply = _totalSupply.add(supplyChange_);
        _sharesPerToken = _totalShares.div(newTotalSupply);

        // Set correct total supply in case of mismatch caused by integer division
        newTotalSupply = _totalShares.div(_sharesPerToken);

        emit LogTokenDistribution(_totalSupply, supplyChange_, newTotalSupply);

        _totalSupply = newTotalSupply;

        // Call downstream transactions
        for (uint256 i = 0; i < transactions.length; i++) {
            Transaction storage t = transactions[i];
            if (t.enabled) {
                bool result = externalCall(t.destination, t.data);
                if (!result) {
                    emit TransactionFailed(t.destination, i, t.data);
                    revert("Transaction Failed");
                }
            }
        }

        return _totalSupply;
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() external view returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() external view returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5,05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the value {ERC20} uses, unless {_setupDecimals} is
     * called.
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() external view returns (uint8) {
        return _decimals;
    }

    /**
     * @return The total supply of the underlying token
     */
    function totalSupply() external override view returns (uint256) {
        return _totalSupply;
    }

    /**
     * @return The total supply in shares
     */
    function totalShares() external view returns (uint256) {
        return _totalShares;
    }

    /**
     * @param who The address to query.
     * @return The balance of the specified address.
     */
    function balanceOf(address who) external override view returns (uint256) {
        return _shareBalances[who].div(_sharesPerToken);
    }

    /**
     * @param who The address to query.
     * @return The balance of the specified address in shares.
     */
    function sharesOf(address who) external view returns (uint256) {
        return _shareBalances[who];
    }

    /**
     * @dev Transfer tokens to a specified address.
     * @param to The address to transfer to.
     * @param value The amount to be transferred.
     * @return True on success, false otherwise.
     */
    function transfer(address to, uint256 value) external override validRecipient(to) returns (bool) {
        uint256 shareValue = value.mul(_sharesPerToken);
        _shareBalances[msg.sender] = _shareBalances[msg.sender].sub(
            shareValue,
            "ERC20: transfer amount exceed account balance"
        );
        _shareBalances[to] = _shareBalances[to].add(shareValue);
        emit Transfer(msg.sender, to, value);
        return true;
    }

    /**
     * @dev Function to check the amount of tokens that an owner has allowed to a spender.
     * @param owner_ The address which owns the funds.
     * @param spender The address which will spend the funds.
     * @return The number of tokens still available for the spender.
     */
    function allowance(address owner_, address spender) external override view returns (uint256) {
        return _allowedTokens[owner_][spender];
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
    ) external override validRecipient(to) returns (bool) {
        _allowedTokens[from][msg.sender] = _allowedTokens[from][msg.sender].sub(
            value,
            "ERC20: transfer amount exceeds allowance"
        );

        uint256 shareValue = value.mul(_sharesPerToken);
        _shareBalances[from] = _shareBalances[from].sub(shareValue, "ERC20: transfer amount exceeds account balance");
        _shareBalances[to] = _shareBalances[to].add(shareValue);
        emit Transfer(from, to, value);

        return true;
    }

    /**
     * @dev Approve the passed address to spend the specified amount of tokens on behalf of
     * msg.sender. This method is included for ERC20 compatibility.
     * increaseAllowance and decreaseAllowance should be used instead.
     * Changing an allowance with this method brings the risk that someone may transfer both
     * the old and the new allowance - if they are both greater than zero - if a transfer
     * transaction is mined before the later approve() call is mined.
     *
     * @param spender The address which will spend the funds.
     * @param value The amount of tokens to be spent.
     */
    function approve(address spender, uint256 value) external override returns (bool) {
        _allowedTokens[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    /**
     * @dev Increase the amount of tokens that an owner has allowed to a spender.
     * This method should be used instead of approve() to avoid the double approval vulnerability
     * described above.
     * @param spender The address which will spend the funds.
     * @param addedValue The amount of tokens to increase the allowance by.
     */
    function increaseAllowance(address spender, uint256 addedValue) external returns (bool) {
        _allowedTokens[msg.sender][spender] = _allowedTokens[msg.sender][spender].add(addedValue);
        emit Approval(msg.sender, spender, _allowedTokens[msg.sender][spender]);
        return true;
    }

    /**
     * @dev Decrease the amount of tokens that an owner has allowed to a spender.
     *
     * @param spender The address which will spend the funds.
     * @param subtractedValue The amount of tokens to decrease the allowance by.
     */
    function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool) {
        uint256 oldValue = _allowedTokens[msg.sender][spender];
        if (subtractedValue >= oldValue) {
            _allowedTokens[msg.sender][spender] = 0;
        } else {
            _allowedTokens[msg.sender][spender] = oldValue.sub(subtractedValue);
        }
        emit Approval(msg.sender, spender, _allowedTokens[msg.sender][spender]);
        return true;
    }

    /** Creates `amount` tokens and assigns them to `account`, increasing
     * the total supply, keeping the tokens per shares constant
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * Requirements
     *
     * - `account` cannot be the zero address.
     */
    function mint(address account, uint256 amount) external onlySupplyController {
        require(account != address(0), "ERC20: mint to the zero address");

        _totalSupply = _totalSupply.add(amount);
        uint256 shareAmount = amount.mul(_sharesPerToken);
        _totalShares = _totalShares.add(shareAmount);
        _shareBalances[account] = _shareBalances[account].add(shareAmount);
        emit Transfer(address(0), account, amount);
    }

    /**
     * Destroys `amount` tokens from `account`, reducing the
     * total supply while keeping the tokens per shares ratio constant
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     *
     * Requirements
     *
     * - `account` cannot be the zero address.
     * - `account` must have at least `amount` tokens.
     */
    function burn(uint256 amount) external onlySupplyController {
        address account = msg.sender;

        uint256 shareAmount = amount.mul(_sharesPerToken);
        _shareBalances[account] = _shareBalances[account].sub(shareAmount, "ERC20: burn amount exceeds balance");
        _totalShares = _totalShares.sub(shareAmount);
        _totalSupply = _totalSupply.sub(amount);
        emit Transfer(account, address(0), amount);
    }

    /**
     * @notice Adds a transaction that gets called for a downstream receiver of token distributions
     * @param destination Address of contract destination
     * @param data Transaction data payload
     */
    function addTransaction(address destination, bytes memory data) external onlyOwner {
        transactions.push(Transaction({ enabled: true, destination: destination, data: data }));
    }

    /**
     * @param index Index of transaction to remove.
     *              Transaction ordering may have changed since adding.
     */
    function removeTransaction(uint256 index) external onlyOwner {
        require(index < transactions.length, "index out of bounds");

        if (index < transactions.length - 1) {
            transactions[index] = transactions[transactions.length - 1];
        }

        transactions.pop();
    }

    /**
     * @param index Index of transaction. Transaction ordering may have changed since adding.
     * @param enabled True for enabled, false for disabled.
     */
    function setTransactionEnabled(uint256 index, bool enabled) external onlyOwner {
        require(index < transactions.length, "index must be in range of stored tx list");
        transactions[index].enabled = enabled;
    }

    /**
     * @return Number of transactions, both enabled and disabled, in transactions list.
     */
    function transactionsSize() external view returns (uint256) {
        return transactions.length;
    }

    /**
     * @dev wrapper to call the encoded transactions on downstream consumers.
     * @param destination Address of destination contract.
     * @param data The encoded data payload.
     * @return True on success
     */
    function externalCall(address destination, bytes memory data) internal returns (bool) {
        bool result;
        assembly {
            // solhint-disable-line no-inline-assembly
            // "Allocate" memory for output
            // (0x40 is where "free memory" pointer is stored by convention)
            let outputAddress := mload(0x40)

            // First 32 bytes are the padded length of data, so exclude that
            let dataAddress := add(data, 32)

            result := call(
                // 34710 is the value that solidity is currently emitting
                // It includes callGas (700) + callVeryLow (3, to pay for SUB)
                // + callValueTransferGas (9000) + callNewAccountGas
                // (25000, in case the destination address does not exist and needs creating)
                sub(gas(), 34710),
                destination,
                0, // transfer value in wei
                dataAddress,
                mload(data), // Size of the input, in bytes. Stored in position 0 of the array.
                outputAddress,
                0 // Output is ignored, therefore the output size is zero
            )
        }
        return result;
    }
}
