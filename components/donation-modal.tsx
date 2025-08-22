'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { Campaign, Creator } from '@/types/creator';
import { useAccount, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { LoadingSpinner } from './ui/loading-spinner';
import { privateCampaignDonationContract } from '@/lib/contract';

interface DonationModalProps {
  campaign?: Campaign;
  creator?: Creator; // Keep for backward compatibility
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (txHash: string, amount: string) => void;
}

export function DonationModal({ campaign, creator, isOpen, onClose, onSuccess }: DonationModalProps) {
  const [amount, setAmount] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [step, setStep] = useState<'input' | 'confirming' | 'success' | 'error'>('input');

  // Use campaign or creator for backward compatibility
  const targetTitle = campaign?.title || creator?.name || 'Unknown';
  const targetAddress = campaign?.organizerAddress || creator?.walletAddress || '';

  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();

  // Watch for transaction hash and update state
  useEffect(() => {
    if (hash && step === 'confirming') {
      setTxHash(hash);
      setStep('success');
      onSuccess?.(hash, amount);
      setIsLoading(false);
    }
  }, [hash, step, amount, onSuccess]);

  const validateAmount = (value: string): boolean => {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0 && num <= 10; // Max 10 ETH for safety
  };

  const handleDonate = async () => {
    if (!isConnected || !address) {
      setError('Connect your wallet to send donations');
      setStep('error');
      return;
    }

    if (!validateAmount(amount)) {
      setError('Please enter a valid amount between 0 and 10 ETH');
      setStep('error');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setStep('confirming');

      // Check if we're in browser and have ethereum provider
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('Please install MetaMask or connect your wallet');
      }

      // Initialize contract
      await privateCampaignDonationContract.initialize(window.ethereum);
      
      let targetId: string;
      
      if (campaign) {
        // For campaigns
        targetId = campaign.id;
        
        // Check if campaign exists and is active
        const campaignInfo = await privateCampaignDonationContract.getCampaignInfo(targetId);
        if (!campaignInfo?.isActive) {
          throw new Error(`Kampanye ${campaign.title} tidak aktif atau tidak ditemukan.`);
        }
      } else if (creator) {
        // Legacy creator support - generate creator ID
        targetId = privateCampaignDonationContract.generateCampaignId(creator.name, creator.walletAddress);
        
        // For legacy, we'd need to check creator registration here
        // But for now, we'll assume it's valid
      } else {
        throw new Error('No valid campaign or creator provided');
      }

      // Get contract address
      const CONTRACT_ADDRESS = "0xAD9c503F9AC5c2fA8152B8699f8db469B5a8809F";
      
      // Call smart contract donateSimple function for privacy
      // Flow: User -> Smart Contract -> Organizer (maintains privacy & audit trail)
      
      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: [
          {
            "inputs": [
              {"internalType": "bytes32", "name": "campaignId", "type": "bytes32"},
              {"internalType": "bool", "name": "isAnonymous", "type": "bool"}
            ],
            "name": "donateSimple",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
          }
        ],
        functionName: 'donateSimple',
        args: [targetId as `0x${string}`, isAnonymous],
        value: parseEther(amount),
      });

    } catch (err: any) {
      console.error('Donation failed:', err);
      setError(err.message || 'Transaction failed');
      setStep('error');
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setAmount('');
    setError('');
    setTxHash('');
    setStep('input');
    setIsLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-white/20 backdrop-blur-md"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md mx-auto bg-white/80 backdrop-blur-md border border-white/30 rounded-2xl p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Content based on step */}
            {step === 'input' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {campaign ? `Dukung ${targetTitle}` : `Dukung ${targetTitle}`}
                  </h2>
                  <p className="text-gray-600">
                    {campaign 
                      ? 'Donasi Anda akan langsung diteruskan ke penyelenggara kampanye'
                      : 'Kirim ETH langsung ke wallet mereka di Sepolia testnet'
                    }
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (ETH)
                    </label>
                    <input
                      id="amount"
                      type="number"
                      step="0.001"
                      min="0"
                      max="10"
                      placeholder="0.1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-neumorphic focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['0.01', '0.05', '0.1', '0.5'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(preset)}
                        className="py-2 px-3 text-xs sm:text-sm bg-gray-100 hover:bg-orange-100 rounded-neumorphic transition-colors"
                      >
                        {preset} ETH
                      </button>
                    ))}
                  </div>

                  {campaign && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          id="anonymous"
                          type="checkbox"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <label htmlFor="anonymous" className="text-sm text-gray-700">
                          Donasi secara anonim
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">
                        Jika dicentang, identitas Anda akan disembunyikan dari publik
                      </p>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded-neumorphic">
                    <p>⚠️ Ini adalah Sepolia testnet. Gunakan hanya test ETH.</p>
                    <p>Penerima: {targetAddress.slice(0, 20)}...</p>
                    {campaign && (
                      <p className="mt-1">💰 Jumlah donasi Anda akan tetap rahasia dari publik</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleDonate}
                  disabled={!amount || isLoading}
                  className="w-full neumorphic-button px-6 py-3 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <LoadingSpinner size="sm" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    `Donate ${amount || '0'} ETH`
                  )}
                </button>
              </div>
            )}

            {step === 'confirming' && (
              <div className="text-center space-y-6">
                <div
                  className="mx-auto w-16 h-16 bg-orange-400 rounded-full flex items-center justify-center"
                >
                  <LoadingSpinner size="lg" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    Confirming Transaction
                  </h2>
                  <p className="text-gray-600">
                    Harap konfirmasi transaksi di wallet Anda...
                  </p>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center space-y-6">
                <div
                  className="mx-auto w-16 h-16 bg-green-400 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    Donation Sent! 🎉
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Donasi {amount} ETH Anda untuk {targetTitle} telah berhasil dikirim.
                  </p>
                  {txHash && (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-sm text-orange-400 hover:text-orange-500"
                    >
                      <span>View Transaction</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <button
                  onClick={handleClose}
                  className="w-full neumorphic-button-secondary px-6 py-3 font-bold"
                >
                  Close
                </button>
              </div>
            )}

            {step === 'error' && (
              <div className="text-center space-y-6">
                <div
                  className="mx-auto w-16 h-16 bg-red-400 rounded-full flex items-center justify-center"
                >
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    Transaction Failed
                  </h2>
                  <p className="text-gray-600 text-sm mb-4">
                    {error}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setStep('input')}
                    className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded-neumorphic transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleClose}
                    className="w-full neumorphic-button-secondary px-6 py-3 font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}