import { Contract, BrowserProvider, JsonRpcProvider, parseEther, keccak256, toUtf8Bytes } from 'ethers';
import { Campaign, CampaignCategory } from '@/types/creator';

// ZLETH Wrapper ABI - Updated to match ZLETHWrapper.sol
const ZLETH_WRAPPER_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "to", "type": "address"}],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "from", "type": "address"},
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "euint64", "name": "amount", "type": "bytes32"}
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "from", "type": "address"},
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "externalEuint64", "name": "encryptedAmount", "type": "bytes32"},
      {"internalType": "bytes", "name": "inputProof", "type": "bytes"}
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "externalEuint64", "name": "encryptedAmount", "type": "bytes32"},
      {"internalType": "bytes", "name": "inputProof", "type": "bytes"}
    ],
    "name": "confidentialTransfer",
    "outputs": [],
    "stateMutability": "nonpayable", 
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "euint64", "name": "amount", "type": "bytes32"}
    ],
    "name": "confidentialTransfer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "euint64", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "spender", "type": "address"}],
    "name": "allowDecryption",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "rate",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalEthLocked",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "contractHealth",
    "outputs": [
      {"internalType": "uint256", "name": "ethBalance", "type": "uint256"},
      {"internalType": "uint256", "name": "ethLocked", "type": "uint256"},
      {"internalType": "bool", "name": "isHealthy", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "requestID", "type": "uint256"},
      {"internalType": "uint64", "name": "zlethAmount", "type": "uint64"},
      {"internalType": "bytes[]", "name": "signatures", "type": "bytes[]"}
    ],
    "name": "finalizeWithdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "ethAmount", "type": "uint256"},
      {"indexed": false, "internalType": "uint64", "name": "zlethAmount", "type": "uint64"}
    ],
    "name": "ETHWrapped",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "requestId", "type": "uint256"}
    ],
    "name": "UnwrapRequested",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "ethAmount", "type": "uint256"}
    ],
    "name": "ETHUnwrapped",
    "type": "event"
  }
];

