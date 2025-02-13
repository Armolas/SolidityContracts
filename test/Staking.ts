import {
    time,
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe ("Staking", function() {
    async function deployStaking() {
        const [owner, address1, address2, address3] = await hre.ethers.getSigners()

        const Staking = await hre.ethers.getContractFactory('Staking')

        const staking = await Staking.deploy()

        const token = await staking._token()

        return {owner, address1, address2, address3, staking, token}
    }

    describe('Deployment', function() {
        it("deployed successfully with owner as principal", async function () {
            const {owner, staking, token} = await loadFixture(deployStaking)

            console.log(token, staking.target)
            const _token = await hre.ethers.getContractAt('ERC20', token)
            console.log(_token.target)
        })
    })
    describe('Stake', function() {
        it("reverts if user tries to stake more than they have", async () => {
            const {address1, staking} = await loadFixture(deployStaking)

            await expect(staking.connect(address1).stake(100, 2)).to.be.revertedWithCustomError(staking, "insufficientBalance")
        })

        it("reverts if user tries to stake zero tokens", async () => {
            const {address1, staking} = await loadFixture(deployStaking)

            await expect(staking.connect(address1).stake(0, 2)).to.be.revertedWithCustomError(staking, "invalidAmount")
        })

        it("stakes the correct amount of tokens", async () => {
            const {address1, staking, token} = await loadFixture(deployStaking)

            const _token = await hre.ethers.getContractAt('ERC20', token)

            await _token.connect(address1)._mint(address1.address, 100)
            await _token.connect(address1).approve(staking.target, 100)
            await staking.connect(address1).stake(100, 2)

            expect((await staking.connect(address1).stakings(address1.address)).amount).to.equal(100)
            expect(await _token.balanceOf(address1.address)).to.equal(0)
        })

        it("reverts if user tries to stake twice", async () => {
            const {address1, staking, token} = await loadFixture(deployStaking)

            const _token = await hre.ethers.getContractAt('ERC20', token)

            await _token.connect(address1)._mint(address1.address, 100)
            await _token.connect(address1).approve(staking.target, 100)
            await staking.connect(address1).stake(100, 2)

            await expect(staking.connect(address1).stake(100, 2)).to.be.revertedWithCustomError(staking, "alreadyStaked")
        })
    })
});