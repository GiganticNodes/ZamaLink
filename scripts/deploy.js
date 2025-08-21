const { ethers } = require("hardhat");

async function main() {
  console.log("=== Deploying PrivateDonation Contract ===");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Network:", hre.network.name);
  console.log("Deployer address:", deployer.address);
  
  // Get deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
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

  console.log("\nUsing FHEVM contract addresses:");
  Object.entries(FHEVM_ADDRESSES).forEach(([key, value]) => {
    if (!key.includes("URL")) {
      console.log(`${key}: ${value}`);
    }
  });

  console.log("\n🚀 Deploying PrivateDonation contract...");

  // Deploy contract  
  const PrivateDonation = await ethers.getContractFactory("PrivateDonation");
  const privateDonation = await PrivateDonation.deploy({
    gasLimit: 6000000
  });

  // Wait for deployment
  await privateDonation.waitForDeployment();
  const contractAddress = await privateDonation.getAddress();

  console.log("\n✅ Deployment Complete!");
  console.log(`📄 Contract Address: ${contractAddress}`);
  console.log(`🔗 Transaction Hash: ${privateDonation.deploymentTransaction().hash}`);
  
  // Save contract address info
  const contractInfo = {
    address: contractAddress,
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
    txHash: privateDonation.deploymentTransaction().hash,
    fhevmAddresses: FHEVM_ADDRESSES
  };

  console.log("\n📋 Contract Info:");
  console.log(JSON.stringify(contractInfo, null, 2));

  console.log("\n📋 Next Steps:");
  console.log("1. Update frontend with contract address:", contractAddress);
  console.log("2. Test contract functions");
  console.log("3. Fund creators and test donations");

  return contractAddress;
}

main()
  .then((address) => {
    console.log(`\n🎉 Contract deployed successfully at: ${address}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
