import { WatchProduct, Review } from './types';

export const BRAND_STATS = {
  username: 'sanwariya_watches',
  displayName: 'Sanwariya Watches',
  postsCount: 32,
  followersCount: 1089,
  followingCount: 21,
  category: 'Fashion Accessories',
  tagline: 'YOUR WRIST DESERVES BETTER✨',
  highlights: [
    '⏳ Limited Stock Only!',
    '🎯 100% Authentic Guaranteed',
    'Fastest Delivery 🚀',
    '💌 DM to Order Now'
  ],
  instagramUrl: 'https://www.instagram.com/sanwariya_watches/',
  phone: '09691504104',
  whatsappPhone: '+919691504104',
  email: 'sanwariyawatchesofficial@gamil.com',
  address: 'Sanwariya Watches Store, India'
};

export const WATCHES_CATALOG: WatchProduct[] = [
  {
    id: 'sw-01',
    name: 'Royal Emperor Gold',
    brand: 'Sanwariya Premium',
    price: 4999,
    originalPrice: 8999,
    description: 'A masterpiece of classic horology featuring an opulent fully-brushed 24k gold-electroplated case, an intricate sunburst golden dial, and a calendar date aperture. Exudes unmatched power and prestige.',
    image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=600&auto=format&fit=crop',
    tag: 'Best Seller',
    type: 'Chronograph',
    specs: {
      case: '42mm Gold-Plated Stainless Steel',
      waterResistance: '50m (5 ATM)',
      movement: 'High-Precision Quartz Chronograph',
      strap: 'Adjustable Triple-Link Gold Bracelet'
    },
    inStock: true
  },
  {
    id: 'sw-02',
    name: 'Stealth Obsidian Chrono',
    brand: 'Sanwariya Sports',
    price: 3499,
    originalPrice: 5999,
    description: 'Designed for the modern adventurer, this stealth chronograph boasts a carbon-matte black tactical finish, dual timing subdials, and luminescent indices for flawless readability in complete darkness.',
    image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=600&auto=format&fit=crop',
    tag: 'Limited Stock',
    type: 'Chronograph',
    specs: {
      case: '44mm Gunmetal Black Alloy',
      waterResistance: '100m (10 ATM)',
      movement: 'Japanese Quartz Caliber',
      strap: 'Premium Suede Textured Leather Strap'
    },
    inStock: true
  },
  {
    id: 'sw-03',
    name: 'Emerald Heritage Automatic',
    brand: 'Sanwariya Signature',
    price: 5499,
    originalPrice: 9999,
    description: 'Capturing classic British vintage racing aesthetics, this automatic features an exquisite British emerald green dial framed by a hand-polished silver bezel. Powered purely by your natural wrist motion.',
    image: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=600&auto=format&fit=crop',
    tag: 'New Arrival',
    type: 'Automatic',
    specs: {
      case: '40mm Premium 316L Stainless Steel',
      waterResistance: '30m (3 ATM)',
      movement: 'Miyota 21-Jewel Automatic Self-Winding',
      strap: 'Genuine Hand-Stitched Cognac Leather'
    },
    inStock: true
  },
  {
    id: 'sw-04',
    name: 'Vanguard Rose Gold',
    brand: 'Sanwariya Luxury',
    price: 3999,
    originalPrice: 6999,
    description: 'An exercise in minimalist luxury. Crisp, clean dial in flawless matte white with raised rose gold linear indices, housed in an ultra-slim 8mm case. The ultimate executive dress watch.',
    image: 'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?q=80&w=600&auto=format&fit=crop',
    tag: 'Authentic',
    type: 'Luxury Classic',
    specs: {
      case: '39mm Slim Rose Gold Alloy',
      waterResistance: '30m (3 ATM)',
      movement: 'Swiss Precision Quartz',
      strap: 'Alligator-Embossed Italian Black Leather'
    },
    inStock: true
  },
  {
    id: 'sw-05',
    name: 'Cosmo Oceanic Diver',
    brand: 'Sanwariya Professional',
    price: 4799,
    originalPrice: 7999,
    description: 'A professional-grade dive watch equipped with a unidirectional rotating ceramic ocean blue bezel, high-contrast oversized geometric indices, and a scratch-resistant sapphire crystal dome.',
    image: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=600&auto=format&fit=crop',
    tag: 'Best Seller',
    type: 'Automatic',
    specs: {
      case: '43mm Corrosion-Resistant Steel',
      waterResistance: '200m (20 ATM)',
      movement: 'Precision Automatic 24-Hour Sweep',
      strap: 'Heavy-Duty Oyster Metal Band'
    },
    inStock: true
  },
  {
    id: 'sw-06',
    name: 'Obsidian Skeleton Mesh',
    brand: 'Sanwariya Minimal',
    price: 3299,
    originalPrice: 4999,
    description: 'A futuristic design celebrating transparency. The skeleton dial reveals the intricate inner wheel movements, supported by a super comfortable, ultra-breathable black stainless steel magnetic mesh band.',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop',
    tag: 'Limited Stock',
    type: 'Quartz',
    specs: {
      case: '41mm Space Black IP Steel',
      waterResistance: '30m (3 ATM)',
      movement: 'Modern Dual-Time Quartz',
      strap: 'Magnetic Quick-Adjust Metal Mesh Strap'
    },
    inStock: true
  },
  {
    id: 'sw-07',
    name: 'Augustus Heritage Tourbillon',
    brand: 'Sanwariya Signature',
    price: 6999,
    originalPrice: 12999,
    description: 'An elite level mechanical masterpiece showcasing an open-heart skeleton design showcasing the rhythmic balance wheel. A magnificent homage to high-end legacy horology.',
    image: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=600&auto=format&fit=crop',
    tag: 'Vintage Rare',
    type: 'Automatic',
    specs: {
      case: '42mm Polished Platinum-Tone Steel',
      waterResistance: '50m (5 ATM)',
      movement: 'Premium Calibre Skeleton Tourbillon',
      strap: 'Luxury Croco-Pattern Dark Mahogany Leather'
    },
    inStock: false
  },
  {
    id: 'sw-08',
    name: 'Aero-Racer Tachymeter',
    brand: 'Sanwariya Sports',
    price: 3699,
    originalPrice: 6499,
    description: 'Engineered for speed, the Aero-Racer features a fully functional tachymeter bezel, flyback chronograph timers, and an ultra-rugged silicone strap that handles extreme activities with ease.',
    image: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=600&auto=format&fit=crop',
    tag: 'New Arrival',
    type: 'Chronograph',
    specs: {
      case: '45mm Lightweight Carbon Fiber Polymer',
      waterResistance: '100m (10 ATM)',
      movement: 'High-Velocity Split Second Quartz',
      strap: 'Sweat-Resistant Curved Red-Lined Silicone'
    },
    inStock: true
  }
];

