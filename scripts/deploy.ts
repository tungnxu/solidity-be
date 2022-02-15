// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const Dogg = await ethers.getContractFactory("DoggToken");
  const contract = Dogg.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");
  // const greeter = await Greeter.deploy("Hello, Hardhat!");

  await contract.mint("0x6eA601551F2f6A9339192432fa4Ca0E426c0011A", "10000000");
  const balance = await contract.balanceOf(
    "0x6eA601551F2f6A9339192432fa4Ca0E426c0011A"
  );

  console.log("Greeter deployed to:", balance.toString());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
