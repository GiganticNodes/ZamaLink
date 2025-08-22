import { ethers } from 'ethers';

// FHEVM utility functions for ZamaLink
export class FHEVMClient {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  
  constructor() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
    }
  }

  async connect() {
    if (!this.provider) {
      throw new Error('No ethereum provider found');
    }
    
    await this.provider.send("eth_requestAccounts", []);
    this.signer = await this.provider.getSigner();
    return this.signer;
  }

  async encryptValue(value: number): Promise<{ encryptedValue: string; proof: string }> {
    // Placeholder untuk enkripsi FHEVM
    // Di production, gunakan fhevmjs library untuk enkripsi yang sebenarnya
    const encryptedValue = ethers.toBeHex(value, 32);
    const proof = "0x" + "00".repeat(32); // Dummy proof
    
    return {
      encryptedValue,
      proof
    };
  }

  async getContract(contractAddress: string, abi: any[]) {
    if (!this.signer) {
      throw new Error('Signer not initialized. Call connect() first');
    }
    
    return new ethers.Contract(contractAddress, abi, this.signer);
  }

  async registerCreator(
    contractAddress: string, 
    abi: any[], 
    creatorId: string, 
    name: string, 
    description: string
  ) {
    const contract = await this.getContract(contractAddress, abi);
    const creatorIdBytes = ethers.keccak256(ethers.toUtf8Bytes(creatorId));
    
    const tx = await contract.registerCreator(creatorIdBytes, name, description);
    return await tx.wait();
  }

  async makeDonation(
    contractAddress: string,
    abi: any[],
    creatorId: string,
    amountInEth: string
  ) {
    const contract = await this.getContract(contractAddress, abi);
    const creatorIdBytes = ethers.keccak256(ethers.toUtf8Bytes(creatorId));
    
    // Convert ETH to wei untuk enkripsi
    const amountInWei = ethers.parseEther(amountInEth);
    const amountNumber = Number(amountInWei);
    
    // Encrypt donation amount
    const { encryptedValue, proof } = await this.encryptValue(amountNumber);
    
    const tx = await contract.donate(creatorIdBytes, encryptedValue, proof, {
      value: amountInWei
    });
    
    return await tx.wait();
  }

  async getCreatorInfo(contractAddress: string, abi: any[], creatorId: string) {
    const contract = await this.getContract(contractAddress, abi);
    const creatorIdBytes = ethers.keccak256(ethers.toUtf8Bytes(creatorId));
    
    const [wallet, name, description, isRegistered] = await contract.getCreatorInfo(creatorIdBytes);
    
    return {
      wallet,
      name,
      description,
      isRegistered
    };
  }

  async getAllCreators(contractAddress: string, abi: any[]) {
    const contract = await this.getContract(contractAddress, abi);
    const creatorIds = await contract.getAllCreators();
    
    const creators = [];
    for (const creatorId of creatorIds) {
      try {
        const info = await contract.getCreatorInfo(creatorId);
        creators.push({
          id: creatorId,
          wallet: info[0],
          name: info[1],
          description: info[2],
          isRegistered: info[3]
        });
      } catch (error) {
        console.error('Error fetching creator info:', error instanceof Error ? error.message : String(error));
      }
    }
    
    return creators;
  }

  async getPublicDonationCount(contractAddress: string, abi: any[], creatorId: string) {
    const contract = await this.getContract(contractAddress, abi);
    const creatorIdBytes = ethers.keccak256(ethers.toUtf8Bytes(creatorId));
    
    const count = await contract.getPublicDonationCount(creatorIdBytes);
    return Number(count);
  }

  // Utility function untuk generate creator ID dari wallet address
  generateCreatorId(walletAddress: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(walletAddress.toLowerCase()));
  }
}

// Contract ABI placeholder - akan diupdate setelah compilation berhasil
export const PRIVATE_DONATION_ABI = [
  // Constructor dan basic functions
  "function registerCreator(bytes32 creatorId, string calldata name, string calldata description) external",
  "function donate(bytes32 creatorId, uint256 encryptedAmount, bytes calldata inputProof) external payable",
  "function getCreatorInfo(bytes32 creatorId) external view returns (address wallet, string memory name, string memory description, bool isRegistered)",
  "function getAllCreators() external view returns (bytes32[] memory)",
  "function getPublicDonationCount(bytes32 creatorId) external view returns (uint256)",
  "function hasDonated(address donor, bytes32 creatorId) external view returns (bool)",
  
  // Events
  "event CreatorRegistered(bytes32 indexed creatorId, address indexed wallet, string name)",
  "event DonationMade(bytes32 indexed creatorId, address indexed donor, uint256 timestamp)"
];

// Contract address placeholder - akan diupdate setelah deployment
export const PRIVATE_DONATION_ADDRESS = "0x0000000000000000000000000000000000000000";
