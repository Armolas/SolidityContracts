// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface IERC20{
    function approve(address _spender, uint _value) external;
    function balanceOf(address who) external view returns(uint256 balance);
    function transferFrom(address _from, address _to, uint256 _value) external returns(bool success);
    function transfer(address to, uint256 value) external returns(bool);

}