// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract ERC20{
    string public token_name;
    string public token_symbol;
    uint8 public token_decimals;
    uint256 public token_totalSupply;
    mapping(address => uint256) public token_balanceOf;
    mapping(address => mapping(address => uint256)) public token_allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);

    constructor(string memory _name, string memory _symbol, uint8 _decimals, uint256 _totalSupply){
        token_name = _name;
        token_symbol = _symbol;
        token_decimals = _decimals;
        token_totalSupply = _totalSupply;
        token_balanceOf[msg.sender] = _totalSupply;
    }

    function name() public view returns(string memory){
        return token_name;
    }

    function symbol() public view returns(string memory){
        return token_symbol;
    }

    function decimals() public view returns(uint8){
        return token_decimals;
    }

    function totalSupply() public view returns(uint256){
        return token_totalSupply;
    }

    function balanceOf(address _owner) public view returns(uint256){
        return token_balanceOf[_owner];
    }

    function allowance(address _owner, address _spender) public view returns(uint256 remaining) {
        return token_allowance[_owner][_spender];
    }

    function transfer(address to, uint256 value) public returns(bool){
        require(token_balanceOf[msg.sender] >= value, 'Insufficient balance');
        token_balanceOf[msg.sender] -= value;
        token_balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns(bool success) {
        require(_value <= token_balanceOf[_from], 'Insufficient balance');
        require(_value <= token_allowance[_from][msg.sender], 'Insufficient allowance');
        token_balanceOf[_from] -= _value;
        token_balanceOf[_to] += _value;
        token_allowance[_from][msg.sender] -= _value;
        emit Transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns(bool success) {
        token_allowance[msg.sender][_spender] += _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function _mint(address _to, uint256 amount) external {
        require(_to != address(0), "Invalid address");
        token_totalSupply += amount;
        token_balanceOf[_to] += amount;
    }

}