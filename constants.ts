import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Classic Americano',
    price: 110,
    unitCost: 25,
    category: 'Hot Coffee',
    stock: 45,
    image: 'https://images.unsplash.com/photo-1551033406-611cf9a28f67?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '2',
    name: 'Caramel Macchiato',
    price: 155,
    unitCost: 45,
    category: 'Hot Coffee',
    stock: 30,
    image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '3',
    name: 'Iced Spanish Latte',
    price: 165,
    unitCost: 50,
    category: 'Iced Coffee',
    stock: 25,
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '4',
    name: 'Vietnamese Cold Brew',
    price: 140,
    unitCost: 35,
    category: 'Iced Coffee',
    stock: 20,
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '5',
    name: 'Matcha Milk Tea',
    price: 150,
    unitCost: 40,
    category: 'Milk Drinks',
    stock: 15,
    image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '6',
    name: 'Strawberry Soda',
    price: 120,
    unitCost: 20,
    category: 'Soda',
    stock: 40,
    image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&q=80&w=400'
  }
];