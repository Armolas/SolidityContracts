// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.28;

contract SmartSaving {
    uint256 private constant ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    address public owner;
    uint256 public totalAccounts;
    mapping(address => mapping(string => Account)) public accounts;

    struct Account{
        string name;
        uint256 balance;
        uint256 lockPeriodInYears;
        uint256 timeCreated;
        uint256 withdrawalTime;
    }

    error Unauthorized();   

    event AccountCreated(address indexed _addr, string indexed _name);
    event Deposit(address indexed _addr, string indexed _name, uint256 amount);
    event Withdrawal(address indexed _addr, string indexed _name, uint256 amount);


    constructor() {
        owner = msg.sender;
    }

    function createAccount(string memory _name, uint256 _lockPeriodInYears) public {
        require(msg.sender != address(0), 'Invalid address');
        require(_lockPeriodInYears > 0, 'Lock period must be greater than 0');
        require(accounts[msg.sender][_name].timeCreated == 0, 'You already have an account in this name');
        uint256 lockPeriodInSeconds = _lockPeriodInYears * ONE_YEAR_IN_SECS;
        Account memory newAccount = Account(_name, 0, _lockPeriodInYears, block.timestamp, (block.timestamp + lockPeriodInSeconds));
        accounts[msg.sender][_name] = newAccount;
        emit AccountCreated(msg.sender, _name);
    }

    function depositToAccount(string memory _name, uint256 amount) public payable {
        require(accounts[msg.sender][_name].timeCreated != 0, Unauthorized());
        require(accounts[msg.sender][_name].withdrawalTime > block.timestamp, "This savings is already opened!");
        require(msg.sender.balance >= amount, "You don't have enough ETH to save!");
        require(msg.value == amount, "Please send correct amount");
        accounts[msg.sender][_name].balance += msg.value;
        totalAccounts++;
        emit Deposit(msg.sender, _name, amount);
    }

    function withdrawFromAccount(string memory _name) public {
        require(accounts[msg.sender][_name].timeCreated != 0, "You don't have an account in this name");
        require(accounts[msg.sender][_name].withdrawalTime <= block.timestamp, "This savings is still locked!");
        uint256 balance = accounts[msg.sender][_name].balance;
        payable(msg.sender).transfer(balance);
        accounts[msg.sender][_name].balance = 0;
        emit Withdrawal(msg.sender, _name, balance);
    }


}