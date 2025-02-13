import { ethers } from 'hardhat';
import { time, loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';

const TWO_WEEKS = 2 * 7 * 24 * 60 * 60;

describe('CrowdFunding', function () {
    async function deployERC20() {
        const ERC20 = await ethers.getContractFactory('ERC20');

        const erc20 = await ERC20.deploy('ArmolasToken', 'ARM', 18, ethers.parseEther('0'));

        await erc20.waitForDeployment();

        return erc20;
    }

    async function deployCrowdFunding() {
        const [owner, address1, address2, address3] = await ethers.getSigners();

        const token = await deployERC20();

        const CrowdFunding = await ethers.getContractFactory('CrowdFunding');
        const crowdFunding = await CrowdFunding.deploy(token.target);

        const args = {
            name: 'Buy Tesla',
            description: "Help me reach my goal of getting 100k for a tesla in 2 weeks",
            goal: ethers.parseEther('100000'),
            endDate: (await time.latest()) + TWO_WEEKS
        }

        return { owner, address1, address2, address3, crowdFunding, token, args };
    }
    describe('Deployment', function () {
        it('deployed successfully with correct token address', async function () {
            const { crowdFunding, token } = await loadFixture(deployCrowdFunding);

            expect(await crowdFunding.token()).to.equal(token.target);
        });
    });

    describe('Create Funding Account', function () {
        it('reverts if user already has an account in that name', async () => {
            const {  args, address1, crowdFunding } = await loadFixture(deployCrowdFunding);

            await crowdFunding.connect(address1).createAccount(args.name, args.description, args.goal, args.endDate);
            await expect(crowdFunding.connect(address1).createAccount(args.name, args.description, args.goal, args.endDate)).to.be.revertedWithCustomError(crowdFunding, 'duplicateFunding')
        });

        it("reverts if name is empty", async () => {
            const {  args, address1, crowdFunding } = await loadFixture(deployCrowdFunding);

            await expect(crowdFunding.connect(address1).createAccount("", args.description, args.goal, args.endDate)).to.be.revertedWithCustomError(crowdFunding, "invalidInput");
        })

        it("reverts if description is empty", async () => {
            const {  args, address1, crowdFunding } = await loadFixture(deployCrowdFunding);

            await expect(crowdFunding.connect(address1).createAccount(args.name, '', args.goal, args.endDate)).to.be.revertedWithCustomError(crowdFunding, "invalidInput");
        })

        it("reverts if goal is zero", async () => {
            const {  args, address1, crowdFunding } = await loadFixture(deployCrowdFunding);

            await expect(crowdFunding.connect(address1).createAccount(args.name, args.description, 0, args.endDate)).to.be.revertedWithCustomError(crowdFunding, "invalidInput");
        })

        it("reverts if endDate is invalid", async () => {
            const {  args, address1, crowdFunding } = await loadFixture(deployCrowdFunding);

            await expect(crowdFunding.connect(address1).createAccount(args.name, args.description, args.goal, args.endDate - TWO_WEEKS - 1)).to.be.revertedWithCustomError(crowdFunding, "invalidDate");
        })

        it('Successfully creates account with correct goal', async () => {
            const {  args, address1, crowdFunding } = await loadFixture(deployCrowdFunding);

            await crowdFunding.connect(address1).createAccount(args.name, args.description, args.goal, args.endDate);
            expect((await crowdFunding.accounts(0)).fundingGoal).to.equal(args.goal);
        })
    });

    describe('Donate', function (){
        it("reverts if funding account does not exist", async () => {
            const { address1, crowdFunding } = await loadFixture(deployCrowdFunding);

            await expect(crowdFunding.connect(address1).donate(1, ethers.parseEther('400'))).to.be.revertedWithCustomError(crowdFunding, 'fundingDoesNotExist');
        })

        it("reverts if funding has ended", async () => {
            const {args, address1, crowdFunding} = await loadFixture(deployCrowdFunding);

            await crowdFunding.connect(address1).createAccount(args.name, args.description, args.goal, args.endDate);

            await time.increase(TWO_WEEKS);
        
            await expect(crowdFunding.connect(address1).donate(0, ethers.parseEther('400'))).to.be.revertedWithCustomError(crowdFunding, 'fundingEnded');
        })

        it('reverts if donor does not have sufficient balance to donate', async () => {
            const {args, address1, crowdFunding} = await loadFixture(deployCrowdFunding);

            await crowdFunding.connect(address1).createAccount(args.name, args.description, args.goal, args.endDate);
        
            await expect(crowdFunding.connect(address1).donate(0, ethers.parseEther('400'))).to.be.revertedWithCustomError(crowdFunding, 'insufficientBalance');
        })

        it('reverts if funding goal is reached', async () => {
            const {args, address1, crowdFunding, token} = await loadFixture(deployCrowdFunding);

            await crowdFunding.connect(address1).createAccount(args.name, args.description, args.goal, args.endDate);

            await token._mint(address1.address, ethers.parseEther('100000'));

            await token.connect(address1).approve(crowdFunding.target, ethers.parseEther('100000'));

            await crowdFunding.connect(address1).donate(0, ethers.parseEther('100000'));
        
            await expect(crowdFunding.connect(address1).donate(0, ethers.parseEther('10000'))).to.be.revertedWithCustomError(crowdFunding, 'goalReached');
        })

        it('Successfully donates and update donations', async () => {
            const {args, address1, crowdFunding, token} = await loadFixture(deployCrowdFunding);

            await crowdFunding.connect(address1).createAccount(args.name, args.description, args.goal, args.endDate);

            await token._mint(address1.address, ethers.parseEther('100000'));

            await token.connect(address1).approve(crowdFunding.target, ethers.parseEther('100000'));

            await crowdFunding.connect(address1).donate(0, ethers.parseEther('100000'));

            expect((await crowdFunding.accounts(0)).balance).to.equal(ethers.parseEther('100000'))
        })
    })

    describe('Claim', function(){
        it("reverts if non organizer tries to withdraw", async () => {
            const {args, address1, crowdFunding, token} = await loadFixture(deployCrowdFunding);

            await crowdFunding.connect(address1).createAccount(args.name, args.description, args.goal, args.endDate);

            await token._mint(address1.address, ethers.parseEther('100000'));

            await token.connect(address1).approve(crowdFunding.target, ethers.parseEther('100000'));

            await crowdFunding.connect(address1).donate(0, ethers.parseEther('100000'));

            await expect(crowdFunding.Claim(0)).to.be.revertedWithCustomError(crowdFunding, 'Unauthorized')
        })
        it("reverts if the organizer try to withdraw unachieved goal", async ()=> {
            const {args, address1, crowdFunding, token} = await loadFixture(deployCrowdFunding);

            await crowdFunding.createAccount(args.name, args.description, args.goal, args.endDate);

            await token._mint(address1.address, ethers.parseEther('100000'));

            await token.connect(address1).approve(crowdFunding.target, ethers.parseEther('100000'));

            await crowdFunding.connect(address1).donate(0, ethers.parseEther('1000'));

            await time.increase(TWO_WEEKS + 3);

            await expect(crowdFunding.Claim(0)).to.be.revertedWithCustomError(crowdFunding, 'fundingFailed');
        })

        it('reverts if the funding has ended', async () => {
            const {args, address1, crowdFunding, token} = await loadFixture(deployCrowdFunding);

            await crowdFunding.connect(address1).createAccount(args.name, args.description, args.goal, args.endDate);

            await token._mint(address1.address, ethers.parseEther('100000'));

            await token.connect(address1).approve(crowdFunding.target, ethers.parseEther('100000'));

            await crowdFunding.connect(address1).donate(0, ethers.parseEther('100000'));

            await time.increase(TWO_WEEKS);

            await crowdFunding.connect(address1).Claim(0)

            await expect(crowdFunding.connect(address1).Claim(0)).to.be.revertedWithCustomError(crowdFunding, 'fundingEnded');
        })
    })

    describe('Claim Refund', function () {
        it("reverts if funding was successful", async () => {
            const {args, address1, crowdFunding, token} = await loadFixture(deployCrowdFunding);

            await crowdFunding.createAccount(args.name, args.description, args.goal, args.endDate);

            await token._mint(address1.address, ethers.parseEther('100000'));

            await token.connect(address1).approve(crowdFunding.target, ethers.parseEther('100000'));

            await crowdFunding.connect(address1).donate(0, ethers.parseEther('100000'));

            await time.increase(TWO_WEEKS+2);

            await crowdFunding.Claim(0)

            await expect(crowdFunding.connect(address1).ClaimRefund(0)).to.be.revertedWithCustomError(crowdFunding, 'fundingEnded');
        })
        it('successfully claims donation if funding failed', async () => {
            const {args, address1, crowdFunding, token} = await loadFixture(deployCrowdFunding);

            await crowdFunding.createAccount(args.name, args.description, args.goal, args.endDate);

            await token._mint(address1.address, ethers.parseEther('100000'));

            await token.connect(address1).approve(crowdFunding.target, ethers.parseEther('10000'));

            await crowdFunding.connect(address1).donate(0, ethers.parseEther('10000'));

            await time.increase(TWO_WEEKS+800);

            await expect(crowdFunding.connect(address1).ClaimRefund(0)).not.to.be.reverted
        })
    })
});