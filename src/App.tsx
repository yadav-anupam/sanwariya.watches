import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  SlidersHorizontal, 
  ArrowRight, 
  ChevronRight, 
  Instagram, 
  Phone, 
  Mail, 
  MapPin, 
  Sparkles, 
  Star, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  ShieldCheck, 
  Truck, 
  ArrowUpRight, 
  Heart,
  ShoppingBag
} from 'lucide-react';

import { Header } from './components/Header';
import { WatchModal } from './components/WatchModal';
import { CartDrawer } from './components/CartDrawer';
import { ContactForm } from './components/ContactForm';
import { Logo } from './components/Logo';
import { AuthModal } from './components/AuthModal';
import { OrderSuccessView } from './components/OrderSuccessView';
import { supabase } from './lib/supabase';
import { WatchProduct, CartItem } from './types';
import { BRAND_STATS, WATCHES_CATALOG, CUSTOMER_REVIEWS, INSTAGRAM_MOCK_FEED } from './data';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'menu' | 'about' | 'contact' | 'order-success'>('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [startCartAtCheckout, setStartCartAtCheckout] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<WatchProduct | null>(null);
  const [lastOrder, setLastOrder] = useState<{
    name: string;
    phone: string;
    address: string;
    notes?: string;
    items: CartItem[];
    totalPrice: number;
    createdAt: string;
  } | null>(null);
  
  // Auth states
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  
  // Catalog states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [sortOption, setSortOption] = useState<string>('featured');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [dbProducts, setDbProducts] = useState<WatchProduct[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbBrands, setDbBrands] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [instagramImages, setInstagramImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800',
    'https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=800',
    'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=800',
    'https://images.unsplash.com/photo-1622434641406-a158123450f9?q=80&w=800',
    'https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=800',
    'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=800'
  ]);
  
  // Interactive notifications (Toast alerts)
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  // Combined Category and Brand Collections derived dynamically
  const combinedCollections = useMemo(() => {
    const items: Array<{
      id: string;
      name: string;
      type: 'Category' | 'Brand';
      image: string;
      description: string;
    }> = [];

    // Prioritize user-created categories and brands
    if (dbCategories.length > 0 || dbBrands.length > 0) {
      dbCategories.forEach(cat => {
        if (cat.image_url || cat.name) {
          items.push({
            id: cat.id,
            name: cat.name,
            type: 'Category',
            image: cat.image_url || 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=400',
            description: cat.description || 'Custom curated timepiece series'
          });
        }
      });

      dbBrands.forEach(brand => {
        if (brand.logo_url || brand.name) {
          items.push({
            id: brand.id,
            name: brand.name,
            type: 'Brand',
            image: brand.logo_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
            description: brand.description || 'Renowned luxury watchmaker'
          });
        }
      });
    }

    // Fallback default showcase collections
    if (items.length === 0) {
      return [
        {
          id: 'def-1',
          name: 'Skeletal Series',
          type: 'Category' as const,
          image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&auto=format&fit=crop&q=80',
          description: 'Transparent gears displaying structural masterpieces'
        },
        {
          id: 'def-2',
          name: 'Chronograph',
          type: 'Category' as const,
          image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&auto=format&fit=crop&q=80',
          description: 'High-precision multi-dial stopwatches'
        },
        {
          id: 'def-3',
          name: 'Rolex',
          type: 'Brand' as const,
          image: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=400&auto=format&fit=crop&q=80',
          description: 'Uncompromising prestige and classical luxury'
        },
        {
          id: 'def-4',
          name: 'Audemars Piguet',
          type: 'Brand' as const,
          image: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=400&auto=format&fit=crop&q=80',
          description: 'Avant-garde royal oak geometry & complexity'
        },
        {
          id: 'def-5',
          name: 'Classic Vintage',
          type: 'Category' as const,
          image: 'https://images.unsplash.com/photo-1539874754764-5a96559165b0?w=400&auto=format&fit=crop&q=80',
          description: 'Hand-wound nostalgic masterpieces from golden eras'
        },
        {
          id: 'def-6',
          name: 'Patek Philippe',
          type: 'Brand' as const,
          image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400&auto=format&fit=crop&q=80',
          description: 'Swiss horological legacy and timeless elegance'
        }
      ];
    }

    return items;
  }, [dbCategories, dbBrands]);

  const handleCollectionClick = (item: { name: string; type: 'Category' | 'Brand' }) => {
    if (item.type === 'Category') {
      setSelectedType(item.name);
    } else {
      setSelectedType('All');
      setSearchQuery(item.name);
    }
    setActiveTab('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`🔍 Filtering watch catalog for: ${item.name}`);
  };

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
      if (!error && data) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      setIsAdmin(false);
    }
  };

  // Load user session and monitor auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        checkAdminStatus(u.id);
      } else {
        setIsAdmin(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        checkAdminStatus(u.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch products, categories, and brands from Supabase
  useEffect(() => {
    const fetchCatalogData = async () => {
      try {
        setIsLoadingProducts(true);
        // Fetch published products
        const { data: dbProds, error: pError } = await supabase
          .from('products')
          .select('*, product_images(image_url, sort_order)')
          .eq('status', 'published');

        if (pError) throw pError;

        // Fetch categories
        const { data: dbCats } = await supabase
          .from('categories')
          .select('*');

        // Fetch brands
        const { data: dbBrands } = await supabase
          .from('brands')
          .select('*');

        const categoriesList = dbCats || [];
        const brandsList = dbBrands || [];

        // Check if there's a database-backed system row for Instagram images
        const systemSettings = categoriesList.find((c: any) => c.name === '__INSTAGRAM_IMAGES__');
        if (systemSettings && systemSettings.description) {
          try {
            const urls = JSON.parse(systemSettings.description);
            if (Array.isArray(urls) && urls.length === 6) {
              setInstagramImages(urls);
            }
          } catch (e) {
            console.warn('Failed to parse dynamic instagram images from database:', e);
          }
        }

        // Filter out system row so it doesn't leak into visible categories list
        const visibleCategories = categoriesList.filter((c: any) => c.name !== '__INSTAGRAM_IMAGES__');

        const mapped: WatchProduct[] = (dbProds || []).map((p: any) => {
          // Resolve category name to use as type
          const cat = categoriesList.find((c: any) => c.id === p.category_id);
          const resolvedType = cat ? cat.name : 'Luxury Classic';

          // Resolve brand name
          const brandObj = brandsList.find((b: any) => b.id === p.brand_id);
          const resolvedBrand = brandObj ? brandObj.name : 'Sanwariya Luxury';

          // Resolve image
          let imageUrl = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=120';
          const resolvedImages = p.product_images ? p.product_images.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)).map((img: any) => img.image_url) : [];
          if (resolvedImages && resolvedImages.length > 0) {
            imageUrl = resolvedImages[0];
          } else if (p.images && p.images.length > 0) {
            imageUrl = p.images[0];
          } else if (p.image_url) {
            imageUrl = p.image_url;
          }

          // Resolve tag
          let resolvedTag: WatchProduct['tag'] = 'Authentic';
          if (p.is_best_seller) {
            resolvedTag = 'Best Seller';
          } else if (p.is_trending) {
            resolvedTag = 'New Arrival';
          } else if (p.is_featured) {
            resolvedTag = 'Limited Stock';
          }

          return {
            id: p.id,
            name: p.name,
            brand: resolvedBrand,
            price: Number(p.pricing_selling || 0),
            originalPrice: Number(p.pricing_original || 0),
            description: p.full_description || p.short_description || '',
            image: imageUrl,
            tag: resolvedTag,
            type: resolvedType as WatchProduct['type'],
            specs: {
              case: p.variant_size || '42mm Premium Stainless Steel',
              waterResistance: p.variant_dimensions || '50m (5 ATM)',
              movement: p.variant_material || 'High-Precision Movement',
              strap: p.variant_color || 'Premium Metal/Leather Strap'
            },
            inStock: p.stock_quantity > 0 || p.unlimited_stock,
            gstPercentage: Number(p.pricing_tax || 0),
            shippingCharges: Number(p.pricing_shipping || 0)
          };
        });

        // Set the products in state
        setDbProducts(mapped);
        setDbCategories(visibleCategories);
        setDbBrands(brandsList);
      } catch (err) {
        console.error('Error fetching dynamic products from Supabase:', err);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchCatalogData();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      showToast('🔒 Safely signed out of your secure session.');
    } catch (err: any) {
      console.error('Error signing out:', err);
    }
  };

  // Load cart from localStorage on init
  useEffect(() => {
    const savedCart = localStorage.getItem('sanwariya_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse saved cart');
      }
    }
  }, []);

  // Synchronize cart with latest database products to ensure uploaded images and prices are up to date
  useEffect(() => {
    if (dbProducts.length > 0) {
      setCart(currentCart => {
        let changed = false;
        const updatedCart = currentCart.map(item => {
          const latestProduct = dbProducts.find(p => p.id === item.product.id);
          if (latestProduct && (
            latestProduct.image !== item.product.image ||
            latestProduct.price !== item.product.price ||
            latestProduct.originalPrice !== item.product.originalPrice ||
            latestProduct.name !== item.product.name
          )) {
            changed = true;
            return { ...item, product: latestProduct };
          }
          return item;
        });
        if (changed) {
          localStorage.setItem('sanwariya_cart', JSON.stringify(updatedCart));
          return updatedCart;
        }
        return currentCart;
      });
    }
  }, [dbProducts]);

  // Save cart changes
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('sanwariya_cart', JSON.stringify(newCart));
  };

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Cart Handlers
  const handleAddToCart = (product: WatchProduct, quantity: number) => {
    if (!user) {
      setIsAuthOpen(true);
      showToast('🔒 Please sign in to your secure collector account to reserve timepieces.');
      return;
    }
    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    let updatedCart = [...cart];
    
    if (existingIndex > -1) {
      updatedCart[existingIndex].quantity += quantity;
    } else {
      updatedCart.push({ product, quantity });
    }
    
    saveCart(updatedCart);
    showToast(`🛒 Added ${quantity}x ${product.name} to your bag!`);
  };

  const handleInstantCheckout = (product: WatchProduct, quantity: number) => {
    if (!user) {
      setIsAuthOpen(true);
      showToast('🔒 Please sign in to your secure collector account to reserve timepieces.');
      return;
    }
    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    let updatedCart = [...cart];
    
    if (existingIndex > -1) {
      updatedCart[existingIndex].quantity += quantity;
    } else {
      updatedCart.push({ product, quantity });
    }
    
    saveCart(updatedCart);
    setStartCartAtCheckout(true);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    const updatedCart = cart.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    );
    saveCart(updatedCart);
  };

  const handleRemoveFromCart = (productId: string) => {
    const itemToRemove = cart.find(item => item.product.id === productId);
    const updatedCart = cart.filter(item => item.product.id !== productId);
    saveCart(updatedCart);
    if (itemToRemove) {
      showToast(`Removed ${itemToRemove.product.name} from cart.`);
    }
  };

  const handleClearCart = () => {
    saveCart([]);
  };

  const toggleFavorite = (id: string, name: string) => {
    if (favorites.includes(id)) {
      setFavorites(prev => prev.filter(favId => favId !== id));
      showToast(`Removed ${name} from your wishlist.`);
    } else {
      setFavorites(prev => [...prev, id]);
      showToast(`❤️ Added ${name} to your wishlist!`);
    }
  };

  // Dynamic catalog list loaded exclusively from Supabase
  const catalogList = useMemo(() => {
    return dbProducts;
  }, [dbProducts]);

  // Filter and Search Watches
  const filteredWatches = useMemo(() => {
    return catalogList.filter(watch => {
      const matchesSearch = 
        watch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        watch.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        watch.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        watch.type.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = selectedType === 'All' || watch.type === selectedType;
      
      return matchesSearch && matchesType;
    }).sort((a, b) => {
      if (sortOption === 'price-asc') return a.price - b.price;
      if (sortOption === 'price-desc') return b.price - a.price;
      if (sortOption === 'popular') return (a.tag === 'Best Seller' ? -1 : 1);
      return 0; // Default featured sequence
    });
  }, [catalogList, searchQuery, selectedType, sortOption]);

  const featuredWatches = useMemo(() => {
    return catalogList.filter(watch => watch.tag === 'Best Seller' || watch.tag === 'New Arrival').slice(0, 3);
  }, [catalogList]);

  const featuredHeroWatch = useMemo(() => {
    return catalogList[0] || null;
  }, [catalogList]);

  return (
    <div className="min-h-screen bg-black text-neutral-100 font-sans selection:bg-gold-500 selection:text-black antialiased overflow-x-hidden">
      
      {/* Sticky Premium Navigation Bar */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={() => {
          setStartCartAtCheckout(false);
          setIsCartOpen(true);
        }}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSignOut={handleSignOut}
        isAdmin={isAdmin}
      />

      {/* Luxury Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(u) => showToast(`👋 Welcome back, ${u.user_metadata?.full_name || u.email}!`)}
      />

      {/* Main Container with tab switching animation */}
      <main className="relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
            >
              {/* Luxury Hero Section */}
              <section className="relative overflow-hidden bg-luxury-radial py-20 lg:py-28 px-4 sm:px-6 lg:px-8 border-b border-neutral-950">
                {/* Visual Glows */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-10 right-10 w-72 h-72 bg-gold-900/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  
                  {/* Left Column Text details */}
                  <div className="lg:col-span-7 flex flex-col text-center lg:text-left items-center lg:items-start">
                    
                    {/* Urgency Announcement Pill */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold-500/20 bg-gold-950/20 text-gold-400 text-[10px] tracking-widest font-extrabold uppercase mb-6">
                      <Sparkles size="10" />
                      <span>{BRAND_STATS.tagline}</span>
                    </div>

                    <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
                      Elevate Your Wrist. <br />
                      <span className="text-gold-gradient">Define Your Legacy.</span>
                    </h1>

                    <p className="text-neutral-400 text-sm sm:text-base lg:text-lg max-w-xl leading-relaxed mb-8 font-sans font-light">
                      Sanwariya Watches curates authentic, high-caliber, and premium luxury timepieces. Experience unparalleled build quality, precision timing, and swift secure delivery direct to your door.
                    </p>

                    {/* Trust indicators */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg mb-8 text-left">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-neutral-900 text-gold-400 border border-neutral-800">
                          <ShieldCheck size="16" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">100% Authentic</p>
                          <p className="text-[10px] text-neutral-500">Verified Sourcing</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-neutral-900 text-gold-400 border border-neutral-800">
                          <Truck size="16" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Fastest Delivery</p>
                          <p className="text-[10px] text-neutral-500">Express Tracked</p>
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-neutral-900 text-gold-400 border border-neutral-800">
                          <Phone size="16" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Direct DM Order</p>
                          <p className="text-[10px] text-neutral-500">Instant Support</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                      <button
                        onClick={() => setActiveTab('menu')}
                        className="px-8 py-4 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-sans font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 shadow-lg shadow-gold-500/10 hover:shadow-gold-500/20 hover:-translate-y-0.5"
                      >
                        <span>Explore Watch Menu</span>
                        <ArrowRight size="14" />
                      </button>

                      <a
                        href={BRAND_STATS.instagramUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-8 py-4 rounded-xl border border-neutral-800 hover:border-gold-500/40 text-neutral-300 hover:text-white font-sans font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Instagram size="14" />
                        <span>Visit Instagram</span>
                      </a>
                    </div>
                  </div>

                  {/* Right Column Interactive Featured Watch 3D effect Card */}
                  <div className="lg:col-span-5 flex justify-center">
                    {featuredHeroWatch ? (
                      <motion.div
                        whileHover={{ y: -6, rotateY: 2, rotateX: -2 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        onClick={() => setSelectedProduct(featuredHeroWatch)}
                        className="group relative cursor-pointer w-full max-w-sm rounded-3xl border border-neutral-900 bg-neutral-950 p-4 shadow-2xl transition-all duration-300 hover:border-gold-500/30 overflow-hidden"
                      >
                        {/* Urgency tag overlay */}
                        <div className="absolute top-6 left-6 z-10">
                          <span className="px-3.5 py-1 rounded-full bg-gold-500 text-black font-sans text-[9px] tracking-widest font-extrabold uppercase">
                            Featured Masterpiece
                          </span>
                        </div>

                        {/* Watch Image container */}
                        <div className="h-80 w-full overflow-hidden rounded-2xl bg-neutral-900 relative">
                          <img
                            src={featuredHeroWatch.image}
                            alt={featuredHeroWatch.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>

                        {/* Metadata info */}
                        <div className="mt-4 px-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-mono text-gold-500 uppercase tracking-widest font-bold">
                              {featuredHeroWatch.brand}
                            </span>
                            {featuredHeroWatch.originalPrice && (
                              <span className="text-xs font-mono text-neutral-500">₹{featuredHeroWatch.originalPrice}</span>
                            )}
                          </div>
                          <h3 className="font-serif text-lg text-white font-bold tracking-wide group-hover:text-gold-400 transition-colors">
                            {featuredHeroWatch.name}
                          </h3>
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-neutral-900">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-lg font-mono font-bold text-gold-400">₹{featuredHeroWatch.price}</span>
                              <span className="text-[10px] text-emerald-400 font-mono">Free Express Delivery 🚀</span>
                            </div>
                            <span className="text-xs font-sans font-bold text-white flex items-center gap-1 group-hover:underline">
                              Details <ChevronRight size="12" />
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="w-full max-w-sm rounded-3xl border border-dashed border-neutral-800 bg-neutral-950/40 p-8 text-center flex flex-col justify-center items-center gap-4">
                        <span className="text-4xl">⏱️</span>
                        <h3 className="font-serif text-lg text-white font-bold tracking-wide">Awaiting Next Watch Drop</h3>
                        <p className="text-neutral-500 text-xs font-sans leading-relaxed">
                          No luxury timepieces have been registered in the database catalog yet. Add high-precision watches from the Admin Portal to populate the live store collection!
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              </section>

              {/* Urgency Highlight Banner */}
              <section className="bg-neutral-950 py-10 px-4 border-b border-neutral-900/50">
                <div className="mx-auto max-w-7xl flex flex-col md:flex-row gap-6 items-center justify-between">
                  <div className="flex flex-col text-center md:text-left">
                    <span className="text-red-500 text-xs font-mono font-bold uppercase tracking-widest mb-1">🚨 CRITICAL ALLOCATION WARNING</span>
                    <h3 className="font-serif text-white font-bold text-lg sm:text-xl tracking-wide">
                      AUTHENTIC WATCH DROPS HAVE EXTREMELY LIMITED STOCK
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveTab('menu')}
                      className="px-6 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-gold-400 font-sans font-bold text-xs uppercase tracking-widest border border-neutral-800 transition-all cursor-pointer w-full sm:w-auto"
                    >
                      Reserve Timepiece
                    </button>
                  </div>
                </div>
              </section>

              {/* Three Featured Watch Grid Section */}
              <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black">
                <div className="mx-auto max-w-7xl">
                  <div className="text-center mb-12">
                    <span className="text-xs font-mono uppercase tracking-widest text-gold-500 font-bold">THE HIGHLIGHTS</span>
                    <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-wide mt-2">
                      Most Desired Curated Timepieces
                    </h2>
                    <p className="text-neutral-400 text-xs sm:text-sm font-sans max-w-md mx-auto mt-3">
                      Each model represents the absolute pinnacle of luxury aesthetics. Rigorously vetted and backed by 100% authenticity.
                    </p>
                  </div>

                  {featuredWatches.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {featuredWatches.map((watch) => (
                        <div
                          key={watch.id}
                          onClick={() => setSelectedProduct(watch)}
                          className="group relative cursor-pointer bg-neutral-900/20 hover:bg-neutral-900/40 rounded-2xl border border-neutral-900 p-4 transition-all duration-300 hover:border-gold-500/20"
                        >
                          <div className="h-64 w-full overflow-hidden rounded-xl bg-neutral-900 relative">
                            <img
                              src={watch.image}
                              alt={watch.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <span className="absolute top-4 left-4 px-2.5 py-1 rounded bg-black/75 text-gold-400 font-mono text-[9px] uppercase tracking-widest font-bold border border-gold-500/20">
                              {watch.tag}
                            </span>
                          </div>
                          <div className="mt-4">
                            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">{watch.brand}</span>
                            <h4 className="font-serif text-base text-white font-bold tracking-wide mt-0.5 line-clamp-1">{watch.name}</h4>
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-neutral-900/80">
                              <span className="text-base font-mono font-bold text-gold-400">₹{watch.price}</span>
                              <span className="text-xs font-sans text-neutral-400 hover:text-gold-400 transition-colors flex items-center gap-1">
                                View Details <ChevronRight size="12" />
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 px-6 rounded-2xl border border-neutral-900 bg-neutral-950/40 text-center max-w-xl mx-auto">
                      <p className="text-neutral-500 text-xs sm:text-sm font-sans italic">
                        No curated pieces are flagged as featured right now. Browse our full live catalog below or add watch collections in the Admin Portal!
                      </p>
                    </div>
                  )}

                  <div className="text-center mt-12">
                    <button
                      onClick={() => setActiveTab('menu')}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-900 border border-neutral-800 text-white hover:text-gold-400 hover:bg-neutral-800 text-xs font-sans font-bold tracking-widest uppercase transition-all cursor-pointer"
                    >
                      <span>Browse Full Catalog</span>
                      <ArrowRight size="12" />
                    </button>
                  </div>
                </div>
              </section>

              {/* Enhanced Live Instagram Drop Feed Section */}
              <section 
                onClick={() => {
                  showToast("🔗 Redirecting to Sanwariya Watches Instagram drops...");
                  setTimeout(() => {
                    window.open(BRAND_STATS.instagramUrl, '_blank', 'noopener,noreferrer');
                  }, 600);
                }}
                className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-950 border-t border-b border-neutral-900/30 cursor-pointer group/sec relative overflow-hidden transition-all duration-300 hover:bg-neutral-900/40"
              >
                <div id="instagram-gallery-container" className="mx-auto max-w-7xl">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-10 text-center md:text-left gap-4">
                    <div>
                      <span className="text-xs font-mono uppercase tracking-widest text-gold-500 font-bold flex items-center justify-center md:justify-start gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        LIVE INSTAGRAM FEED
                      </span>
                      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-wide mt-1 group-hover/sec:text-gold-400 transition-colors">
                        Follow Our Instagram Drop Feed
                      </h2>
                      <p className="text-[11px] text-neutral-400 mt-1 font-sans">
                        Click anywhere in this section to explore live watch exhibitions and DM on Instagram to purchase.
                      </p>
                    </div>

                    {/* Social Statistics */}
                    <div className="flex items-center gap-6 bg-neutral-900/80 p-4 rounded-2xl border border-neutral-800 backdrop-blur-sm">
                      <div className="text-center border-r border-neutral-800 pr-5">
                        <p className="text-lg font-mono font-bold text-white">1,089+</p>
                        <p className="text-[9px] text-neutral-500 uppercase tracking-widest">Collectors</p>
                      </div>
                      <div className="text-center border-r border-neutral-800 pr-5">
                        <p className="text-lg font-mono font-bold text-white">32</p>
                        <p className="text-[9px] text-neutral-500 uppercase tracking-widest">Watch Drops</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-mono font-bold text-gold-400">100%</p>
                        <p className="text-[9px] text-neutral-500 uppercase tracking-widest">Authentic</p>
                      </div>
                    </div>
                  </div>

                  {/* 6 High-Quality Enhanced Watch Only Images */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                      {
                        caption: 'White Minimalist Classic',
                        likes: '1.2k'
                      },
                      {
                        caption: 'Sanwariya Obsidian Elite',
                        likes: '894'
                      },
                      {
                        caption: 'Steel Dynamic Chronograph',
                        likes: '1.5k'
                      },
                      {
                        caption: 'Royal Horizon Gold Tourbillon',
                        likes: '2.1k'
                      },
                      {
                        caption: 'Vintage Leather Heritage',
                        likes: '1.1k'
                      },
                      {
                        caption: 'Exquisite Mechanical Core',
                        likes: '1.7k'
                      }
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="group/card relative h-56 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-850 transition-all duration-300 hover:border-gold-500/50 hover:shadow-lg hover:shadow-gold-500/5"
                      >
                        <img
                          src={instagramImages[idx] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800'}
                          alt={item.caption}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-3 flex flex-col justify-end opacity-90 group-hover/card:opacity-100 transition-opacity">
                          <span className="text-[8px] font-mono text-gold-400 uppercase tracking-widest font-bold">@sanwariya_watches</span>
                          <p className="text-[10px] font-bold text-white font-sans truncate mt-0.5">{item.caption}</p>
                          <div className="flex justify-between items-center text-[9px] font-mono text-neutral-400 mt-1.5 border-t border-neutral-800/60 pt-1.5">
                            <span className="flex items-center gap-1 text-red-500">❤️ {item.likes}</span>
                            <span className="text-gold-400 flex items-center gap-0.5">Shop drops <ArrowUpRight size="8" /></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-center mt-12">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        showToast("🔗 Redirecting to Sanwariya Watches Instagram...");
                        setTimeout(() => {
                          window.open(BRAND_STATS.instagramUrl, '_blank', 'noopener,noreferrer');
                        }, 500);
                      }}
                      className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gold-500 text-black font-sans font-bold text-xs tracking-widest uppercase hover:bg-gold-400 transition-all cursor-pointer shadow-lg shadow-gold-500/10 hover:scale-[1.02]"
                    >
                      <Instagram size="14" />
                      <span>Explore @sanwariya_watches</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Testimonials Quote Section */}
              <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black">
                <div className="mx-auto max-w-4xl text-center">
                  <div className="flex justify-center mb-6 text-gold-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size="18" fill="#dcae1d" stroke="none" />
                    ))}
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl text-white font-semibold leading-snug tracking-wide italic max-w-3xl mx-auto mb-6">
                    "Every timepiece we sell is inspected carefully by certified master horologists. We do not just sell watches; we secure your identity."
                  </h3>
                  <div className="flex flex-col items-center">
                    <div className="h-10 w-[1px] bg-gold-500 mb-4" />
                    <p className="font-serif text-sm font-bold text-white tracking-widest uppercase">
                      SANWARIYA WATCHES OFFICIAL
                    </p>
                    <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                      AUTHENTIC WATCH CURATORS
                    </p>
                  </div>
                </div>
              </section>

            </motion.div>
          )}

          {activeTab === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="py-12 px-4 sm:px-6 lg:px-8 bg-black"
            >
              <div className="mx-auto max-w-7xl">
                
                {/* Title and Intro */}
                <div className="text-center mb-10">
                  <span className="text-xs font-mono uppercase tracking-widest text-gold-500 font-bold">THE CATALOG</span>
                  <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-wide mt-1">
                    Premium Watch Collections
                  </h2>
                  <p className="text-neutral-400 text-xs sm:text-sm font-sans max-w-md mx-auto mt-2">
                    Select a model below to explore technical specifications and proceed to checkout instantly over WhatsApp.
                  </p>
                </div>

                {/* Filters, Search and Sorting layout block */}
                <div className="bg-neutral-950 p-4 sm:p-6 rounded-2xl border border-neutral-900 mb-8 flex flex-col gap-4">
                  
                  {/* Search and Sort */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* Search bar */}
                    <div className="relative md:col-span-8">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size="18" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search model, movement, Case size, color..."
                        className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-800 text-white rounded-xl text-xs sm:text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 transition-all font-sans"
                      />
                    </div>

                    {/* Sort option drop-down */}
                    <div className="relative md:col-span-4 flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5">
                      <SlidersHorizontal className="text-neutral-500" size="14" />
                      <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        className="w-full bg-transparent text-white text-xs py-1.5 focus:outline-none focus:ring-0 appearance-none font-sans cursor-pointer"
                      >
                        <option value="featured">Featured Sequence</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="popular">Best Sellers first</option>
                      </select>
                    </div>
                  </div>

                  {/* Filter pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-900">
                    <span className="text-[10px] font-sans font-bold tracking-wider uppercase text-neutral-500 mr-2">MOVEMENT:</span>
                    {['All', 'Automatic', 'Chronograph', 'Luxury Classic', 'Quartz'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-sans tracking-wide font-medium transition-colors cursor-pointer ${
                          selectedType === type
                            ? 'bg-gold-500 text-black font-semibold'
                            : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-850'
                        }`}
                      >
                        {type === 'All' ? 'All Watches' : type}
                      </button>
                    ))}
                  </div>

                </div>

                {/* Products Grid layout */}
                {filteredWatches.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredWatches.map((watch) => {
                      const discount = watch.originalPrice 
                        ? Math.round(((watch.originalPrice - watch.price) / watch.originalPrice) * 100) 
                        : 0;

                      return (
                        <div
                          key={watch.id}
                          className="group relative flex flex-col justify-between rounded-2xl border border-neutral-900 bg-neutral-950/40 p-4 transition-all duration-300 hover:border-gold-500/20"
                        >
                          {/* Heart icon overlay */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(watch.id, watch.name);
                            }}
                            className="absolute top-6 right-6 z-10 p-1.5 rounded-full bg-black/60 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                            aria-label="Add to wishlist"
                          >
                            <Heart size="14" fill={favorites.includes(watch.id) ? '#ef4444' : 'none'} className={favorites.includes(watch.id) ? 'text-red-500' : ''} />
                          </button>

                          {/* Detail Click Area */}
                          <div 
                            className="cursor-pointer flex-1 flex flex-col"
                            onClick={() => setSelectedProduct(watch)}
                          >
                            {/* Image container */}
                            <div className="h-60 w-full overflow-hidden rounded-xl bg-neutral-900 relative">
                              <img
                                src={watch.image}
                                alt={watch.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                                <span className="px-2 py-0.5 rounded bg-black/80 text-gold-400 font-mono text-[8px] uppercase tracking-widest font-extrabold border border-gold-500/10">
                                  {watch.tag}
                                </span>
                              </div>
                              {discount > 0 && (
                                <span className="absolute bottom-4 left-4 px-1.5 py-0.5 rounded bg-red-600 text-white font-mono text-[8px] font-bold">
                                  SAVE {discount}%
                                </span>
                              )}
                              {!watch.inStock && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                  <span className="px-3 py-1 border border-red-500 text-red-500 font-sans text-xs tracking-widest font-bold uppercase rounded-lg">
                                    Sold Out
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Product metadata */}
                            <div className="mt-4 flex-1 flex flex-col justify-between">
                              <div>
                                <span className="text-[10px] font-mono text-gold-500 uppercase tracking-widest font-bold">
                                  {watch.brand}
                                </span>
                                <h3 className="font-serif text-sm text-white font-bold tracking-wide mt-0.5 group-hover:text-gold-400 transition-colors line-clamp-1">
                                  {watch.name}
                                </h3>
                                <p className="text-[11px] text-neutral-500 font-sans mt-1 line-clamp-2 leading-relaxed">
                                  {watch.description}
                                </p>
                              </div>

                              <div className="mt-4 pt-3 border-t border-neutral-900/60 flex items-baseline gap-2">
                                <span className="text-base font-mono font-bold text-gold-400">₹{watch.price}</span>
                                {watch.originalPrice && (
                                  <span className="text-xs font-mono text-neutral-500 line-through">₹{watch.originalPrice}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Checkout Buttons */}
                          <div className="mt-4 grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setSelectedProduct(watch)}
                              className="py-2 text-[10px] uppercase tracking-wider font-bold rounded bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-850 cursor-pointer"
                            >
                              Specs
                            </button>
                            
                            {watch.inStock ? (
                              <button
                                onClick={() => handleInstantCheckout(watch, 1)}
                                className="py-2 text-[10px] uppercase tracking-widest font-extrabold rounded bg-gold-500 hover:bg-gold-400 text-black cursor-pointer"
                              >
                                Buy Now
                              </button>
                            ) : (
                              <button
                                disabled
                                className="py-2 text-[10px] uppercase tracking-widest font-bold rounded bg-neutral-900 text-neutral-600 border border-neutral-900 cursor-not-allowed"
                              >
                                Sold Out
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-neutral-950 rounded-2xl border border-neutral-900">
                    <p className="text-neutral-500 text-sm">No timepieces matched your current filters.</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedType('All');
                      }}
                      className="mt-4 text-xs font-bold text-gold-400 uppercase tracking-widest underline hover:text-gold-300 cursor-pointer"
                    >
                      Clear Search Filters
                    </button>
                  </div>
                )}

              </div>
            </motion.div>
          )}

          {activeTab === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="py-16 px-4 sm:px-6 lg:px-8 bg-black"
            >
              <div className="mx-auto max-w-7xl">
                
                {/* Visual Grid Splitter layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gold-600/5 rounded-3xl blur-[80px]" />
                    <img
                      src="https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=600&auto=format&fit=crop"
                      alt="Craftsmanship"
                      referrerPolicy="no-referrer"
                      className="relative rounded-3xl object-cover w-full h-[450px] border border-neutral-900 shadow-2xl"
                    />
                    <div className="absolute -bottom-6 -right-6 bg-gold-500 p-6 rounded-2xl text-black font-serif hidden sm:block border border-gold-600 max-w-xs">
                      <p className="text-2xl font-black mb-1">100%</p>
                      <p className="text-xs font-sans tracking-wider uppercase font-bold text-neutral-900 leading-snug">
                        Authenticity Guarantees Backed By Certified Horologists.
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-gold-500 font-bold">OUR STORY</span>
                    <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-wide mt-2 mb-6">
                      Sanwariya Watches <br />
                      <span className="text-gold-gradient">YOUR WRIST DESERVES BETTER✨</span>
                    </h2>

                    <div className="space-y-4 font-sans text-neutral-400 text-sm leading-relaxed font-light">
                      <p>
                        Sanwariya Watches is founded on a singular commitment: delivering uncompromised aesthetic value to collectors of high-end timepieces. We believe a watch is not merely a tracking device—it is your personal legacy.
                      </p>
                      <p>
                        Our drops are strictly curated, focusing on premium materials, robust mechanical caliber actions, calendar complications, and durable finishes. Every watch that leaves our vault undergoes extensive manual tests for alignment, bezel index alignment, timing, and structural integrity.
                      </p>
                      <p>
                        With fastest delivery support across India and immediate personalized responses via WhatsApp and DMs, we provide the luxury shopping experience of high-end European boutiques directly to your phone.
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-neutral-900 text-center sm:text-left">
                      <div>
                        <p className="text-2xl font-mono font-bold text-gold-400">1,080+</p>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Collectors Connected</p>
                      </div>
                      <div>
                        <p className="text-2xl font-mono font-bold text-gold-400">32+</p>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Timeless Drops</p>
                      </div>
                      <div>
                        <p className="text-2xl font-mono font-bold text-gold-400">24h</p>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Fast Dispatch</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Testimonials Review section */}
                <div className="border-t border-neutral-900 pt-16">
                  <div className="text-center mb-12">
                    <span className="text-xs font-mono uppercase tracking-widest text-gold-500 font-bold">REVIEWS</span>
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-wide mt-2">
                      Trusted By Collectors Across India
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {CUSTOMER_REVIEWS.map((review) => (
                      <div
                        key={review.id}
                        className="bg-neutral-950 p-5 rounded-2xl border border-neutral-900 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex gap-0.5 text-gold-500 mb-3.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size="12" fill={i < Math.floor(review.rating) ? '#dcae1d' : 'none'} stroke={i < Math.floor(review.rating) ? 'none' : '#dcae1d'} />
                            ))}
                          </div>
                          <p className="text-xs text-neutral-300 leading-relaxed italic mb-4">
                            "{review.comment}"
                          </p>
                        </div>
                        <div className="border-t border-neutral-900 pt-3 mt-auto flex justify-between items-center text-[10px] font-mono">
                          <div>
                            <span className="block font-sans font-bold text-white">{review.user}</span>
                            <span className="text-neutral-500">{review.date}</span>
                          </div>
                          {review.verified && (
                            <span className="px-1.5 py-0.5 rounded bg-gold-950/40 text-gold-400 border border-gold-500/10 font-sans font-extrabold tracking-wide uppercase text-[8px]">
                              ✓ Verified Buyer
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {activeTab === 'contact' && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="py-16 px-4 sm:px-6 lg:px-8 bg-black"
            >
              <div className="mx-auto max-w-7xl">
                
                {/* Split layout: Details vs Form */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
                  
                  {/* Info Panel Left */}
                  <div className="lg:col-span-5 flex flex-col justify-between gap-8">
                    <div>
                      <span className="text-xs font-mono uppercase tracking-widest text-gold-500 font-bold">VISIT & CONTACT</span>
                      <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-wide mt-2 mb-4">
                        Connect Directly With Our Vault
                      </h2>
                      <p className="text-neutral-400 text-sm font-sans font-light leading-relaxed mb-6">
                        We prioritize fast and personal feedback. Send an email or reach out immediately on WhatsApp for instant checkout support or feedback.
                      </p>

                      <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-neutral-950 border border-neutral-900">
                          <Phone className="text-gold-500 mt-1" size="18" />
                          <div>
                            <p className="text-xs font-mono text-neutral-500 uppercase">TELEPHONE & WHATSAPP</p>
                            <p className="text-sm font-sans font-bold text-white mt-0.5">{BRAND_STATS.phone}</p>
                            <a
                              href={`https://wa.me/91${BRAND_STATS.phone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-gold-400 hover:underline text-xs inline-flex items-center gap-1 mt-1 font-semibold"
                            >
                              Message on WhatsApp <ChevronRight size="12" />
                            </a>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-neutral-950 border border-neutral-900">
                          <Mail className="text-gold-500 mt-1" size="18" />
                          <div>
                            <p className="text-xs font-mono text-neutral-500 uppercase">OFFICIAL EMAIL</p>
                            <p className="text-sm font-sans font-bold text-white mt-0.5">{BRAND_STATS.email}</p>
                            <a
                              href={`mailto:${BRAND_STATS.email}`}
                              className="text-gold-400 hover:underline text-xs inline-flex items-center gap-1 mt-1 font-semibold"
                            >
                              Send Email <ChevronRight size="12" />
                            </a>
                          </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-neutral-950 border border-neutral-900">
                          <MapPin className="text-gold-500 mt-1" size="18" />
                          <div>
                            <p className="text-xs font-mono text-neutral-500 uppercase">OFFLINE HUB LOCATION</p>
                            <p className="text-sm font-sans font-bold text-white mt-0.5">India, 100% Secure Prepaid / Online Payment Only</p>
                            <span className="text-neutral-400 text-xs mt-1 block">Worldwide tracked air cargo shipping.</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Trust statement */}
                    <div className="p-4 rounded-2xl bg-gold-950/10 border border-gold-900/20 text-xs">
                      <p className="font-serif font-bold text-gold-400 mb-1 flex items-center gap-1.5">
                        <ShieldCheck size="14" /> 100% Authentic Guarantee
                      </p>
                      <p className="text-neutral-400">
                        Every luxury piece includes a certified watch box, protective padding, and authenticity card. Direct DM to order prevents fake replicas.
                      </p>
                    </div>
                  </div>

                  {/* Form Panel Right */}
                  <div className="lg:col-span-7">
                    <ContactForm />
                  </div>

                </div>

                {/* Additional Instagram Section on Visit Us page requested */}
                <div className="border-t border-neutral-900 pt-16">
                  <div className="text-center mb-10">
                    <span className="text-xs font-mono uppercase tracking-widest text-gold-500 font-bold">DIGITAL SHOWROOM</span>
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-wide mt-2">
                      Browse Live Gallery Collections
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {INSTAGRAM_MOCK_FEED.map((post) => (
                      <a
                        key={post.id}
                        href={BRAND_STATS.instagramUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative h-40 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-850"
                      >
                        <img
                          src={post.imageUrl}
                          alt="Sanwariya Watches IG post"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <span className="px-3 py-1 bg-gold-500 text-black text-[9px] uppercase font-sans font-black tracking-widest rounded">
                            Buy Now
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {activeTab === 'order-success' && (
            <motion.div
              key="order-success"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
            >
              <OrderSuccessView 
                order={lastOrder} 
                onContinueShopping={() => {
                  setActiveTab('menu');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Luxury Footer */}
      <footer className="bg-neutral-950 border-t border-neutral-900 py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Logo & Slogan Column */}
          <div className="md:col-span-2">
            <Logo size="md" className="mb-4" />
            <p className="text-neutral-400 text-xs sm:text-sm max-w-sm mb-6 leading-relaxed font-sans">
              Authentic luxury watch curations and secure prepaid shipping across India. Defining elegance on your wrist.
            </p>
            <div className="flex gap-4">
              <a
                href={BRAND_STATS.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-full bg-neutral-900 text-neutral-400 hover:text-gold-400 transition-colors border border-neutral-850"
                aria-label="Instagram Link"
              >
                <Instagram size="16" />
              </a>
              <a
                href={`https://wa.me/91${BRAND_STATS.phone}`}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-full bg-neutral-900 text-neutral-400 hover:text-gold-400 transition-colors border border-neutral-850"
                aria-label="WhatsApp Link"
              >
                <Phone size="16" />
              </a>
            </div>
          </div>

          {/* Quick Nav links */}
          <div>
            <h4 className="font-serif text-white tracking-widest uppercase text-xs font-bold mb-4">
              BOUTIQUE NAVIGATION
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li>
                <button onClick={() => { setActiveTab('home'); window.scrollTo(0,0); }} className="hover:text-gold-400 transition-colors cursor-pointer">
                  Home Landing
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('menu'); window.scrollTo(0,0); }} className="hover:text-gold-400 transition-colors cursor-pointer">
                  Watch Menu / Catalog
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('about'); window.scrollTo(0,0); }} className="hover:text-gold-400 transition-colors cursor-pointer">
                  Our Story & Heritage
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('contact'); window.scrollTo(0,0); }} className="hover:text-gold-400 transition-colors cursor-pointer">
                  Visit & Direct Support
                </button>
              </li>
            </ul>
          </div>

          {/* Trust values */}
          <div>
            <h4 className="font-serif text-white tracking-widest uppercase text-xs font-bold mb-4">
              100% AUTHENTIC GUARANTEE
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li className="flex items-center gap-2">
                <span className="h-1 w-1 bg-gold-400 rounded-full" />
                <span>32+ Curated Watch Drops</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1 w-1 bg-gold-400 rounded-full" />
                <span>Secure WhatsApp Checkout</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1 w-1 bg-gold-400 rounded-full" />
                <span>No replica watches accepted</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1 w-1 bg-gold-400 rounded-full" />
                <span>Indore-based premium care</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Lower copyright bar */}
        <div className="mx-auto max-w-7xl border-t border-neutral-900/80 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center text-[10px] text-neutral-500 font-mono gap-4">
          <p>© 2026 Sanwariya Watches. Handcrafted for Elite Elegance. All rights reserved.</p>
          <div className="flex gap-4">
            <span>LIMITED RELEASES ONLY</span>
            <span>•</span>
            <span>FASTEST INDIAN SHIPPING 🚀</span>
          </div>
        </div>

        {/* Designed & Developed at the bottom */}
        <div className="mx-auto max-w-7xl mt-4 text-center text-[10px] text-neutral-600 font-mono">
          Designed & Developed by{' '}
          <a 
            href="https://webjugaadlabs.vercel.app" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-neutral-400 hover:text-gold-400 transition-colors underline decoration-neutral-800 hover:decoration-gold-400/50"
          >
            WebJuagd Labs | Anupam Yadav
          </a>
        </div>
      </footer>

      {/* Persistent Floating WhatsApp Widget as requested for seamless customer support directly from any view */}
      <a
        href={`https://wa.me/91${BRAND_STATS.phone}?text=Hello%20Sanwariya%20Watches!%20I%20am%20browsing%20your%20luxury%20boutique%20and%20had%20an%20inquiry%20regarding%20availabilities.`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-emerald-500 text-white shadow-2xl hover:bg-emerald-400 hover:scale-110 transition-all duration-300 flex items-center justify-center cursor-pointer group"
        aria-label="Direct Chat Support"
      >
        <MessageSquare size="24" fill="white" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 text-xs font-sans font-extrabold uppercase tracking-wider whitespace-nowrap">
          Quick Support
        </span>
      </a>

      {/* Global Interactive Watch Detail Modal Popup */}
      <WatchModal 
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onQuickCheckout={handleInstantCheckout}
      />

      {/* Shopping Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onBrowseMenu={() => setActiveTab('menu')}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOrderSuccess={(orderData) => {
          setLastOrder(orderData);
          saveCart([]);
          setActiveTab('order-success');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          showToast('👑 Timepiece Reserved! Pending Admin Approval.');
        }}
        startAtCheckout={startCartAtCheckout}
      />

      {/* Dynamic Success Alert / Toast Popup */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 30, x: '-50%' }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-neutral-900 border border-gold-500/30 text-white font-sans text-xs font-semibold flex items-center gap-2.5 shadow-2xl shadow-gold-500/5 backdrop-blur-md"
          >
            <CheckCircle className="text-gold-500 h-4 w-4" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
