const deployZLETHSystem = async function (hre) {
    const { deployments, getNamedAccounts, ethers } = hre;
    const { deploy } = deployments;

    const { deployer } = await getNamedAccounts();

    console.log("=== Deploying ZLETH System ===");
    console.log("Network:", hre.network.name);
    console.log("Deployer:", deployer);
    
    // Get deployer balance
    const balance = await ethers.provider.getBalance(deployer);
    console.log("Deployer balance:", ethers.formatEther(balance), "ETH");

    // Step 1: Deploy ZLETH Wrapper
    console.log("\nStep 1: Deploying ZLETHWrapper...");
    const zlethWrapper = await deploy("ZLETHWrapper", {
        from: deployer,
        args: [],
        log: true,
        autoMine: true,
        gasLimit: 6000000,
    });

    console.log("ZLETHWrapper deployed to:", zlethWrapper.address);

    // Get deployed contract instance to check rate
    const zlethWrapperContract = await ethers.getContractAt("ZLETHWrapper", zlethWrapper.address);
    const wrapperRate = await zlethWrapperContract.rate();
    console.log("   - ZLETH Rate:", wrapperRate.toString());
    console.log("   - ZLETH Symbol: ZLETH");
    console.log("   - ZLETH Name: Zama Link ETH");

    // Step 2: Deploy Campaign Contract
    console.log("\nStep 2: Deploying ZamaLinkCampaign...");
    const campaignContract = await deploy("ZamaLinkCampaign", {
        from: deployer,
        args: [zlethWrapper.address],
        log: true,
        autoMine: true,
        gasLimit: 6000000,
    });

    console.log("ZamaLinkCampaign deployed to:", campaignContract.address);
    console.log("   - Connected to ZLETH Wrapper:", zlethWrapper.address);

    // Step 3: Test basic functionality (optional, skip in production)
    if (hre.network.name !== "mainnet") {
        console.log("\nStep 3: Testing basic functionality...");
        
        try {
            // Test ZLETH wrapper deposit
            console.log("Testing ZLETH wrapper deposit...");
            const depositTx = await zlethWrapperContract.deposit(deployer, {
                value: ethers.parseEther("0.01") // 0.01 ETH
            });
            await depositTx.wait();
            console.log("ZLETH deposit test successful");

            // Check ZLETH balance (encrypted, so we can't see actual value)
            const encryptedBalance = await zlethWrapperContract.balanceOf(deployer);
            console.log("   - Encrypted ZLETH balance:", encryptedBalance);

            // Test campaign creation
            console.log("Testing campaign creation...");
            const campaignContractInstance = await ethers.getContractAt("ZamaLinkCampaign", campaignContract.address);
            const campaignId = ethers.keccak256(ethers.toUtf8Bytes("test_campaign_" + Date.now()));
            const createTx = await campaignContractInstance.createCampaign(
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
    }

    // Step 4: Save deployment info
    console.log("\nStep 4: Saving deployment configuration...");
    
    const deploymentInfo = {
        network: hre.network.name,
        timestamp: new Date().toISOString(),
        deployer: deployer,
        contracts: {
            ZLETHWrapper: {
                address: zlethWrapper.address,
                name: "Zama Link ETH",
                symbol: "ZLETH",
                decimals: 9,
                rate: wrapperRate.toString()
            },
            ZamaLinkCampaign: {
                address: campaignContract.address,
                zlethWrapper: zlethWrapper.address
            }
        },
        deployment: {
            blockNumber: await ethers.provider.getBlockNumber(),
            gasUsed: "estimated",
            transactionHashes: {
                zlethWrapper: zlethWrapper.transactionHash || "deployed",
                campaign: campaignContract.transactionHash || "deployed"
            }
        }
    };

    // Save configuration files
    const fs = require('fs');
    const path = require('path');

    const deployDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deployDir)) {
        fs.mkdirSync(deployDir, { recursive: true });
    }
    
    // 1. Main deployment record
    fs.writeFileSync(
        path.join(deployDir, 'zleth-system-sepolia.json'),
        JSON.stringify(deploymentInfo, null, 2)
    );

    // 2. Frontend configuration
    const frontendConfig = {
        NEXT_PUBLIC_ZLETH_WRAPPER_ADDRESS: zlethWrapper.address,
        NEXT_PUBLIC_CAMPAIGN_CONTRACT_ADDRESS: campaignContract.address,
        NEXT_PUBLIC_NETWORK: hre.network.name,
        NEXT_PUBLIC_ZLETH_RATE: wrapperRate.toString(),
        // Legacy compatibility
        NEXT_PUBLIC_CONTRACT_ADDRESS: campaignContract.address
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
    console.log("=".repeat(50));
    console.log("Contract Addresses:");
    console.log(`   ZLETHWrapper:     ${zlethWrapper.address}`);
    console.log(`   ZamaLinkCampaign: ${campaignContract.address}`);
    console.log("");
    console.log("Frontend Environment Variables:");
    console.log(`   NEXT_PUBLIC_ZLETH_WRAPPER_ADDRESS=${zlethWrapper.address}`);
    console.log(`   NEXT_PUBLIC_CAMPAIGN_CONTRACT_ADDRESS=${campaignContract.address}`);
    console.log("");
    console.log("How to use:");
    console.log("1. Copy the environment variables to your .env.local file");
    console.log("2. Update your frontend to use the new campaign contract");
    console.log("3. Users can now donate privately with automatic ETH->ZLETH wrapping");
    console.log("4. Campaign creators can claim and automatically unwrap ZLETH->ETH");
    console.log("");
    console.log("Verify contracts on Etherscan:");
    console.log(`   https://sepolia.etherscan.io/address/${zlethWrapper.address}`);
    console.log(`   https://sepolia.etherscan.io/address/${campaignContract.address}`);
    console.log("");
    console.log(`WARNING: This is on ${hre.network.name} - use only test ETH!`);

    return true;
};

module.exports = deployZLETHSystem;
deployZLETHSystem.id = "deploy_zleth_system";
deployZLETHSystem.tags = ["ZLETHSystem", "main"];
deployZLETHSystem.dependencies = [];
