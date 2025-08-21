'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { BackgroundEffects } from '@/components/background-effects';
import { CreatorCard } from '@/components/creator-card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Creator } from '@/types/creator';
import { creatorStorage, initializeSampleData } from '@/lib/storage';
import { Users, Heart, Zap } from 'lucide-react';

export default function Home() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Initialize sample data and load creators
    initializeSampleData();
    const loadedCreators = creatorStorage.getAll();
    setCreators(loadedCreators);
    setLoading(false);
  }, [mounted]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <BackgroundEffects />
      <Header />
      
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold">
              <span className="bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Support Your Favorite Creators
              </span>
              <br />
              <span className="text-gray-800 text-lg md:text-2xl">
                Powered by Zama fhEVM
              </span>
            </h1>
            
            <p className="text-xs md:text-sm text-gray-600 max-w-lg mx-auto">
              Support creators with ETH donations. Private, secure, instant.
            </p>
          </div>
        </section>

        {/* Creators Section */}
        <section className="container mx-auto px-4 pb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Featured Creators
            </h2>
            <p className="text-xs md:text-sm text-gray-600 max-w-lg mx-auto">
              Discover and support creators
            </p>
          </div>

          {creators.length === 0 ? (
            <div className="text-center py-16">
              <div className="neumorphic-card p-12 max-w-md mx-auto">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No Creators Yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Be the first to register as a creator and start receiving support!
                </p>
                <a
                  href="/register"
                  className="inline-block neumorphic-button px-6 py-3 text-white font-bold"
                >
                  Register Now
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {creators.map((creator, index) => (
                <CreatorCard 
                  key={creator.id} 
                  creator={creator} 
                  index={index}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}