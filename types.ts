export interface Product {
  id: string;
  name: string;
  price: number;
  unitCost: number;
  category: string;
  stock: number;
  image: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  items: CartItem[];
  total: number;
  timestamp: number;
  status: 'queue' | 'done';
  type: 'normal' | 'event';
  createdBy?: string;
  completedBy?: string;
}

export interface InventoryLog {
  id: string;
  productId: string;
  change: number;
  reason: string;
  timestamp: number;
}

export interface EventConfig {
  id: string;
  remainingCups: number;
  maxCups: number;
  isActive: boolean;
}

export type View = 'pos' | 'event' | 'inventory' | 'history' | 'queue';