"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaChevronDown, FaSearch, FaTimes, FaStore } from 'react-icons/fa';
import { httpClient } from '@/lib/http-client';
import Badge from './badge/Badge';

interface ShopAuthorization {
  id: string;
  shopId: string;
  shopName: string | null;
  managedName: string | null;
  region: string | null;
  status: string;
  app: {
    appName: string | null;
    channel: string;
  };
}

interface ShopSelectorProps {
  value?: string; // Selected shop ID
  onChange: (shopId: string | null, shop: ShopAuthorization | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  error?: string;
  label?: string;
  showAllShops?: boolean; // If true, shows all shops regardless of user permissions
}

const ShopSelector: React.FC<ShopSelectorProps> = ({
  value,
  onChange,
  placeholder = "Search and select a shop...",
  disabled = false,
  className = "",
  required = false,
  error,
  label,
  showAllShops = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [shops, setShops] = useState<ShopAuthorization[]>([]);
  const [filteredShops, setFilteredShops] = useState<ShopAuthorization[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedShop, setSelectedShop] = useState<ShopAuthorization | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get status badge for shop
  const getStatusBadge = (status: string) => {
    const normalized = status?.toLowerCase() || '';
    if (['active', 'live'].includes(normalized)) {
      return <Badge size="sm" color="success">Active</Badge>;
    }
    return <Badge size="sm" color="warning">{status}</Badge>;
  };

  // Fetch shops from API
  const fetchShops = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '100', // Get more shops for better search
        status: 'ACTIVE'
      });

      if (showAllShops) {
        params.append('showAll', 'true');
      }

      const data = await httpClient.get(`/shops?${params}`);
      setShops(data.shops || []);
      setFilteredShops(data.shops || []);
    } catch (error) {
      console.error('Error fetching shops:', error);
      setShops([]);
      setFilteredShops([]);
    } finally {
      setLoading(false);
    }
  }, [showAllShops]);

  // Filter shops based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredShops(shops);
      return;
    }

    const filtered = shops.filter(shop => {
      const searchLower = searchTerm.toLowerCase();
      const matchesName = shop.shopName?.toLowerCase().includes(searchLower);
      const matchesManagedName = shop.managedName?.toLowerCase().includes(searchLower);
      const matchesId = shop.shopId.toLowerCase().includes(searchLower);
      const matchesRegion = shop.region?.toLowerCase().includes(searchLower);
      const matchesApp = shop.app.appName?.toLowerCase().includes(searchLower);
      
      return matchesName || matchesManagedName || matchesId || matchesRegion || matchesApp;
    });
    
    setFilteredShops(filtered);
  }, [searchTerm, shops]);

  // Find selected shop when value changes
  useEffect(() => {
    if (value && shops.length > 0) {
      const shop = shops.find(s => s.shopId === value);
      setSelectedShop(shop || null);
    } else {
      setSelectedShop(null);
    }
  }, [value, shops]);

  // Fetch shops on component mount
  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
    }
  };

  const handleSelect = (shop: ShopAuthorization) => {
    setSelectedShop(shop);
    onChange(shop.shopId, shop);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedShop(null);
    onChange(null, null);
    setSearchTerm('');
  };

  const displayText = selectedShop 
    ? (selectedShop.managedName || selectedShop.shopName || selectedShop.shopId)
    : placeholder;

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Main selector container */}
      <div ref={dropdownRef} className="relative">
        {/* Fixed: Split into separate clickable areas instead of nested buttons */}
        <div
          className={`
            relative w-full cursor-default rounded-lg border bg-white py-2 pl-3 pr-10 text-left shadow-sm 
            focus-within:border-brand-500 focus-within:outline-none focus-within:ring-1 focus-within:ring-brand-500
            dark:bg-gray-800 dark:border-gray-600 dark:text-white
            ${disabled ? 'bg-gray-100 cursor-not-allowed dark:bg-gray-700' : 'hover:border-gray-400'}
            ${error ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-500' : 'border-gray-300'}
          `}
          onClick={handleToggle}
        >
          <span className="flex items-center">
            <FaStore className="h-4 w-4 text-gray-400 mr-3" />
            <span className={`block truncate ${!selectedShop ? 'text-gray-500' : ''}`}>
              {displayText}
            </span>
          </span>
          
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {selectedShop && !disabled && (
              <div
                onClick={handleClear}
                className="mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer p-1"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClear(e as any);
                  }
                }}
              >
                <FaTimes className="h-3 w-3" />
              </div>
            )}
            <FaChevronDown 
              className={`h-3 w-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            />
          </div>
        </div>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:ring-gray-700">
            {/* Search input */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search shops..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
              </div>
            </div>

            {/* Options list */}
            <div className="max-h-60 overflow-auto">
              {loading ? (
                <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                  Loading shops...
                </div>
              ) : filteredShops.length === 0 ? (
                <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                  {searchTerm ? `No shops found matching "${searchTerm}"` : 'No shops available'}
                </div>
              ) : (
                filteredShops.map((shop) => (
                  <button
                    key={shop.id}
                    onClick={() => handleSelect(shop)}
                    className={`
                      w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700
                      focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700
                      ${selectedShop?.shopId === shop.shopId ? 'bg-brand-50 dark:bg-brand-900/20' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white truncate">
                            {shop.managedName || shop.shopName || 'Unnamed Shop'}
                          </span>
                          {getStatusBadge(shop.status)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                          <div>ID: {shop.shopId}</div>
                          <div className="flex items-center gap-2">
                            <span>App: {shop.app.appName || 'N/A'}</span>
                            {shop.region && <span>• Region: {shop.region}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Selected shop details (optional) */}
      {selectedShop && (
        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
          <div>Selected: {selectedShop.managedName || selectedShop.shopName}</div>
          <div>App: {selectedShop.app.appName} ({selectedShop.app.channel})</div>
        </div>
      )}
    </div>
  );
};

export default ShopSelector;
