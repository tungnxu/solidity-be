/* eslint-disable node/no-missing-import */
/* eslint-disable node/no-unpublished-import */
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, get, execute } = deployments;

  const { deployer } = await getNamedAccounts();

  const WETHToken = "0xd0a1e359811322d97991e03f863a0c30c2cf029c";
  const SushiSwrap = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";

  const deployedRouter = await deploy("Router", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  const contractRouter = await ethers.getContractAt(deployedRouter.abi, deployedRouter.address);

  const DoggToken = await get("DoggToken");
  await execute('Router',
    { from: deployer, log: true },
    'addRoute',
    WETHToken,
    DoggToken.address,
    SushiSwrap,
    [WETHToken, DoggToken.address]
  );

  await execute('Router',
    { from: deployer, log: true },
    'addRoute',
    DoggToken.address,
    WETHToken,
    SushiSwrap,
    [DoggToken.address, WETHToken]
  );

  // await execute(
  //   "MasterChef",
  //   { from: deployer, log: true },
  //   "add",
  //   parseEther(`5000000`),
  //   SLPToken,
  //   false
  // );

  const masterChef = await get("MasterChef");
  const deployed = await deploy("Vault", {
    from: deployer,
    args: ["0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506", masterChef.address, 0, contractRouter.address],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  const contract = await ethers.getContractAt(deployed.abi, deployed.address);

};

export default func;
func.tags = ["kovan"];
func.skip = async ({ network }) => {
  return network.name != "kovan"
}

