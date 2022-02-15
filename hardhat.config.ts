/* eslint-disable prettier/prettier */
import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-deploy";
import "hardhat-deploy-tenderly";
import "hardhat-deploy-ethers";
import '@nomiclabs/hardhat-ethers';
import {nodeUrl, accounts} from "./utils/network";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: "0.6.12",
  networks: {
    ropsten: {
      url: nodeUrl("ROPSTEN_URL") || "",
      accounts: accounts(),
    },
    polygon: {
      url: nodeUrl("POLYGON_URL") || "",
      accounts: accounts(),
    },
    mumbai: {
      url: "https://matic-mumbai.chainstacklabs.com",
      accounts: [
        "808e4a0b7b059d382f4f270589ca34d5aa749c1f83a1a984043c51ace4afac6a"
      ],
      chainId: 80001,
      tags: ["mumbai"]
    },
    kovan: {
      url: "https://kovan.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
      accounts: [
        "5d0ddcec65c962b2771cb2e9076aa716ec94349b20198152ccf7ec792a5c294d"
      ],
      chainId: 42,
      tags: ["kovan"]
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  namedAccounts: {
    deployer: 0,
    simpleERC20Beneficiary: 1,
  }
};

export default config;
