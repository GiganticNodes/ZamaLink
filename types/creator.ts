export interface Creator {
  id: string;
  name: string;
  walletAddress: string;
  twitterHandle?: string;
  farcasterUsername?: string;
  youtubeChannel?: string;
  avatar?: string;
  description?: string;
  totalDonations?: string;
  donationCount?: number;
  createdAt: Date;
}

export interface Donation {
  id: string;
  creatorId: string;
  donorAddress: string;
  amount: string;
  transactionHash: string;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface CreatorFormData {
  name: string;
  twitterHandle?: string;
  farcasterUsername?: string;
  youtubeChannel?: string;
  description?: string;
}