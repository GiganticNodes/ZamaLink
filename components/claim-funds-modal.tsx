'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Campaign } from '@/types/creator';
import { zlethCampaignContract } from '@/lib/zleth-contract';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Wallet, AlertTriangle, CheckCircle, X, ExternalLink, Info } from 'lucide-react';

interface ClaimFundsModalProps {
  campaign: Campaign;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (txHash: string) => void;
}

export function ClaimFundsModal({ campaign, isOpen, onClose, onSuccess }: ClaimFundsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [step, setStep] = useState<'confirm' | 'processing' | 'success' | 'error'>('confirm');

  const { address } = useAccount();

  const handleClose = () => {
    if (!isLoading) {
      setStep('confirm');
      setError('');
      setTxHash('');
      onClose();
    }
  };

  const handleClaimFunds = async () => {
    if (!address) {
      setError('Please connect your wallet');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setStep('processing');

      console.log(`🏦 Claiming funds for campaign: ${campaign.title}`);
      
      const result = await zlethCampaignContract.claimFunds(campaign.id);
      
      if (result.success) {
        setTxHash(result.txHash || '');
        setStep('success');
        onSuccess?.(result.txHash || '');
      } else {
        throw new Error(result.error || 'Failed to claim funds');
      }
    } catch (error: any) {
      console.error('Failed to claim funds:', error);
      setError(error.message || 'Failed to claim funds');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
            <Wallet className="w-5 h-5 text-orange-500" />
            <span>Claim Campaign Funds</span>
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'confirm' && (
            <div className="space-y-6">
              {/* Campaign Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-medium text-gray-800 mb-2">{campaign.title}</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Campaign ID: <span className="font-mono text-xs">{campaign.id}</span></div>
                  <div>Target: {campaign.targetAmount} ETH</div>
                  <div>Donors: {campaign.publicDonatorCount} public donors</div>
                </div>
              </div>

              {/* Process Explanation */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-medium text-blue-800 mb-3 flex items-center space-x-2">
                  <Info className="w-4 h-4" />
                  <span>Claiming Process</span>
                </h4>
                <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                  <li>Access your private ZLETH balance directly</li>
                  <li>Withdraw all ZLETH tokens from your wallet</li>
                  <li>ZLETH automatically converts to ETH via Zama oracle</li>
                  <li>ETH is sent directly to your wallet</li>
                  <li>Process is completely private and secure</li>
                </ol>
              </div>

              {/* Warning */}
              <div className="bg-orange-50 rounded-xl p-4">
                <h4 className="font-medium text-orange-800 mb-3 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Important Notes</span>
                </h4>
                <ol className="text-sm text-orange-700 space-y-2 list-decimal list-inside">
                  <li>This will withdraw ALL your ZLETH balance (all donations)</li>
                  <li>Works by directly accessing your private ZLETH tokens</li>
                  <li>Conversion uses Zama FHEVM oracle and may take 1-2 minutes</li>
                  <li>Only works if you have received donations to your campaign</li>
                </ol>
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleClaimFunds}
                disabled={isLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Wallet className="w-5 h-5" />
                <span>Claim All Funds</span>
              </button>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <LoadingSpinner size="lg" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Wallet className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Claiming Your Funds</h3>
                  <p className="text-gray-600">
                    Processing your claim request. Please wait while your ZLETH is converted to ETH...
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 text-left">
                <h4 className="font-medium text-blue-800 mb-2">What's happening:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Accessing your private ZLETH balance</li>
                  <li>• Converting ZLETH to ETH via Zama oracle</li>
                  <li>• Transferring ETH to your wallet</li>
                  <li>• Process may take 1-2 minutes to complete</li>
                </ul>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Funds Claimed Successfully!</h3>
                  <p className="text-gray-600">
                    Your ZLETH donations have been converted to ETH and sent to your wallet.
                  </p>
                </div>
              </div>

              {txHash && (
                <div className="bg-green-50 rounded-xl p-4">
                  <h4 className="font-medium text-green-800 mb-2">Transaction Details</h4>
                  <div className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-green-700">Transaction:</span>
                      <a 
                        href={`https://sepolia.etherscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 flex items-center space-x-1"
                      >
                        <span className="font-mono text-xs">{txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleClose}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Claim Failed</h3>
                  <p className="text-gray-600 mb-4">
                    There was an error processing your claim request.
                  </p>
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('confirm')}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

