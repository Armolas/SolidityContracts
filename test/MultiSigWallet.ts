import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';

describe("MultiSig Wallet", function () {
    async function deployERC20(token_name: string, token_symbol: string) {
        const ERC20 = await ethers.getContractFactory('ERC20');

        const erc20 = await ERC20.deploy(token_name, token_symbol, 18, ethers.parseEther('0'));

        await erc20.waitForDeployment();

        return erc20;
    }
    
    const deployMultiSig = async () => {

        const [owner, account1, account2, account3, account4, account5, account6] = await ethers.getSigners();

        const tokenA = await deployERC20("Test Token A", "TTA")
        const tokenB = await deployERC20("Test Token B", "TTB")

        const signers = [owner, account1, account2, account3, account4, account5];
        const quorum = 5;

        const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
        const multiSigWallet = await MultiSigWallet.deploy(quorum, signers);

        return {owner, account1, account2, account3, account4, account5, account6, multiSigWallet, tokenA, tokenB, quorum}
    }

    describe("Deployment", function () {
        it("deploys successfully with correct quorum", async () => {
            const {multiSigWallet, quorum} = await loadFixture(deployMultiSig);

            expect(await multiSigWallet.quorum()).to.equal(quorum);
        })
        it("deploys successfully with all the valid signers", async ()=>{
            const {owner, account1, account2, account3, account4, account5, multiSigWallet} = await loadFixture(deployMultiSig);

            expect(await multiSigWallet.validSigners(owner.address)).to.be.true;
            expect(await multiSigWallet.validSigners(account1.address)).to.be.true;
            expect(await multiSigWallet.validSigners(account2.address)).to.be.true;
            expect(await multiSigWallet.validSigners(account3.address)).to.be.true;
            expect(await multiSigWallet.validSigners(account4.address)).to.be.true;
            expect(await multiSigWallet.validSigners(account5.address)).to.be.true;
        })
        it("reverts if quorum is more that the valid signers", async ()=>{
            const [owner, account1, account2, account3, account4, account5] = await ethers.getSigners();

            const signers = [owner, account1, account2, account3, account4, account5];
            const quorum = 8;

            const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
            await expect(MultiSigWallet.deploy(quorum, signers)).to.be.revertedWithCustomError(MultiSigWallet, "invalidQuorum");
        })
        it("reverts if quorum is zero", async ()=>{
            const [owner, account1, account2, account3, account4, account5] = await ethers.getSigners();

            const signers = [owner, account1, account2, account3, account4, account5];
            const quorum = 0;

            const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
            await expect(MultiSigWallet.deploy(quorum, signers)).to.be.revertedWithCustomError(MultiSigWallet, "invalidQuorum");
        })
        it("reverts if address is duplicated", async ()=>{
            const [owner, account1, account2, account3, account4, account5] = await ethers.getSigners();

            const signers = [owner, account1, account1, account3, account4, account5];
            const quorum = 5;

            const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
            await expect(MultiSigWallet.deploy(quorum, signers)).to.be.revertedWithCustomError(MultiSigWallet, "duplicateSigner");
        })
        it("reverts if address is contains address zero", async ()=>{
            const [owner, account1, account2, account3, account4, account5] = await ethers.getSigners();

            const signers = [owner, account1, account2, account3, account4, account5, ethers.ZeroAddress];
            const quorum = 5;

            const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
            await expect(MultiSigWallet.deploy(quorum, signers)).to.be.revertedWithCustomError(MultiSigWallet, "addressZero");
        })
    })

    describe("Initiate Transaction", function (){
        it("reverts if not called by valid signer", async ()=>{
            const {account6, multiSigWallet, tokenA} = await loadFixture(deployMultiSig);
            const amount = ethers.parseUnits('1000', 18)

            await expect(multiSigWallet.connect(account6).initiateTransaction(tokenA.target, account6, amount)).to.be.revertedWithCustomError(multiSigWallet, 'invalidSigner')
        })
        it("reverts if token address is address zero", async ()=>{
            const {account6, multiSigWallet, tokenA} = await loadFixture(deployMultiSig);
            const amount = ethers.parseUnits('1000', 18)

            await expect(multiSigWallet.initiateTransaction(ethers.ZeroAddress, account6, amount)).to.be.revertedWithCustomError(multiSigWallet, 'addressZero')
        })
        it("reverts if recipient address is address zero", async ()=>{
            const {account6, multiSigWallet, tokenA} = await loadFixture(deployMultiSig);
            const amount = ethers.parseUnits('1000', 18)

            await expect(multiSigWallet.initiateTransaction(account6, ethers.ZeroAddress, amount)).to.be.revertedWithCustomError(multiSigWallet, 'addressZero')
        })
        it("reverts if amount is zero", async ()=>{
            const {account6, multiSigWallet, tokenA} = await loadFixture(deployMultiSig);
            const amount = ethers.parseUnits('0', 18)

            await expect(multiSigWallet.initiateTransaction(tokenA.target, account6, amount)).to.be.revertedWithCustomError(multiSigWallet, 'invalidAmount')
        })
        it("reverts if there is insufficient amount token in wallet", async ()=>{
            const {account6, multiSigWallet, tokenA} = await loadFixture(deployMultiSig);
            const amount = ethers.parseUnits('1000', 18)

            await expect(multiSigWallet.initiateTransaction(tokenA.target, account6, amount)).to.be.revertedWithCustomError(multiSigWallet, 'insufficientFunds')
        })
        it("successfully initiates a transaction", async ()=>{
            const {account6, multiSigWallet, tokenA, owner, account1} = await loadFixture(deployMultiSig);
            const amount = ethers.parseUnits('10000', 18)

            await tokenA._mint(owner, amount);

            await tokenA.transfer(multiSigWallet.target, amount);

            
            await expect(multiSigWallet.connect(account1).initiateTransaction(tokenA.target, account6, amount)).not.to.be.reverted
        })
        it("successfully initiates a transaction with all the correct values", async ()=>{
            const {account6, multiSigWallet, tokenA, owner, account1} = await loadFixture(deployMultiSig);
            const amount = ethers.parseUnits('10000', 18)

            await tokenA._mint(owner, amount);

            await tokenA.transfer(multiSigWallet.target, amount);

            await multiSigWallet.connect(account1).initiateTransaction(tokenA.target, account6, amount)
            expect(await multiSigWallet.txCount()).to.equal(1)
            expect((await multiSigWallet.transactions(1)).amount).to.be.equal(amount);
            expect((await multiSigWallet.transactions(1)).initiator).to.be.equal(account1);
            expect((await multiSigWallet.transactions(1)).approvalCount).to.be.equal(1);
            expect((await multiSigWallet.transactions(1)).tokenAddress).to.be.equal(tokenA.target);
            expect((await multiSigWallet.transactions(1)).recipient).to.be.equal(account6);
            expect((await multiSigWallet.transactions(1)).isETH).to.be.false;
            expect((await multiSigWallet.transactions(1)).status).to.be.false;
            expect(await multiSigWallet.hasSigned(1, account1.address)).to.be.true;
        })
    })

    describe("Approve Transaction", function (){
        it("reverts if the caller is not a valid signer", async ()=>{
            const {account6, multiSigWallet} = await loadFixture(deployMultiSig);

            await expect(multiSigWallet.connect(account6).approveTransaction(1)).to.be.revertedWithCustomError(multiSigWallet, 'invalidSigner')
        })
        it("reverts if the transaction does not exist", async ()=>{
            const {multiSigWallet} = await loadFixture(deployMultiSig);

            await expect(multiSigWallet.approveTransaction(1)).to.be.revertedWithCustomError(multiSigWallet, 'txDoesNotExist')
        })
        it("reverts if the signer has already signed", async ()=>{
            const {account6, multiSigWallet, tokenA, owner, account1} = await loadFixture(deployMultiSig);
            const amount = ethers.parseUnits('10000', 18)

            await tokenA._mint(owner, amount);

            await tokenA.transfer(multiSigWallet.target, amount);

            await multiSigWallet.connect(account1).initiateTransaction(tokenA.target, account6, amount)

            await multiSigWallet.approveTransaction(1);

            await expect(multiSigWallet.approveTransaction(1)).to.be.revertedWithCustomError(multiSigWallet, 'alreadySigned')
        })
        it("updates transaction approval count and update signer status on transaction", async ()=>{
            const {account6, multiSigWallet, tokenA, owner, account1} = await loadFixture(deployMultiSig);
            const amount = ethers.parseUnits('10000', 18)

            await tokenA._mint(owner, amount);

            await tokenA.transfer(multiSigWallet.target, amount);

            await multiSigWallet.connect(account1).initiateTransaction(tokenA.target, account6, amount)

            await multiSigWallet.approveTransaction(1);

            expect((await multiSigWallet.transactions(1)).approvalCount).to.equal(2);
            expect(await multiSigWallet.hasSigned(1, owner)).to.be.true;
        })
        it("reverts if the transaction is already completed", async ()=>{
            const {account6, multiSigWallet, tokenA, owner, account1, account2, account3, account4, account5} = await loadFixture(deployMultiSig);
            const amount = ethers.parseUnits('10000', 18)

            await tokenA._mint(owner, amount);

            await tokenA.transfer(multiSigWallet.target, amount);

            await multiSigWallet.connect(account1).initiateTransaction(tokenA.target, account6, amount)
            await multiSigWallet.connect(account2).approveTransaction(1);
            await multiSigWallet.connect(account3).approveTransaction(1);
            await multiSigWallet.connect(account4).approveTransaction(1);
            await multiSigWallet.connect(account5).approveTransaction(1);

            await expect(multiSigWallet.approveTransaction(1)).to.be.revertedWithCustomError(multiSigWallet, 'txCompleted')
        })
        it("reverts if the balance is low at execution", async ()=>{
            const {account6, multiSigWallet, tokenA, owner, account1, account2, account3, account4, account5} = await loadFixture(deployMultiSig);
            const amount = ethers.parseUnits('10000', 18)

            await tokenA._mint(owner, amount);

            await tokenA.transfer(multiSigWallet.target, amount);

            await multiSigWallet.connect(account1).initiateTransaction(tokenA.target, account6, amount)
            await multiSigWallet.connect(account1).initiateTransaction(tokenA.target, account6, amount)
            await multiSigWallet.connect(account2).approveTransaction(2);
            await multiSigWallet.connect(account3).approveTransaction(2);
            await multiSigWallet.connect(account4).approveTransaction(2);
            await multiSigWallet.connect(account5).approveTransaction(2);
            await multiSigWallet.connect(account2).approveTransaction(1);
            await multiSigWallet.connect(account3).approveTransaction(1);
            await multiSigWallet.connect(account4).approveTransaction(1);

            await expect(multiSigWallet.approveTransaction(1)).to.be.revertedWithCustomError(multiSigWallet, 'insufficientFunds')
        })
        it("successfully transfers money once quorum is reached", async ()=>{
            const {account6, multiSigWallet, tokenA, owner, account1, account2, account3, account4, account5} = await loadFixture(deployMultiSig);
            const amount = ethers.parseUnits('10000', 18)

            await tokenA._mint(owner, amount);

            await tokenA.transfer(multiSigWallet.target, amount);

            await multiSigWallet.connect(account1).initiateTransaction(tokenA.target, account6, amount)
            await multiSigWallet.connect(account2).approveTransaction(1);
            await multiSigWallet.connect(account3).approveTransaction(1);
            await multiSigWallet.connect(account4).approveTransaction(1);

            await expect(multiSigWallet.approveTransaction(1)).not.to.be.reverted;
            expect(await tokenA.balanceOf(account6)).equal(amount);
        })
    })
    describe("Initiate Transaction ETH", function (){
        it("reverts if not called by valid signer", async ()=>{
            const {account6, multiSigWallet} = await loadFixture(deployMultiSig);
            const amount = ethers.parseUnits('1000', 18)

            await expect(multiSigWallet.connect(account6).initiateTransactionETH(account6, amount)).to.be.revertedWithCustomError(multiSigWallet, 'invalidSigner')
        })
        it("reverts if recipient address is address zero", async ()=>{
            const {account6, multiSigWallet} = await loadFixture(deployMultiSig);
            const amount = ethers.parseUnits('1000', 18)

            await expect(multiSigWallet.initiateTransactionETH(ethers.ZeroAddress, amount)).to.be.revertedWithCustomError(multiSigWallet, 'addressZero')
        })
        it("reverts if amount is zero", async ()=>{
            const {account6, multiSigWallet} = await loadFixture(deployMultiSig);
            const amount = ethers.parseUnits('0', 18)

            await expect(multiSigWallet.initiateTransactionETH(account6, amount)).to.be.revertedWithCustomError(multiSigWallet, 'invalidAmount')
        })
        it("reverts if there is insufficient amount token in wallet", async ()=>{
            const {account6, multiSigWallet} = await loadFixture(deployMultiSig);
            const amount = ethers.parseUnits('1000', 18)

            await expect(multiSigWallet.initiateTransactionETH(account6, amount)).to.be.revertedWithCustomError(multiSigWallet, 'insufficientFunds')
        })
        it("successfully initiates a transaction", async ()=>{
            const {account6, multiSigWallet, account1} = await loadFixture(deployMultiSig);
            const amount = ethers.parseUnits('100', 18)

            await account1.sendTransaction({to: multiSigWallet, value: amount})
            
            await expect(multiSigWallet.connect(account1).initiateTransactionETH(account6, amount)).not.to.be.reverted
        })
        it("successfully initiates a transaction with all the correct values", async ()=>{
            const {account6, multiSigWallet, account1} = await loadFixture(deployMultiSig);
            const amount = ethers.parseUnits('100', 18);

            await account1.sendTransaction({to: multiSigWallet, value: amount})

            await multiSigWallet.connect(account1).initiateTransactionETH(account6, amount)
            expect(await multiSigWallet.txCount()).to.equal(1)
            expect((await multiSigWallet.transactions(1)).amount).to.be.equal(amount);
            expect((await multiSigWallet.transactions(1)).initiator).to.be.equal(account1);
            expect((await multiSigWallet.transactions(1)).approvalCount).to.be.equal(1);
            expect((await multiSigWallet.transactions(1)).tokenAddress).to.be.equal(ethers.ZeroAddress);
            expect((await multiSigWallet.transactions(1)).recipient).to.be.equal(account6);
            expect((await multiSigWallet.transactions(1)).isETH).to.be.true;
            expect((await multiSigWallet.transactions(1)).status).to.be.false;
            expect(await multiSigWallet.hasSigned(1, account1.address)).to.be.true;
        })
    })

    describe("Approve Transaction ETH", function (){
        it("reverts if the caller is not a valid signer", async ()=>{
            const {account6, multiSigWallet} = await loadFixture(deployMultiSig);

            await expect(multiSigWallet.connect(account6).approveTransactionETH(1)).to.be.revertedWithCustomError(multiSigWallet, 'invalidSigner')
        })
        it("reverts if the transaction does not exist", async ()=>{
            const {multiSigWallet} = await loadFixture(deployMultiSig);

            await expect(multiSigWallet.approveTransactionETH(1)).to.be.revertedWithCustomError(multiSigWallet, 'txDoesNotExist')
        })
        it("reverts if the signer has already signed", async ()=>{
            const {account6, multiSigWallet, tokenA, owner, account1} = await loadFixture(deployMultiSig);
            const amount = ethers.parseUnits('100', 18)

            await account1.sendTransaction({to: multiSigWallet, value: amount})

            await multiSigWallet.connect(account1).initiateTransactionETH(account6, amount)

            await multiSigWallet.approveTransactionETH(1);

            await expect(multiSigWallet.approveTransactionETH(1)).to.be.revertedWithCustomError(multiSigWallet, 'alreadySigned')
        })
        it("reverts if the transaction is not an ETH transaction", async ()=>{
            const {account6, multiSigWallet, tokenA, owner, account1} = await loadFixture(deployMultiSig);
            const amount = ethers.parseUnits('10000', 18)

            await tokenA._mint(owner, amount);

            await tokenA.transfer(multiSigWallet.target, amount);

            await multiSigWallet.connect(account1).initiateTransaction(tokenA.target, account6, amount)

            await expect(multiSigWallet.approveTransactionETH(1)).to.be.revertedWithCustomError(multiSigWallet, 'notETHTransaction')
        })
        it("updates transaction approval count and update signer status on transaction", async ()=>{
            const {account6, multiSigWallet, owner, account1} = await loadFixture(deployMultiSig);
            const amount = ethers.parseUnits('100', 18)

            await account1.sendTransaction({to: multiSigWallet, value: amount})

            await multiSigWallet.connect(account1).initiateTransactionETH(account6, amount)

            await multiSigWallet.approveTransactionETH(1);

            expect((await multiSigWallet.transactions(1)).approvalCount).to.equal(2);
            expect(await multiSigWallet.hasSigned(1, owner)).to.be.true;
        })
        it("reverts if the transaction is already completed", async ()=>{
            const {account6, multiSigWallet, tokenA, owner, account1, account2, account3, account4, account5} = await loadFixture(deployMultiSig);
            const amount = ethers.parseUnits('100', 18)

            await account1.sendTransaction({to: multiSigWallet, value: amount})

            await multiSigWallet.connect(account1).initiateTransactionETH(account6, amount)
            await multiSigWallet.connect(account2).approveTransactionETH(1);
            await multiSigWallet.connect(account3).approveTransactionETH(1);
            await multiSigWallet.connect(account4).approveTransactionETH(1);
            await multiSigWallet.connect(account5).approveTransactionETH(1);

            await expect(multiSigWallet.approveTransactionETH(1)).to.be.revertedWithCustomError(multiSigWallet, 'txCompleted')
        })
        it("reverts if the balance is low at execution", async ()=>{
            const {account6, multiSigWallet, account1, account2, account3, account4, account5} = await loadFixture(deployMultiSig);
            const amount = ethers.parseUnits('100', 18)

            await account1.sendTransaction({to: multiSigWallet, value: amount})

            await multiSigWallet.connect(account1).initiateTransactionETH(account6, amount)
            await multiSigWallet.connect(account1).initiateTransactionETH(account6, amount)
            await multiSigWallet.connect(account2).approveTransactionETH(2);
            await multiSigWallet.connect(account3).approveTransactionETH(2);
            await multiSigWallet.connect(account4).approveTransactionETH(2);
            await multiSigWallet.connect(account5).approveTransactionETH(2);
            await multiSigWallet.connect(account2).approveTransactionETH(1);
            await multiSigWallet.connect(account3).approveTransactionETH(1);
            await multiSigWallet.connect(account4).approveTransactionETH(1);

            await expect(multiSigWallet.approveTransactionETH(1)).to.be.revertedWithCustomError(multiSigWallet, 'insufficientETHFunds')
        })
        it("successfully transfers money once quorum is reached", async ()=>{
            const {account6, multiSigWallet, account1, account2, account3, account4} = await loadFixture(deployMultiSig);
            const amount = ethers.parseUnits('100', 18)

            await account1.sendTransaction({to: multiSigWallet, value: amount})

            await multiSigWallet.connect(account1).initiateTransactionETH(account6, amount)
            await multiSigWallet.connect(account2).approveTransactionETH(1);
            await multiSigWallet.connect(account3).approveTransactionETH(1);
            await multiSigWallet.connect(account4).approveTransactionETH(1);

            await expect(multiSigWallet.approveTransactionETH(1)).not.to.be.reverted;
            expect(await ethers.provider.getBalance(multiSigWallet)).to.equal(0)
        })
    })
})