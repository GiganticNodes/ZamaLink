'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { BackgroundEffects } from '@/components/background-effects';
import { CampaignCard } from '@/components/campaign-card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Campaign, CampaignCategory } from '@/types/creator';
import { privateCampaignDonationContract } from '@/lib/contract';
import { Users, Heart, Zap, Calendar, Target } from 'lucide-react';

export default function Home() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CampaignCategory | 'ALL'>('ALL');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const loadCampaigns = async () => {
      try {
        // Check if we're in browser and have ethereum provider
        if (typeof window !== 'undefined' && window.ethereum) {
          await privateCampaignDonationContract.initialize(window.ethereum);
          const contractCampaigns = await privateCampaignDonationContract.getActiveCampaigns();
          
          // Convert contract campaigns to Campaign type format
          const formattedCampaigns: Campaign[] = contractCampaigns.map((cc) => ({
            id: cc.id,
            title: cc.title,
            description: cc.description,
            imageUrl: cc.imageUrl,
            organizerAddress: cc.organizer,
            targetAmount: cc.targetAmount,
            deadline: cc.deadline,
            category: cc.category,
            publicDonatorCount: cc.publicDonatorCount,
            isActive: cc.isActive,
            isCompleted: false,
            finalAmountRevealed: false,
            daysLeft: cc.daysLeft,
            createdAt: new Date() // Placeholder since contract doesn't store this
          }));
          
          setCampaigns(formattedCampaigns);
        } else {
          setCampaigns([]); // No wallet or SSR, show empty state
        }
      } catch (error) {
        console.log('Could not load campaigns from blockchain:', error);
        setCampaigns([]); // Show empty state
      } finally {
        setLoading(false);
      }
    };
    
    loadCampaigns();
  }, [mounted]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <BackgroundEffects />
      <Header />
      
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-3 leading-tight">
              Private Donation Platform
              <br />
              <span className="bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                with FHEVM
              </span>
            </h1>
            <p className="text-base text-gray-600 mb-4 leading-relaxed">
              Donate to meaningful campaigns with guaranteed privacy. 
              Your donation amounts are fully encrypted using Zama FHEVM.
            </p>
          </div>
        </section>

        {/* Campaign Categories Filter */}
        <section className="container mx-auto px-4 pb-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === 'ALL' 
                  ? 'bg-orange-400 text-white shadow-lg' 
                  : 'bg-white text-gray-600 hover:bg-orange-50 shadow-neumorphic'
              }`}
            >
              All
            </button>
            {Object.values(CampaignCategory).map((category) => {
              const categoryNames = {
                [CampaignCategory.DISASTER_RELIEF]: 'Disaster Relief',
                [CampaignCategory.MEDICAL]: 'Medical',
                [CampaignCategory.EDUCATION]: 'Education',
                [CampaignCategory.ENVIRONMENT]: 'Environment',
                [CampaignCategory.SOCIAL]: 'Social',
                [CampaignCategory.EMERGENCY]: 'Emergency',
                [CampaignCategory.OTHER]: 'Other'
              };
              
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'bg-white text-gray-600 hover:bg-orange-50 border border-gray-200'
                  }`}
                >
                  {categoryNames[category]}
                </button>
              );
            })}
          </div>
        </section>

        {/* Campaigns Section */}
        <section className="container mx-auto px-4 pb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Active Campaigns
            </h2>
            <p className="text-xs md:text-sm text-gray-600 max-w-lg mx-auto">
              Find campaigns you want to support
            </p>
          </div>

          {campaigns.filter(campaign => 
            selectedCategory === 'ALL' || campaign.category === selectedCategory
          ).length === 0 ? (
            <div className="text-center py-16">
              <div className="neumorphic-card p-12 max-w-md mx-auto">
                <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {selectedCategory === 'ALL' ? 'No Campaigns Yet' : 'No Campaigns Found'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {selectedCategory === 'ALL' 
                    ? 'Be the first to create a fundraising campaign!' 
                    : 'No campaigns found for this category.'
                  }
                </p>
                <a
                  href="/create-campaign"
                  className="inline-block neumorphic-button px-6 py-3 text-white font-bold"
                >
                  Create Campaign
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* Stats Bar */}
              <div className="flex justify-center mb-8">
                <div className="bg-white rounded-lg shadow-lg p-6 flex items-center space-x-8">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Target className="w-5 h-5 text-orange-500 mr-2" />
                      <span className="text-2xl font-bold text-gray-800">
                        {campaigns.filter(c => selectedCategory === 'ALL' || c.category === selectedCategory).length}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Active Campaigns</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Users className="w-5 h-5 text-blue-500 mr-2" />
                      <span className="text-2xl font-bold text-gray-800">
                        {campaigns.reduce((sum, c) => sum + c.publicDonatorCount, 0)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Total Donors</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Heart className="w-5 h-5 text-red-500 mr-2" />
                      <span className="text-2xl font-bold text-gray-800">
                        Secret
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Private Funds ✨</p>
                  </div>
                </div>
              </div>

              {/* Campaign Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {campaigns
                  .filter(campaign => selectedCategory === 'ALL' || campaign.category === selectedCategory)
                  .map((campaign, index) => (
                    <CampaignCard 
                      key={campaign.id} 
                      campaign={campaign} 
                      index={index}
                    />
                  ))
                }
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}