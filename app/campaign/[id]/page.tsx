'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/header';
import { BackgroundEffects } from '@/components/background-effects';
import { DonationModal } from '@/components/donation-modal';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { privateCampaignDonationContract } from '@/lib/contract';
import { Campaign, RecentDonation } from '@/types/creator';
import Image from 'next/image';

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [recentDonations, setRecentDonations] = useState<RecentDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCampaignDetails();
  }, [campaignId]);

  const loadCampaignDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load campaign info
      const campaignInfo = await privateCampaignDonationContract.getCampaignInfo(campaignId);
      if (!campaignInfo) {
        setError('Campaign not found');
        return;
      }

      // Load metrics
      const metrics = await privateCampaignDonationContract.getCampaignMetrics(campaignId);
      
      // Load recent donations
      const donations = await privateCampaignDonationContract.getRecentDonations(campaignId);

      // Combine data
      const fullCampaign: Campaign = {
        id: campaignId,
        organizer: campaignInfo.organizer,
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
        daysLeft: campaignInfo.daysLeft || 0,
        totalDonators: metrics?.totalDonators || 0,
        progressPercentage: 0 // Will calculate if revealed
      };

      setCampaign(fullCampaign);
      setRecentDonations(donations);

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

  const getCategoryName = (category: number) => {
    const categories = ['Disaster Relief', 'Medical', 'Education', 'Environment', 'Social', 'Emergency', 'Other'];
    return categories[category] || 'Other';
  };

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
                      <div className="text-4xl mb-2">📸</div>
                      <p>No image</p>
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
                    <span className="font-mono text-sm">{campaign.organizer.slice(0, 6)}...{campaign.organizer.slice(-4)}</span>
                  </div>
                </div>
                
                {campaign.isActive && (
                  <button
                    onClick={() => setShowDonationModal(true)}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-neumorphic font-semibold transition-colors"
                  >
                    Donate Now
                  </button>
                )}
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
                            {donation.isAnonymous ? 'Anonymous' : `${donation.donor.slice(0, 6)}...${donation.donor.slice(-4)}`}
                          </div>
                          <div className="text-xs text-gray-500">{donation.timeAgo}</div>
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

      {/* Donation Modal */}
      {showDonationModal && (
        <DonationModal
          campaign={campaign}
          onClose={() => setShowDonationModal(false)}
          onDonationComplete={() => {
            setShowDonationModal(false);
            loadCampaignDetails(); // Refresh data
          }}
        />
      )}
    </div>
  );
}
