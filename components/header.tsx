'use client';

import React, { useCallback, useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Coins, Heart, Plus, BarChart3, Menu, X } from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = useMemo(() => [
    { href: '/', label: 'Campaigns', icon: Heart },
    { href: '/create-campaign', label: 'Create Campaign', icon: Plus },
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 }
  ], []);

  const getNavLinkClass = useCallback((href: string, isMobile = false) => {
    const isActive = pathname === href;
    const baseClasses = `group relative flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all duration-300 ease-out`;
    const colorClasses = isActive 
      ? 'text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25 scale-105' 
      : 'text-gray-600 hover:text-orange-500 hover:bg-white/60 hover:shadow-md hover:scale-105 active:scale-95';
    const mobileClasses = isMobile ? 'w-full justify-start text-base' : '';
    
    return `${baseClasses} ${colorClasses} ${mobileClasses}`;
  }, [pathname]);

  const handleNavClick = useCallback((href: string, e: React.MouseEvent) => {
    if (pathname === href) return;
    
    e.preventDefault();
    setIsMobileMenuOpen(false); // Close mobile menu on navigation
    router.push(href);
  }, [pathname, router]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prefetch all nav items on component mount for instant navigation
  const prefetchNavItems = useCallback(() => {
    navItems.forEach(({ href }) => {
      if (href !== pathname) {
        router.prefetch(href);
      }
    });
  }, [navItems, pathname, router]);

  // Prefetch on mount and when pathname changes
  useEffect(() => {
    prefetchNavItems();
  }, [prefetchNavItems]);

  return (
    <>
      {/* Floating Navbar */}
      <header className="fixed top-4 left-4 right-4 z-50">
        <div className="mx-auto max-w-7xl">
          <div className="relative backdrop-blur-xl bg-white/80 border border-white/20 rounded-3xl shadow-2xl shadow-black/5">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="group flex items-center gap-3">
                  <Image 
                    src="/images/logo/ZamaLink Logo.png"
                    alt="ZamaLink"
                    width={40}
                    height={40}
                    className="h-8 md:h-10 w-auto"
                  />
                  <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                    ZamaLink
                  </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-2 bg-gray-50/60 backdrop-blur-sm rounded-2xl p-2">
                  {navItems.map(({ href, label, icon: IconComponent }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={(e) => handleNavClick(href, e)}
                      className={getNavLinkClass(href)}
                      aria-label={label}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="font-medium">{label}</span>
                    </Link>
                  ))}
                </nav>

                {/* Tablet Navigation - Icons only */}
                <nav className="hidden md:flex lg:hidden items-center gap-2 bg-gray-50/60 backdrop-blur-sm rounded-2xl p-2">
                  {navItems.map(({ href, label, icon: IconComponent }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={(e) => handleNavClick(href, e)}
                      className={getNavLinkClass(href)}
                      aria-label={label}
                      title={label}
                    >
                      <IconComponent className="w-4 h-4" />
                    </Link>
                  ))}
                </nav>

                {/* Right side - Connect Button + Mobile Menu */}
                <div className="flex items-center gap-3">
                  <div className="hidden sm:block">
                    <ConnectButton />
                  </div>
                  
                  {/* Mobile menu button */}
                  <button
                    onClick={toggleMobileMenu}
                    className="md:hidden group relative p-3 rounded-2xl bg-gray-50/60 backdrop-blur-sm text-gray-600 hover:text-orange-500 hover:bg-white/60 transition-all duration-300 hover:scale-105 active:scale-95"
                    aria-label="Toggle mobile menu"
                  >
                    <div className="relative w-5 h-5">
                      <Menu 
                        className={`absolute inset-0 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0 rotate-180' : 'opacity-100 rotate-0'}`} 
                      />
                      <X 
                        className={`absolute inset-0 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-180'}`} 
                      />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300" 
            onClick={toggleMobileMenu} 
          />
          
          {/* Mobile Menu */}
          <div className="fixed top-20 left-4 right-4 animate-in slide-in-from-top-4 duration-300">
            <div className="backdrop-blur-xl bg-white/90 border border-white/20 rounded-3xl shadow-2xl shadow-black/10 overflow-hidden">
              <div className="p-6">
                {/* Mobile Navigation */}
                <nav className="space-y-3">
                  {navItems.map(({ href, label, icon: IconComponent }, index) => (
                    <div
                      key={href}
                      className="animate-in slide-in-from-left-2 duration-300"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <Link
                        href={href}
                        onClick={(e) => handleNavClick(href, e)}
                        className={getNavLinkClass(href, true)}
                        aria-label={label}
                      >
                        <IconComponent className="w-5 h-5" />
                        <span className="font-medium">{label}</span>
                      </Link>
                    </div>
                  ))}
                </nav>
                
                {/* Mobile Connect Button */}
                <div className="mt-6 pt-6 border-t border-gray-200/30 animate-in slide-in-from-bottom-2 duration-300 delay-300">
                  <ConnectButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}