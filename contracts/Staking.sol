// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import './ERC20.sol';

contract Staking{
    uint256 constant _MONTH_IN_SECS = 60 * 60 * 24 * 30;
    mapping(address => Stake) public stakings;
    ERC20 public _token;
    
    struct Stake{
        uint256 amount;
        uint256 stakeDate;
        uint8 stakePeriodInMonths;
        uint256 stakeWithdrawalDate;
    }

    error invalidAccount();
    error invalidAmount();
    error locked();
    error insufficientBalance();
    error noStaking();
    error alreadyStaked();

    constructor () {
        _token = new ERC20("tadhor", "tdh", 18, 10000e18);
    }

    function stake(uint256 stakeAmount, uint8 stakePeriodInMonths) external {
        if (msg.sender == address(0)) {
            revert invalidAccount();
        }

        if (stakings[msg.sender].amount != 0){
            revert alreadyStaked();
        }

        if (stakeAmount <= 0) {
            revert invalidAmount();
        }
        if (_token.balanceOf(msg.sender) < stakeAmount) {
            revert insufficientBalance();
        }

        _token.transferFrom(msg.sender, address(this), stakeAmount);
        Stake memory _stake = Stake(stakeAmount, block.timestamp, stakePeriodInMonths, block.timestamp + (stakePeriodInMonths * _MONTH_IN_SECS));
        stakings[msg.sender] = _stake;
    }

    function redeem() public {
        if (stakings[msg.sender].amount == 0){
            revert noStaking();
        }
        if (stakings[msg.sender].stakeWithdrawalDate < block.timestamp){
            revert locked();
        }
        uint256 reward = calculateReward(stakings[msg.sender]);
        _token._mint(msg.sender, reward);
        _token.transferFrom(address(this), msg.sender, stakings[msg.sender].amount);
        delete stakings[msg.sender];
    }

    function calculateReward(Stake memory _stake) public view returns(uint256){
        uint256 period = block.timestamp - _stake.stakeDate;
        uint256 monthsStaked = period / _MONTH_IN_SECS;
        uint rewardPerMonth = (_stake.amount * 5) / 100;
        uint256 reward = monthsStaked * rewardPerMonth;

        return reward;
    }
}