import { ethers } from "hardhat";
import deployToken from "./deployToken";
import { root } from "./airdropmerkle";

async function deployAirdrop() {
    const airdrop = await ethers.getContractFactory("Airdrop");

    const token = await deployToken();
    const formattedRoot = "0x" + root;

    console.log("Deploying Airdrop Contract...");

    // Deploy contract
    const deployedAirdrop = await airdrop.deploy(formattedRoot, token.target);
    await deployedAirdrop.waitForDeployment();

    console.log(`🎉 Airdrop deployed at: ${deployedAirdrop.target}`);
    return deployedAirdrop;
}

// Handle errors properly
deployAirdrop()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
});

export default deployAirdrop;