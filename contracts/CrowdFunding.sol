// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.28;
import './ERC20.sol';

contract CrowdFunding {
    uint256 public totalAccounts;
    mapping(uint256 => Account) public accounts;
    mapping(address => mapping(string => bool)) private activeFundings;
    ERC20 public token;

    struct Account{
        string name;
        string description;
        uint256 balance;
        uint256 fundingGoal;
        uint256 timeCreated;
        uint256 endDate;
        address organizer;
        mapping(address => uint256) donations;
        bool active;
    }

    error Unauthorized();
    error invalidAccount(); 
    error invalidDate();
    error invalidInput();
    error duplicateFunding();
    error fundingDoesNotExist();
    error goalReached();
    error fundingEnded();
    error insufficientBalance();
    error transferFailed();
    error fundingFailed();
    error noDonation();
    error fundingOngoing();
    error fundingPassed();

    event AccountCreated(uint indexed id, string indexed _name);
    event Funded(uint indexed id, address indexed addr, uint256 amount);
    event Withdrawal(uint indexed id, address indexed addr, uint256 amount);
    event Refunded(uint256 indexed id, address _addr, uint amount);


    constructor(address tokenAddress) {
        token = ERC20(tokenAddress);
    }

    function createAccount(string memory _name, string memory _desc, uint256 goal, uint256 endDate) public {
        if (bytes(_name).length == 0 || bytes(_desc).length == 0 || goal < 1) revert invalidInput();
        if (msg.sender == address(0)) revert invalidAccount();
        if (endDate <= block.timestamp) revert invalidDate();
        if (activeFundings[msg.sender][_name]) revert duplicateFunding();

        uint256 id = totalAccounts;
        accounts[id].name = _name;
        accounts[id].description = _desc;
        accounts[id].fundingGoal = goal;
        accounts[id].endDate = endDate;
        accounts[id].timeCreated = block.timestamp;
        accounts[id].organizer = msg.sender;
        accounts[id].active = true;
        totalAccounts += 1;

        activeFundings[msg.sender][_name] = true;

        emit AccountCreated(id, _name);
    }

    function donate(uint256 id, uint256 amount) public{
        if (accounts[id].timeCreated == 0) revert fundingDoesNotExist();
        if (accounts[id].balance >= accounts[id].fundingGoal) revert goalReached();
        if (block.timestamp > accounts[id].endDate) revert fundingEnded();
        if (token.balanceOf(msg.sender) < amount) revert insufficientBalance();

        bool success = token.transferFrom(msg.sender, address(this), amount);
        if(!success) revert transferFailed();
        accounts[id].balance += amount;
        accounts[id].donations[msg.sender] += amount;

        emit Funded(id, msg.sender, amount);
    }

    function Claim(uint256 id) public {
        if (accounts[id].organizer != msg.sender) revert Unauthorized();
        if (!activeFundings[msg.sender][accounts[id].name]) revert fundingEnded();
        if (accounts[id].balance < accounts[id].fundingGoal && accounts[id].endDate > block.timestamp) revert fundingFailed();
        if (accounts[id].balance < accounts[id].fundingGoal) revert fundingFailed();

        uint256 balance = accounts[id].balance;

        bool success = token.transfer(msg.sender, balance);
        if(!success) revert transferFailed();

        accounts[id].balance = 0;
        accounts[id].active = false;
        activeFundings[msg.sender][accounts[id].name] = false;
        emit Withdrawal(id, msg.sender, balance);
    }

    function ClaimRefund(uint256 id) public {
        if (!accounts[id].active) revert fundingEnded();
        if (accounts[id].endDate > block.timestamp) revert fundingOngoing();
        if (accounts[id].balance >= accounts[id].fundingGoal) revert fundingPassed();

        uint256 donorBalance = accounts[id].donations[msg.sender];
        if (donorBalance == 0) revert noDonation();

        token.transfer(msg.sender, donorBalance);
        accounts[id].donations[msg.sender] = 0;
        accounts[id].balance -= donorBalance;

        emit Refunded(id, msg.sender, donorBalance);
    }

}