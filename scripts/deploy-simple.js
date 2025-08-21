async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const PrivateDonation = await ethers.getContractFactory("PrivateDonation");
  const contract = await PrivateDonation.deploy();
  
  await contract.waitForDeployment();
  
  console.log("PrivateDonation deployed to:", await contract.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
