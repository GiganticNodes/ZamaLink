import { Contract, BrowserProvider, parseEther, keccak256, toUtf8Bytes } from 'ethers';
import { Campaign, CampaignCategory, CampaignInfo, CampaignMetrics, RecentDonation as CampaignRecentDonation } from '@/types/creator';

// ABI untuk fungsi yang kita butuhkan dari contract PrivateCampaignDonation
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "campaignId",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "imageUrl",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "targetAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "duration",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "category",
        "type": "uint8"
      }
    ],
    "name": "createCampaign",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "campaignId",
        "type": "bytes32"
      }
    ],
    "name": "getCampaignInfo",
    "outputs": [
      {
        "internalType": "address",
        "name": "organizer",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "imageUrl",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "targetAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "publicDonatorCount",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "uint8",
        "name": "category",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getActiveCampaigns",
    "outputs": [
      {
        "internalType": "bytes32[]",
        "name": "",
        "type": "bytes32[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllCampaigns",
    "outputs": [
      {
        "internalType": "bytes32[]",
        "name": "",
        "type": "bytes32[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "campaignId",
        "type": "bytes32"
      }
    ],
    "name": "getCampaignMetrics",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "targetAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalDonators",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "daysLeft",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "campaignId",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint64",
        "name": "encryptedAmount",
        "type": "externalEuint64"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      },
      {
        "internalType": "bool",
        "name": "isAnonymous",
        "type": "bool"
      }
    ],
    "name": "donate",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "campaignId",
        "type": "bytes32"
      },
      {
        "internalType": "bool",
        "name": "isAnonymous",
        "type": "bool"
      }
    ],
    "name": "donateSimple",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "campaignId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "organizer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "targetAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      }
    ],
    "name": "CampaignCreated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "campaignId",
        "type": "bytes32"
      }
    ],
    "name": "getRecentDonations",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "donors",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "timestamps",
        "type": "uint256[]"
      },
      {
        "internalType": "bool[]",
        "name": "isAnonymous",
        "type": "bool[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "campaignId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "donor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isAnonymous",
        "type": "bool"
      }
    ],
    "name": "DonationMade",
    "type": "event"
  }
];

// Contract address di Sepolia
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xAD9c503F9AC5c2fA8152B8699f8db469B5a8809F";

export interface ContractCampaign {
  id: string;
  organizer: string;
  organizerAddress: string; // Alias untuk organizer
  title: string;
  description: string;
  imageUrl: string;
  targetAmount: string;
  deadline: number;
  publicDonatorCount: number;
  isActive: boolean;
  isCompleted: boolean;
  finalAmountRevealed: boolean;
  category: CampaignCategory;
  daysLeft: number;
}

export interface ContractRecentDonation {
  donor: string; // address(0) for anonymous
  timestamp: number;
  timeAgo: string;
  isAnonymous: boolean;
  displayName: string;
}

export class PrivateCampaignDonationContract {
  private contract: Contract | null = null;
  private provider: BrowserProvider | null = null;

  async initialize(ethereum: any): Promise<void> {
    if (!ethereum) throw new Error('Ethereum provider not found');
    
    this.provider = new BrowserProvider(ethereum);
    const signer = await this.provider.getSigner();
    this.contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  }

  // Generate campaign ID dari title dan organizer
  generateCampaignId(title: string, organizerAddress: string): string {
    return keccak256(toUtf8Bytes(`${title.toLowerCase()}_${organizerAddress.toLowerCase()}_${Date.now()}`));
  }

  // Create campaign ke blockchain
  async createCampaign(
    title: string,
    description: string,
    imageUrl: string,
    targetAmountEth: string,
    durationDays: number,
    category: CampaignCategory,
    organizerAddress: string
  ): Promise<{ success: boolean; txHash?: string; campaignId?: string; error?: string }> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      const campaignId = this.generateCampaignId(title, organizerAddress);
      const targetAmountWei = parseEther(targetAmountEth);
      const durationSeconds = durationDays * 24 * 60 * 60;
      const categoryIndex = Object.values(CampaignCategory).indexOf(category);
      
      const tx = await this.contract.createCampaign(
        campaignId, 
        title, 
        description, 
        imageUrl,
        targetAmountWei,
        durationSeconds,
        categoryIndex
      );
      const receipt = await tx.wait();
      
