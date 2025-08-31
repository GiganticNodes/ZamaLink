'use client';

import { useState, memo, useCallback } from 'react';
import { Creator } from '@/types/creator';
import { ExternalLink, Twitter, Youtube } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { DonationModal } from './donation-modal';

interface CreatorCardProps {
  creator: Creator;
  index: number;
}

const CreatorCard = memo(function CreatorCard({ creator, index }: CreatorCardProps) {
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
    console.log('Donation success:', { txHash, amount });
  }, []);

  return (
    <>
      <div className="neumorphic-card p-6 hover:shadow-neumorphic-hover transition-shadow duration-300 h-full flex flex-col">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Avatar */}
          <Link href={`/creator/${creator.id}`}>
            <div className="relative cursor-pointer">
              <div className="w-20 h-20 rounded-full overflow-hidden shadow-neumorphic">
                <div className="w-full h-full bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {creator.name.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white shadow-sm" />
            </div>
          </Link>

          {/* Creator Info */}
          <div className="space-y-2">
            <Link href={`/creator/${creator.id}`}>
              <h3 className="text-lg font-semibold text-gray-800 cursor-pointer hover:text-orange-500 transition-colors">
                {creator.name}
              </h3>
            </Link>
            <p className="text-sm text-gray-600 font-mono">
              {formatAddress(creator.walletAddress)}
            </p>
            {creator.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {creator.description}
              </p>
            )}
          </div>

          {/* Social Links - Hidden until creator profiles are implemented */}
          <div className="flex space-x-3">
            {/* Social links temporarily disabled */}
          </div>

          {/* Stats */}
          <div className="flex justify-between w-full pt-4 border-t border-gray-200/50">
            <div className="text-center">
              <p className="text-xs text-gray-500">Total Donations</p>
              <p className="font-semibold text-gray-800">
                {parseFloat(creator.totalDonations || '0').toFixed(3)} ETH
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Supporters</p>
              <p className="font-semibold text-gray-800">
                {creator.donationCount || 0}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3 w-full">
            <Link href={`/creator/${creator.id}`} className="flex-1">
              <button className="border border-orange-400/50 text-orange-500 hover:bg-orange-50 px-3 sm:px-4 py-2 w-full text-xs sm:text-sm font-bold rounded-2xl transition-colors">
                View Profile
              </button>
            </Link>
            <button 
              onClick={handleDonateClick}
              className="neumorphic-button px-3 sm:px-4 py-2 w-full text-xs sm:text-sm font-bold flex-1"
            >
              Donate
            </button>
          </div>
        </div>
      </div>

      <DonationModal
        creator={creator}
        isOpen={isDonationModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleDonationSuccess}
      />
    </>
  );
});

export { CreatorCard };