// ZamaLink Campaign ABI - Updated to match ZamaLinkCampaign.sol
const CAMPAIGN_ABI = [
  {
    "inputs": [
      {"internalType": "bytes32", "name": "campaignId", "type": "bytes32"},
      {"internalType": "string", "name": "title", "type": "string"},
      {"internalType": "string", "name": "description", "type": "string"},
      {"internalType": "string", "name": "imageUrl", "type": "string"},
      {"internalType": "uint256", "name": "targetAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "duration", "type": "uint256"},
      {"internalType": "uint8", "name": "category", "type": "uint8"}
    ],
    "name": "createCampaign",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "campaignId", "type": "bytes32"},
      {"internalType": "bool", "name": "isAnonymous", "type": "bool"}
    ],
    "name": "donate",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "campaignId", "type": "bytes32"}],
    "name": "claimFunds",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "campaignId", "type": "bytes32"}],
    "name": "completeCampaign",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "campaignId", "type": "bytes32"}],
    "name": "allowOrganizerDecrypt",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "campaignId", "type": "bytes32"}],
    "name": "getCampaignInfo",
    "outputs": [
      {"internalType": "address", "name": "organizer", "type": "address"},
      {"internalType": "string", "name": "title", "type": "string"},
      {"internalType": "string", "name": "description", "type": "string"},
      {"internalType": "string", "name": "imageUrl", "type": "string"},
      {"internalType": "uint256", "name": "targetAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "deadline", "type": "uint256"},
      {"internalType": "uint256", "name": "publicDonorCount", "type": "uint256"},
      {"internalType": "bool", "name": "isActive", "type": "bool"},
      {"internalType": "uint8", "name": "category", "type": "uint8"},
      {"internalType": "uint256", "name": "createdAt", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getActiveCampaigns",
    "outputs": [{"internalType": "bytes32[]", "name": "", "type": "bytes32[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllCampaigns", 
    "outputs": [{"internalType": "bytes32[]", "name": "", "type": "bytes32[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "organizer", "type": "address"}],
    "name": "getCampaignsByOrganizer",
    "outputs": [{"internalType": "bytes32[]", "name": "", "type": "bytes32[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "campaignId", "type": "bytes32"},
      {"internalType": "uint256", "name": "limit", "type": "uint256"}
    ],
    "name": "getRecentDonations",
    "outputs": [
      {"internalType": "address[]", "name": "donors", "type": "address[]"},
      {"internalType": "uint256[]", "name": "timestamps", "type": "uint256[]"},
      {"internalType": "bool[]", "name": "isAnonymous", "type": "bool[]"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "campaignId", "type": "bytes32"}],
    "name": "getEncryptedTotals",
    "outputs": [
      {"internalType": "euint64", "name": "totalZLETH", "type": "bytes32"},
      {"internalType": "euint32", "name": "donationCount", "type": "bytes32"}
    ],
    "stateMutability": "view", 
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "bytes32", "name": "campaignId", "type": "bytes32"},
      {"indexed": true, "internalType": "address", "name": "organizer", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "title", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "targetAmount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "deadline", "type": "uint256"}
    ],
    "name": "CampaignCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "bytes32", "name": "campaignId", "type": "bytes32"},
      {"indexed": true, "internalType": "address", "name": "donor", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"indexed": false, "internalType": "bool", "name": "isAnonymous", "type": "bool"}
    ],
    "name": "PrivateDonationMade",
    "type": "event"
  }
];

// Contract addresses - will be loaded from deployment config
const ZLETH_WRAPPER_ADDRESS = process.env.NEXT_PUBLIC_ZLETH_WRAPPER_ADDRESS || "0xC92A0100589Baace55eE5724733824703c152d0B";
const CAMPAIGN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CAMPAIGN_CONTRACT_ADDRESS || "0xE004EB22a1a6864d32664039a7325056ae15Be1c";

export interface ZLETHWrapperInfo {
  address: string;
  rate: string;
  ethBalance: string;
  ethLocked: string;
  isHealthy: boolean;
}

export interface ContractCampaign {
  id: string;
  organizer: string;
  organizerAddress: string;
  title: string;
  description: string;
  imageUrl: string;
  targetAmount: string;
  deadline: number;
  publicDonorCount: number;
  isActive: boolean;
  category: CampaignCategory;
  daysLeft: number;
  createdAt: number;
}

export class ZLETHCampaignContract {
  private campaignContract: Contract | null = null;
  private zlethContract: Contract | null = null;
  private provider: BrowserProvider | JsonRpcProvider | null = null;

  async initialize(ethereum: any): Promise<void> {
    if (!ethereum) throw new Error('Ethereum provider not found');
    
    this.provider = new BrowserProvider(ethereum);
    const signer = await this.provider.getSigner();
    
    if (!CAMPAIGN_CONTRACT_ADDRESS || !ZLETH_WRAPPER_ADDRESS) {
      throw new Error('Contract addresses not configured. Please deploy ZLETH system first.');
    }
    
    this.campaignContract = new Contract(CAMPAIGN_CONTRACT_ADDRESS, CAMPAIGN_ABI, signer);
    this.zlethContract = new Contract(ZLETH_WRAPPER_ADDRESS, ZLETH_WRAPPER_ABI, signer);
  }

  async initializeReadOnly(): Promise<void> {
    const rpcEndpoints = [
      'https://sepolia.gateway.tenderly.co',
      'https://ethereum-sepolia.publicnode.com',
      'https://1rpc.io/sepolia',
      ...(process.env.NEXT_PUBLIC_INFURA_API_KEY ? [`https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`] : [])
    ];
    
    let provider: JsonRpcProvider | null = null;
    
    for (const endpoint of rpcEndpoints) {
      try {
        const testProvider = new JsonRpcProvider(endpoint);
        await testProvider.getNetwork();
        provider = testProvider;
        break;
      } catch (error) {
        continue;
      }
    }
    
    if (!provider) {
      throw new Error('All RPC endpoints failed');
    }
    
    if (!CAMPAIGN_CONTRACT_ADDRESS || !ZLETH_WRAPPER_ADDRESS) {
      console.warn('Contract addresses not configured');
      return;
    }
    
    this.campaignContract = new Contract(CAMPAIGN_CONTRACT_ADDRESS, CAMPAIGN_ABI, provider);
    this.zlethContract = new Contract(ZLETH_WRAPPER_ADDRESS, ZLETH_WRAPPER_ABI, provider);
  }

  // ZLETH Wrapper Functions

  async getZLETHInfo(): Promise<ZLETHWrapperInfo> {
    if (!this.zlethContract) throw new Error('ZLETH contract not initialized');

    const [rate, health] = await Promise.all([
      this.zlethContract.rate(),
      this.zlethContract.contractHealth()
    ]);

    return {
      address: ZLETH_WRAPPER_ADDRESS,
      rate: rate.toString(),
      ethBalance: (Number(health.ethBalance) / 1e18).toFixed(4),
      ethLocked: (Number(health.ethLocked) / 1e18).toFixed(4),
      isHealthy: health.isHealthy
    };
  }

  async wrapETH(
    amountEth: string,
    recipient?: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      if (!this.zlethContract) throw new Error('ZLETH contract not initialized');

      const amount = parseEther(amountEth);
      const to = recipient || (await this.provider!.getSigner()).address;

      const tx = await this.zlethContract.deposit(to, { value: amount });
      const receipt = await tx.wait();

      return { success: true, txHash: receipt.hash };
    } catch (error: any) {
      return { success: false, error: error.message || 'ETH wrapping failed' };
    }
  }

  async getEncryptedZLETHBalance(address: string): Promise<string> {
    if (!this.zlethContract) throw new Error('ZLETH contract not initialized');
    
    try {
      const encryptedBalance = await this.zlethContract.balanceOf(address);
      return encryptedBalance.toString();
    } catch (error) {
      console.error('Failed to get ZLETH balance:', error);
      return '0x00';
    }
  }

  async checkZLETHBalance(address: string): Promise<boolean> {
    try {
      if (!this.zlethContract) throw new Error('ZLETH contract not initialized');
      
      const encryptedBalance = await this.zlethContract.balanceOf(address);
      // We can't decrypt the balance here, but we can check if it's not zero
      return encryptedBalance !== '0x00';
    } catch (error) {
      console.error('Failed to check ZLETH balance:', error);
      return false;
    }
  }

  // Campaign Functions

  generateCampaignId(title: string, organizerAddress: string): string {
    return keccak256(toUtf8Bytes(`${title.toLowerCase()}_${organizerAddress.toLowerCase()}`));
  }

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
      if (!this.campaignContract) throw new Error('Campaign contract not initialized');

      const campaignId = this.generateCampaignId(title, organizerAddress);
      const targetAmountWei = parseEther(targetAmountEth);
      const durationSeconds = durationDays * 24 * 60 * 60;
      const categoryIndex = Object.values(CampaignCategory).indexOf(category);
      
      const tx = await this.campaignContract.createCampaign(
        campaignId,
        title,
        description,
        imageUrl,
        targetAmountWei,
        durationSeconds,
        categoryIndex
      );
      const receipt = await tx.wait();
      
      return { success: true, txHash: receipt.hash, campaignId };
    } catch (error: any) {
      return { success: false, error: error.message || 'Campaign creation failed' };
    }
  }

  async getCampaignInfo(campaignId: string): Promise<ContractCampaign | null> {
    try {
      if (!this.campaignContract) throw new Error('Campaign contract not initialized');

      const result = await this.campaignContract.getCampaignInfo(campaignId);
      const [organizer, title, description, imageUrl, targetAmount, deadline, publicDonorCount, isActive, categoryIndex, createdAt] = result;
      
      if (organizer === '0x0000000000000000000000000000000000000000') return null;

      const now = Math.floor(Date.now() / 1000);
      const deadlineNum = Number(deadline);
      const daysLeft = Math.max(0, Math.floor((deadlineNum - now) / 86400));
      
      const categoryValues = Object.values(CampaignCategory);
      const category = categoryValues[Number(categoryIndex)] || CampaignCategory.OTHER;

      return {
        id: campaignId,
        organizer,
        organizerAddress: organizer,
        title,
        description,
        imageUrl,
        targetAmount: (Number(targetAmount) / 1e18).toFixed(4),
        deadline: deadlineNum,
        publicDonorCount: Number(publicDonorCount),
        isActive,
        category,
        daysLeft,
        createdAt: Number(createdAt)
      };
    } catch (error) {
      console.error('Failed to get campaign info:', error);
      return null;
    }
  }

  async getActiveCampaigns(): Promise<ContractCampaign[]> {
    try {
      if (!this.campaignContract) throw new Error('Campaign contract not initialized');

      const campaignIds = await this.campaignContract.getActiveCampaigns();
      const campaigns: ContractCampaign[] = [];

      for (const id of campaignIds) {
        const campaign = await this.getCampaignInfo(id);
        if (campaign) campaigns.push(campaign);
      }

      return campaigns;
    } catch (error) {
      console.error('Failed to get active campaigns:', error);
      return [];
    }
  }

  async getAllCampaigns(): Promise<ContractCampaign[]> {
    try {
      if (!this.campaignContract) throw new Error('Campaign contract not initialized');

      const campaignIds = await this.campaignContract.getAllCampaigns();
      const campaigns: ContractCampaign[] = [];

      for (const id of campaignIds) {
        const campaign = await this.getCampaignInfo(id);
        if (campaign) campaigns.push(campaign);
      }

      return campaigns;
    } catch (error) {
      console.error('Failed to get all campaigns:', error);
      return [];
    }
  }

  async getCampaignsByOrganizer(organizerAddress: string): Promise<ContractCampaign[]> {
    try {
      if (!this.campaignContract) throw new Error('Campaign contract not initialized');

      const campaignIds = await this.campaignContract.getCampaignsByOrganizer(organizerAddress);
      const campaigns: ContractCampaign[] = [];

      for (const id of campaignIds) {
        const campaign = await this.getCampaignInfo(id);
        if (campaign) campaigns.push(campaign);
      }

      return campaigns;
    } catch (error) {
      console.error('Failed to get campaigns by organizer:', error);
      return [];
    }
  }

  // Donation Functions

  async donate(
    campaignId: string,
    amountEth: string,
    isAnonymous: boolean = false
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      if (!this.campaignContract) throw new Error('Campaign contract not initialized');

      const amountWei = parseEther(amountEth);
      
      // All donations are private: ETH automatically wraps to ZLETH and transfers privately
      const tx = await this.campaignContract.donate(campaignId, isAnonymous, {
        value: amountWei
      });
      const receipt = await tx.wait();
      
      return { success: true, txHash: receipt.hash };
    } catch (error: any) {
      return { success: false, error: error.message || 'Private donation failed' };
    }
  }

  async claimFunds(campaignId: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      if (!this.zlethContract) throw new Error('ZLETH contract not initialized');

      // Get organizer's ZLETH balance first
      const signer = await this.provider!.getSigner();
      const organizerAddress = await signer.getAddress();
      
      const zlethBalance = await this.zlethContract.balanceOf(organizerAddress);
      
      // Check if organizer has any ZLETH to claim
      // Note: We can't decrypt the balance here without special permissions
      // so we'll attempt the withdrawal and let it fail if balance is 0
      
      console.log('🏦 Withdrawing ZLETH directly from wrapper contract...');
      
      // Withdraw all ZLETH tokens directly from the wrapper (this will convert to ETH)
      const tx = await this.zlethContract.withdraw(organizerAddress, organizerAddress, zlethBalance);
      const receipt = await tx.wait();
      
      return { success: true, txHash: receipt.hash };
    } catch (error: any) {
      console.error('Claim error:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('Unauthorized')) {
        return { 
          success: false, 
          error: 'Unable to access ZLETH balance. Make sure you are the campaign organizer and have received donations.' 
        };
      }
      if (error.message?.includes('insufficient')) {
        return { 
          success: false, 
          error: 'No ZLETH balance to claim. Make sure your campaign has received donations first.' 
        };
      }
      
      return { success: false, error: error.message || 'Claim failed' };
    }
  }

  async getRecentDonations(campaignId: string, limit: number = 10) {
    try {
      if (!this.campaignContract) throw new Error('Campaign contract not initialized');

      const result = await this.campaignContract.getRecentDonations(campaignId, limit);
      const [donors, timestamps, isAnonymous] = result;
      
      const donations = [];
      const now = Math.floor(Date.now() / 1000);

      for (let i = 0; i < donors.length; i++) {
        const timestamp = Number(timestamps[i]);
        const timeAgo = this.formatTimeAgo(now - timestamp);
        const donor = isAnonymous[i] ? '0x0000000000000000000000000000000000000000' : donors[i];
        
        donations.push({
          donor,
          timestamp,
          timeAgo,
          isAnonymous: isAnonymous[i],
          isPrivate: true, // All donations are private
          displayName: isAnonymous[i] ? 'Anonymous' : `${donor.slice(0, 6)}...${donor.slice(-4)}`
        });
      }

      return donations;
    } catch (error) {
      console.error('Failed to get recent donations:', error);
      return [];
    }
  }

  private formatTimeAgo(seconds: number): string {
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  // Campaign Management Functions

  async completeCampaign(campaignId: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      if (!this.campaignContract) throw new Error('Campaign contract not initialized');

      const tx = await this.campaignContract.completeCampaign(campaignId);
      const receipt = await tx.wait();
      
      return { success: true, txHash: receipt.hash };
    } catch (error: any) {
      return { success: false, error: error.message || 'Campaign completion failed' };
    }
  }

  async allowOrganizerDecrypt(campaignId: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      if (!this.campaignContract) throw new Error('Campaign contract not initialized');

      const tx = await this.campaignContract.allowOrganizerDecrypt(campaignId);
      const receipt = await tx.wait();
      
      return { success: true, txHash: receipt.hash };
    } catch (error: any) {
      return { success: false, error: error.message || 'Decrypt permission failed' };
    }
  }

  async getEncryptedTotals(campaignId: string): Promise<{
    encryptedTotal?: string;
    encryptedCount?: string;
    error?: string;
  }> {
    try {
      if (!this.campaignContract) throw new Error('Campaign contract not initialized');

      const result = await this.campaignContract.getEncryptedTotals(campaignId);
      const [totalZLETH, donationCount] = result;
      
      return {
        encryptedTotal: totalZLETH.toString(),
        encryptedCount: donationCount.toString()
      };
    } catch (error: any) {
      return {
        error: error.message || 'Failed to get encrypted data'
      };
    }
  }

  // Organizer-specific functions
  async getCampaignMetrics(campaignId: string): Promise<{
    targetAmount: string;
    totalDonators: number;
    deadline: number;
    isActive: boolean;
    daysLeft: number;
  } | null> {
    try {
      const campaign = await this.getCampaignInfo(campaignId);
      if (!campaign) return null;

      return {
        targetAmount: campaign.targetAmount,
        totalDonators: campaign.publicDonorCount,
        deadline: campaign.deadline,
        isActive: campaign.isActive,
        daysLeft: campaign.daysLeft
      };
    } catch (error) {
      console.error('Failed to get campaign metrics:', error);
      return null;
    }
  }

  // Health check
  async isConfigured(): Promise<boolean> {
    return !!(CAMPAIGN_CONTRACT_ADDRESS && ZLETH_WRAPPER_ADDRESS);
  }

  getContractAddresses(): { campaign: string; zleth: string } {
    return {
      campaign: CAMPAIGN_CONTRACT_ADDRESS,
      zleth: ZLETH_WRAPPER_ADDRESS
    };
  }
}

// Singleton instance
export const zlethCampaignContract = new ZLETHCampaignContract();
