require("@fhevm/hardhat-plugin");
require("@nomicfoundation/hardhat-ethers");
require("dotenv/config");

const PRIVATE_KEY = process.env.PRIVATE_KEY
const INFURA_API_KEY = process.env.INFURA_API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 800,
      },
    },
  },
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
    },
  },
};
