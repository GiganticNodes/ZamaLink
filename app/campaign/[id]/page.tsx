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
import { Campaign } from '@/types/creator';
import { Wallet, Shield } from 'lucide-react';
import Image from 'next/image';

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
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
      

      // Combine data
      const fullCampaign: Campaign = {
        id: campaignId,
        organizerAddress: campaignInfo.organizer,
        title: campaignInfo.title,
        description: campaignInfo.description,
        imageUrl: campaignInfo.imageUrl,
        targetAmount: campaignInfo.targetAmount,
        deadline: campaignInfo.deadline,
        publicDonatorCount: campaignInfo.publicDonorCount || 0,
        isActive: campaignInfo.isActive,
        isCompleted: false,
        finalAmountRevealed: false,
        category: campaignInfo.category,
        daysLeft: metrics?.daysLeft || 0
      };

      setCampaign(fullCampaign);
      

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
        <main className="relative z-10 container mx-auto px-4 py-16 pt-24 md:pt-28">
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-lg text-gray-600">Loading campaign details...</p>
          </div>
        </main>
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
      
      <div className="pt-28 md:pt-32 pb-12 px-4">
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
                  <div className="w-full h-64 md:h-96 bg-gradient-to-br from-orange-100 via-amber-50 to-red-100 flex items-center justify-center relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-4 left-4 w-12 h-12 bg-orange-300 rounded-full"></div>
                      <div className="absolute top-16 right-8 w-8 h-8 bg-red-300 rounded-full"></div>
                      <div className="absolute bottom-8 left-12 w-6 h-6 bg-amber-300 rounded-full"></div>
                      <div className="absolute bottom-16 right-4 w-10 h-10 bg-orange-400 rounded-full"></div>
                    </div>
                    
                    <div className="text-center z-10">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-200 to-red-200 rounded-2xl flex items-center justify-center shadow-lg">
                        <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">Visual Coming Soon</h3>
                      <p className="text-gray-500">Campaign image will be uploaded soon</p>
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
                
                {/* Progress Section */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-4 mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm text-gray-600">0 ETH raised</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-3 shadow-inner">
                    <div className="bg-gradient-to-r from-orange-400 to-red-400 h-3 rounded-full transition-all duration-300 ease-out" style={{width: '0%'}}></div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">0% of goal</span>
                    <span className="text-xs font-medium text-gray-700">{campaign.targetAmount} ETH goal</span>
                  </div>
                </div>

                {/* Campaign Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="text-2xl font-bold text-gray-800">{campaign.publicDonatorCount}</div>
                    <div className="text-sm text-gray-600">Supporters</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="text-2xl font-bold text-orange-600">{formatTimeLeft(campaign.deadline)}</div>
                    <div className="text-sm text-gray-600">Time Left</div>
                  </div>
                </div>

                {/* Organizer Info */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">{campaign.organizerAddress.slice(2, 4).toUpperCase()}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">Campaign Organizer</div>
                      <div className="font-mono text-xs text-gray-500">{campaign.organizerAddress.slice(0, 6)}...{campaign.organizerAddress.slice(-4)}</div>
                    </div>
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
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 px-6 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>Support This Campaign</span>
                    </button>
                  )}
                  
                  {/* Show message if campaign is not active */}
                  {!campaign.isActive && (
                    <div className="w-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 py-4 px-6 rounded-2xl text-center border border-gray-300">
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Campaign has ended</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Campaign Description */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-2 h-8 bg-gradient-to-b from-orange-400 to-red-400 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-gray-800">About This Campaign</h2>
                </div>
                <div className="text-gray-600 leading-relaxed text-lg whitespace-pre-wrap">
                  {campaign.description}
                </div>
              </div>
            </div>
            
            {/* Campaign Stats Sidebar */}
            <div className="space-y-6">
              {/* Impact Metrics */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Campaign Impact</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Funds Needed</span>
                    <span className="font-bold text-orange-600">{campaign.targetAmount} ETH</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Supporters</span>
                    <span className="font-bold text-green-600">{campaign.publicDonatorCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Days Active</span>
                    <span className="font-bold text-blue-600">{Math.max(0, Math.floor((Date.now() - (campaign.createdAt?.getTime() || Date.now())) / (1000 * 60 * 60 * 24)))}</span>
                  </div>
                </div>
              </div>
              
              {/* Trust Indicators */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Trust & Security</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-600">Blockchain Verified</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-600">Private Donations</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-600">Instant Transfers</span>
                  </div>
                </div>
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
