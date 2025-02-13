import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SmartSavingModule = buildModule("ERC20Module", (m) => {
    const smartSaving = m.contract("SmartSaving");

    return { smartSaving };
});

export default SmartSavingModule;