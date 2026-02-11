'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import type { MarketplaceSync, InventoryItem } from '@/lib/types';

// Mock marketplace data
const mockMarketplaceSyncs: MarketplaceSync[] = [
  {
    id: 'sync-1',
    product_id: 'prod-1',
    marketplace_product_id: 'AMZN-12345',
    marketplace_name: 'Amazon',
    last_synced_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    sync_status: 'synced',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sync-2',
    product_id: 'prod-2',
    marketplace_product_id: 'SHOP-67890',
    marketplace_name: 'Shopify',
    last_synced_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    sync_status: 'synced',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sync-3',
    product_id: 'prod-3',
    marketplace_product_id: 'EBAY-54321',
    marketplace_name: 'eBay',
    last_synced_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    sync_status: 'pending',
    error_message: 'Connection timeout',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function MarketplacePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [syncs, setSyncs] = useState<MarketplaceSync[]>(mockMarketplaceSyncs);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filterMarketplace, setFilterMarketplace] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'synced' | 'pending' | 'failed'>('all');

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await fetch('/api/inventory');
        const data = await response.json();
        if (data.success) {
          setInventory(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
      }
    };

    fetchInventory();
  }, []);

  if (user?.role !== 'admin') {
    return null;
  }

  const filtered = syncs.filter((sync) => {
    const matchesMarketplace =
      filterMarketplace === 'all' ||
      sync.marketplace_name === filterMarketplace;
    const matchesStatus = filterStatus === 'all' || sync.sync_status === filterStatus;
    return matchesMarketplace && matchesStatus;
  });

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      // Simulate sync process
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSyncs(
        syncs.map((sync) => ({
          ...sync,
          sync_status: 'synced' as const,
          last_synced_at: new Date().toISOString(),
          error_message: undefined,
        }))
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const stats = {
    total: syncs.length,
    synced: syncs.filter((s) => s.sync_status === 'synced').length,
    pending: syncs.filter((s) => s.sync_status === 'pending').length,
    failed: syncs.filter((s) => s.sync_status === 'failed').length,
  };

  const marketplaces = ['all', ...new Set(syncs.map((s) => s.marketplace_name))];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Marketplace Integration
          </h1>
          <p className="text-foreground/60">
            Sync inventory with external marketplaces and sales channels
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleSyncAll}
          loading={isSyncing}
        >
          Sync All
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-4" variant="elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground/60 mb-1">Total Syncs</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.total}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4" variant="elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground/60 mb-1">Synced</p>
              <p className="text-2xl font-bold text-success">
                {stats.synced}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center text-success">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4" variant="elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground/60 mb-1">Pending</p>
              <p className="text-2xl font-bold text-warning">
                {stats.pending}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center text-warning">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4" variant="elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground/60 mb-1">Failed</p>
              <p className="text-2xl font-bold text-error">
                {stats.failed}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-error/20 flex items-center justify-center text-error">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">
            Marketplace
          </label>
          <select
            value={filterMarketplace}
            onChange={(e) => setFilterMarketplace(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-surface border border-border text-foreground focus:outline-none focus:border-primary transition-colors"
          >
            {marketplaces.map((m) => (
              <option key={m} value={m} className="bg-surface text-foreground">
                {m === 'all' ? 'All Marketplaces' : m}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'synced' | 'pending' | 'failed')}
            className="px-4 py-2.5 rounded-lg bg-surface border border-border text-foreground focus:outline-none focus:border-primary transition-colors"
          >
            <option value="all">All Status</option>
            <option value="synced">Synced</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Syncs List */}
      <GlassCard className="p-6" variant="lg">
        <h2 className="text-xl font-bold text-foreground mb-6">
          Marketplace Connections
        </h2>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 text-foreground/20 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <p className="text-foreground/60">No marketplace syncs found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((sync) => {
              const product = inventory.find((p) => p.product_id === sync.product_id);
              return (
                <div
                  key={sync.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-surface/30 hover:bg-surface/50 transition-colors border border-border/30"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center flex-shrink-0 text-primary font-bold">
                      {sync.marketplace_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground">
                          {product?.product?.name}
                        </p>
                        <span className="text-xs bg-surface px-2 py-1 rounded text-foreground/60">
                          {sync.marketplace_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-foreground/60">
                        <span>ID: {sync.marketplace_product_id}</span>
                        {sync.last_synced_at && (
                          <>
                            <span>|</span>
                            <span>
                              Synced:{' '}
                              {new Date(sync.last_synced_at).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    {sync.sync_status === 'synced' && (
                      <span className="bg-success/20 text-success px-3 py-1 rounded-full text-xs font-medium">
                        Synced
                      </span>
                    )}
                    {sync.sync_status === 'pending' && (
                      <span className="bg-warning/20 text-warning px-3 py-1 rounded-full text-xs font-medium">
                        Pending
                      </span>
                    )}
                    {sync.sync_status === 'failed' && (
                      <span className="bg-error/20 text-error px-3 py-1 rounded-full text-xs font-medium">
                        Failed
                      </span>
                    )}

                    <button className="p-2 hover:bg-surface rounded-lg transition-colors text-foreground/60 hover:text-foreground">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
