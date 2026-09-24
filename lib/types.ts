export type UserRole = 'admin' | 'worker';
export type MovementType = 'in' | 'out' | 'adjustment';
export type SyncStatus = 'pending' | 'synced' | 'failed';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  warehouse_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacity: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  unit_price: number;
  reorder_level: number;
  marketplace_id?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  last_counted_at?: string;
  created_at: string;
  updated_at: string;
  product?: Product;
  warehouse?: Warehouse;
}

export interface StockMovement {
  id: string;
  product_id: string;
  warehouse_id: string;
  movement_type: MovementType;
  quantity: number;
  reference_id?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  product?: Product;
  warehouse?: Warehouse;
  user?: User;
}

export interface MarketplaceSync {
  id: string;
  product_id: string;
  marketplace_product_id: string;
  marketplace_name: string;
  last_synced_at?: string;
  sync_status: SyncStatus;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  userId: string;
  token: string;
  expiresAt: Date;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
