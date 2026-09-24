'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { InventoryItem } from '@/lib/types';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

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

  const filtered = inventory.filter((item) => {
    const matchesSearch =
      item.product?.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      filterCategory === 'all' ||
      item.product?.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = [
    'all',
    ...new Set(inventory.map((item) => item.product?.category).filter(Boolean)),
  ];

  const lowStockCount = inventory.filter(
    (item) => item.product && item.available_quantity < item.product.reorder_level
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Inventory</h1>
        <p className="text-foreground/60">
          Manage and track your warehouse inventory in real-time
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Search by SKU or Product Name"
          placeholder="Search inventory..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          }
        />

        <div className="flex flex-col gap-2">
          <label htmlFor="category" className="text-sm font-medium text-foreground">
            Category
          </label>
          <select
            id="category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-surface border border-border text-foreground focus:outline-none focus:border-primary transition-colors"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-surface text-foreground">
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Actions</label>
          <Button variant="primary" className="w-full">
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-4" variant="elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground/60 mb-1">Total Products</p>
              <p className="text-2xl font-bold text-foreground">
                {inventory.length}
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
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m0 10v10l8 4"
                />
              </svg>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4" variant="elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground/60 mb-1">Total Quantity</p>
              <p className="text-2xl font-bold text-foreground">
                {inventory
                  .reduce((sum, item) => sum + item.quantity, 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center text-secondary">
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
              <p className="text-sm text-foreground/60 mb-1">Low Stock</p>
              <p className="text-2xl font-bold text-error">{lowStockCount}</p>
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

      {/* Inventory Table */}
      <GlassCard className="p-6" variant="lg">
        <h2 className="text-xl font-bold text-foreground mb-6">Product Inventory</h2>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-foreground/60">Loading inventory...</p>
          </div>
        ) : filtered.length === 0 ? (
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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m0 10v10l8 4"
              />
            </svg>
            <p className="text-foreground/60">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-foreground/60 font-medium">
                    SKU
                  </th>
                  <th className="text-left py-3 px-4 text-foreground/60 font-medium">
                    Product
                  </th>
                  <th className="text-left py-3 px-4 text-foreground/60 font-medium">
                    Category
                  </th>
                  <th className="text-center py-3 px-4 text-foreground/60 font-medium">
                    Quantity
                  </th>
                  <th className="text-center py-3 px-4 text-foreground/60 font-medium">
                    Available
                  </th>
                  <th className="text-center py-3 px-4 text-foreground/60 font-medium">
                    Price
                  </th>
                  <th className="text-center py-3 px-4 text-foreground/60 font-medium">
                    Status
                  </th>
                  <th className="text-center py-3 px-4 text-foreground/60 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const isLowStock =
                    item.product &&
                    item.available_quantity < item.product.reorder_level;
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-border/50 hover:bg-surface/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-foreground font-medium">
                        {item.product?.sku}
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        <div>
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-xs text-foreground/60 mt-0.5">
                            {item.product?.description}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        <span className="text-xs bg-surface px-2 py-1 rounded">
                          {item.product?.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-foreground">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 text-center text-foreground">
                        {item.available_quantity}
                      </td>
                      <td className="py-3 px-4 text-center text-secondary font-medium">
                        ${item.product?.unit_price.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            isLowStock
                              ? 'bg-error/20 text-error'
                              : 'bg-success/20 text-success'
                          }`}
                        >
                          {isLowStock ? 'Low' : 'OK'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button className="text-primary hover:text-primary-dark transition-colors">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
