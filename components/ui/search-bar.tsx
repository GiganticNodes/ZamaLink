'use client';

import { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  className?: string;
}

export function SearchBar({ 
  placeholder = "Search campaigns...", 
  onSearch, 
  className = "" 
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  }, [onSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    onSearch('');
  }, [onSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  }, [handleClear]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative group transition-all duration-300">
        {/* Search Input Container */}
        <div className="relative backdrop-blur-xl bg-white/90 border border-white/20 rounded-2xl shadow-lg overflow-hidden">
          {/* Search Icon */}
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
            <Search className={`w-5 h-5 transition-colors duration-200 ${
              isFocused || query 
                ? 'text-orange-500' 
                : 'text-gray-400'
            }`} />
          </div>

          {/* Input Field */}
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="w-full pl-12 pr-12 py-4 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 text-base font-medium"
          />

          {/* Clear Button */}
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200 group z-10"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            </button>
          )}

          {/* Animated Border */}
          <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-orange-400 to-amber-400 transition-all duration-300 ${
            isFocused 
              ? 'w-full opacity-100' 
              : 'w-0 opacity-0'
          }`} />
        </div>

        {/* Search Suggestions Glow Effect */}
        <div className={`absolute inset-0 bg-gradient-to-r from-orange-400/20 to-amber-400/20 rounded-2xl blur-sm transition-opacity duration-300 -z-10 ${
          isFocused ? 'opacity-100' : 'opacity-0'
        }`} />
      </div>

      {/* Search Stats */}
      {query && (
        <div className="mt-2 text-xs text-gray-500 animate-in slide-in-from-top-1 duration-200">
          Searching for: <span className="font-medium text-gray-700">"{query}"</span>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
