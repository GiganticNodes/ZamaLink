import { HardhatRuntimeEnvironment } from "hardhat/types/index.js";
import { DeployFunction } from "hardhat-deploy/types";

const deployPrivateDonation: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre as any;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  console.log("=== Deploying PrivateDonation Contract ===");
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer);
  
  // Get deployer balance
  const balance = await ethers.provider.getBalance(deployer);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH");

  // FHEVM Contract Addresses for Sepolia (hardcoded)
  const FHEVM_ADDRESSES = {
    FHEVM_EXECUTOR_CONTRACT: "0x848B0066793BcC60346Da1F49049357399B8D595",
    ACL_CONTRACT: "0x687820221192C5B662b25367F70076A37bc79b6c",
    HCU_LIMIT_CONTRACT: "0x594BB474275918AF9609814E68C61B1587c5F838",
    KMS_VERIFIER_CONTRACT: "0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC",
    INPUT_VERIFIER_CONTRACT: "0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4",
    DECRYPTION_ORACLE_CONTRACT: "0xa02Cda4Ca3a71D7C46997716F4283aa851C28812",
    DECRYPTION_ADDRESS: "0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1",
    INPUT_VERIFICATION_ADDRESS: "0x7048C39f048125eDa9d678AEbaDfB22F7900a29F",
    RELAYER_URL: "https://relayer.testnet.zama.cloud"
  };

  console.log("Using FHEVM contract addresses:");
  Object.entries(FHEVM_ADDRESSES).forEach(([key, value]) => {
    if (!key.includes("URL")) {
      console.log(`${key}: ${value}`);
    }
  });

  console.log("\nDeploying PrivateDonation contract...");

  const privateDonation = await deploy("PrivateDonation", {
    from: deployer,
    args: [], // No constructor arguments needed
    log: true,
    autoMine: true,
    gasLimit: 6000000, // Set higher gas limit for complex contract
  });

  console.log("\nDeployment Complete!");
  console.log(`Contract Address: ${privateDonation.address}`);
  console.log(`Transaction Hash: ${privateDonation.transactionHash}`);
  console.log(`Gas Used: ${privateDonation.receipt?.gasUsed || 'N/A'}`);

  // Save contract address to a file for frontend usage
  const contractInfo = {
    address: privateDonation.address,
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
    txHash: privateDonation.transactionHash,
    fhevmAddresses: FHEVM_ADDRESSES
  };

  // Verify contract on Etherscan if on sepolia
  if (hre.network.name === "sepolia" && process.env.ETHERSCAN_API_KEY) {
    console.log("\nWaiting for block confirmations before verification...");
    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 60 seconds
    
    try {
      console.log("Verifying contract on Etherscan...");
      await hre.run("verify:verify", {
        address: privateDonation.address,
        constructorArguments: [],
      });
      console.log("Contract verified on Etherscan!");
    } catch (error) {
      console.log("Error verifying contract:", error);
    }
  }


  return true;
};

export default deployPrivateDonation;
deployPrivateDonation.tags = ["PrivateDonation", "main"];
deployPrivateDonation.dependencies = [];
