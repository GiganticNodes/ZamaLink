'use client';

import { useEffect, useState, useMemo } from 'react';
import { Header } from '@/components/header';
import { BackgroundEffects } from '@/components/background-effects';
import { CampaignCard } from '@/components/campaign-card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { CampaignGridSkeleton } from '@/components/ui/campaign-skeleton';
import { SearchBar } from '@/components/ui/search-bar';
import { Campaign, CampaignCategory } from '@/types/creator';
import { zlethCampaignContract } from '@/lib/zleth-contract';
import { clearLegacyData } from '@/lib/storage';
import { Users, Heart, Zap, Calendar, Target } from 'lucide-react';

export default function Home() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CampaignCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
    // Clear any legacy campaign data on app startup
    clearLegacyData();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const loadCampaigns = async () => {
      try {
        // Clear any cached campaign data to ensure fresh blockchain data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('campaigns_cache');
          localStorage.removeItem('contract_campaigns');
          localStorage.removeItem('campaign_metrics_cache');
        }
        
        try {
          await zlethCampaignContract.initialize(window.ethereum);
        } catch (initError) {
          console.warn('Could not initialize with wallet, trying read-only mode:', initError);
          try {
            await zlethCampaignContract.initializeReadOnly();
            console.log('✅ Read-only mode initialized successfully');
          } catch (readOnlyError) {
            console.error('Failed to initialize in read-only mode:', readOnlyError);
            setCampaigns([]);
            return;
          }
        }
        
        const contractCampaigns = await zlethCampaignContract.getActiveCampaigns();
        
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
          publicDonatorCount: cc.publicDonorCount,
          isActive: cc.isActive,
          isCompleted: false,
          finalAmountRevealed: false,
          daysLeft: cc.daysLeft,
          createdAt: new Date() // Placeholder since contract doesn't store this
        }));
        
        setCampaigns(formattedCampaigns);
      } catch (error) {
        console.log('Could not load campaigns from blockchain:', error instanceof Error ? error.message : String(error));
        setCampaigns([]); // Show empty state
      } finally {
        setLoading(false);
      }
    };
    
    loadCampaigns();
  }, [mounted]);

  // Filter campaigns based on search query and category
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      const matchesCategory = selectedCategory === 'ALL' || campaign.category === selectedCategory;
      const matchesSearch = searchQuery === '' || 
        campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [campaigns, selectedCategory, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <BackgroundEffects />
        <Header />
        
        <main className="relative z-10 pt-24 md:pt-28">
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

          {/* Loading Skeleton */}
          <section className="container mx-auto px-4 pb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Loading Campaigns...
              </h2>
              <p className="text-xs md:text-sm text-gray-600 max-w-lg mx-auto">
                Please wait while we fetch the latest campaigns
              </p>
            </div>
            <CampaignGridSkeleton count={6} />
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <BackgroundEffects />
      <Header />
      
      <main className="relative z-10 pt-24 md:pt-28">
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
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Active Campaigns
              </h2>
              <p className="text-xs md:text-sm text-gray-600">
                Find campaigns you want to support
              </p>
            </div>
            <div className="lg:w-96">
              <SearchBar 
                placeholder="Search campaigns..."
                onSearch={handleSearch}
                className=""
              />
            </div>
          </div>

          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-16">
              <div className="neumorphic-card p-12 max-w-md mx-auto">
                <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {searchQuery ? 'No Results Found' : selectedCategory === 'ALL' ? 'No Campaigns Yet' : 'No Campaigns Found'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery 
                    ? `No campaigns match "${searchQuery}". Try different keywords or browse all campaigns.`
                    : selectedCategory === 'ALL' 
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
              {/* Campaign Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCampaigns.map((campaign, index) => (
                  <CampaignCard 
                    key={campaign.id} 
                    campaign={campaign} 
                    index={index}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}