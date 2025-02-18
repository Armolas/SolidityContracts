// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MultiSigWallet{

    IERC20 public tokenAddress;
    struct Transaction{
        uint256 amount;
        address initiator;
        address recipient;
        bool status;
        uint8 approvalCount;
        address tokenAddress;
        mapping(address => bool) approvals;
        bool isETH;
    }

    mapping(uint => Transaction) public transactions;
    mapping(address => bool) public validSigners;

    uint256 public txCount;
    uint8 public quorum;
    bool locked;

    error invalidQuorum();
    error addressZero();
    error duplicateSigner();
    error invalidSigner();
    error insufficientFunds();
    error insufficientETHFunds();
    error invalidAmount();
    error txDoesNotExist();
    error txCompleted();
    error alreadySigned();
    error transferFailed();
    error notETHTransaction();
    error InvalidTokenAddress();
    error functionLocked();

    constructor(uint8 _quorum, address[] memory _validSigners){
        if(_quorum < 1) revert invalidQuorum();
        if(_quorum > _validSigners.length) revert invalidQuorum();
        for (uint8 x = 0; x < _validSigners.length; x++){
            if (_validSigners[x] == address(0)) revert addressZero();
            if (validSigners[_validSigners[x]]) revert duplicateSigner();
            validSigners[_validSigners[x]] = true;
        }
        quorum = _quorum;
    }

    modifier lock {
        if(locked) revert functionLocked();
        locked = true;
        _;
        locked = false;
    }

    function initiateTransaction(address _tokenAddress, address _recipient, uint256 _amount) external {
        if(!validSigners[msg.sender]) revert invalidSigner();
        if(_tokenAddress == address(0)) revert addressZero();
        if(_recipient == address(0)) revert addressZero();
        if(_amount < 1) revert invalidAmount();
        if(IERC20(_tokenAddress).balanceOf(address(this)) < _amount) revert insufficientFunds();
        //if(_tokenAddress != address(tokenAddress)) revert InvalidTokenAddress();

        uint256 _txId = txCount + 1;
        
        Transaction storage newTx = transactions[_txId];
        newTx.amount = _amount;
        newTx.approvalCount += 1;
        newTx.approvals[msg.sender] = true;
        newTx.initiator = msg.sender;
        newTx.recipient = _recipient;
        newTx.tokenAddress = _tokenAddress;

        txCount = _txId;
    }

    function approveTransaction(uint256 _txId) lock external {
        if(!validSigners[msg.sender]) revert invalidSigner();
        if(transactions[_txId].amount == 0) revert txDoesNotExist();
        if(transactions[_txId].approvals[msg.sender]) revert alreadySigned();
        if(transactions[_txId].status) revert txCompleted();
        
        transactions[_txId].approvals[msg.sender] = true;
        transactions[_txId].approvalCount += 1;

        if(transactions[_txId].approvalCount >= quorum){
            if(IERC20(transactions[_txId].tokenAddress).balanceOf(address(this)) < transactions[_txId].amount) revert insufficientFunds();

            bool success = IERC20(transactions[_txId].tokenAddress).transfer(transactions[_txId].recipient, transactions[_txId].amount);
            if(!success) revert transferFailed();
            transactions[_txId].status = true;
        }
    }

    function initiateTransactionETH(address _recipient, uint256 _amount) external {
        if(!validSigners[msg.sender]) revert invalidSigner();
        if(_recipient == address(0)) revert addressZero();
        if(_amount < 1) revert invalidAmount();
        if(address(this).balance < _amount) revert insufficientFunds();

        uint256 _txId = txCount + 1;
        
        Transaction storage newTx = transactions[_txId];
        newTx.amount = _amount;
        newTx.approvalCount += 1;
        newTx.approvals[msg.sender] = true;
        newTx.initiator = msg.sender;
        newTx.recipient = _recipient;
        newTx.isETH = true;

        txCount = _txId;
    }

    function approveTransactionETH(uint256 _txId) lock external {
        if(!validSigners[msg.sender]) revert invalidSigner();
        if(transactions[_txId].amount == 0) revert txDoesNotExist();
        if(transactions[_txId].approvals[msg.sender]) revert alreadySigned();
        if(transactions[_txId].status) revert txCompleted();
        if(!transactions[_txId].isETH) revert notETHTransaction();
        
        transactions[_txId].approvals[msg.sender] = true;
        transactions[_txId].approvalCount += 1;

        if(transactions[_txId].approvalCount >= quorum){
            if(address(this).balance < transactions[_txId].amount) revert insufficientETHFunds();

            bool success = payable(transactions[_txId].recipient).send(transactions[_txId].amount);
            if(!success) revert transferFailed();
            transactions[_txId].status = true;
        }
    }

    receive() external payable {
    }

    function getTokenBalance(address _tokenAddress) external view returns(uint256) {
        return IERC20(_tokenAddress).balanceOf(address(this));
    }

    function getETHBalance() external view returns(uint256) {
        return address(this).balance;
    }

    function hasSigned(uint256 _txId, address _validSigner) external view returns(bool){
        bool _signed = transactions[_txId].approvals[_validSigner];
        return (_signed);
    }


}