// supabase.js
// Production-ready Supabase Client Configuration
// Assumes VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are injected via environment.
// Falls back to your verified sandbox project keys for a seamless experience.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gckfouwduuxwbrdvlclc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdja2ZvdXdkdXV4d2JyZHZsY2xjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNzY1OTAsImV4cCI6MjA5OTg1MjU5MH0.ZB1aSzlX-xE4HBfPMaEpQQkfNiMiP4bnc1IFfy_uQ7E';

if (!window.supabase) {
  console.error('Supabase library has not loaded. Please verify CDN script tag.');
}

// Secure Custom Storage Strategy for Remember Me functionality
const customStorage = {
  getItem: (key) => {
    try {
      const localVal = localStorage.getItem(key);
      if (localVal) return localVal;
      return sessionStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: (key, value) => {
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
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (e) {
      // Fail-safe
    }
  }
};

// Create and export the Supabase Client with storage configuration
export const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true
  }
});

