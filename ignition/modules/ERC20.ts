// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ERC20Module = buildModule("ERC20Module", (m) => {
    const name = "ArmolasToken";
    const symbol = "ARM";
    const decimals = 18;
    const initialSupply = 1000000;

    const erc20 = m.contract("ERC20", [name, symbol, decimals, initialSupply]);

    return { erc20 };
});

export default ERC20Module;
