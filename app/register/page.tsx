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
import { CreatorFormData, Creator } from '@/types/creator';
import { creatorStorage } from '@/lib/storage';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  twitterHandle: z.string().optional(),
  farcasterUsername: z.string().optional(),
  youtubeChannel: z.string().optional(),
  description: z.string().max(200, 'Description must be less than 200 characters').optional(),
});

export default function RegisterPage() {
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
  } = useForm<CreatorFormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: CreatorFormData) => {
    if (!isConnected || !address) {
      setErrorMessage('Please connect your wallet first');
      setSubmitStatus('error');
      return;
    }

    // Check if creator already exists
    const existingCreator = creatorStorage.getByWallet(address);
    if (existingCreator) {
      setErrorMessage('A creator profile already exists for this wallet address');
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const newCreator: Creator = {
        id: Date.now().toString(),
        name: data.name,
        walletAddress: address,
        twitterHandle: data.twitterHandle || undefined,
        farcasterUsername: data.farcasterUsername || undefined,
        youtubeChannel: data.youtubeChannel || undefined,
        description: data.description || undefined,
        totalDonations: '0',
        donationCount: 0,
        createdAt: new Date(),
      };

      creatorStorage.save(newCreator);
      setSubmitStatus('success');
      
      // Instant redirect ke creator profile
      router.push(`/creator/${newCreator.id}`);

    } catch (error) {
      console.error('Registration failed:', error);
      setErrorMessage('Registration failed. Please try again.');
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
      
      <main className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-neumorphic shadow-neumorphic mb-6">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Join as a Creator
            </h1>
            <p className="text-lg text-gray-600">
              Set up your profile and start receiving support from your community
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
                  Connect your wallet to create your creator profile and start receiving donations
                </p>
              </div>
            ) : submitStatus === 'success' ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Registration Successful! 🎉
                </h3>
                <p className="text-gray-600 mb-4">
                  Your creator profile has been created. Redirecting to your profile...
                </p>
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name *
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    placeholder="Your creator name"
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-neumorphic focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    placeholder="Tell your audience about yourself..."
                    className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-neumorphic focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="twitterHandle" className="block text-sm font-medium text-gray-700 mb-2">
                      Twitter Handle
                    </label>
                    <input
                      {...register('twitterHandle')}
                      type="text"
                      placeholder="@username (without @)"
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-neumorphic focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="farcasterUsername" className="block text-sm font-medium text-gray-700 mb-2">
                      Farcaster Username
                    </label>
                    <input
                      {...register('farcasterUsername')}
                      type="text"
                      placeholder="username"
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-neumorphic focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="youtubeChannel" className="block text-sm font-medium text-gray-700 mb-2">
                    YouTube Channel ID
                  </label>
                  <input
                    {...register('youtubeChannel')}
                    type="text"
                    placeholder="UC_ChannelID"
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-neumorphic focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                </div>

                <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-neumorphic">
                  <p><strong>Connected Wallet:</strong> {address}</p>
                  <p>This will be your donation receiving address on Sepolia testnet.</p>
                </div>

                {submitStatus === 'error' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-neumorphic">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                      <p className="text-sm text-red-700">{errorMessage}</p>
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
                        <span>Creating Profile...</span>
                      </div>
                    ) : (
                      'Create Profile'
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