export const CUSTOMER_REVIEWS: Review[] = [
  {
    id: 'r1',
    user: 'Aman Sharma',
    rating: 5,
    comment: 'The Royal Emperor Gold is stunning. The gold finish looks exactly like a 50k watch. Delivery took only 2 days in Indore! Absolutely satisfied with Sanwariya Watches.',
    date: 'July 5, 2026',
    verified: true
  },
  {
    id: 'r2',
    user: 'Rohan Deshmukh',
    rating: 5,
    comment: 'Best customer service ever. I messaged them on WhatsApp for the Emerald Heritage and they sent me live video clips of the watch first. Highly recommended!',
    date: 'June 28, 2026',
    verified: true
  },
  {
    id: 'r3',
    user: 'Priyanka Patel',
    rating: 5,
    comment: 'Bought the Stealth Obsidian Chrono as a gift for my husband. He wears it every day. The weight feels premium, and ordering through the WhatsApp process was incredibly simple.',
    date: 'June 14, 2026',
    verified: true
  },
  {
    id: 'r4',
    user: 'Vikram Singh',
    rating: 4.8,
    comment: '100% genuine and fast shipping. Highly authentic packaging and the watch was protected perfectly during transit. Will buy again!',
    date: 'May 30, 2026',
    verified: true
  }
];

export const INSTAGRAM_MOCK_FEED = [
  {
    id: 'ig1',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=500&auto=format&fit=crop',
    likes: 245,
    comments: 18,
    caption: 'Time is luxury. Make it count with our limited-edition Stealth Obsidian Chrono. ✨ Link in bio. #SanwariyaWatches #wristwear'
  },
  {
    id: 'ig2',
    imageUrl: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=500&auto=format&fit=crop',
    likes: 412,
    comments: 32,
    caption: 'Gold never goes out of style. Elevate your presence today with Royal Emperor. ⚜️ 100% Authentic. #luxury #rolexlookalike #goldwatch'
  },
  {
    id: 'ig3',
    imageUrl: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=500&auto=format&fit=crop',
    likes: 189,
    comments: 11,
    caption: 'Mechanical beauty in motion. Pure craftsmanship. No batteries, just the soul of movement. ⚙️ #automaticwatch #watches'
  },
  {
    id: 'ig4',
    imageUrl: 'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?q=80&w=500&auto=format&fit=crop',
    likes: 310,
    comments: 25,
    caption: 'Sleek. Minimalist. Timeless. Designed for the high-achieving modern professional. 💼 #MinimalistStyle #dresstimepiece'
  },
  {
    id: 'ig5',
    imageUrl: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=500&auto=format&fit=crop',
    likes: 367,
    comments: 29,
    caption: 'Deep-ocean ready. 200m water resistance. Meet the Cosmo Oceanic. 🌊 Limited Stock. #diverwatch #proadventure'
  },
  {
    id: 'ig6',
    imageUrl: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=500&auto=format&fit=crop',
    likes: 298,
    comments: 14,
    caption: 'Uncompromising performance. Perfect tachymeter scale for speed enthusiasts. 🏎️💨 #chrono #motorsports'
  }
];
