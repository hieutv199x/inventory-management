'use client';

import { useState, useEffect } from 'react';
import { Channel } from '@prisma/client';
import ChannelSelector from '@/components/channels/ChannelSelector';

interface Product {
  id: string;
  productId: string;
  channel: Channel;
  title: string;
  description: string;
  status: string;
  price?: string;
  currency?: string;
  createdAt: string;
  shop: {
    shopName: string;
    app: {
      channel: Channel;
      appName: string;
    };
  };
  channelData?: any;
  skus?: any[];
  images?: any[];
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 20,
    total: 0,
    hasMore: false
  });

  useEffect(() => {
    fetchProducts();
  }, [selectedChannel, pagination.offset]);

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString()
      });
      
      if (selectedChannel) {
        params.append('channel', selectedChannel);
      }

      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();
      
      setProducts(data.products || []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        hasMore: data.hasMore || false
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChannelIcon = (channel: Channel) => {
    const icons = {
      TIKTOK: '🎵',
      AMAZON: '📦',
      SHOPIFY: '🛍️',
      ALIBABA_1688: '🏭'
    };
    return icons[channel];
  };

  const formatPrice = (price?: string, currency?: string) => {
    if (!price) return 'N/A';
    return `${currency || ''} ${price}`.trim();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage products across all channels</p>
        </div>
        <div className="text-sm text-gray-500">
          {pagination.total} total products
        </div>
      </div>

      <div className="mb-8 bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Filter by Channel</h2>
        <ChannelSelector
          selectedChannel={selectedChannel}
          onChannelChange={setSelectedChannel}
          allowClear={true}
        />
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
          <p className="text-gray-600">
            {selectedChannel 
              ? `No products found for ${selectedChannel}.`
              : 'No products have been synced yet.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {product.images && product.images.length > 0 && (
                <div className="h-48 bg-gray-100 relative">
                  <img
                    src={product.images[0]?.urls?.[0] || product.images[0]?.uri}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm px-2 py-1 bg-gray-100 rounded">
                    {getChannelIcon(product.channel)} {product.channel}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    product.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                    product.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {product.status}
                  </span>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {product.title}
                </h3>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {product.description}
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Price:</span>
                    <span className="font-medium">
                      {formatPrice(product.price, product.currency)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Shop:</span>
                    <span className="text-sm font-medium truncate">
                      {product.shop.shopName || 'Unknown'}
                    </span>
                  </div>
                  
                  {product.skus && product.skus.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">SKUs:</span>
                      <span className="text-sm">{product.skus.length}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Load More Products
          </button>
        </div>
      )}
    </div>
  );
}