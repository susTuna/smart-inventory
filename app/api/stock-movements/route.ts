import { NextRequest, NextResponse } from 'next/server';
import type { StockMovement } from '@/lib/types';

// Mock data
const mockMovements: StockMovement[] = [
  {
    id: 'mov-1',
    product_id: 'prod-1',
    warehouse_id: 'warehouse-1',
    movement_type: 'in',
    quantity: 50,
    reference_id: 'PO-2024-001',
    notes: 'Purchase order received',
    created_by: '2',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mov-2',
    product_id: 'prod-2',
    warehouse_id: 'warehouse-1',
    movement_type: 'out',
    quantity: 30,
    reference_id: 'SO-2024-045',
    notes: 'Sales order shipment',
    created_by: '2',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mov-3',
    product_id: 'prod-3',
    warehouse_id: 'warehouse-1',
    movement_type: 'adjustment',
    quantity: -5,
    reference_id: 'ADJ-2024-002',
    notes: 'Inventory count adjustment',
    created_by: '1',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mov-4',
    product_id: 'prod-1',
    warehouse_id: 'warehouse-1',
    movement_type: 'out',
    quantity: 15,
    reference_id: 'SO-2024-046',
    notes: 'Customer order delivery',
    created_by: '2',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouse_id');
    const productId = searchParams.get('product_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    let filtered = [...mockMovements].reverse();

    if (warehouseId) {
      filtered = filtered.filter((m) => m.warehouse_id === warehouseId);
    }

    if (productId) {
      filtered = filtered.filter((m) => m.product_id === productId);
    }

    filtered = filtered.slice(0, limit);

    return NextResponse.json(
      {
        success: true,
        data: filtered,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Stock movements fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock movements' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      product_id,
      warehouse_id,
      movement_type,
      quantity,
      reference_id,
      notes,
      created_by,
    } = body;

    // Validate required fields
    if (!product_id || !warehouse_id || !movement_type || !quantity) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newMovement: StockMovement = {
      id: `mov-${Date.now()}`,
      product_id,
      warehouse_id,
      movement_type,
      quantity,
      reference_id,
      notes,
      created_by,
      created_at: new Date().toISOString(),
    };

    mockMovements.push(newMovement);

    return NextResponse.json(
      {
        success: true,
        data: newMovement,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Stock movement creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create stock movement' },
      { status: 500 }
    );
  }
}
