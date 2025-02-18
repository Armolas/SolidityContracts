import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const main = async () => {
    
    const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const DAIAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

    const poolAddress = "0xAE461cA67B15dc8dc81CE7615e0320dA1A9aB8D5";
   
  
    const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  
    const holder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

  
    await helpers.impersonateAccount(holder);
    const impersonatedSigner = await ethers.getSigner(holder);

    let usdcContract = await ethers.getContractAt('IERC20', USDCAddress);
    let daiContract = await ethers.getContractAt('IERC20', DAIAddress);
    let poolContract = await ethers.getContractAt('IERC20', poolAddress);
    let uniswapContract = await ethers.getContractAt('IUniswap', UNIRouter);

    // let holderUsdcBal = await usdcContract.balanceOf(impersonatedSigner.address);

    const usdcBal = await usdcContract.balanceOf(impersonatedSigner.address);
    const daiBal = await daiContract.balanceOf(impersonatedSigner.address);

    const poolUsdcBal = await usdcContract.balanceOf(poolAddress);
    const poolDaiBal = await daiContract.balanceOf(poolAddress); 

    const liquidityBefore = await poolContract.balanceOf(impersonatedSigner.address);

    console.log('----------------Here We Gooooooooooo-----------------')
    
    console.log('Pool usdc balance before adding liquidity:', ethers.formatUnits(poolUsdcBal, 6))

    console.log('Pool dai balance before adding liquidity:', ethers.formatUnits(poolDaiBal, 18))

    console.log('\nimpersonated acct usdc bal before adding liquidity:', ethers.formatUnits(usdcBal, 6))

    console.log('impersonated acct dai bal adding liquidity:', ethers.formatUnits(daiBal, 18))

    console.log('liquidity balance adding removing liquidity:', ethers.formatUnits(liquidityBefore, 18));


    let AmtADesired = ethers.parseUnits('100000', 6);
    let AmtBDesired = ethers.parseUnits('100000', 18);

    let AmtAMin = ethers.parseUnits('99000', 6);
    let AmtBMin = ethers.parseUnits('99000', 18);

    let deadline = await helpers.time.latest() + 500;


    await usdcContract.connect(impersonatedSigner).approve(UNIRouter, AmtADesired);
    await daiContract.connect(impersonatedSigner).approve(UNIRouter, AmtBDesired);

    console.log('\n-------------------------- Adding liquidity... --------------\n')

    await uniswapContract.connect(impersonatedSigner).addLiquidity(
        USDCAddress,
        DAIAddress,
        AmtADesired,
        AmtBDesired,
        AmtAMin,
        AmtBMin,
        impersonatedSigner.address,
        deadline
    )

    console.log('\n-------------------------- liquidity added ------------\n')

    const usdcBalAfter = await usdcContract.balanceOf(impersonatedSigner.address);
    const daiBalAfter = await daiContract.balanceOf(impersonatedSigner.address);

    const poolUsdcBalAfter = await usdcContract.balanceOf(poolAddress);
    const poolDaiBalAfter = await daiContract.balanceOf(poolAddress);

    const liquidity = await poolContract.balanceOf(impersonatedSigner.address);

    console.log('Pool usdc balance after adding liquidity:', ethers.formatUnits(poolUsdcBalAfter, 6))

    console.log('Pool dai balance after adding liquidity:', ethers.formatUnits(poolDaiBalAfter, 18))

    console.log('\nimpersonated acct usdc bal after adding liquidity:', ethers.formatUnits(usdcBalAfter, 6))

    console.log('impersonated acct dai bal after adding liquidity:', ethers.formatUnits(daiBalAfter, 18))

    console.log('\nliquidity balance before removing liquidity:', ethers.formatUnits(liquidity, 18));

    console.log('\n-------------------------- removing liduidity... ------------\n')

    await poolContract.connect(impersonatedSigner).approve(UNIRouter, liquidity);

    await uniswapContract.connect(impersonatedSigner).removeLiquidity(
        USDCAddress,
        DAIAddress,
        liquidity,
        AmtAMin,
        AmtBMin,
        impersonatedSigner.address,
        deadline + 500
    );

    console.log('\n-------------------------- liquidity removed -------------\n')

    const usdcBalAfterRemove = await usdcContract.balanceOf(impersonatedSigner.address);
    const daiBalAfterRemove = await daiContract.balanceOf(impersonatedSigner.address);

    const _poolUsdcBalAfter = await usdcContract.balanceOf(poolAddress);
    const _poolDaiBalAfter = await daiContract.balanceOf(poolAddress);
    
    const liquidityAfter = await poolContract.balanceOf(impersonatedSigner.address);

    console.log('Pool usdc balance after removing liquidity:', ethers.formatUnits(_poolUsdcBalAfter, 6))

    console.log('Pool dai balance after removing liquidity:', ethers.formatUnits(_poolDaiBalAfter, 18))

    console.log('\nimpersonated acct usdc bal after removing liduidity:', ethers.formatUnits(usdcBalAfterRemove, 6))
    console.log('impersonated acct dai bal after removing liquidity:', ethers.formatUnits(daiBalAfterRemove, 18))

    console.log('\nliquidity balance after removing liquidity:', ethers.formatUnits(liquidityAfter, 18));

    console.log('\n-------------------------- Congratulations 🥳🥳🥳 -------------\n')



}

  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });