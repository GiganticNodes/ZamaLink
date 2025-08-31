import { Creator, Donation } from '@/types/creator';

// Simple localStorage-based storage for demo purposes
// In production, you'd use a proper database

export const creatorStorage = {
  getAll: (): Creator[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('creators');
    return stored ? JSON.parse(stored) : [];
  },

  getById: (id: string): Creator | null => {
    const creators = creatorStorage.getAll();
    return creators.find(c => c.id === id) || null;
  },

  save: (creator: Creator): void => {
    if (typeof window === 'undefined') return;
    const creators = creatorStorage.getAll();
    const existingIndex = creators.findIndex(c => c.id === creator.id);
    
    if (existingIndex >= 0) {
      creators[existingIndex] = creator;
    } else {
      creators.push(creator);
    }
    
    localStorage.setItem('creators', JSON.stringify(creators));
  },

  getByWallet: (walletAddress: string): Creator | null => {
    const creators = creatorStorage.getAll();
    return creators.find(c => c.walletAddress.toLowerCase() === walletAddress.toLowerCase()) || null;
  }
};

export const donationStorage = {
  getAll: (): Donation[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('donations');
    return stored ? JSON.parse(stored) : [];
  },

  getByCreator: (creatorId: string): Donation[] => {
    const donations = donationStorage.getAll();
    return donations.filter(d => d.campaignId === creatorId);
  },

  save: (donation: Donation): void => {
    if (typeof window === 'undefined') return;
    const donations = donationStorage.getAll();
    const existingIndex = donations.findIndex(d => d.id === donation.id);
    
    if (existingIndex >= 0) {
      donations[existingIndex] = donation;
    } else {
      donations.push(donation);
    }
    
    localStorage.setItem('donations', JSON.stringify(donations));
  }
};

// Initialize with some sample creators
// Campaign storage for caching blockchain data
export const campaignStorage = {
  getAll: () => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('campaigns_cache');
    return stored ? JSON.parse(stored) : [];
  },
  
  clear: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('campaigns_cache');
  },
  
  save: (campaigns: any[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('campaigns_cache', JSON.stringify(campaigns));
  }
};

// Clear old campaign data and system cache
export const clearLegacyData = () => {
  if (typeof window === 'undefined') return;
  
  console.log('🧹 Clearing legacy campaign data...');
  
  // Remove old campaign cache
  localStorage.removeItem('campaigns_cache');
  localStorage.removeItem('legacy_campaigns');
  localStorage.removeItem('contract_campaigns');
  
  // Clear any cached contract data
  localStorage.removeItem('campaign_metrics_cache');
  localStorage.removeItem('donation_cache');
  
  console.log('✅ Legacy data cleared - now using ZLETH system only');
};

export const initializeSampleData = () => {
  if (typeof window === 'undefined') return;
  
  // Clear legacy data first
  clearLegacyData();
  
  const existing = creatorStorage.getAll();
  if (existing.length === 0) {
    const sampleCreators: Creator[] = [
      {
        id: '1',
        name: 'Alex Crypto',
        walletAddress: '0x1234567890123456789012345678901234567890',
        description: 'Web3 educator and blockchain enthusiast',
        totalDonations: '0',
        donationCount: 0,
        createdAt: new Date(),
      },
      {
        id: '2',
        name: 'Sarah DeFi',
        walletAddress: '0x2345678901234567890123456789012345678901',
        description: 'DeFi protocols and yield farming expert',
        totalDonations: '0',
        donationCount: 0,
        createdAt: new Date(),
      },
      {
        id: '3',
        name: 'Mike NFT',
        walletAddress: '0x3456789012345678901234567890123456789012',
        description: 'NFT collector and digital art curator',
        totalDonations: '0',
        donationCount: 0,
        createdAt: new Date(),
      },
    ];
    
    sampleCreators.forEach(creator => creatorStorage.save(creator));
  }
};