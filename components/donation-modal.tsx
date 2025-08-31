'use client';

import { useState, useEffect, useCallback } from 'react';
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

  // Format error messages for better UX
  const formatErrorMessage = (error: any): string => {
    const errorMessage = error.message || error.toString();
    
    // Handle MetaMask user rejection
    if (errorMessage.includes('User denied') || 
        errorMessage.includes('User rejected') ||
        errorMessage.includes('user rejected transaction') ||
        errorMessage.includes('Transaction was rejected')) {
      return 'Transaction cancelled - You rejected the transaction in MetaMask. Click "Try Again" to retry.';
    }
    
    // Handle insufficient funds
    if (errorMessage.includes('insufficient funds')) {
      return 'Insufficient funds in your wallet. Please add more ETH to your wallet.';
    }
    
    // Handle network errors
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }
    
    // Handle gas estimation errors
    if (errorMessage.includes('gas') && errorMessage.includes('estimation')) {
      return 'Transaction may fail. Please check the campaign is still active and try with a higher gas limit.';
    }
    
    // Handle contract errors
    if (errorMessage.includes('execution reverted')) {
      return 'Smart contract error - The campaign may be inactive or you may not meet the requirements.';
    }
    
    // Default fallback with shortened error for readability
    return errorMessage.length > 150 
      ? errorMessage.substring(0, 150) + '...' 
      : errorMessage;
  };

  const { address, isConnected } = useAccount();
  const { 
    writeContract, 
    data: hash, 
    isPending, 
    reset: resetWriteContract, 
    error: writeError, 
    status 
  } = useWriteContract({
    mutation: {
      onSuccess: (data) => {
        console.log('✅ WriteContract Success:', data);
        setTxHash(data);
        setStep('success');
        onSuccess?.(data, amount);
        setIsLoading(false);
      },
      onError: (error) => {
        console.error('❌ WriteContract Error:', error);
        const friendlyError = formatErrorMessage(error);
        setError(friendlyError);
        setStep('error');
        setIsLoading(false);
      }
    }
  });

  // Simplified force reset wagmi state 
  const forceResetWagmi = useCallback(() => {
    try {
      resetWriteContract();
      console.log('Wagmi state reset successful');
    } catch (error) {
      console.warn('Wagmi reset error:', error);
    }
  }, [resetWriteContract]);

  // Monitor writeContract status for debugging
  useEffect(() => {
    console.log('Wagmi Status:', { status, isPending, hash, writeError: writeError?.message });
  }, [status, isPending, hash, writeError]);

  // Reset wagmi state when modal opens - CRITICAL FIX
  useEffect(() => {
    if (isOpen) {
      // Always reset when modal opens regardless of step
      forceResetWagmi();
      setError('');
      setTxHash('');
      if (step !== 'input') {
        setStep('input');
      }
    }
  }, [isOpen, forceResetWagmi]);

  // CRITICAL: Reset state when wallet changes - this fixes multiple wallet issue
  useEffect(() => {
    if (address) {
      forceResetWagmi();
      setError('');
      setTxHash('');
      console.log('Wallet changed, resetting state for:', address);
    }
  }, [address, forceResetWagmi]);
  
  // Monitor wagmi status dan error untuk debugging
  useEffect(() => {
    console.log('Wagmi Status:', { status, hash, error: writeError, isPending });
  }, [status, hash, writeError, isPending]);

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
        
        // Initialize read-only contract untuk validation
        await privateCampaignDonationContract.initializeReadOnly();
        
        // Check if campaign exists and is active
        const campaignInfo = await privateCampaignDonationContract.getCampaignInfo(targetId);
        
        console.log('DEBUG - Campaign info dari contract:', {
          targetId,
          targetIdType: typeof targetId,
          targetIdLength: targetId.length,
          campaignInfo,
          exists: campaignInfo !== null,
          campaignTitle: campaign.title,
          organizerAddress: campaign.organizerAddress
        });
        
        // Test juga dengan manual campaign ID generation
        const manualId = privateCampaignDonationContract.generateCampaignId(campaign.title, campaign.organizerAddress);
        console.log('DEBUG - Manual ID generation:', {
          originalId: targetId,
          manualId,
          idsMatch: targetId === manualId
        });
        
        if (!campaignInfo) {
          throw new Error(`Campaign tidak ditemukan di smart contract. Campaign ID: ${targetId}`);
        }
        
        if (!campaignInfo.isActive) {
          throw new Error(`Campaign "${campaign.title}" sudah tidak aktif.`);
        }

        // Additional checks for debugging
        const now = Math.floor(Date.now() / 1000);
        if (campaignInfo.deadline && campaignInfo.deadline < now) {
          throw new Error(`Campaign "${campaign.title}" sudah expired (deadline: ${new Date(campaignInfo.deadline * 1000).toLocaleString()})`);
        }

        const donationAmount = parseFloat(amount);
        if (donationAmount <= 0) {
          throw new Error('Jumlah donasi harus lebih dari 0');
        }
        if (donationAmount > 10) {
          throw new Error('Jumlah donasi tidak boleh melebihi 10 ETH');
        }

        console.log('DEBUG - Campaign validation passed:', {
          campaignId: targetId,
          isActive: campaignInfo.isActive,
          deadline: campaignInfo.deadline,
          now: now,
          expired: campaignInfo.deadline < now,
          organizer: campaignInfo.organizer,
          amount: donationAmount,
          currentAddress: address
        });
      } else if (creator) {
        // Legacy creator support - generate creator ID
        targetId = privateCampaignDonationContract.generateCampaignId(creator.name, creator.walletAddress);
        
        // For legacy, we'd need to check creator registration here
        // But for now, we'll assume it's valid
      } else {
        throw new Error('No valid campaign or creator provided');
      }

      // Get contract address - UPDATED after redeployment  
      const CONTRACT_ADDRESS = "0x2Ab89Ee2092d1ccd652Da1360C36Da7bf9A200Ef";
      
      // Single reset before transaction - SIMPLIFIED
      forceResetWagmi();
      
      // Call public donation function (non-FHE path)
      // Flow: User -> Smart Contract -> Organizer (fast and reliable)
      
      console.log('⚡ Starting public donation:', {
        campaignId: targetId,
        isAnonymous,
        valueInEth: amount,
        currentUserAddress: address,
        organizerAddress: campaign?.organizerAddress
      });
      
      // Validate campaign exists and is active
      try {
        const testInfo = await privateCampaignDonationContract.getCampaignInfo(targetId);
        if (!testInfo) {
          throw new Error(`Campaign tidak ditemukan di smart contract.`);
        }
        
        console.log('✅ Campaign validation passed:', {
          campaignExists: true,
          isActive: testInfo.isActive,
          organizer: testInfo.organizer
        });
        
      } catch (testError) {
        console.error('❌ Contract validation failed:', testError);
        throw new Error(`Contract validation failed: ${testError instanceof Error ? testError.message : String(testError)}`);
      }
      
      // Call donatePublic function (non-FHE path)
      // Ensure targetId is properly formatted as bytes32
      const formattedTargetId = targetId.startsWith('0x') ? targetId : `0x${targetId}`;
      
      console.log('🚀 Calling writeContract with:', {
        address: CONTRACT_ADDRESS,
        functionName: 'donatePublic',
        args: [formattedTargetId, isAnonymous],
        value: amount + ' ETH',
        isConnected,
        userAddress: address
      });

      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: [
          {
            "inputs": [
              {"internalType": "bytes32", "name": "campaignId", "type": "bytes32"},
              {"internalType": "bool", "name": "isAnonymous", "type": "bool"}
            ],
            "name": "donatePublic",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
          }
        ],
        functionName: 'donatePublic',
        args: [formattedTargetId as `0x${string}`, isAnonymous],
        value: parseEther(amount),
      });
      
      console.log('📝 WriteContract call initiated');

    } catch (err: any) {
      console.error('Donation failed:', err);
      const friendlyError = formatErrorMessage(err);
      setError(friendlyError);
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
    
    // Single reset - no more conflicting timeouts
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
                    {campaign ? `Support ${targetTitle}` : `Support ${targetTitle}`}
                  </h2>
                  <p className="text-gray-600">
                    {campaign 
                      ? 'Your donation will be sent directly to the campaign organizer'
                      : 'Send ETH directly to their wallet on Sepolia testnet'
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

                  <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded-neumorphic">
                    <p>This is Sepolia testnet. Use only test ETH.</p>
                    <p>Recipient: {targetAddress.slice(0, 20)}...</p>
                    {campaign && (
                      <p className="mt-1">Your donation amount will remain private from the public</p>
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
                    Please confirm the transaction in your wallet...
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
                    Donation Sent!
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Your donation of {amount} ETH to {targetTitle} has been successfully sent.
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
                  className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
                    error.includes('cancelled') || error.includes('rejected')
                      ? 'bg-yellow-400' // Yellow for user cancellation
                      : 'bg-red-400'   // Red for actual errors
                  }`}
                >
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    {error.includes('cancelled') || error.includes('rejected')
                      ? 'Transaction Cancelled'
                      : 'Transaction Failed'
                    }
                  </h2>
                  <p className="text-gray-600 text-sm mb-4">
                    {error}
                  </p>
                  {(error.includes('cancelled') || error.includes('rejected')) && (
                    <p className="text-xs text-gray-500 mt-2">
                      💡 No worries! This happens when you click "Reject" in MetaMask. Just try again when ready.
                    </p>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setStep('input')}
                    className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded-neumorphic transition-colors font-medium"
                  >
                    {error.includes('cancelled') || error.includes('rejected') 
                      ? 'Try Again' 
                      : 'Retry'
                    }
                  </button>
                  <button
                    onClick={handleClose}
                    className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-neumorphic transition-colors"
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