import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const main = async () => {
    const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    const poolAddress = "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc";

    const UNIRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  
    const holder = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";

    await helpers.impersonateAccount(holder);
    const impersonatedSigner = await ethers.getSigner(holder);

    let usdcContract = await ethers.getContractAt('IERC20', USDCAddress);
    let wethContract = await ethers.getContractAt('IERC20', WETHAddress);
    let poolContract = await ethers.getContractAt('IERC20', poolAddress);
    let uniswapContract = await ethers.getContractAt('IUniswap', UNIRouter);

    const usdcBal = await usdcContract.balanceOf(impersonatedSigner.address);
    const ETHBal = await ethers.provider.getBalance(holder);

    const poolUsdcBal = await usdcContract.balanceOf(poolAddress);
    const poolWethBal = await wethContract.balanceOf(poolAddress);

    const liquidityBefore = await poolContract.balanceOf(impersonatedSigner.address);

    console.log('----------------Here We Gooooooooooo-----------------')
    
    console.log('Pool usdc balance before adding liquidity:', ethers.formatUnits(poolUsdcBal, 6))

    console.log('Pool WETH balance before adding liquidity:', ethers.formatUnits(poolWethBal, 18))

    console.log('\nimpersonated acct usdc bal before adding liquidity:', ethers.formatUnits(usdcBal, 6))

    console.log('impersonated acct ETH bal adding liquidity:', ethers.formatUnits(ETHBal, 18))

    console.log('liquidity balance before adding liquidity:', ethers.formatUnits(liquidityBefore, 18));

    let AmtADesired = ethers.parseUnits('50', 18);
    
    let QuoteB = await uniswapContract.quote(AmtADesired, poolWethBal, poolUsdcBal);

    let AmtBDesired = QuoteB

    console.log('Quote B:', ethers.formatUnits(QuoteB, 6));

    let AmtAMin = ethers.parseUnits('49', 18);
    let AmtBMin = AmtBDesired - ethers.parseUnits('1000', 6);

    let deadline = await helpers.time.latest() + 500;


    await usdcContract.connect(impersonatedSigner).approve(UNIRouter, AmtBDesired);
    
    console.log('\n-------------------------- Adding liquidity... --------------\n')

    await uniswapContract.connect(impersonatedSigner).addLiquidityETH(
        USDCAddress,
        AmtBDesired,
        AmtBMin,
        AmtAMin,
        holder,
        deadline,
        {value: AmtADesired}
    )

    console.log('\n-------------------------- liquidity ETH added ------------\n')

    const usdcBalAfter = await usdcContract.balanceOf(impersonatedSigner.address);
    const ETHBalAfter = await ethers.provider.getBalance(holder);

    const poolUsdcBalAfter = await usdcContract.balanceOf(poolAddress);
    const poolWethBalAfter = await wethContract.balanceOf(poolAddress);

    const liquidity = await poolContract.balanceOf(impersonatedSigner.address);

    console.log('Pool usdc balance after adding liquidity:', ethers.formatUnits(poolUsdcBalAfter, 6))

    console.log('Pool WETH balance after adding liquidity:', ethers.formatUnits(poolWethBalAfter, 18))

    console.log('\nimpersonated acct usdc bal after adding liquidity:', ethers.formatUnits(usdcBalAfter, 6))

    console.log('impersonated acct ETH bal after adding liquidity:', ethers.formatUnits(ETHBalAfter, 18))

    console.log('\nliquidity balance after adding liquidity:', ethers.formatUnits(liquidity, 18));

    console.log('\n-------------------------- Congratulations 🥳🥳🥳 -------------\n')

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });