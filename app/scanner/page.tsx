'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { InventoryItem, StockMovement } from '@/lib/types';

export default function ScannerPage() {
  const { user } = useAuth();
  const [scannedSKU, setScannedSKU] = useState('');
  const [movementType, setMovementType] = useState<'in' | 'out'>('in');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch inventory data
    const fetchData = async () => {
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

    fetchData();
    inputRef.current?.focus();
  }, []);

  const selectedProduct = inventory.find((item) =>
    item.product?.sku.toLowerCase() === scannedSKU.toLowerCase()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !user) return;

    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await fetch('/api/stock-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct.product_id,
          warehouse_id: selectedProduct.warehouse_id,
          movement_type: movementType,
          quantity: parseInt(quantity),
          reference_id: `SCAN-${Date.now()}`,
          notes,
          created_by: user.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to record movement');

      setSuccessMessage(
        `Stock movement recorded: ${quantity} unit(s) ${movementType === 'in' ? 'received' : 'shipped'}`
      );

      // Reset form
      setScannedSKU('');
      setQuantity('1');
      setNotes('');
      setMovementType('in');

      // Refresh recent movements
      const movementsResponse = await fetch('/api/stock-movements?limit=10');
      const movementsData = await movementsResponse.json();
      if (movementsData.success) {
        setRecentMovements(movementsData.data);
      }

      inputRef.current?.focus();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to record movement'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Scanner Interface
        </h1>
        <p className="text-foreground/60">
          Track product in/out movements using barcode scanner
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner Input */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard className="p-6" variant="lg">
            <h2 className="text-xl font-bold text-foreground mb-6">
              Scan Barcode
            </h2>

            {successMessage && (
              <div className="mb-6 p-4 bg-success/20 border border-success/30 rounded-lg text-success text-sm animate-fade-in">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 p-4 bg-error/20 border border-error/30 rounded-lg text-error text-sm">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                ref={inputRef}
                label="Barcode/SKU"
                placeholder="Scan or enter SKU (e.g., SKU-001)"
                value={scannedSKU}
                onChange={(e) => setScannedSKU(e.target.value)}
                autoFocus
              />

              {selectedProduct && (
                <GlassCard className="p-4 border border-primary/30" variant="default">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-foreground/60 mb-1">Product</p>
                      <p className="text-lg font-bold text-foreground">
                        {selectedProduct.product?.name}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-foreground/60 mb-1">
                          Current Stock
                        </p>
                        <p className="text-xl font-bold text-foreground">
                          {selectedProduct.quantity}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-foreground/60 mb-1">
                          Available
                        </p>
                        <p className="text-xl font-bold text-secondary">
                          {selectedProduct.available_quantity}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-foreground/60 mb-1">
                          Unit Price
                        </p>
                        <p className="text-xl font-bold text-primary">
                          ${selectedProduct.product?.unit_price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">
                    Movement Type
                  </label>
                  <select
                    value={movementType}
                    onChange={(e) =>
                      setMovementType(e.target.value as 'in' | 'out')
                    }
                    className="px-4 py-2.5 rounded-lg bg-surface border border-border text-foreground focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="in" className="bg-surface text-foreground">
                      Stock In (Receive)
                    </option>
                    <option value="out" className="bg-surface text-foreground">
                      Stock Out (Ship)
                    </option>
                  </select>
                </div>

                <Input
                  label="Quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="notes" className="text-sm font-medium text-foreground">
                  Notes
                </label>
                <textarea
                  id="notes"
                  placeholder="Optional notes about this movement..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="px-4 py-2.5 rounded-lg bg-surface border border-border text-foreground placeholder-foreground/40 focus:outline-none focus:border-primary transition-colors resize-none h-24"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={isLoading}
                disabled={!selectedProduct}
              >
                {movementType === 'in' ? 'Record Stock In' : 'Record Stock Out'}
              </Button>
            </form>
          </GlassCard>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <GlassCard className="p-6" variant="lg">
            <h3 className="text-lg font-bold text-foreground mb-6">
              Quick Stats
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-surface/50 rounded-lg">
                <p className="text-xs text-foreground/60 mb-1">
                  Total Products
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {inventory.length}
                </p>
              </div>

              <div className="p-4 bg-surface/50 rounded-lg">
                <p className="text-xs text-foreground/60 mb-1">
                  Total Units
                </p>
                <p className="text-2xl font-bold text-secondary">
                  {inventory
                    .reduce((sum, item) => sum + item.quantity, 0)
                    .toLocaleString()}
                </p>
              </div>

              <div className="p-4 bg-surface/50 rounded-lg">
                <p className="text-xs text-foreground/60 mb-1">
                  Low Stock Items
                </p>
                <p className="text-2xl font-bold text-error">
                  {inventory.filter(
                    (item) =>
                      item.product &&
                      item.available_quantity < item.product.reorder_level
                  ).length}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6" variant="lg">
            <h3 className="text-lg font-bold text-foreground mb-4">
              Scanner Tips
            </h3>

            <ul className="space-y-2 text-sm text-foreground/60">
              <li className="flex gap-2">
                <span className="text-primary">1.</span>
                <span>Focus the scanner input field before scanning</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">2.</span>
                <span>Scan or enter the product SKU</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">3.</span>
                <span>Select movement type (In/Out)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">4.</span>
                <span>Enter quantity and optional notes</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">5.</span>
                <span>Click submit to record the movement</span>
              </li>
            </ul>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
