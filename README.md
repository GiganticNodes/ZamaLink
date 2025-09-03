# ZamaLink - Private Donation Platform

ZamaLink is a private donation platform powered by Zama FHEVM. Every donation is converted into encrypted tokens (ZLETH) and transferred confidentially, ensuring full end-to-end privacy of donor identity and donation amount.

## Smart Contracts (Sepolia Testnet)

### Current Deployment
| Contract | Address | Purpose |
|----------|---------|---------|
| **ZLETHWrapper** | [`0xC92A0100589Baace55eE5724733824703c152d0B`](https://sepolia.etherscan.io/address/0xC92A0100589Baace55eE5724733824703c152d0B) | Private ETH wrapper |
| **ZamaLinkCampaign** | [`0xE004EB22a1a6864d32664039a7325056ae15Be1c`](https://sepolia.etherscan.io/address/0xE004EB22a1a6864d32664039a7325056ae15Be1c) | Campaign management |

- ### Live Demo: [zamalink.vercel.app](https://zamalink.vercel.app/)

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

### Frontend Framework
- **Next.js 15** - React full-stack framework with App Router
- **React 18** - UI library with modern hooks and concurrent features
- **TypeScript** - Type-safe JavaScript with enhanced developer experience

### Web3 & Blockchain
- **RainbowKit 2.2.8** - Beautiful wallet connection with multi-wallet support
- **Wagmi 2.16.8** - React hooks for Ethereum interactions
- **Ethers.js 6.15.0** - Ethereum library for smart contract interactions
- **Viem 2.36.0** - Type-safe Ethereum client

### UI/UX Libraries
- **TailwindCSS 3.4.0** - Utility-first CSS framework
- **Radix UI** - Comprehensive set of accessible UI primitives:
  - Dialog, Dropdown, Toast, Form components
  - Navigation, Accordion, Tabs, Calendar
  - Alert Dialog, Context Menu, and more
- **Shadcn/ui** - Beautiful component library built on Radix UI
- **Lucide React** - Beautiful SVG icon library
- **Motion 12.0.0** - Framer Motion animations

### Smart Contracts
- **Solidity 0.8.24** - Smart contract programming language
- **Hardhat 2.26.3** - Ethereum development environment
- **OpenZeppelin Contracts 5.4.0** - Secure smart contract library
- **OpenZeppelin Confidential 0.1.0** - Privacy-focused contract utilities

### Privacy Technology Architecture
- **Zama FHEVM** - Fully Homomorphic Encryption Virtual Machine
- **ZLETH Wrapper** - Private ETH with encrypted balances
- **Encrypted Data Types** - euint32, euint64, euint128, ebool
- **Oracle Integration** - Secure decryption via Zama oracle network

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

## Documentation

- [FHEVM Solidity Documentation](https://docs.zama.ai/protocol/solidity-guides)
- [Supported encrypted types](https://docs.zama.ai/protocol/solidity-guides/smart-contract/types)
- [Operations on encrypted types](https://docs.zama.ai/protocol/solidity-guides/smart-contract/operations)
- [Access Control List (ACL)](https://docs.zama.ai/protocol/solidity-guides/smart-contract/acl)
- [Encrypted inputs (externalEuintXX & FHE.fromExternal)](https://docs.zama.ai/protocol/solidity-guides/smart-contract/inputs)
- [Decryption (Oracle: requestDecryption & checkSignatures)](https://docs.zama.ai/protocol/solidity-guides/smart-contract/oracle)
- [Configuration & `SepoliaConfig`](https://docs.zama.ai/protocol/solidity-guides/smart-contract/configure)
- [Relayer SDK – Overview](https://docs.zama.ai/protocol/relayer-sdk-guides)
- [FHEVM Hardhat Quick Start Tutorial](https://docs.zama.ai/protocol/solidity-guides/getting-started/quick-start-tutorial)
- [How to set up a FHEVM Hardhat development environment](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup)
- [Write FHEVM Tests using Hardhat](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test)
- [Deploy contracts and run tests (Hardhat)](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/run_test)

---

**Built with love using Zama FHEVM technology for complete donation privacy**
