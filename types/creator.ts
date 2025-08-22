export enum CampaignCategory {
  DISASTER_RELIEF = 'DISASTER_RELIEF',
  MEDICAL = 'MEDICAL',
  EDUCATION = 'EDUCATION',
  ENVIRONMENT = 'ENVIRONMENT',
  SOCIAL = 'SOCIAL',
  EMERGENCY = 'EMERGENCY',
  OTHER = 'OTHER'
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  organizerAddress: string;
  organizerName?: string;
  targetAmount: string; // Target amount in wei (public)
  deadline: number; // Unix timestamp
  category: CampaignCategory;
  publicDonatorCount: number; // Public count for social proof
  isActive: boolean;
  isCompleted: boolean;
  finalAmountRevealed: boolean;
  revealedFinalAmount?: string; // Only set if organizer reveals at end
  daysLeft?: number;
  createdAt?: Date;
  // Private fields (only accessible by organizer)
  totalDonations?: string; // Encrypted
  donationCount?: number; // Encrypted
}

// Legacy Creator interface for backward compatibility
export interface Creator {
  id: string;
  name: string;
  walletAddress: string;
  description?: string;
  totalDonations?: string;
  donationCount?: number;
  createdAt?: Date;
}

export interface Donation {
  id: string;
  campaignId: string;
  donorAddress: string; // Will be address(0) for anonymous donations
  amount: string; // Always "Dirahasiakan" for public view
  transactionHash: string;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
  isAnonymous: boolean;
}

export interface CampaignFormData {
  title: string;
  description: string;
  imageUrl?: string;
  targetAmount: string;
  duration: number; // in days
  category: CampaignCategory;
  organizerName?: string;
}

export interface CampaignMetrics {
  targetAmount: string;
  totalDonators: number;
  deadline: number;
  isActive: boolean;
  daysLeft: number;
}

export interface CampaignInfo {
  organizer: string;
  title: string;
  description: string;
  imageUrl: string;
  targetAmount: string;
  deadline: number;
  publicDonatorCount: number;
  isActive: boolean;
  category: CampaignCategory;
}

// For organizer dashboard (private view)
export interface OrganizerCampaignView extends Campaign {
  actualTotalDonations: string; // Decrypted amount
  actualDonationCount: number; // Decrypted count
  progressPercentage: number; // Calculated from actual vs target
}

// For milestone system
export interface Milestone {
  percentage: number; // 25, 50, 75, 100
  amount: string;
  reached: boolean;
  reachedAt?: Date;
}

export interface RecentDonation {
  donorAddress: string; // address(0) for anonymous
  timestamp: number;
  isAnonymous: boolean;
  displayName: string; // "Hamba Allah" for anonymous, shortened address otherwise
}

// Helper functions for campaign display
export function getCategoryDisplayName(category: CampaignCategory): string {
  const names = {
    [CampaignCategory.DISASTER_RELIEF]: 'Disaster Relief',
    [CampaignCategory.MEDICAL]: 'Medical',
    [CampaignCategory.EDUCATION]: 'Education', 
    [CampaignCategory.ENVIRONMENT]: 'Environment',
    [CampaignCategory.SOCIAL]: 'Social',
    [CampaignCategory.EMERGENCY]: 'Emergency',
    [CampaignCategory.OTHER]: 'Other'
  };
  return names[category] || 'Other';
};

export const formatTimeLeft = (daysLeft: number): string => {
  if (daysLeft === 0) return 'Ending today';
  if (daysLeft === 1) return '1 day left';
  return `${daysLeft} days left`;
};

export const formatDonatorCount = (count: number): string => {
  if (count === 0) return 'No donors yet';
  if (count === 1) return '1 donor';
  return `${count} donors`;
};