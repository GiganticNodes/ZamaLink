'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/header';
import { BackgroundEffects } from '@/components/background-effects';
import { DonationModal } from '@/components/donation-modal';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Creator, Donation } from '@/types/creator';
import { creatorStorage, donationStorage } from '@/lib/storage';
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

export default function CreatorProfilePage() {
  const params = useParams();
  const creatorId = params.id as string;
  
  const [creator, setCreator] = useState<Creator | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDonationModal, setShowDonationModal] = useState(false);

  useEffect(() => {
    if (creatorId) {
      const foundCreator = creatorStorage.getById(creatorId);
      setCreator(foundCreator);
      
      if (foundCreator) {
        const creatorDonations = donationStorage.getByCreator(creatorId);
        setDonations(creatorDonations);
      }
      
      setLoading(false);
    }
  }, [creatorId]);

  const handleDonationSuccess = (txHash: string, amount: string) => {
    if (!creator) return;

    // Create new donation record
    const newDonation: Donation = {
      id: Date.now().toString(),
      creatorId: creator.id,
      donorAddress: 'donor-address', // Would get from wallet
      amount,
      transactionHash: txHash,
      timestamp: new Date(),
      status: 'confirmed'
    };

    // Save donation
    donationStorage.save(newDonation);

    // Update creator stats
    const updatedCreator: Creator = {
      ...creator,
      totalDonations: (parseFloat(creator.totalDonations || '0') + parseFloat(amount)).toString(),
      donationCount: (creator.donationCount || 0) + 1,
    };

    creatorStorage.save(updatedCreator);
    setCreator(updatedCreator);
    setDonations(prev => [newDonation, ...prev]);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <BackgroundEffects />
        <Header />
        <div className="flex items-center justify-center py-32">
          <LoadingSpinner size="lg" />
        </div>
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
      
      <main className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Creator Header */}
          <div className="neumorphic-card p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden shadow-neumorphic">
                  {creator.avatar ? (
                    <Image
                      src={creator.avatar}
                      alt={creator.name}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center">
                      <span className="text-white font-bold text-4xl">
                        {creator.name.charAt(0)}
                      </span>
                    </div>
                  )}
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
                  {creator.twitterHandle && (
                    <a
                      href={`https://twitter.com/${creator.twitterHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-blue-100 hover:bg-blue-200 rounded-neumorphic transition-colors"
                    >
                      <Twitter className="w-5 h-5 text-blue-500" />
                    </a>
                  )}
                  
                  {creator.farcasterUsername && (
                    <a
                      href={`https://farcaster.xyz/${creator.farcasterUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-purple-100 hover:bg-purple-200 rounded-neumorphic transition-colors"
                    >
                      <ExternalLink className="w-5 h-5 text-purple-500" />
                    </a>
                  )}
                  
                  {creator.youtubeChannel && (
                    <a
                      href={`https://youtube.com/channel/${creator.youtubeChannel}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-red-100 hover:bg-red-200 rounded-neumorphic transition-colors"
                    >
                      <Youtube className="w-5 h-5 text-red-500" />
                    </a>
                  )}
                </div>

                {/* Join Date */}
                <div className="flex items-center justify-center md:justify-start space-x-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {formatDate(creator.createdAt)}</span>
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
                {parseFloat(creator.totalDonations || '0').toFixed(3)}
              </p>
              <p className="text-sm text-gray-600">Total ETH Received</p>
            </div>

            <div className="neumorphic-card p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-neumorphic flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mb-1">
                {creator.donationCount || 0}
              </p>
              <p className="text-sm text-gray-600">Total Supporters</p>
            </div>

            <div className="neumorphic-card p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-neumorphic flex items-center justify-center mx-auto mb-3">
                <Heart className="w-6 h-6 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mb-1">
                {donations.length > 0 ? (parseFloat(creator.totalDonations || '0') / donations.length).toFixed(3) : '0.000'}
              </p>
              <p className="text-sm text-gray-600">Avg Donation (ETH)</p>
            </div>
          </div>

          {/* Recent Donations */}
          <div className="neumorphic-card p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Support</h2>
            
            {donations.length === 0 ? (
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
                {donations.slice(0, 5).map((donation, index) => (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between p-4 bg-gray-50/50 rounded-neumorphic"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full flex items-center justify-center">
                        <Heart className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {donation.amount} ETH
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(donation.timestamp)}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${donation.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-400 hover:text-orange-500 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
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