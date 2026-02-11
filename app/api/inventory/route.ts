import { NextRequest, NextResponse } from 'next/server';
import type { InventoryItem } from '@/lib/types';

// Mock data
const mockInventory: InventoryItem[] = [
  {
    id: 'inv-1',
    product_id: 'prod-1',
    warehouse_id: 'warehouse-1',
    quantity: 150,
    reserved_quantity: 30,
    available_quantity: 120,
    last_counted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    product: {
      id: 'prod-1',
      sku: 'SKU-001',
      name: 'Industrial Bearing',
      description: 'High precision bearing',
      category: 'Components',
      unit_price: 45.99,
      reorder_level: 50,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'inv-2',
    product_id: 'prod-2',
    warehouse_id: 'warehouse-1',
    quantity: 320,
    reserved_quantity: 80,
    available_quantity: 240,
    last_counted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    product: {
      id: 'prod-2',
      sku: 'SKU-002',
      name: 'Steel Fastener',
      description: 'Industrial grade fastener',
      category: 'Hardware',
      unit_price: 2.50,
      reorder_level: 200,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'inv-3',
    product_id: 'prod-3',
    warehouse_id: 'warehouse-1',
    quantity: 45,
    reserved_quantity: 15,
    available_quantity: 30,
    last_counted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    product: {
      id: 'prod-3',
      sku: 'SKU-003',
      name: 'Hydraulic Seal Kit',
      description: 'Complete hydraulic seal set',
      category: 'Seals',
      unit_price: 125.00,
      reorder_level: 20,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'inv-4',
    product_id: 'prod-4',
    warehouse_id: 'warehouse-1',
    quantity: 8,
    reserved_quantity: 2,
    available_quantity: 6,
    last_counted_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    product: {
      id: 'prod-4',
      sku: 'SKU-004',
      name: 'Electric Motor',
      description: '3 HP electric motor',
      category: 'Motors',
      unit_price: 450.00,
      reorder_level: 5,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouse_id');
    const productId = searchParams.get('product_id');

    let filtered = mockInventory;

    if (warehouseId) {
      filtered = filtered.filter((item) => item.warehouse_id === warehouseId);
    }

    if (productId) {
      filtered = filtered.filter((item) => item.product_id === productId);
    }

    return NextResponse.json(
      {
        success: true,
        data: filtered,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Inventory fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}