      return {
        success: true,
        txHash: receipt.hash,
        campaignId
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Campaign creation failed'
      };
    }
  }

  // Get campaign info dari blockchain
  async getCampaignInfo(campaignId: string): Promise<ContractCampaign | null> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      const [organizer, title, description, imageUrl, targetAmount, deadline, publicDonatorCount, isActive, categoryIndex] = 
        await this.contract.getCampaignInfo(campaignId);
      
      if (organizer === '0x0000000000000000000000000000000000000000') return null;

      // Calculate days left
      const now = Math.floor(Date.now() / 1000);
      const deadlineNum = Number(deadline);
      const daysLeft = Math.max(0, Math.floor((deadlineNum - now) / 86400));
      
      // Convert category index to enum
      const categoryValues = Object.values(CampaignCategory);
      const category = categoryValues[Number(categoryIndex)] || CampaignCategory.OTHER;

      return {
        id: campaignId,
        organizer,
        organizerAddress: organizer, // Alias
        title,
        description,
        imageUrl,
        targetAmount: (Number(targetAmount) / 1e18).toFixed(4), // Convert to ETH
        deadline: deadlineNum,
        publicDonatorCount: Number(publicDonatorCount),
        isActive,
        isCompleted: false, // Default untuk sekarang
        finalAmountRevealed: false, // Default untuk sekarang
        category,
        daysLeft
      };
    } catch (error) {
      console.error('Failed to get campaign info:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  // Get campaign metrics
  async getCampaignMetrics(campaignId: string): Promise<CampaignMetrics | null> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      const [targetAmount, totalDonators, deadline, isActive, daysLeft] = 
        await this.contract.getCampaignMetrics(campaignId);
      
      return {
        targetAmount: (Number(targetAmount) / 1e18).toFixed(4), // Convert to ETH
        totalDonators: Number(totalDonators),
        deadline: Number(deadline),
        isActive,
        daysLeft: Number(daysLeft)
      };
    } catch (error) {
      console.error('Failed to get campaign metrics:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  // Get all active campaigns
  async getActiveCampaigns(): Promise<ContractCampaign[]> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      const campaignIds = await this.contract.getActiveCampaigns();
      const campaigns: ContractCampaign[] = [];

      for (const id of campaignIds) {
        const campaign = await this.getCampaignInfo(id);
        if (campaign) {
          campaigns.push(campaign);
        }
      }

      return campaigns;
    } catch (error) {
      console.error('Failed to get active campaigns:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  // Get all campaigns
  async getAllCampaigns(): Promise<ContractCampaign[]> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      const campaignIds = await this.contract.getAllCampaigns();
      const campaigns: ContractCampaign[] = [];

      for (const id of campaignIds) {
        const campaign = await this.getCampaignInfo(id);
        if (campaign) {
          campaigns.push(campaign);
        }
      }

      return campaigns;
    } catch (error) {
      console.error('Failed to get all campaigns:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  // Simple donation to campaign
  async donateSimple(
    campaignId: string,
    amountEth: string,
    isAnonymous: boolean = false
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      const amountWei = parseEther(amountEth);
      
      const tx = await this.contract.donateSimple(campaignId, isAnonymous, {
        value: amountWei
      });
      const receipt = await tx.wait();
      
      return {
        success: true,
        txHash: receipt.hash
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Donation failed'
      };
    }
  }

  // Get recent donations for campaign (respecting privacy)
  async getRecentDonations(campaignId: string): Promise<ContractRecentDonation[]> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');

      const [donors, timestamps, isAnonymousArray] = await this.contract.getRecentDonations(campaignId);
      
      const recentDonations: ContractRecentDonation[] = [];
      const now = Math.floor(Date.now() / 1000);

      for (let i = 0; i < donors.length; i++) {
        const timestamp = Number(timestamps[i]);
        const timeAgo = this.formatTimeAgo(now - timestamp);
        const isAnonymous = isAnonymousArray[i];
        const donor = isAnonymous ? '0x0000000000000000000000000000000000000000' : donors[i];
        
        let displayName: string;
        if (isAnonymous) {
          displayName = 'Hamba Allah';
        } else {
          displayName = `${donor.slice(0, 6)}...${donor.slice(-4)}`;
        }
        
        recentDonations.push({
          donor,
          timestamp,
          timeAgo,
          isAnonymous,
          displayName
        });
      }

      return recentDonations;
    } catch (error) {
      console.error('Failed to get recent donations:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  // Helper function to format time ago
  private formatTimeAgo(seconds: number): string {
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  // Get organizer campaign view dengan data decrypted (placeholder untuk sekarang)
  async getOrganizerCampaignView(campaignId: string): Promise<{decryptedTotalDonations: string, decryptedDonationCount: number}> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      
      // Placeholder: Di implementasi nyata, ini akan call contract untuk decrypt data
      // Untuk sekarang return mock data
      return {
        decryptedTotalDonations: "0",
        decryptedDonationCount: 0
      };
    } catch (error) {
      console.error('Failed to get organizer campaign view:', error instanceof Error ? error.message : String(error));
      return {
        decryptedTotalDonations: "0",
        decryptedDonationCount: 0
      };
    }
  }

  // Complete campaign (placeholder)
  async completeCampaign(campaignId: string, organizerAddress: string): Promise<{success: boolean, error?: string}> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      
      // Placeholder: Di implementasi nyata akan call smart contract
      console.log(`Completing campaign ${campaignId} by ${organizerAddress}`);
      
      return { success: true };
    } catch (error: any) {
      console.error('Failed to complete campaign:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        error: error.message || 'Failed to complete campaign'
      };
    }
  }

  // Reveal final amount (placeholder)
  async revealFinalAmount(campaignId: string, organizerAddress: string): Promise<{success: boolean, error?: string}> {
    try {
      if (!this.contract) throw new Error('Contract not initialized');
      
      // Placeholder: Di implementasi nyata akan call smart contract untuk reveal encrypted total
      console.log(`Revealing final amount for campaign ${campaignId} by ${organizerAddress}`);
      
      return { success: true };
    } catch (error: any) {
      console.error('Failed to reveal final amount:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        error: error.message || 'Failed to reveal final amount'
      };
    }
  }

  // Get contract instance for advanced usage
  getContract(): Contract | null {
    return this.contract;
  }
}

// Singleton instance
export const privateCampaignDonationContract = new PrivateCampaignDonationContract();

// Keep old export for backward compatibility during transition
export const privateDonationContract = privateCampaignDonationContract;
