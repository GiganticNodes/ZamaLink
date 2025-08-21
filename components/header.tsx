'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Coins, Users, UserPlus } from 'lucide-react';

export function Header() {
  const pathname = usePathname();

  const getNavLinkClass = (href: string) => {
    const isActive = pathname === href;
    return `flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
      isActive 
        ? 'text-orange-500 bg-orange-50 font-semibold' 
        : 'text-gray-700 hover:text-orange-400 hover:bg-orange-50/50'
    }`;
  };

  return (
    <header className="relative z-20 top-0 z-50 w-full border-b border-white/20">
      <div className="glass-overlay">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-neumorphic shadow-neumorphic">
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                  ZamaLink
                </span>
              </div>
            </Link>

            <nav className="flex items-center space-x-2">
              <Link href="/">
                <div className={getNavLinkClass('/')}>
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Creators</span>
                </div>
              </Link>
              <Link href="/register">
                <div className={getNavLinkClass('/register')}>
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Register</span>
                </div>
              </Link>
            </nav>

            <div>
              <ConnectButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}