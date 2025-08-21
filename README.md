# ZamaLink - Private Donation Platform

Private donation platform using **Zama fhEVM** for encrypted on-chain donations. Support creators with ETH while keeping amounts completely private.

## Features

- **Private donations** with Zama fhEVM encryption 
- **Multi-wallet support**
- **Direct ETH transfers** to creator wallets

## Tech Stack

- Next.js 15, React 19, TypeScript
- Zama fhEVM, Wagmi, RainbowKit
- TailwindCSS, shadcn/ui
- Hardhat, Solidity 0.8.24

## Quick Start

```bash
git clone https://github.com/GiganticNodes/ZamaLink.git
cd ZamaLink
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Smart Contract

**Sepolia:** `0xc6385a8aD579Da026f6Ac373DD613490F3C8C014`

```bash
# Deploy
npm run deploy:sepolia

# Verify
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## Usage

**Donors:** Connect wallet > Browse creators > Donate privately

**Creators:** Visit `/register` > Fill profile > Start receiving donations
