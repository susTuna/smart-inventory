'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import type { StockMovement } from '@/lib/types';

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out' | 'adjustment'>('all');

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        const response = await fetch('/api/stock-movements?limit=100');
        const data = await response.json();
        if (data.success) {
          setMovements(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch movements:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovements();
  }, []);

  const filtered = movements.filter(
    (m) => filterType === 'all' || m.movement_type === filterType
  );

  const stats = {
    totalIn: movements.filter((m) => m.movement_type === 'in').reduce((sum, m) => sum + m.quantity, 0),
    totalOut: movements.filter((m) => m.movement_type === 'out').reduce((sum, m) => sum + m.quantity, 0),
    adjustments: movements.filter((m) => m.movement_type === 'adjustment').length,
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
        return (
          <svg
            className="w-5 h-5 text-success"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        );
      case 'out':
        return (
          <svg
            className="w-5 h-5 text-error"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-5 h-5 text-warning"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Stock Movements
        </h1>
        <p className="text-foreground/60">
          Track all inventory in/out movements and adjustments
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-6" variant="elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground/60 text-sm font-medium mb-1">
                Total In
              </p>
              <p className="text-3xl font-bold text-success">
                {stats.totalIn.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6" variant="elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground/60 text-sm font-medium mb-1">
                Total Out
              </p>
              <p className="text-3xl font-bold text-error">
                {stats.totalOut.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-error/20 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-error"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6" variant="elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground/60 text-sm font-medium mb-1">
                Adjustments
              </p>
              <p className="text-3xl font-bold text-warning">
                {stats.adjustments}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-warning/20 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-warning"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'in', 'out', 'adjustment'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              filterType === type
                ? 'bg-primary text-background shadow-glow'
                : 'bg-surface border border-border text-foreground hover:bg-surface-light'
            }`}
          >
            {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Movements Table */}
      <GlassCard className="p-6" variant="lg">
        <h2 className="text-xl font-bold text-foreground mb-6">Movement History</h2>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-foreground/60">Loading movements...</p>
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
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-foreground/60">No movements found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((movement) => (
              <div
                key={movement.id}
                className="flex items-center justify-between p-4 rounded-lg bg-surface/30 hover:bg-surface/50 transition-colors border border-border/30"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
                    {getMovementIcon(movement.movement_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground">
                        {movement.product?.name}
                      </p>
                      <span className="text-xs bg-surface px-2 py-1 rounded text-foreground/60">
                        {movement.product?.sku}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-foreground/60">
                      <span>
                        Qty: <span className="text-foreground font-medium">{movement.quantity}</span>
                      </span>
                      {movement.reference_id && (
                        <>
                          <span>|</span>
                          <span>Ref: {movement.reference_id}</span>
                        </>
                      )}
                      {movement.notes && (
                        <>
                          <span>|</span>
                          <span>{movement.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <span
                    className={`text-sm font-bold px-3 py-1 rounded-lg ${
                      movement.movement_type === 'in'
                        ? 'bg-success/20 text-success'
                        : movement.movement_type === 'out'
                          ? 'bg-error/20 text-error'
                          : 'bg-warning/20 text-warning'
                    }`}
                  >
                    {movement.movement_type === 'in'
                      ? 'IN'
                      : movement.movement_type === 'out'
                        ? 'OUT'
                        : 'ADJ'}
                  </span>
                  <div className="text-right text-sm">
                    <p className="text-foreground font-medium">
                      {formatDate(movement.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
