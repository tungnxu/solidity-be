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

  const deployed = await deploy("DoggToken", {
    from: deployer,
    args: [parseEther("10000000000000000")],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
  
  ////====== Setminter for deployer ======//
  // await execute(
  //   "DoggToken",
  //   { from: deployer, log: true },
  //   "setMinter",
  //   deployer,
  //   parseEther(`100000000000000`)
  // );

  ////====== Mint for deployer some Dogg token ======//
  // await execute(
  //   "DoggToken",
  //   { from: deployer, log: true },
  //   "mint",
  //   deployer,
  //   parseEther("1000000000")
  // );

  const contract = await ethers.getContractAt(deployed.abi, deployed.address);

  const balance = await contract.balanceOf(deployer);

  console.log(`Deployer balance: ${balance}`);
};

export default func;
func.tags = ["polygon"];
func.skip = async ({network}) => {
  return network.name != "polygon"
}