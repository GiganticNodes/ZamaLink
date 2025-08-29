'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, AlertCircle, CheckCircle, ExternalLink, Shield, Info } from 'lucide-react';
import { Campaign } from '@/types/creator';
import { useAccount, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { LoadingSpinner } from './ui/loading-spinner';
import { zlethCampaignContract } from '@/lib/zleth-contract';

interface PrivateDonationModalProps {
  campaign: Campaign;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (txHash: string, amount: string) => void;
}

export function PrivateDonationModal({ campaign, isOpen, onClose, onSuccess }: PrivateDonationModalProps) {
  const [amount, setAmount] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  // All donations are private using ZLETH
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [step, setStep] = useState<'input' | 'confirming' | 'success' | 'error'>('input');

  const { address, isConnected } = useAccount();
  const { writeContract, reset: resetWriteContract } = useWriteContract({
    mutation: {
      onSuccess: (data) => {
        console.log('✅ Transaction Success:', data);
        setTxHash(data);
        setStep('success');
        onSuccess?.(data, amount);
        setIsLoading(false);
      },
      onError: (error) => {
        console.error('❌ Transaction Error:', error);
        setError(formatErrorMessage(error));
        setStep('error');
        setIsLoading(false);
      }
    }
  });

  const formatErrorMessage = (error: any): string => {
    const errorMessage = error.message || error.toString();
    
    if (errorMessage.includes('User denied') || 
        errorMessage.includes('User rejected') ||
        errorMessage.includes('user rejected transaction')) {
      return 'Transaction cancelled - You rejected the transaction in your wallet.';
    }
    
    if (errorMessage.includes('insufficient funds')) {
      return 'Insufficient funds in your wallet. Please add more ETH.';
    }
    
    if (errorMessage.includes('Campaign not active')) {
      return 'This campaign is no longer accepting donations.';
    }
    
    if (errorMessage.includes('Campaign deadline passed')) {
      return 'This campaign has expired and is no longer accepting donations.';
    }
    
    return errorMessage.length > 150 ? errorMessage.substring(0, 150) + '...' : errorMessage;
  };

  const forceResetWagmi = useCallback(() => {
    try {
      resetWriteContract();
    } catch (error) {
      console.warn('Wagmi reset error:', error);
    }
  }, [resetWriteContract]);

  useEffect(() => {
    if (isOpen) {
      forceResetWagmi();
      setError('');
      setTxHash('');
      setStep('input');
    }
  }, [isOpen, forceResetWagmi]);

  useEffect(() => {
    if (address) {
      forceResetWagmi();
      setError('');
      setTxHash('');
    }
  }, [address, forceResetWagmi]);

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

      // Check if ZLETH system is configured
      const isConfigured = await zlethCampaignContract.isConfigured();
      if (!isConfigured) {
        throw new Error('ZLETH system not configured. Please contact support.');
      }

      // Initialize contract
      if (typeof window !== 'undefined' && window.ethereum) {
        await zlethCampaignContract.initialize(window.ethereum);
      } else {
        throw new Error('Please install MetaMask or connect your wallet');
      }

      // Validate campaign
      const campaignInfo = await zlethCampaignContract.getCampaignInfo(campaign.id);
      if (!campaignInfo) {
        throw new Error('Campaign not found on blockchain');
      }
      
      if (!campaignInfo.isActive) {
        throw new Error('Campaign is not active');
      }

      const addresses = zlethCampaignContract.getContractAddresses();
      const targetContract = addresses.campaign;
      const formattedCampaignId = campaign.id.startsWith('0x') ? campaign.id : `0x${campaign.id}`;

      console.log(`🚀 Starting private donation:`, {
        campaignId: formattedCampaignId,
        amount: amount + ' ETH',
        isAnonymous,
        targetContract
      });

      // Reset wagmi state before transaction
      forceResetWagmi();

      // Private donation: ETH -> ZLETH -> Private Transfer
      writeContract({
        address: targetContract as `0x${string}`,
        abi: [
          {
            "inputs": [
              {"internalType": "bytes32", "name": "campaignId", "type": "bytes32"},
              {"internalType": "bool", "name": "isAnonymous", "type": "bool"}
            ],
            "name": "donate",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
          }
        ],
        functionName: 'donate',
        args: [formattedCampaignId as `0x${string}`, isAnonymous],
        value: parseEther(amount),
      });

      console.log('📝 Transaction initiated');

    } catch (err: any) {
      console.error('Donation failed:', err);
      setError(formatErrorMessage(err));
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
    setIsAnonymous(false);
    // donationType is always 'private'
    forceResetWagmi();
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
          <div className="relative w-full max-w-lg mx-auto bg-white/90 backdrop-blur-md border border-white/30 rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
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
                    Private Donation to {campaign.title}
                  </h2>
                  <p className="text-gray-600">
                    Your donation amount will be completely private using Zama FHEVM
                  </p>
                </div>

                {/* Private Donation Info */}
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-6 h-6 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-orange-800 mb-2">Private Donation with ZLETH</h3>
                      <ul className="text-orange-700 space-y-1 text-sm">
                        <li>• Your ETH automatically wraps to ZLETH (private token)</li>
                        <li>• Donation amount encrypted using Zama FHEVM technology</li>
                        <li>• Only you and campaign organizer can see the amount</li>
                        <li>• Organizer claims and unwraps ZLETH → ETH automatically</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Amount Input */}
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
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    />
                  </div>

                  {/* Preset amounts */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['0.01', '0.05', '0.1', '0.5'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(preset)}
                        className="py-2 px-3 text-xs sm:text-sm bg-gray-100 hover:bg-orange-100 rounded-xl transition-colors"
                      >
                        {preset} ETH
                      </button>
                    ))}
                  </div>

                  {/* Anonymous option */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        id="anonymous"
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <label htmlFor="anonymous" className="text-sm text-gray-700">
                        Donate anonymously
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">
                      Hide your wallet address from the public donation history
                    </p>
                  </div>

                  {/* Warning */}
                  <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded-xl">
                    <p className="font-medium mb-1">⚠️ Testnet Only</p>
                    <p>This is Sepolia testnet. Use only test ETH.</p>
                    <p>Recipient: {campaign.organizerAddress.slice(0, 20)}...</p>
                  </div>
                </div>

                {/* Donate Button */}
                <button
                  onClick={handleDonate}
                  disabled={!amount || isLoading}
                  className="w-full px-6 py-4 font-bold rounded-2xl bg-gradient-to-r from-orange-400 to-yellow-400 text-white hover:from-orange-500 hover:to-yellow-500 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <LoadingSpinner size="sm" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Shield className="w-5 h-5" />
                      <span>Donate Privately {amount || '0'} ETH</span>
                    </div>
                  )}
                </button>
              </div>
            )}

            {/* Other steps remain the same */}
            {step === 'confirming' && (
              <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-orange-400 rounded-full flex items-center justify-center">
                  <LoadingSpinner size="lg" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    Confirming Transaction
                  </h2>
                  <p className="text-gray-600">
                    Please confirm the private donation in your wallet...
                  </p>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-green-400 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    Donation Sent!
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Your private donation of {amount} ETH to {campaign.title} has been successfully sent.
                  </p>
                  <div className="bg-orange-50 p-3 rounded-xl mb-4">
                    <p className="text-sm text-orange-700">
                      🔒 Your donation amount is now completely private and encrypted. The campaign organizer can claim and unwrap the ZLETH to ETH anytime.
                    </p>
                  </div>
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
                  className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            )}

            {step === 'error' && (
              <div className="text-center space-y-6">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
                  error.includes('cancelled') || error.includes('rejected')
                    ? 'bg-yellow-400'
                    : 'bg-red-400'
                }`}>
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    {error.includes('cancelled') || error.includes('rejected')
                      ? 'Transaction Cancelled'
                      : 'Transaction Failed'
                    }
                  </h2>
                  <p className="text-gray-600 text-sm mb-4">{error}</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setStep('input')}
                    className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors font-medium"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleClose}
                    className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
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