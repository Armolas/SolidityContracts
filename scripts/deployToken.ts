import { ethers } from "hardhat";

async function deployToken() {
    const erc20 = await ethers.getContractFactory("ERC20");

    console.log("Deploying Token Contract...");

    // Deploy contract
    const deployedToken = await erc20.deploy("ArmolasToken", "ARM", 18, ethers.parseEther("1000000"));
    await deployedToken.waitForDeployment();

    console.log(`🎉 Token deployed at: ${deployedToken.target}`);
    return deployedToken;
}

export default deployToken;