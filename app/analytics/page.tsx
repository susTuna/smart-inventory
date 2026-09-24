'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';
import type { InventoryItem, StockMovement } from '@/lib/types';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inventoryRes, movementsRes] = await Promise.all([
          fetch('/api/inventory'),
          fetch('/api/stock-movements?limit=100'),
        ]);

        const inventoryData = await inventoryRes.json();
        const movementsData = await movementsRes.json();

        if (inventoryData.success) {
          setInventory(inventoryData.data);
        }
        if (movementsData.success) {
          setMovements(movementsData.data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  if (user?.role !== 'admin') {
    return null;
  }

  const categoryBreakdown = inventory.reduce(
    (acc, item) => {
      const category = item.product?.category || 'Unknown';
      if (!acc[category]) {
        acc[category] = { quantity: 0, value: 0 };
      }
      acc[category].quantity += item.quantity;
      acc[category].value +=
        (item.product?.unit_price || 0) * item.quantity;
      return acc;
    },
    {} as Record<string, { quantity: number; value: number }>
  );

  const movementTrend = movements.reduce(
    (acc, m) => {
      const date = new Date(m.created_at).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { in: 0, out: 0 };
      }
      if (m.movement_type === 'in') {
        acc[date].in += m.quantity;
      } else if (m.movement_type === 'out') {
        acc[date].out += m.quantity;
      }
      return acc;
    },
    {} as Record<string, { in: number; out: number }>
  );

  const topProducts = inventory
    .filter((item) => item.product)
    .sort(
      (a, b) =>
        (b.product?.unit_price || 0) * b.quantity -
        (a.product?.unit_price || 0) * a.quantity
    )
    .slice(0, 5);

  const lowStockProducts = inventory
    .filter(
      (item) =>
        item.product &&
        item.available_quantity < item.product.reorder_level
    )
    .sort((a, b) => a.available_quantity - b.available_quantity)
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Analytics & Reports
        </h1>
        <p className="text-foreground/60">
          Comprehensive inventory analytics and performance metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-6" variant="elevated">
          <div>
            <p className="text-foreground/60 text-sm font-medium mb-2">
              Total Inventory Value
            </p>
            <p className="text-3xl font-bold text-primary">
              ${inventory
                .reduce(
                  (sum, item) =>
                    sum + (item.product?.unit_price || 0) * item.quantity,
                  0
                )
                .toFixed(0)}
            </p>
            <p className="text-xs text-foreground/60 mt-2">
              Across {inventory.length} SKUs
            </p>
          </div>
        </GlassCard>

        <GlassCard className="p-6" variant="elevated">
          <div>
            <p className="text-foreground/60 text-sm font-medium mb-2">
              Total Units in Stock
            </p>
            <p className="text-3xl font-bold text-secondary">
              {inventory.reduce((sum, item) => sum + item.quantity, 0)}
            </p>
            <p className="text-xs text-foreground/60 mt-2">
              {inventory.reduce((sum, item) => sum + item.reserved_quantity, 0)}{' '}
              reserved
            </p>
          </div>
        </GlassCard>

        <GlassCard className="p-6" variant="elevated">
          <div>
            <p className="text-foreground/60 text-sm font-medium mb-2">
              Stock Turnover Rate
            </p>
            <p className="text-3xl font-bold text-success">
              {((movements.filter((m) => m.movement_type === 'out').length /
                inventory.length) *
                100
              ).toFixed(1)}
              %
            </p>
            <p className="text-xs text-foreground/60 mt-2">
              {movements.length} total movements
            </p>
          </div>
        </GlassCard>

        <GlassCard className="p-6" variant="elevated">
          <div>
            <p className="text-foreground/60 text-sm font-medium mb-2">
              Low Stock Items
            </p>
            <p className="text-3xl font-bold text-error">
              {inventory.filter(
                (item) =>
                  item.product &&
                  item.available_quantity < item.product.reorder_level
              ).length}
            </p>
            <p className="text-xs text-foreground/60 mt-2">
              Need reordering
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <GlassCard className="p-6" variant="lg">
          <h2 className="text-xl font-bold text-foreground mb-6">
            Inventory by Category
          </h2>
          <div className="space-y-4">
            {Object.entries(categoryBreakdown).map(([category, data]) => {
              const totalValue = Object.values(categoryBreakdown).reduce(
                (sum, cat) => sum + cat.value,
                0
              );
              const percentage = (data.value / totalValue) * 100;
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      {category}
                    </span>
                    <span className="text-sm text-foreground/60">
                      ${data.value.toFixed(0)}
                    </span>
                  </div>
                  <div className="h-2 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Movement Trend */}
        <GlassCard className="p-6" variant="lg">
          <h2 className="text-xl font-bold text-foreground mb-6">
            Recent Movement Trend
          </h2>
          <div className="space-y-4">
            {Object.entries(movementTrend)
              .slice(-7)
              .reverse()
              .map(([date, data]) => (
                <div key={date}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground">{date}</span>
                    <div className="flex gap-2 text-xs">
                      <span className="text-success">In: {data.in}</span>
                      <span className="text-error">Out: {data.out}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 h-8">
                    {data.in > 0 && (
                      <div
                        className="bg-success/30 rounded"
                        style={{
                          flex: data.in,
                          minWidth: '4px',
                        }}
                      />
                    )}
                    {data.out > 0 && (
                      <div
                        className="bg-error/30 rounded"
                        style={{
                          flex: data.out,
                          minWidth: '4px',
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
          </div>
        </GlassCard>
      </div>

      {/* Top Products */}
      <GlassCard className="p-6" variant="lg">
        <h2 className="text-xl font-bold text-foreground mb-6">
          Top Products by Value
        </h2>
        <div className="space-y-3">
          {topProducts.map((item, index) => {
            const value = (item.product?.unit_price || 0) * item.quantity;
            const totalValue = inventory.reduce(
              (sum, i) => sum + (i.product?.unit_price || 0) * i.quantity,
              0
            );
            const percentage = (value / totalValue) * 100;

            return (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-bold text-primary w-6">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {item.product?.name}
                      </p>
                      <p className="text-xs text-foreground/60">
                        {item.quantity} units
                      </p>
                    </div>
                  </div>
                  <div className="h-2 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <p className="text-sm font-bold text-secondary">
                    ${value.toFixed(0)}
                  </p>
                  <p className="text-xs text-foreground/60">
                    {percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <GlassCard className="p-6 border border-error/30" variant="lg">
          <h2 className="text-xl font-bold text-error mb-6">
            Low Stock Alert
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-foreground/60 font-medium">
                    Product
                  </th>
                  <th className="text-center py-3 px-4 text-foreground/60 font-medium">
                    Current
                  </th>
                  <th className="text-center py-3 px-4 text-foreground/60 font-medium">
                    Min Level
                  </th>
                  <th className="text-center py-3 px-4 text-foreground/60 font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/50 hover:bg-surface/30"
                  >
                    <td className="py-3 px-4 text-foreground font-medium">
                      {item.product?.name}
                    </td>
                    <td className="py-3 px-4 text-center text-foreground">
                      {item.available_quantity}
                    </td>
                    <td className="py-3 px-4 text-center text-foreground">
                      {item.product?.reorder_level}
                    </td>
                    <td className="py-3 px-4 text-center">
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
    </div>
  );
}
