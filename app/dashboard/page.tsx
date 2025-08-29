'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Header } from '@/components/header';
import { BackgroundEffects } from '@/components/background-effects';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Campaign, CampaignCategory, getCategoryDisplayName, formatTimeLeft } from '@/types/creator';
import { zlethCampaignContract } from '@/lib/zleth-contract';
import { BarChart3, Eye, EyeOff, Calendar, Target, Users, Wallet, Plus, Settings } from 'lucide-react';
import Link from 'next/link';
import { ClaimFundsModal } from '@/components/claim-funds-modal';

interface OrganizerCampaignView extends Campaign {
  decryptedTotalDonations: string;
  decryptedDonationCount: number;
  progressPercentage: number;
}

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<OrganizerCampaignView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDecrypted, setShowDecrypted] = useState<{[key: string]: boolean}>({});
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const { address, isConnected } = useAccount();

  useEffect(() => {
    if (!isConnected || !address) {
      setLoading(false);
      return;
    }

    loadOrganizerCampaigns();
  }, [isConnected, address]);

  const loadOrganizerCampaigns = async () => {
    if (!address) return;

    try {
      setLoading(true);
      await zlethCampaignContract.initialize(window.ethereum);
      
      // Get campaigns by organizer directly (more efficient)
      const organizerCampaigns = await zlethCampaignContract.getCampaignsByOrganizer(address);

      // For each campaign, get decrypted metrics (only organizer can see this)
      const campaignsWithDecryption = await Promise.all(
        organizerCampaigns.map(async (campaign) => {
          try {
            // Get decrypted metrics from contract (only works for organizer)
            const metrics = await privateCampaignDonationContract.getOrganizerCampaignView(campaign.id);
            
            const progressPercentage = metrics.decryptedTotalDonations && campaign.targetAmount ? 
              (parseFloat(metrics.decryptedTotalDonations) / parseFloat(campaign.targetAmount)) * 100 : 0;

            return {
              ...campaign,
              decryptedTotalDonations: metrics.decryptedTotalDonations || '0',
              decryptedDonationCount: metrics.decryptedDonationCount || 0,
              progressPercentage: Math.min(progressPercentage, 100),
            };
          } catch (error) {
            console.error('Failed to decrypt campaign data:', error);
            // Fallback to encrypted data
            return {
              ...campaign,
              decryptedTotalDonations: '0',
              decryptedDonationCount: 0,
              progressPercentage: 0,
            };
          }
        })
      );

      setCampaigns(campaignsWithDecryption);
    } catch (error: any) {
      console.error('Failed to load organizer campaigns:', error);
      setError('Failed to load campaigns. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDecryptedView = (campaignId: string) => {
    setShowDecrypted(prev => ({
      ...prev,
      [campaignId]: !prev[campaignId]
    }));
  };

  const handleCompleteCampaign = async (campaignId: string) => {
    if (!address) return;
    try {
      const result = await zlethCampaignContract.completeCampaign(campaignId);
      if (result.success) {
        alert('✅ Campaign completed successfully!');
        // Reload campaigns
        await loadOrganizerCampaigns();
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Failed to complete campaign:', error);
      alert('Failed to complete campaign: ' + (error.message || 'Unknown error'));
    }
  };

  const handleClaimFunds = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setClaimModalOpen(true);
  };

  const handleClaimSuccess = async (txHash: string) => {
    console.log('✅ Funds claimed successfully:', txHash);
    // Reload campaigns to update state
    await loadOrganizerCampaigns();
    setClaimModalOpen(false);
    setSelectedCampaign(null);
  };

  const handleAllowDecryption = async (campaignId: string) => {
    if (!address) return;
    try {
      const result = await zlethCampaignContract.allowOrganizerDecrypt(campaignId);
      if (result.success) {
        alert('✅ Decryption permission granted! You can now see private totals.');
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Failed to allow decryption:', error);
      alert('Failed to grant decryption permission: ' + (error.message || 'Unknown error'));
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen">
        <BackgroundEffects />
        <Header />
        
        <main className="relative z-10 container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <Wallet className="w-16 h-16 text-orange-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Organizer Dashboard
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Connect your wallet to view your campaigns
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <BackgroundEffects />
        <Header />
        
        <main className="relative z-10 container mx-auto px-4 py-16">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-lg text-gray-600">Loading your campaigns...</p>
          </div>
        </main>
      </div>
    );
  }

  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.isActive).length;
  const completedCampaigns = campaigns.filter(c => c.isCompleted).length;
  const totalRaised = campaigns.reduce((sum, c) => sum + parseFloat(c.decryptedTotalDonations || '0'), 0);

  return (
    <div className="min-h-screen">
      <BackgroundEffects />
      <Header />
      
      <main className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Organizer Dashboard
              </h1>
              <p className="text-gray-600">
                Manage your campaigns and view real progress
              </p>
            </div>
            <Link 
              href="/create-campaign"
              className="neumorphic-button px-6 py-3 flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Campaign</span>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="neumorphic-card p-6 text-center">
              <BarChart3 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">{totalCampaigns}</div>
              <div className="text-sm text-gray-600">Total Campaigns</div>
            </div>
            
            <div className="neumorphic-card p-6 text-center">
              <Target className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">{activeCampaigns}</div>
              <div className="text-sm text-gray-600">Active Campaigns</div>
            </div>
            
            <div className="neumorphic-card p-6 text-center">
              <Calendar className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">{completedCampaigns}</div>
              <div className="text-sm text-gray-600">Completed Campaigns</div>
            </div>
            
            <div className="neumorphic-card p-6 text-center">
              <Wallet className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">{totalRaised.toFixed(4)} ETH</div>
              <div className="text-sm text-gray-600">Total Raised</div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-neumorphic p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Campaigns List */}
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No Campaigns Yet
              </h3>
              <p className="text-gray-500 mb-6">
                Start by creating your first campaign
              </p>
              <Link 
                href="/create-campaign"
                className="neumorphic-button px-6 py-3 inline-flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Create First Campaign</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Your Campaigns</h2>
              
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="neumorphic-card p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                    {/* Campaign Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{campaign.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {getCategoryDisplayName(campaign.category)}
                            </span>
                            <span className={`px-2 py-1 rounded-full ${
                              campaign.isCompleted ? 'bg-gray-100 text-gray-600' :
                              campaign.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                            }`}>
                              {campaign.isCompleted ? 'Completed' : campaign.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => toggleDecryptedView(campaign.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title={showDecrypted[campaign.id] ? 'Hide real data' : 'Show real data'}
                        >
                          {showDecrypted[campaign.id] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">{campaign.description}</p>
                      
                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">
                            {showDecrypted[campaign.id] ? 
                              `${campaign.decryptedTotalDonations} / ${campaign.targetAmount} ETH (${campaign.progressPercentage.toFixed(1)}%)` :
                              `*** / ${campaign.targetAmount} ETH (Encrypted)`
                            }
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full transition-all"
                            style={{ width: showDecrypted[campaign.id] ? `${campaign.progressPercentage}%` : '0%' }}
                          />
                        </div>
                      </div>
                      
                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="text-center p-3 bg-gray-50 rounded-neumorphic">
                          <Users className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                          <div className="font-semibold text-gray-800">
                            {showDecrypted[campaign.id] ? campaign.decryptedDonationCount : '***'}
                          </div>
                          <div className="text-xs text-gray-600">Donors</div>
                        </div>
                        
                        <div className="text-center p-3 bg-gray-50 rounded-neumorphic">
                          <Calendar className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                          <div className="font-semibold text-gray-800">
                            {campaign.daysLeft !== undefined ? formatTimeLeft(campaign.daysLeft) : 'N/A'}
                          </div>
                          <div className="text-xs text-gray-600">Time Left</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col space-y-2 lg:ml-6">
                      <Link 
                        href={`/campaign/${campaign.id}`}
                        className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-neumorphic text-center transition-colors"
                      >
                        View Campaign
                      </Link>
                      
                      {/* Claim Funds - Available for any campaign with donations */}
                      <button
                        onClick={() => handleClaimFunds(campaign)}
                        className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-neumorphic transition-colors flex items-center justify-center space-x-2"
                        title="Claim all ZLETH donations and convert to ETH"
                      >
                        <Wallet className="w-4 h-4" />
                        <span>Claim Funds</span>
                      </button>

                      {/* Grant Decryption Permission */}
                      <button
                        onClick={() => handleAllowDecryption(campaign.id)}
                        className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-neumorphic transition-colors flex items-center justify-center space-x-2"
                        title="Allow yourself to decrypt private donation totals"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Enable Decrypt</span>
                      </button>
                      
                      {campaign.isActive && !campaign.isCompleted && (
                        <button
                          onClick={() => handleCompleteCampaign(campaign.id)}
                          className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-neumorphic transition-colors"
                        >
                          Complete Campaign
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Claim Funds Modal */}
      {selectedCampaign && (
        <ClaimFundsModal
          campaign={selectedCampaign}
          isOpen={claimModalOpen}
          onClose={() => {
            setClaimModalOpen(false);
            setSelectedCampaign(null);
          }}
          onSuccess={handleClaimSuccess}
        />
      )}
    </div>
  );
}
