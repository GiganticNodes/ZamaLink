'use client';

import { useState, memo, useCallback } from 'react';
import { Campaign, getCategoryDisplayName, formatTimeLeft, formatDonatorCount } from '@/types/creator';
import { ExternalLink, Clock, Target, Users, MapPin } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { PrivateDonationModal } from './private-donation-modal';

interface CampaignCardProps {
  campaign: Campaign;
  index: number;
}

const CampaignCard = memo(function CampaignCard({ campaign, index }: CampaignCardProps) {
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

  const formatAddress = useCallback((address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  const handleDonateClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDonationModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsDonationModalOpen(false);
  }, []);

  const handleDonationSuccess = useCallback((txHash: string, amount: string) => {
    console.log('Private donation success:', { txHash, amount });
    console.log('🔐 Private donation completed - amount encrypted with ZLETH');
  }, []);

  const getCategoryColor = (category: Campaign['category']) => {
    const colors = {
      DISASTER_RELIEF: 'bg-red-100 text-red-700',
      MEDICAL: 'bg-green-100 text-green-700', 
      EDUCATION: 'bg-blue-100 text-blue-700',
      ENVIRONMENT: 'bg-emerald-100 text-emerald-700',
      SOCIAL: 'bg-purple-100 text-purple-700',
      EMERGENCY: 'bg-orange-100 text-orange-700',
      OTHER: 'bg-gray-100 text-gray-700'
    };
    return colors[category] || colors.OTHER;
  };

  return (
    <>
      <div className="neumorphic-card overflow-hidden hover:shadow-neumorphic-hover transition-shadow duration-300 h-full flex flex-col">
        {/* Campaign Image */}
        <Link href={`/campaign/${campaign.id}`}>
          <div className="relative cursor-pointer h-48 overflow-hidden">
            {campaign.imageUrl ? (
              <Image
                src={campaign.imageUrl}
                alt={campaign.title}
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center">
                <Target className="w-16 h-16 text-white opacity-50" />
              </div>
            )}
            
            {/* Category Badge */}
            <div className="absolute top-3 left-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(campaign.category)}`}>
                {getCategoryDisplayName(campaign.category)}
              </span>
            </div>

            {/* Days Left Badge */}
            <div className="absolute top-3 right-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                campaign.daysLeft! <= 7 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-white text-gray-700'
              }`}>
                {formatTimeLeft(campaign.daysLeft!)}
              </span>
            </div>
          </div>
        </Link>

        <div className="p-6 flex flex-col flex-grow">
          {/* Campaign Title */}
          <Link href={`/campaign/${campaign.id}`}>
            <h3 className="text-lg font-semibold text-gray-800 cursor-pointer hover:text-orange-500 transition-colors line-clamp-2 mb-2">
              {campaign.title}
            </h3>
          </Link>

          {/* Campaign Description */}
          <p 
            className="w-full text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            {campaign.description}
          </p>

          {/* Organizer Info */}
          <div className="flex items-center mb-4 pb-4 border-b border-gray-200/50">
            <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                <span className="text-white font-bold text-xs">
                  {campaign.organizerName?.charAt(0) || formatAddress(campaign.organizerAddress).charAt(0)}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500">Organizer</p>
              <p className="text-sm font-medium text-gray-700">
                {campaign.organizerName || formatAddress(campaign.organizerAddress)}
              </p>
            </div>
          </div>

          {/* Campaign Progress */}
          <div className="space-y-3 mb-4">
            {/* Target Amount */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-600">
                <Target className="w-4 h-4 mr-2" />
                <span>Target</span>
              </div>
              <span className="font-semibold text-gray-800">
                {parseFloat(campaign.targetAmount).toFixed(3)} ETH
              </span>
            </div>

            {/* Progress Bar - Empty for privacy */}
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-orange-400 to-yellow-400 h-2 rounded-full animate-pulse" 
                     style={{ width: '30%' }}>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Funds raised privately 🔒</span>
                <span>Target: {parseFloat(campaign.targetAmount).toFixed(1)} ETH</span>
              </div>
            </div>

            {/* Donator Count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-2" />
                <span>Donors</span>
              </div>
              <span className="font-semibold text-gray-800">
                {formatDonatorCount(campaign.publicDonatorCount)}
              </span>
            </div>

            {/* Time Left */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                <span>Time Left</span>
              </div>
              <span className={`font-semibold ${
                campaign.daysLeft! <= 7 ? 'text-red-600' : 'text-gray-800'
              }`}>
                {formatTimeLeft(campaign.daysLeft!)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3 w-full mt-auto">
            <Link href={`/campaign/${campaign.id}`} className="flex-1">
              <button className="border border-orange-400/50 text-orange-500 hover:bg-orange-50 px-3 sm:px-4 py-2 w-full text-xs sm:text-sm font-bold rounded-2xl transition-colors">
                View Details
              </button>
            </Link>
            <button 
              onClick={handleDonateClick}
              className="w-full neumorphic-button text-white font-semibold py-3 mb-2"
            >
              Donate
            </button>
          </div>
        </div>
      </div>

            <PrivateDonationModal 
        campaign={campaign}
        isOpen={isDonationModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleDonationSuccess}
      />
    </>
  );
});

export default CampaignCard;
export { CampaignCard };
