import { network } from "hardhat";

const { ethers } = require("hardhat");
const { expect } = require("chai");

async function main() {
  try {
    // Get signers
    const [deployer, user1, user2, user3] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // Deploy ERC20 Token
    const Token = await ethers.getContractFactory("ERC20");
    const token = await Token.deploy("TestToken", "TT", 18, ethers.parseEther("1000000")); // 1M tokens
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("Token deployed to:", tokenAddress);

    // Deploy CrowdFunding
    const CrowdFunding = await ethers.getContractFactory("CrowdFunding");
    const crowdfunding = await CrowdFunding.deploy(tokenAddress);
    await crowdfunding.waitForDeployment();
    const crowdfundingAddress = await crowdfunding.getAddress();
    console.log("CrowdFunding deployed to:", crowdfundingAddress);

    // Distribute tokens to users for testing
    const userTokenAmount = ethers.parseEther("1000");
    await token.transfer(user1.address, userTokenAmount);
    await token.transfer(user2.address, userTokenAmount);
    await token.transfer(user3.address, userTokenAmount);
    console.log("Distributed tokens to users");

    // Create a funding campaign
    const currentTime = Math.floor(Date.now() / 1000);
    const endDate = currentTime + (7 * 24 * 60 * 60); // 1 week from now
    const fundingGoal = ethers.parseEther("500");
    
    await crowdfunding.connect(user1).createAccount(
      "Project Alpha",
      "A revolutionary new project",
      fundingGoal,
      endDate
    );
    console.log("Created funding campaign");

    // Approve and donate to the campaign
    const donationAmount = ethers.parseEther("200");
    await token.connect(user2).approve(crowdfundingAddress, donationAmount);
    await crowdfunding.connect(user2).donate(0, donationAmount);
    console.log("User2 donated:", ethers.formatEther(donationAmount), "tokens");

    await token.connect(user3).approve(crowdfundingAddress, donationAmount);
    await crowdfunding.connect(user3).donate(0, donationAmount);
    console.log("User3 donated:", ethers.formatEther(donationAmount), "tokens");

    // Check campaign status
    const account = await crowdfunding.accounts(0);
    console.log("Current campaign balance:", ethers.formatEther(account.balance));
    console.log("Funding goal:", ethers.formatEther(account.fundingGoal));

    // Demonstrate both success and refund scenarios
    if (account.balance >= account.fundingGoal) {
      // Successful funding scenario
      await crowdfunding.connect(user1).Claim(0);
      console.log("Campaign successful - Organizer claimed funds");
    } else {
      // Failed funding scenario - wait for end date
       await network.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]); // Advance time past end date
       await network.provider.send("evm_mine");

      // Donors can claim refunds
      await crowdfunding.connect(user2).ClaimRefund(0);
      await crowdfunding.connect(user3).ClaimRefund(0);
      console.log("Campaign failed - Donors claimed refunds");
    }

    // Final balances
    const organizerBalance = await token.balanceOf(user1.address);
    const donor2Balance = await token.balanceOf(user2.address);
    const donor3Balance = await token.balanceOf(user3.address);

    console.log("\nFinal balances:");
    console.log("Organizer balance:", ethers.formatEther(organizerBalance));
    console.log("Donor2 balance:", ethers.formatEther(donor2Balance));
    console.log("Donor3 balance:", ethers.formatEther(donor3Balance));

  } catch (error) {
    console.error("Error in script:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });