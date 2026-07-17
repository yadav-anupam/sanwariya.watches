export interface WatchProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  description: string;
  image: string;
  tag: 'Best Seller' | 'Limited Stock' | 'New Arrival' | 'Vintage Rare' | 'Authentic';
  type: 'Automatic' | 'Quartz' | 'Chronograph' | 'Luxury Classic';
  specs: {
    case: string;
    waterResistance: string;
    movement: string;
    strap: string;
  };
  inStock: boolean;
  gstPercentage?: number;
  shippingCharges?: number;
}

export interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

export interface CartItem {
  product: WatchProduct;
  quantity: number;
}

export interface ContactFormInput {
  name: string;
  email: string;
  phone: string;
  inquiryType: 'custom_watch' | 'service_request' | 'feedback' | 'general';
  message: string;
}
