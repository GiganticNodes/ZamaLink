'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/header';
import { BackgroundEffects } from '@/components/background-effects';
import { DonationModal } from '@/components/donation-modal';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Creator, Donation } from '@/types/creator';
import { privateCampaignDonationContract } from '@/lib/contract';
import { 
  Twitter, 
  Youtube, 
  ExternalLink, 
  Heart, 
  Calendar,
  Wallet,
  TrendingUp,
  Users
} from 'lucide-react';
import Image from 'next/image';

export default function CreatorPage() {
  const params = useParams();
  const creatorId = params.id as string;
  
  const [creator, setCreator] = useState<Creator | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [recentDonations, setRecentDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDonationModal, setShowDonationModal] = useState(false);

  useEffect(() => {
    if (creatorId) {
      const loadCreator = async () => {
        try {
          if (typeof window !== 'undefined' && window.ethereum) {
            await privateCampaignDonationContract.initialize(window.ethereum);
            
            // Legacy creator page - show placeholder data
            const formattedCreator: Creator = {
              id: creatorId,
              name: 'Legacy Creator',
              walletAddress: '0x0000000000000000000000000000000000000000',
              description: 'This is a legacy creator profile. New features are available in campaign pages.'
            };
            
            setCreator(formattedCreator);
            setDonations([]);
          } else {
            setCreator(null); // No wallet or SSR
          }
        } catch (error) {
          console.error('Failed to load creator:', error);
          setCreator(null);
        } finally {
          setLoading(false);
        }
      };
      
      loadCreator();
    }
  }, [creatorId]);

  const handleDonationSuccess = (txHash: string, amount: string) => {
    if (!creator) return;

    // Create new donation record for display
    const newDonation: Donation = {
      id: Date.now().toString(),
      campaignId: creator.id,
      donorAddress: 'donor-address',
      amount: 'Dirahasiakan',
      transactionHash: txHash,
      timestamp: new Date(),
      status: 'confirmed',
      isAnonymous: false
    };

    // Note: Donation is now handled by blockchain contract
    // Update local display state only
    const updatedCreator: Creator = {
      ...creator,
      totalDonations: (parseFloat(creator.totalDonations || '0') + parseFloat(amount)).toString(),
      donationCount: (creator.donationCount || 0) + 1,
    };

    setCreator(updatedCreator);
    setDonations(prev => [newDonation, ...prev]);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <BackgroundEffects />
        <Header />
        <main className="relative z-10 container mx-auto px-4 py-16 pt-24 md:pt-28">
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-lg text-gray-600">Loading creator profile...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen">
        <BackgroundEffects />
        <Header />
        <div className="container mx-auto px-4 py-32">
          <div className="text-center">
            <div className="neumorphic-card p-12 max-w-md mx-auto">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Creator Not Found
              </h1>
              <p className="text-gray-600 mb-6">
                The creator profile you're looking for doesn't exist.
              </p>
              <a
                href="/"
                className="neumorphic-button px-6 py-3 text-white font-bold"
              >
                Browse Creators
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen">
      <BackgroundEffects />
      <Header />
      
      <main className="relative z-10 container mx-auto px-4 py-16 pt-24 md:pt-28">
        <div className="max-w-4xl mx-auto">
          {/* Creator Header */}
          <div className="neumorphic-card p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden shadow-neumorphic">
                  <Image 
                    src="/profile-picture.jpg" 
                    alt="Profile Picture" 
                    width={128} 
                    height={128} 
                    className="object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-white shadow-sm" />
              </div>

              {/* Creator Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {creator.name}
                </h1>
                
                <div className="flex items-center justify-center md:justify-start space-x-2 mb-4">
                  <Wallet className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 font-mono">
                    {formatAddress(creator.walletAddress)}
                  </span>
                </div>

                {creator.description && (
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {creator.description}
                  </p>
                )}

                {/* Social Links */}
                <div className="flex justify-center md:justify-start space-x-4 mb-6">
                  {/* Social links disabled for legacy creator pages */}
                </div>

                {/* Join Date */}
                <div className="flex items-center justify-center md:justify-start space-x-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {creator.createdAt ? formatDate(creator.createdAt) : 'Recently'}</span>
                </div>
              </div>

              {/* Donation Button */}
              <div className="flex-shrink-0">
                <button
                  onClick={() => setShowDonationModal(true)}
                  className="neumorphic-button px-8 py-4 text-lg font-bold flex items-center space-x-2"
                >
                  <Heart className="w-5 h-5" />
                  <span>Support Creator</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="neumorphic-card p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-neumorphic flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mb-1">
                0.0000 ETH
              </p>
              <p className="text-sm text-gray-600">Total ETH Received</p>
            </div>

            <div className="neumorphic-card p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-neumorphic flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mb-1">
                0
              </p>
              <p className="text-sm text-gray-600">Total Supporters</p>
            </div>

            <div className="neumorphic-card p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-neumorphic flex items-center justify-center mx-auto mb-3">
                <Heart className="w-6 h-6 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mb-1">
                0.0000 ETH
              </p>
              <p className="text-sm text-gray-600">Avg Donation (ETH)</p>
            </div>
          </div>

          {/* Recent Donations */}
          <div className="neumorphic-card p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Support</h2>
            
            {recentDonations.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No donations yet
                </h3>
                <p className="text-gray-500">
                  Be the first to support {creator.name}!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentDonations.map((recentDonation, index) => (
                  <div
                    key={`${recentDonation.donor}-${recentDonation.timestamp}`}
                    className="flex items-center justify-between p-4 bg-gray-50/50 rounded-neumorphic"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full flex items-center justify-center">
                        <Heart className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          Anonymous Supporter
                        </p>
                        <p className="text-sm text-gray-600">
                          {recentDonation.timeAgo}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Wallet className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500 font-mono">
                        {`${recentDonation.donor.slice(0, 6)}...${recentDonation.donor.slice(-4)}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Donation Modal */}
      <DonationModal
        creator={creator}
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
        onSuccess={handleDonationSuccess}
      />
    </div>
  );
}