import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://gckfouwduuxwbrdvlclc.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdja2ZvdXdkdXV4d2JyZHZsY2xjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNzY1OTAsImV4cCI6MjA5OTg1MjU5MH0.ZB1aSzlX-xE4HBfPMaEpQQkfNiMiP4bnc1IFfy_uQ7E';

// Secure Custom Storage Strategy for Remember Me functionality
const customStorage = {
  getItem: (key: string) => {
    try {
      const localVal = localStorage.getItem(key);
      if (localVal) return localVal;
      return sessionStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      const remember = localStorage.getItem('remember_me') === 'true';
      if (remember) {
        localStorage.setItem(key, value);
        sessionStorage.removeItem(key);
      } else {
        sessionStorage.setItem(key, value);
        localStorage.removeItem(key);
      }
    } catch (e) {
      // Fail-safe
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (e) {
      // Fail-safe
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true
  }
});

/**
 * Saves a checkout booking / order details to the Supabase backend.
 * Falls back gracefully to ensure the user's primary action (WhatsApp redirection) is never blocked.
 */
export async function saveOrderBooking(data: {
  name: string;
  phone: string;
  address: string;
  notes?: string;
  items: Array<{
    id: string;
    name: string;
    brand: string;
    price: number;
    quantity: number;
  }>;
  totalPrice: number;
}) {
  try {
    const payload = {
      name: data.name,
      phone: data.phone,
      address: data.address,
      notes: data.notes || '',
      items: JSON.stringify(data.items),
      total_price: data.totalPrice,
      created_at: new Date().toISOString(),
      status: 'Pending',
    };

    console.log('Attempting to save order to Supabase table "orders"/"bookings"...', payload);

    // We'll try to insert to 'bookings' first, and as fallback try 'orders'.
    // This maximizes compatibility depending on what table they created in their database.
    const { error: bookingsError } = await supabase
      .from('bookings')
      .insert([payload]);

    if (bookingsError) {
      console.warn('Could not save to "bookings" table, trying fallback table "orders"...', bookingsError.message);
      
      const { error: ordersError } = await supabase
        .from('orders')
        .insert([payload]);

      if (ordersError) {
        throw new Error(`Supabase Insert Failed (tried "bookings" and "orders"): ${ordersError.message}`);
      }
    }

    console.log('Successfully saved booking to Supabase!');
    return { success: true };
  } catch (err: any) {
    console.error('Supabase booking save exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Saves a contact form inquiry booking to Supabase backend.
 */
export async function saveInquiryBooking(data: {
  name: string;
  email?: string;
  phone: string;
  inquiryType: string;
  message: string;
}) {
  try {
    const payload = {
      name: data.name,
      email: data.email || '',
      phone: data.phone,
      inquiry_type: data.inquiryType,
      message: data.message,
      created_at: new Date().toISOString(),
    };

    console.log('Attempting to save inquiry to Supabase table "inquiries"/"bookings"...', payload);

    // Try inserting into 'inquiries' first, and fallback to 'bookings'.
    const { error: inquiriesError } = await supabase
      .from('inquiries')
      .insert([payload]);

    if (inquiriesError) {
      console.warn('Could not save to "inquiries" table, trying fallback table "bookings"...', inquiriesError.message);
      
      const { error: bookingsError } = await supabase
        .from('bookings')
        .insert([{
          ...payload,
          notes: `Inquiry Type: ${data.inquiryType}\nMessage: ${data.message}`
        }]);

      if (bookingsError) {
        throw new Error(`Supabase Insert Failed (tried "inquiries" and "bookings"): ${bookingsError.message}`);
      }
    }

    console.log('Successfully saved inquiry to Supabase!');
    return { success: true };
  } catch (err: any) {
    console.error('Supabase inquiry save exception:', err);
    return { success: false, error: err.message };
  }
}
