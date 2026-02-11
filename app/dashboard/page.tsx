'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { GlassCard } from '@/components/ui/glass-card';
import type { InventoryItem } from '@/lib/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const lowStockItems = inventory.filter(
    (item) => item.product && item.available_quantity < item.product.reorder_level
  );

  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = inventory.reduce(
    (sum, item) => sum + (item.product?.unit_price || 0) * item.quantity,
    0
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, {user?.full_name}
        </h1>
        <p className="text-foreground/60">
          {user?.role === 'admin'
            ? 'Manage your warehouse operations and view analytics'
            : 'Track inventory and process stock movements'}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-6" variant="elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground/60 text-sm font-medium mb-1">
                Total Items
              </p>
              <p className="text-3xl font-bold text-foreground">
                {totalItems.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m0 10v10l8 4"
                />
              </svg>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6" variant="elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground/60 text-sm font-medium mb-1">
                Total Value
              </p>
              <p className="text-3xl font-bold text-foreground">
                ${totalValue.toFixed(0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center text-secondary">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6" variant="elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground/60 text-sm font-medium mb-1">
                Unique SKUs
              </p>
              <p className="text-3xl font-bold text-foreground">
                {inventory.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-warning/20 flex items-center justify-center text-warning">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6" variant="elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground/60 text-sm font-medium mb-1">
                Low Stock Alert
              </p>
              <p className="text-3xl font-bold text-error">
                {lowStockItems.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-error/20 flex items-center justify-center text-error">
              <svg
                className="w-6 h-6"
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

      {/* Low Stock Items */}
      {lowStockItems.length > 0 && (
        <GlassCard className="p-6" variant="lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">
              Low Stock Alert
            </h2>
            <span className="text-sm text-error bg-error/20 px-3 py-1 rounded-full">
              {lowStockItems.length} items
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-foreground/60 font-medium">
                    SKU
                  </th>
                  <th className="text-left py-3 px-4 text-foreground/60 font-medium">
                    Product Name
                  </th>
                  <th className="text-left py-3 px-4 text-foreground/60 font-medium">
                    Current Stock
                  </th>
                  <th className="text-left py-3 px-4 text-foreground/60 font-medium">
                    Min Level
                  </th>
                  <th className="text-left py-3 px-4 text-foreground/60 font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/50 hover:bg-surface/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-foreground font-medium">
                      {item.product?.sku}
                    </td>
                    <td className="py-3 px-4 text-foreground">
                      {item.product?.name}
                    </td>
                    <td className="py-3 px-4 text-foreground">
                      {item.available_quantity}
                    </td>
                    <td className="py-3 px-4 text-foreground">
                      {item.product?.reorder_level}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-error/20 text-error px-2 py-1 rounded text-xs font-medium">
                        Critical
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Recent Activity */}
      <GlassCard className="p-6" variant="lg">
        <h2 className="text-xl font-bold text-foreground mb-6">
          Inventory Overview
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-foreground/60 mb-4">
              Stock by Category
            </h3>
            <div className="space-y-3">
              {['Components', 'Hardware', 'Seals', 'Motors'].map(
                (category, index) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{category}</span>
                    <div className="flex-1 mx-4 h-2 bg-surface rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                        style={{
                          width: `${[75, 85, 45, 60][index]}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-foreground/60 w-12 text-right">
                      {[75, 85, 45, 60][index]}%
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground/60 mb-4">
              Top Products by Value
            </h3>
            <div className="space-y-3">
              {inventory
                .filter((item) => item.product)
                .sort(
                  (a, b) =>
                    (b.product?.unit_price || 0) * b.quantity -
                    (a.product?.unit_price || 0) * a.quantity
                )
                .slice(0, 4)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-surface/30"
                  >
                    <span className="text-sm text-foreground truncate">
                      {item.product?.name}
                    </span>
                    <span className="text-sm font-medium text-secondary">
                      ${(
                        (item.product?.unit_price || 0) * item.quantity
                      ).toFixed(0)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
