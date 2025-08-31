'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Header } from '@/components/header';
import { BackgroundEffects } from '@/components/background-effects';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { CampaignFormData, CampaignCategory, getCategoryDisplayName } from '@/types/creator';
import { zlethCampaignContract } from '@/lib/zleth-contract';
import { Plus, AlertCircle, CheckCircle, ImageIcon } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(5, 'Campaign title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(500, 'Description must be less than 500 characters'),
  imageUrl: z.string().url('Image URL must be valid').optional().or(z.literal('')),
  targetAmount: z.string().min(1, 'Target donation amount is required').refine((val) => {
    const num = parseFloat(val);
    return num > 0 && num <= 1000;
  }, 'Target donation must be between 0.01 - 1000 ETH'),
  duration: z.number().min(1, 'Duration must be at least 1 day').max(365, 'Duration cannot exceed 365 days'),
  category: z.nativeEnum(CampaignCategory),
});

export default function CreateCampaignPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const router = useRouter();
  const { address, isConnected } = useAccount();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CampaignFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      duration: 30,
      category: CampaignCategory.OTHER,
    },
  });

  const watchedImageUrl = watch('imageUrl');

  const onSubmit = async (data: CampaignFormData) => {
    if (!isConnected || !address) {
      setErrorMessage('Please connect your wallet first');
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Check if we're in browser and have ethereum provider
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('Please install MetaMask or connect your wallet');
      }

      // Initialize contract with current provider
      await zlethCampaignContract.initialize(window.ethereum);

      // Create campaign on blockchain
      const result = await zlethCampaignContract.createCampaign(
        data.title,
        data.description,
        data.imageUrl || '',
        data.targetAmount,
        data.duration,
        data.category,
        address
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to create campaign');
      }

      setSubmitStatus('success');
      
      // Small delay to ensure blockchain state is updated
      setTimeout(() => {
        router.push(`/campaign/${result.campaignId}`);
      }, 2000);

    } catch (error: any) {
      console.error('Campaign creation failed:', error);
      const errorMsg = error?.message || error?.toString() || 'Failed to create campaign. Please try again.';
      setErrorMessage(errorMsg);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    reset();
    setSubmitStatus('idle');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen">
      <BackgroundEffects />
      <Header />
      
      <main className="relative z-10 container mx-auto px-4 py-16 pt-32 md:pt-36">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-orange-400 to-amber-400 rounded-xl shadow-lg mb-6">
              <Plus className="w-4 h-4 text-white" />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
              Create New Campaign
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Start fundraising for meaningful causes with guaranteed privacy
            </p>
          </div>

          <div className="neumorphic-card p-8">
            {!isConnected ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Connect Your Wallet
                </h3>
                <p className="text-gray-600 mb-6">
                  Connect your wallet to create campaigns and receive donations
                </p>
              </div>
            ) : submitStatus === 'success' ? (
              <div className="flex flex-col items-center justify-center min-h-[40vh] py-8">
                <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  🎉 Campaign Created Successfully!
                </h3>
                <p className="text-gray-600 mb-6 max-w-md text-center">
                  Your campaign has been created and is now live on the blockchain. You will be redirected to your new campaign page shortly.
                </p>
                <div className="flex flex-col items-center space-y-2">
                  <LoadingSpinner size="md" />
                  <p className="text-sm text-gray-500">Redirecting...</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Campaign Title *
                    </label>
                    <input
                      {...register('title')}
                      type="text"
                      placeholder="Help for natural disaster victims..."
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-neumorphic focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Campaign Description *
                    </label>
                    <textarea
                      {...register('description')}
                      rows={4}
                      placeholder="Explain the campaign's purpose, why donations are needed, and how funds will be used..."
                      className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-neumorphic focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      {...register('category')}
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-neumorphic focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    >
                      {Object.values(CampaignCategory).map((category) => (
                        <option key={category} value={category}>
                          {getCategoryDisplayName(category)}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-500">{errors.category.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (days) *
                    </label>
                    <input
                      {...register('duration', { valueAsNumber: true })}
                      type="number"
                      min="1"
                      max="365"
                      placeholder="30"
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-neumorphic focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    />
                    {errors.duration && (
                      <p className="mt-1 text-sm text-red-500">{errors.duration.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700 mb-2">
                      Target Donation (ETH) *
                    </label>
                    <input
                      {...register('targetAmount')}
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="1000"
                      placeholder="10.0"
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-neumorphic focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    />
                    {errors.targetAmount && (
                      <p className="mt-1 text-sm text-red-500">{errors.targetAmount.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                      Image URL (optional)
                    </label>
                    <input
                      {...register('imageUrl')}
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-neumorphic focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    />
                    {errors.imageUrl && (
                      <p className="mt-1 text-sm text-red-500">{errors.imageUrl.message}</p>
                    )}
                  </div>
                </div>

                {/* Image Preview */}
                {watchedImageUrl && (
                  <div className="border border-gray-200 rounded-neumorphic p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Image Preview:</p>
                    <div className="relative w-full h-48 bg-gray-100 rounded-neumorphic overflow-hidden">
                      <img
                        src={watchedImageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-200">
                        <div className="text-center">
                          <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Image cannot be loaded</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-neumorphic">
                  <p><strong>Connected Wallet:</strong> {address}</p>
                  <p>This will be the donation receiving address on Sepolia testnet.</p>
                  <p><strong>Privacy:</strong> Total donations will be encrypted and only you can view them.</p>
                </div>

                {submitStatus === 'error' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-red-800 mb-1">Failed to Create Campaign</h4>
                        <p className="text-sm text-red-700">{errorMessage}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  {submitStatus === 'error' && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 py-3 px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-neumorphic transition-colors"
                    >
                      Reset Form
                    </button>
                  )}
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 neumorphic-button py-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <LoadingSpinner size="sm" />
                        <span>Creating Campaign...</span>
                      </div>
                    ) : (
                      'Create Campaign'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
