/* eslint-disable node/no-missing-import */
/* eslint-disable node/no-unpublished-import */
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, execute } = deployments;

  const { deployer } = await getNamedAccounts();

  const matic = await deploy("MockMATIC", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  const usdc = await deploy("MockUSDC", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  await execute(
    "MockMATIC",
    { from: deployer, log: true },
    "mint",
    deployer,
    parseEther("10000")
  );

  await execute(
    "MockUSDC",
    { from: deployer, log: true },
    "mint",
    deployer,
    parseEther("10000")
  );

  const maticContract = await ethers.getContractAt(matic.abi, matic.address);
  const usdcContract = await ethers.getContractAt(usdc.abi, usdc.address);

  const maticBalance = await maticContract.balanceOf(deployer);
  const usdcBalance = await usdcContract.balanceOf(deployer);

  console.log(`Deployer balance MATIC:${maticBalance}, USDC: ${usdcBalance}`);
};

export default func;
func.tags = ["localhost"];
func.skip = async ({network}) => {
  return network.name != "localhost"
}