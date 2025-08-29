'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Header } from '@/components/header';
import { BackgroundEffects } from '@/components/background-effects';
import { PrivateDonationModal } from '@/components/private-donation-modal';
import { ClaimFundsModal } from '@/components/claim-funds-modal';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { zlethCampaignContract } from '@/lib/zleth-contract';
import { Campaign, RecentDonation } from '@/types/creator';
import { Wallet, Shield } from 'lucide-react';
import Image from 'next/image';

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [recentDonations, setRecentDonations] = useState<RecentDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { address, isConnected } = useAccount();

  useEffect(() => {
    loadCampaignDetails();
  }, [campaignId]);

  const loadCampaignDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize ZLETH contract system
      if (typeof window !== 'undefined' && window.ethereum) {
        await zlethCampaignContract.initialize(window.ethereum);
      } else {
        await zlethCampaignContract.initializeReadOnly();
      }

      // Load campaign info
      const campaignInfo = await zlethCampaignContract.getCampaignInfo(campaignId);
      if (!campaignInfo) {
        setError('Campaign not found');
        return;
      }

      // Load metrics
      const metrics = await zlethCampaignContract.getCampaignMetrics(campaignId);
      
      // Load recent donations
      const donations = await zlethCampaignContract.getRecentDonations(campaignId, 10);

      // Combine data
      const fullCampaign: Campaign = {
        id: campaignId,
        organizerAddress: campaignInfo.organizer,
        title: campaignInfo.title,
        description: campaignInfo.description,
        imageUrl: campaignInfo.imageUrl,
        targetAmount: campaignInfo.targetAmount,
        deadline: campaignInfo.deadline,
        publicDonatorCount: campaignInfo.publicDonatorCount,
        isActive: campaignInfo.isActive,
        isCompleted: campaignInfo.isCompleted || false,
        finalAmountRevealed: campaignInfo.finalAmountRevealed || false,
        category: campaignInfo.category,
        daysLeft: metrics?.daysLeft || 0
      };

      setCampaign(fullCampaign);
      
      // Map donations from ZLETH system format to RecentDonation format
      const mappedDonations: RecentDonation[] = donations.map(donation => ({
        donorAddress: donation.donor,
        timestamp: donation.timestamp,
        isAnonymous: donation.isAnonymous,
        displayName: donation.displayName || (donation.isAnonymous ? 'Anonymous' : `${donation.donor.slice(0, 6)}...${donation.donor.slice(-4)}`)
      }));
      
      setRecentDonations(mappedDonations);

    } catch (error) {
      console.error('Failed to load campaign details:', error instanceof Error ? error.message : String(error));
      setError('Failed to load campaign details');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeLeft = (deadline: number) => {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = deadline - now;
    
    if (timeLeft <= 0) return 'Ended';
    
    const days = Math.floor(timeLeft / 86400);
    const hours = Math.floor((timeLeft % 86400) / 3600);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
    return `${hours} hour${hours > 1 ? 's' : ''} left`;
  };

  const getCategoryName = (category: any) => {
    // Handle both enum and numeric values
    if (typeof category === 'string') {
      const nameMap: { [key: string]: string } = {
        'DISASTER_RELIEF': 'Disaster Relief',
        'MEDICAL': 'Medical',
        'EDUCATION': 'Education',
        'ENVIRONMENT': 'Environment',
        'SOCIAL': 'Social',
        'EMERGENCY': 'Emergency',
        'OTHER': 'Other'
      };
      return nameMap[category] || 'Other';
    }
    
    // Fallback for numeric values
    const categories = ['Disaster Relief', 'Medical', 'Education', 'Environment', 'Social', 'Emergency', 'Other'];
    return categories[category] || 'Other';
  };

  const handleClaimSuccess = async (txHash: string) => {
    console.log('✅ Funds claimed successfully:', txHash);
    // Reload campaign details to update state
    await loadCampaignDetails();
    setShowClaimModal(false);
  };

  // Check if current user is the organizer
  const isOrganizer = campaign && address && 
    campaign.organizerAddress.toLowerCase() === address.toLowerCase();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <BackgroundEffects />
        <Header />
        <div className="flex justify-center items-center pt-24">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <BackgroundEffects />
        <Header />
        <div className="pt-24 px-4 text-center">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Campaign Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The campaign you are looking for does not exist.'}</p>
            <a href="/" className="bg-orange-500 text-white px-6 py-2 rounded-neumorphic hover:bg-orange-600 transition-colors">
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <BackgroundEffects />
      <Header />
      
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Campaign Header */}
          <div className="neumorphic-card mb-8 overflow-hidden">
            <div className="md:flex">
              {/* Campaign Image */}
              <div className="md:w-1/2">
                {campaign.imageUrl ? (
                  <Image
                    src={campaign.imageUrl}
                    alt={campaign.title}
                    width={600}
                    height={400}
                    className="w-full h-64 md:h-96 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 md:h-96 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-2">No Image</div>
                      <p>Campaign image not available</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Campaign Info */}
              <div className="md:w-1/2 p-6">
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                    {getCategoryName(campaign.category)}
                  </span>
                  <span className={`inline-block px-3 py-1 text-sm rounded-full ml-2 ${
                    campaign.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {campaign.isActive ? 'Active' : 'Ended'}
                  </span>
                </div>
                
                <h1 className="text-3xl font-bold text-gray-800 mb-4">{campaign.title}</h1>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Target Amount:</span>
                    <span className="font-semibold">{campaign.targetAmount} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Donators:</span>
                    <span className="font-semibold">{campaign.publicDonatorCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time Left:</span>
                    <span className="font-semibold">{formatTimeLeft(campaign.deadline)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Organizer:</span>
                    <span className="font-mono text-sm">{campaign.organizerAddress.slice(0, 6)}...{campaign.organizerAddress.slice(-4)}</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-3">
                  {/* Show organizer controls if user is the organizer */}
                  {isOrganizer && (
                    <div className="bg-blue-50 border border-blue-200 rounded-neumorphic p-4 mb-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-800">Organizer Controls</span>
                      </div>
                      <div className="space-y-2">
                        <button
                          onClick={() => setShowClaimModal(true)}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
                        >
                          <Wallet className="w-4 h-4" />
                          <span>Claim Donated Funds</span>
                        </button>
                        <p className="text-xs text-blue-600">
                          Claim all ZLETH donations and convert to ETH in your wallet
                        </p>
                      </div>
                    </div>
                  )}
                
                  {/* Donation button for everyone else */}
                  {campaign.isActive && !isOrganizer && (
                    <button
                      onClick={() => setShowDonationModal(true)}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-neumorphic font-semibold transition-colors"
                    >
                      Donate Now
                    </button>
                  )}
                  
                  {/* Show message if campaign is not active */}
                  {!campaign.isActive && (
                    <div className="w-full bg-gray-100 text-gray-500 py-3 px-6 rounded-neumorphic text-center">
                      Campaign has ended
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Campaign Description */}
            <div className="md:col-span-2">
              <div className="neumorphic-card p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">About This Campaign</h2>
                <div className="text-gray-600 whitespace-pre-wrap">
                  {campaign.description}
                </div>
              </div>
            </div>
            
            {/* Recent Donations */}
            <div>
              <div className="neumorphic-card p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Donations</h3>
                {recentDonations.length > 0 ? (
                  <div className="space-y-3">
                    {recentDonations.map((donation, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <div>
                          <div className="font-medium text-sm">
                            {donation.isAnonymous ? 'Anonymous' : `${donation.donorAddress.slice(0, 6)}...${donation.donorAddress.slice(-4)}`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(donation.timestamp * 1000).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-green-600 font-semibold text-sm">
                          Donated
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No donations yet. Be the first!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PrivateDonationModal
        isOpen={showDonationModal}
        campaign={campaign}
        onClose={() => setShowDonationModal(false)}
        onSuccess={() => {
          setShowDonationModal(false);
          loadCampaignDetails(); // Refresh data
        }}
      />
      
      {campaign && (
        <ClaimFundsModal
          campaign={campaign}
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
          onSuccess={handleClaimSuccess}
        />
      )}
    </div>
  );
}
