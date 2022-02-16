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
  // const SLPToken = "0x3e28a28b2719ed9d1dc6b0a4b4dd89114dc35fd5";

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

  ////====== Setminter for masterChef: cause need to call mint function  ======//
  // await execute(
  //   "DoggToken",
  //   { from: deployer, log: true },
  //   "setMinter",
  //   masterChef.address,
  //   parseEther(`10000000000000000`)
  // );

  ////====== Set approve for masterChef to use xxx Dogg token  ======//
  // await execute(
  //   "DoggToken",
  //   { from: deployer, log: true },
  //   "approve",
  //   masterChef.address,
  //   parseEther(`10000000000000000`)
  // );

  ////====== Add the first Pool with SLP: WMATIC/DOGG Sushiswrap  ======//
  // await execute(
  //   "MasterChef",
  //   { from: deployer, log: true },
  //   "add",
  //   parseEther(`50000`),
  //   "0x9CA881cf75bF35FC0578624F2b0946ea953d024F", //SLP 1
  //   false
  // );

  ////====== Add the second Pool with SLP: USDC/DOGG QuickSwrap  ======//
  // await execute(
  //   "MasterChef",
  //   { from: deployer, log: true },
  //   "add",
  //   parseEther(`20000`),
  //   "0x6b3a3d6e359D67b0F1d122D2e0f17587AcbB6D5D", //SLP 2
  //   false
  // );
};

export default func;
func.tags = ["polygon"];

func.skip = async ({network}) => {
  return network.name != "polygon"
}