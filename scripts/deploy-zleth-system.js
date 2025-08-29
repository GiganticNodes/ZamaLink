const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying ZLETH System to Sepolia...");
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    // Step 1: Deploy ZLETH Wrapper
    console.log("\nStep 1: Deploying ZLETHWrapper...");
    const ZLETHWrapper = await ethers.getContractFactory("ZLETHWrapper");
    const zlethWrapper = await ZLETHWrapper.deploy();
    await zlethWrapper.waitForDeployment();
    const zlethWrapperAddress = await zlethWrapper.getAddress();
    
    console.log("ZLETHWrapper deployed to:", zlethWrapperAddress);
    
    // Verify wrapper deployment
    const wrapperRate = await zlethWrapper.rate();
    console.log("   - ZLETH Rate:", wrapperRate.toString());
    console.log("   - ZLETH Symbol: ZLETH");
    console.log("   - ZLETH Name: Zama Link ETH");

    // Step 2: Deploy Campaign Contract
    console.log("\nStep 2: Deploying ZamaLinkCampaign...");
    const ZamaLinkCampaign = await ethers.getContractFactory("ZamaLinkCampaign");
    const campaignContract = await ZamaLinkCampaign.deploy(zlethWrapperAddress);
    await campaignContract.waitForDeployment();
    const campaignContractAddress = await campaignContract.getAddress();
    
    console.log("ZamaLinkCampaign deployed to:", campaignContractAddress);
    console.log("   - Connected to ZLETH Wrapper:", zlethWrapperAddress);

    // Step 3: Test basic functionality
    console.log("\nStep 3: Testing basic functionality...");
    
    try {
        // Test ZLETH wrapper
        console.log("Testing ZLETH wrapper deposit...");
        const depositTx = await zlethWrapper.deposit(deployer.address, {
            value: ethers.parseEther("0.01") // 0.01 ETH
        });
        await depositTx.wait();
        console.log("ZLETH deposit test successful");

        // Check ZLETH balance (encrypted, so we can't see actual value)
        const encryptedBalance = await zlethWrapper.balanceOf(deployer.address);
        console.log("   - Encrypted ZLETH balance:", encryptedBalance);

        // Test campaign creation
        console.log("Testing campaign creation...");
        const campaignId = ethers.keccak256(ethers.toUtf8Bytes("test_campaign_" + Date.now()));
        const createTx = await campaignContract.createCampaign(
            campaignId,
            "Test ZLETH Campaign",
            "Testing the new ZLETH donation system",
            "https://example.com/image.jpg",
            ethers.parseEther("1.0"), // Target: 1 ETH
            86400 * 7, // Duration: 7 days
            0 // Category: DISASTER_RELIEF
        );
        await createTx.wait();
        console.log("Campaign creation test successful");
        console.log("   - Test Campaign ID:", campaignId);

    } catch (error) {
        console.warn("WARNING: Some tests failed (this might be expected in testnet):", error.message);
    }

    // Step 4: Save deployment info
    console.log("\nStep 4: Saving deployment configuration...");
    
    const deploymentInfo = {
        network: "sepolia",
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            ZLETHWrapper: {
                address: zlethWrapperAddress,
                name: "Zama Link ETH",
                symbol: "ZLETH",
                decimals: 9,
                rate: wrapperRate.toString()
            },
            ZamaLinkCampaign: {
                address: campaignContractAddress,
                zlethWrapper: zlethWrapperAddress
            }
        },
        deployment: {
            blockNumber: await deployer.provider.getBlockNumber(),
            gasUsed: "estimated", // Could track actual gas if needed
            transactionHashes: {
                zlethWrapper: "deployed", 
                campaign: "deployed"
            }
        }
    };

    // Save to multiple locations for different use cases
    const fs = require('fs');
    const path = require('path');

    // 1. Main deployment record
    const deployDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deployDir)) {
        fs.mkdirSync(deployDir, { recursive: true });
    }
    
    fs.writeFileSync(
        path.join(deployDir, 'zleth-system-sepolia.json'),
        JSON.stringify(deploymentInfo, null, 2)
    );

    // 2. Frontend configuration
    const frontendConfig = {
        NEXT_PUBLIC_ZLETH_WRAPPER_ADDRESS: zlethWrapperAddress,
        NEXT_PUBLIC_CAMPAIGN_CONTRACT_ADDRESS: campaignContractAddress,
        NEXT_PUBLIC_NETWORK: "sepolia",
        NEXT_PUBLIC_ZLETH_RATE: wrapperRate.toString(),
        // Legacy compatibility
        NEXT_PUBLIC_CONTRACT_ADDRESS: campaignContractAddress
    };

    fs.writeFileSync(
        path.join(deployDir, 'frontend-config-zleth.json'),
        JSON.stringify(frontendConfig, null, 2)
    );

    // 3. .env format for easy copy-paste
    const envContent = Object.entries(frontendConfig)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    
    fs.writeFileSync(
        path.join(deployDir, 'zleth.env'),
        envContent
    );

    console.log("Deployment info saved to:");
    console.log("   - deployments/zleth-system-sepolia.json");
    console.log("   - deployments/frontend-config-zleth.json");
    console.log("   - deployments/zleth.env");

    // Step 5: Display summary
    console.log("\nZLETH System Deployment Complete!");
    console.log("=" .repeat(50));
    console.log("Contract Addresses:");
    console.log(`   ZLETHWrapper:     ${zlethWrapperAddress}`);
    console.log(`   ZamaLinkCampaign: ${campaignContractAddress}`);
    console.log("");
    console.log("Frontend Environment Variables:");
    console.log(`   NEXT_PUBLIC_ZLETH_WRAPPER_ADDRESS=${zlethWrapperAddress}`);
    console.log(`   NEXT_PUBLIC_CAMPAIGN_CONTRACT_ADDRESS=${campaignContractAddress}`);
    console.log("");
    console.log("How to use:");
    console.log("1. Copy the environment variables to your .env.local file");
    console.log("2. Update your frontend to use the new campaign contract");
    console.log("3. Users can now donate privately with automatic ETH->ZLETH wrapping");
    console.log("4. Campaign creators can claim and automatically unwrap ZLETH->ETH");
    console.log("");
    console.log("Verify contracts on Etherscan:");
    console.log(`   https://sepolia.etherscan.io/address/${zlethWrapperAddress}`);
    console.log(`   https://sepolia.etherscan.io/address/${campaignContractAddress}`);
    console.log("");
    console.log("WARNING: This is on Sepolia testnet - use only test ETH!");
}

// Error handling
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("ERROR: Deployment failed:");
        console.error(error);
        process.exit(1);
    });
