import {
    time,
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe('SmartSaving', function (){
    async function deploySmartSaving() {
        const [owner, address1, address2, address3] = await hre.ethers.getSigners()

        const SmartSaving = await hre.ethers.getContractFactory('SmartSaving')

        const smartSaving = await SmartSaving.deploy()

        return {owner, address1, address2, address3, smartSaving}
    }

    describe('Deployment', function() {
        it("deployed successfully with owner as principal", async function () {
            const {owner, smartSaving} = await loadFixture(deploySmartSaving)

            expect(owner.address).to.equal(await smartSaving.owner())
        })
    })

    describe('CreateAccount', function() {
        it("reverts if user already has an account in that name", async () => {
            const {address1, smartSaving} = await loadFixture(deploySmartSaving)

            await smartSaving.connect(address1).createAccount('Wedding', 2)
            await expect(smartSaving.connect(address1).createAccount('Wedding', 2)).to.be.revertedWith("You already have an account in this name")
        })

        it("creates new user account successfuly with correct name", async () => {
            const {address1, smartSaving} = await loadFixture(deploySmartSaving)

            await smartSaving.connect(address1).createAccount('Wedding', 2)
            expect((await smartSaving.connect(address1).accounts(address1.address, 'Wedding')).name).to.equal('Wedding')
        })

        it("sets the correct withdrawal time", async () => {          
            const {address1, smartSaving} = await loadFixture(deploySmartSaving)

            await smartSaving.connect(address1).createAccount('Wedding', 2)
            expect((await smartSaving.connect(address1).accounts(address1.address, 'Wedding'))
            .withdrawalTime).to.equal((await time.latest()) + (2 * 365 * 24 * 60 * 60))
        })

        it("reverts when called by address zero", async () => {
            const {smartSaving, owner} = await loadFixture(deploySmartSaving)

            const addressZero = await hre.ethers.getImpersonatedSigner(hre.ethers.ZeroAddress)

            await owner.sendTransaction(
                {
                    to: addressZero.address,
                    value: hre.ethers.parseEther('1')
                }
            )

            await expect(smartSaving.connect(addressZero).createAccount('Wedding', 2)).to
            .be.revertedWith('Invalid address')
        })

        it("sets the correct balance", async () => {
            const {address1, smartSaving} = await loadFixture(deploySmartSaving)

            await smartSaving.connect(address1).createAccount('Wedding', 2)
            expect((await smartSaving.connect(address1).accounts(address1.address, 'Wedding')).balance).to.equal(0)
        })

        it("emits AccountCreated event", async () => {
            const {address1, smartSaving} = await loadFixture(deploySmartSaving)

            await expect(smartSaving.connect(address1).createAccount('Wedding', 2)).to
            .emit(smartSaving, 'AccountCreated').withArgs(address1.address, 'Wedding')
        })
    })

    describe('Deposit', function() {
        it("reverts if user does not have an account in that name", async () => {
            const {address1, smartSaving} = await loadFixture(deploySmartSaving)

            const amount = hre.ethers.parseEther('1')

            await expect(smartSaving.connect(address1).depositToAccount('Wedding', amount, {value: hre.ethers.parseEther('1')})).to
            .be.revertedWithCustomError(smartSaving, 'Unauthorized')
        })

    //     it("reverts if value is zero", async () => {
    //         const {address1, smartSaving} = await loadFixture(deploySmartSaving)

    //         await smartSaving.connect(address1).createAccount('Wedding', 2)
    //         await expect(smartSaving.connect(address1).deposit('Wedding', {value: 0})).to
    //         .be.revertedWith("Value must be greater than zero")
    //     })

    //     it("reverts if called by address zero", async () => {
    //         const {address1, smartSaving} = await loadFixture(deploySmartSaving)

    //         await smartSaving.connect(address1).createAccount('Wedding', 2)

    //         const addressZero = await hre.ethers.getImpersonatedSigner(hre.ethers.ZeroAddress)

    //         await expect(smartSaving.connect(addressZero).deposit('Wedding', {value: hre.ethers.parseEther('1')})).to
    //         .be.revertedWith('Invalid address')
    //     })

    //     it("increases the balance of the account", async () => {
    //         const {address1, smartSaving} = await loadFixture(deploySmartSaving)

    //         await smartSaving.connect(address1).createAccount('Wedding', 2)
    //         await smartSaving.connect(address1).deposit('Wedding', {value: hre.ethers.parseEther('1')})

    //         expect((await smartSaving.connect(address1).accounts(address1.address, 'Wedding')).balance).to.equal(hre.ethers.parseEther('1'))
    //     })

    //     it("emits Deposit event", async () => {
    //         const {address1, smartSaving} = await loadFixture(deploySmartSaving)

    //         await smartSaving.connect(address1).createAccount('Wedding', 2)

    //         await expect(smartSaving.connect(address1).deposit('Wedding', {value: hre.ethers.parseEther('1')})).to
    //         .emit(smartSaving, 'Deposit').withArgs(address1.address, 'Wedding', h
    // 
    })

    
})