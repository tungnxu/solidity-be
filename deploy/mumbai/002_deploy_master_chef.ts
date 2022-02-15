/* eslint-disable node/no-missing-import */
/* eslint-disable node/no-unpublished-import */
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { parseEther } from "ethers/lib/utils";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, get, execute } = deployments;

  const { deployer } = await getNamedAccounts();
  const dogg = await get("DoggToken");
  const blockPerDay = 86400 / 2;
  const DOGGPerDay = 100000;
  // const currentBlock = 24662464;
  const startBlock = 1; // currentBlock + blockPerDay;
  const bonusEndBlock = 24662464 + blockPerDay * 750;

  const masterChef = await deploy("MasterChef", {
    from: deployer,
    args: [
      dogg.address,
      deployer,
      parseEther(`${DOGGPerDay / blockPerDay}`),
      startBlock,
      parseEther(`${bonusEndBlock}`),
    ],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  const SUSHIDOGGMATICLP = await get("MockMATIC");
  const SUSHIDOGGMATICAlloc = 50000;
  const QUICKDOGGUSDCLP = await get("MockUSDC");
  const QUICKDOGGUSDCAlloc = 20000;

  await execute(
    "MasterChef",
    { from: deployer, log: true },
    "add",
    parseEther(`${SUSHIDOGGMATICAlloc}`),
    SUSHIDOGGMATICLP.address,
    false
  );

  await execute(
    "MasterChef",
    { from: deployer, log: true },
    "add",
    parseEther(`${QUICKDOGGUSDCAlloc}`),
    QUICKDOGGUSDCLP.address,
    false
  );

  await execute(
    "DoggToken",
    { from: deployer, log: true },
    "setMinter",
    masterChef.address,
    parseEther(`1000000000`)
  );
};

export default func;
func.tags = ["mumbai"];

func.skip = async ({network}) => {
  return network.name != "mumbai"
}