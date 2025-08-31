# ZamaLink - Private Donation Platform

**Complete privacy for crypto donations using Zama FHEVM technology**

ZamaLink is a revolutionary crowdfunding platform that enables **fully private donations** using advanced FHEVM (Fully Homomorphic Encryption Virtual Machine) technology. Campaign organizers can raise funds while keeping all donation amounts completely encrypted and private until claimed.

## Features

### **Full Privacy System**
- **ZLETH Wrapper**: Automatic ETH-to-ZLETH conversion for private donations
- **Encrypted Amounts**: All donation totals remain private using Zama FHEVM
- **Anonymous Donations**: Optional donor anonymity with encrypted transactions
- **Private Claims**: Organizers claim funds without revealing total amounts

### **Campaign Management**
- **Create Campaigns**: Rich campaign creation with categories and targets
- **Live Dashboard**: Organizer dashboard with encrypted metrics
- **Social Proof**: Public donor count without revealing amounts
- **Time-based Goals**: Campaign deadlines and progress tracking

### **Advanced Web3 Integration**
- **Multi-wallet Support**: RainbowKit integration with major wallets
- **Sepolia Testnet**: Full deployment on Ethereum Sepolia
- **Gas Optimized**: Efficient smart contract design
- **Oracle Integration**: Zama oracle for private-to-public conversions

## Tech Stack

### Frontend
- **Next.js 15** with React 18 and TypeScript
- **RainbowKit & Wagmi** for Web3 wallet connectivity
- **TailwindCSS** with shadcn/ui components
- **Ethers.js** for blockchain interactions

### Smart Contracts
- **Solidity 0.8.24** with Zama FHEVM extensions
- **ZamaLinkCampaign.sol** - Main campaign management
- **ZLETHWrapper.sol** - Private ETH wrapper with FHEVM
- **Hardhat** development environment

### Privacy Technology
- **Zama FHEVM** - Fully Homomorphic Encryption

## Quick Start

### Prerequisites
- **Node.js** >= 22.0.0
- **npm** >= 10.0.0
- **MetaMask** or compatible Web3 wallet

### Installation

```bash
# Clone the repository
git clone https://github.com/GiganticNodes/ZamaLink.git
cd ZamaLink

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Smart Contracts (Sepolia Testnet)

### Current Deployment
| Contract | Address | Purpose |
|----------|---------|---------|
| **ZLETHWrapper** | [`0xC92A0100589Baace55eE5724733824703c152d0B`](https://sepolia.etherscan.io/address/0xC92A0100589Baace55eE5724733824703c152d0B) | Private ETH wrapper |
| **ZamaLinkCampaign** | [`0xE004EB22a1a6864d32664039a7325056ae15Be1c`](https://sepolia.etherscan.io/address/0xE004EB22a1a6864d32664039a7325056ae15Be1c) | Campaign management |

### Development Commands

```bash
# Compile contracts
npm run compile

# Deploy to Sepolia
npm run deploy:sepolia

# Run contract tests
npm run test:contracts

# Verify on Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## How It Works

### For Campaign Organizers

1. **Create Campaign**
   - Connect your wallet
   - Fill campaign details (title, description, target, duration)
   - Deploy on-chain with encrypted tracking

2. **Receive Donations**
   - Donations automatically convert ETH → ZLETH
   - All amounts remain private and encrypted
   - Public donor count for social proof

3. **Claim Funds**
   - Access organizer dashboard
   - Click "Claim Funds" to withdraw all ZLETH
   - Automatic conversion back to ETH via Zama oracle

### For Donors

1. **Browse Campaigns**
   - Explore active campaigns by category
   - View campaign details and progress
   - Check organizer information

2. **Make Private Donations**
   - Click "Donate Now" on any campaign
   - Choose donation amount and anonymity level
   - ETH automatically converts to ZLETH privately

3. **Complete Privacy**
   - Your donation amount stays encrypted
   - Only you and the organizer know the amount
   - Optional anonymous mode hides your identity

## Development Workflow

### Frontend Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

### Smart Contract Development
```bash
# Compile contracts
npm run compile

# Deploy to local network
npx hardhat node
npm run deploy:localhost

# Run tests
npm run test:contracts

# Deploy to Sepolia testnet
npm run deploy:sepolia
```

## Troubleshooting

### Common Issues

1. **RainbowKit Module Errors**
   ```bash
   # Clear build cache
   rm -rf .next
   npm run dev
   ```

2. **"Unauthorized" Claim Error**
   - Ensure you're the campaign organizer
   - Connect the same wallet used to create the campaign
   - Make sure your campaign has received donations

3. **Wallet Connection Issues**
   - Refresh the page and reconnect wallet
   - Switch to Sepolia testnet in MetaMask
   - Clear browser cache if needed

### Environment Setup
The app uses fallback contract addresses, but you can override them:

```bash
# Optional: Create .env.local for custom addresses
NEXT_PUBLIC_ZLETH_WRAPPER_ADDRESS=0xYourWrapperAddress
NEXT_PUBLIC_CAMPAIGN_CONTRACT_ADDRESS=0xYourCampaignAddress
NEXT_PUBLIC_NETWORK=sepolia
```

## Documentation

- **[Claim System Guide](CLAIM_SYSTEM.md)** - How to claim campaign funds
- **[Contract Migration](CONTRACT_MIGRATION.md)** - Migration to ZLETH system
- **[RainbowKit Fix](RAINBOWKIT_FIX.md)** - Module resolution fixes

## Network Configuration

### Sepolia Testnet
- **Network**: Sepolia Testnet
- **Chain ID**: 11155111
- **Currency**: ETH (testnet)
- **Explorer**: [sepolia.etherscan.io](https://sepolia.etherscan.io/)

### Get Testnet ETH
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Quick Links

- **Live Demo**:

---

**Built with love using Zama FHEVM technology for complete donation privacy**
