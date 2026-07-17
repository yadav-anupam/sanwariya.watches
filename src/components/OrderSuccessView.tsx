import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle, 
  MessageSquare, 
  Clock, 
  ArrowRight, 
  Phone, 
  MapPin, 
  User, 
  ShoppingBag, 
  Search, 
  RefreshCw, 
  AlertCircle,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CartItem } from '../types';
import { BRAND_STATS, WATCHES_CATALOG } from '../data';

interface OrderSuccessViewProps {
  order: {
    name: string;
    phone: string;
    address: string;
    notes?: string;
    items: CartItem[];
    totalPrice: number;
    createdAt: string;
  } | null;
  onContinueShopping: () => void;
}

interface TrackedOrder {
  id: string;
  name: string;
  phone: string;
  address: string;
  items: string | any[];
  total_price: number;
  created_at: string;
  status: string;
  notes?: string;
}

export const OrderSuccessView: React.FC<OrderSuccessViewProps> = ({ order, onContinueShopping }) => {
  const [trackingPhone, setTrackingPhone] = useState(order?.phone || '');
  const [trackedOrders, setTrackedOrders] = useState<TrackedOrder[]>([]);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  // Auto-track on load if there's an active order phone
  useEffect(() => {
    if (order?.phone) {
      handleTrackOrders(order.phone);
    }
  }, [order]);

  const handleTrackOrders = async (phoneToTrack: string) => {
    if (!phoneToTrack.trim()) {
      setTrackingError('Please enter a valid phone number to query.');
      return;
    }

    setIsTrackingLoading(true);
    setTrackingError(null);
    setSearched(true);

    try {
      let results: TrackedOrder[] = [];
      const cleanPhone = phoneToTrack.trim();

      // Attempt to query bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('phone', cleanPhone)
        .order('created_at', { ascending: false });

      if (!bookingsError && bookingsData && bookingsData.length > 0) {
        results = bookingsData;
      } else {
        // Fallback to orders table
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('phone', cleanPhone)
          .order('created_at', { ascending: false });

        if (!ordersError && ordersData) {
          results = ordersData;
        }
      }

      setTrackedOrders(results);
    } catch (err: any) {
      console.error('Error tracking orders:', err);
      setTrackingError('Failed to fetch orders from secure cloud database.');
    } finally {
      setIsTrackingLoading(false);
    }
  };

  const getWhatsAppFollowUpUrl = (orderRef?: string, totalPrice?: number) => {
    const text = `Hello Sanwariya Watches Support! I am following up on my order reference ${orderRef || 'N/A'} (Total: ₹${totalPrice || order?.totalPrice || 0}). Please let me know the payment verification and dispatch timeline!`;
    return `https://wa.me/91${BRAND_STATS.phone}?text=${encodeURIComponent(text)}`;
  };

  const parseOrderItems = (itemsStrOrArr: any): any[] => {
    try {
      if (typeof itemsStrOrArr === 'string') {
        return JSON.parse(itemsStrOrArr);
      }
      if (Array.isArray(itemsStrOrArr)) {
        return itemsStrOrArr;
      }
    } catch (e) {
      console.warn('Failed to parse items json', e);
    }
    return [];
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
      
      {/* SUCCESS BANNER */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 mb-6 relative">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="absolute inset-0 rounded-full bg-emerald-500/5 animate-ping"
          />
          <CheckCircle size="40" strokeWidth="1.5" className="relative z-10" />
        </div>
        
        <span className="text-xs font-mono uppercase tracking-[0.3em] text-emerald-400 font-extrabold block mb-2">
          Checkout Redirection Successful
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Your Timepiece is <span className="text-gold-gradient">Reserved.</span>
        </h1>
        <p className="text-neutral-400 text-sm max-w-lg mx-auto mt-4 font-sans font-light leading-relaxed">
          Your order has been recorded and redirected to WhatsApp for final payment instructions. We are ready to verify your premium dispatch.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: ACTIVE RECEIPT */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-neutral-950 rounded-2xl border border-neutral-900 overflow-hidden relative">
            {/* Visual ticket notch effects */}
            <div className="absolute -left-3 top-[35%] h-6 w-6 rounded-full bg-black border-r border-neutral-900" />
            <div className="absolute -right-3 top-[35%] h-6 w-6 rounded-full bg-black border-l border-neutral-900" />

            <div className="p-6 sm:p-8 border-b border-dashed border-neutral-850">
              <div className="flex justify-between items-start gap-4 mb-6">
                <div>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">ORDER STATUS</span>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-950/40 border border-amber-500/20 text-amber-400 text-[10px] uppercase font-black font-mono tracking-wider">
                    <Clock size="10" className="animate-pulse" />
                    <span>Pending Admin Approval</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">EST. DISPATCH</span>
                  <span className="text-xs font-sans font-bold text-white mt-1 block">Within 24 Hours 🚀</span>
                </div>
              </div>

              {order ? (
                <div className="space-y-4">
                  <h3 className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Ordered Items</h3>
                  <div className="space-y-2.5">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-3">
                          {item.product.image && (
                            <img 
                              src={item.product.image} 
                              alt={item.product.name} 
                              className="w-10 h-10 rounded object-cover border border-neutral-900 bg-neutral-900"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <div>
                            <p className="font-sans font-bold text-white line-clamp-1">{item.product.name}</p>
                            <span className="text-[10px] font-mono text-neutral-500 uppercase">{item.product.brand} • Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <span className="font-mono text-gold-500 font-semibold">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-neutral-500 italic">
                  Complete a checkout to view live transaction receipt details.
                </div>
              )}
            </div>

            {/* LOWER PORTION OF THE TICKET */}
            <div className="p-6 sm:p-8 bg-neutral-900/30 space-y-5 text-xs">
              <div className="flex justify-between font-mono text-sm border-b border-neutral-900 pb-3">
                <span className="text-neutral-400">Total Price</span>
                <span className="text-gold-400 font-bold">₹{(order?.totalPrice || 0).toLocaleString('en-IN')}</span>
              </div>

              {order && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">DELIVERY TO</span>
                    <p className="font-sans font-bold text-white flex items-center gap-1">
                      <User size="11" className="text-gold-500" /> {order.name}
                    </p>
                    <p className="text-neutral-400 text-[11px] leading-relaxed flex items-start gap-1 mt-1">
                      <MapPin size="11" className="text-neutral-500 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{order.address}</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">CONTACT INFO</span>
                    <p className="font-sans font-bold text-white flex items-center gap-1 font-mono">
                      <Phone size="11" className="text-gold-500" /> {order.phone}
                    </p>
                    {order.notes && (
                      <p className="text-neutral-500 text-[10px] italic mt-1 bg-neutral-900/60 p-1.5 rounded border border-neutral-855">
                        "{order.notes}"
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ACTION LINKS */}
              <div className="pt-4 border-t border-neutral-900 flex flex-col sm:flex-row gap-3">
                <a
                  href={getWhatsAppFollowUpUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans font-bold text-center tracking-wider uppercase text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  <MessageSquare size="14" fill="currentColor" />
                  <span>Message support on WhatsApp</span>
                </a>
                <button
                  onClick={onContinueShopping}
                  className="py-3 px-4 rounded-xl border border-neutral-800 hover:border-gold-500/30 text-neutral-300 hover:text-white font-sans font-bold text-center tracking-wider uppercase text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <span>Continue Shopping</span>
                  <ArrowRight size="12" />
                </button>
              </div>
            </div>
          </div>

          {/* SECURITY TRUST FOOTER */}
          <div className="p-4 rounded-2xl bg-gold-950/10 border border-gold-900/20 flex gap-3.5 items-start">
            <ShieldCheck size="20" className="text-gold-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <h4 className="font-bold text-gold-400 uppercase tracking-wider mb-0.5">Secure Prepaid Protocol Only</h4>
              <p className="text-neutral-400 leading-relaxed font-light">
                To prevent fraud and maintain the authenticity of our luxury collections, we do not support open COD. Payment credentials will be shared securely via WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: REAL-TIME TRACKING SYSTEM */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-neutral-950 border border-neutral-900 rounded-2xl">
            <h3 className="font-serif text-lg font-bold text-white tracking-wide mb-2 flex items-center gap-2">
              <TrendingUp size="16" className="text-gold-500" />
              <span>Real-Time Order Tracking</span>
            </h3>
            <p className="text-neutral-400 text-xs font-light leading-relaxed mb-4">
              Enter your mobile number below to query your live booking status and verification history from our cloud database.
            </p>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Enter 10-digit phone number"
                  value={trackingPhone}
                  onChange={(e) => setTrackingPhone(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-gold-500"
                />
              </div>
              <button
                onClick={() => handleTrackOrders(trackingPhone)}
                disabled={isTrackingLoading}
                className="bg-gold-500 hover:bg-gold-400 text-black px-4 rounded-xl font-bold uppercase tracking-wider text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                {isTrackingLoading ? (
                  <RefreshCw size="12" className="animate-spin" />
                ) : (
                  <Search size="12" />
                )}
                <span>Search</span>
              </button>
            </div>

            {trackingError && (
              <div className="mt-3.5 p-3 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 text-[11px] flex gap-2 items-center">
                <AlertCircle size="14" />
                <span>{trackingError}</span>
              </div>
            )}

            {/* TRACKED ORDERS DISPLAY */}
            <div className="mt-6 space-y-4">
              {isTrackingLoading ? (
                <div className="py-12 text-center text-xs text-neutral-500 font-mono flex flex-col items-center justify-center gap-2">
                  <RefreshCw size="20" className="animate-spin text-gold-500" />
                  <span>Connecting to secure Cloud DB...</span>
                </div>
              ) : searched ? (
                trackedOrders.length > 0 ? (
                  <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">
                      Found {trackedOrders.length} Bookings
                    </span>
                    {trackedOrders.map((o) => {
                      const dateText = o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
                      const itemsList = parseOrderItems(o.items);
                      const statusVal = o.status || 'Pending';
                      
                      let badgeColor = 'bg-amber-950/40 border-amber-500/20 text-amber-400';
                      if (statusVal === 'Approved') badgeColor = 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400';
                      if (statusVal === 'Rejected') badgeColor = 'bg-red-950/40 border-red-500/20 text-red-400';

                      return (
                        <div 
                          key={o.id}
                          className="p-4 rounded-xl border border-neutral-900 bg-neutral-900/40 flex flex-col justify-between gap-3"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="text-[10px] font-mono text-neutral-500">{dateText}</p>
                              <p className="text-[11px] text-white font-sans font-bold mt-0.5 max-w-[120px] truncate">
                                Ref: #{o.id.substring(0, 8)}...
                              </p>
                            </div>
                            <span className={`px-2 py-0.5 rounded border text-[9px] uppercase font-bold font-mono tracking-wider ${badgeColor}`}>
                              {statusVal === 'Approved' ? '🟢 APPROVED' : statusVal === 'Rejected' ? '🔴 REJECTED' : '🟡 PENDING APPROVAL'}
                            </span>
                          </div>

                          <div className="space-y-2.5 pl-1 border-l border-neutral-800">
                            {itemsList.map((item: any, idx: number) => {
                              const matchedWatch = WATCHES_CATALOG.find(w => w.id === item.id);
                              const imgUrl = item.image || matchedWatch?.image;
                              return (
                                <div key={idx} className="flex items-center gap-3">
                                  {imgUrl && (
                                    <img 
                                      src={imgUrl} 
                                      alt={item.name || 'Premium Timepiece'} 
                                      className="w-10 h-10 rounded object-cover border border-neutral-900 bg-neutral-900 shrink-0"
                                      referrerPolicy="no-referrer"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-sans font-bold text-neutral-200 truncate">
                                      {item.name || 'Premium Timepiece'}
                                    </p>
                                    <span className="text-[9px] font-mono text-neutral-500 uppercase">
                                      {item.brand || matchedWatch?.brand || 'Sanwariya'} • Qty: {item.quantity || 1}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex justify-between items-center text-[11px] border-t border-neutral-900/50 pt-2">
                            <span className="font-mono text-gold-500 font-bold">₹{Number(o.total_price || 0).toLocaleString('en-IN')}</span>
                            <a
                              href={getWhatsAppFollowUpUrl(o.id.substring(0, 8), o.total_price)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-400 hover:underline text-[10px] font-sans font-bold flex items-center gap-1"
                            >
                              Follow up <MessageSquare size="10" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-neutral-500 font-sans italic border border-neutral-900 rounded-xl bg-neutral-900/10">
                    No active watch reservation bookings found for <span className="font-mono text-neutral-400 font-bold">{trackingPhone}</span>.
                  </div>
                )
              ) : (
                <div className="py-8 text-center text-xs text-neutral-600 font-mono flex flex-col items-center justify-center gap-1.5">
                  <ShoppingBag size="24" className="text-neutral-800" />
                  <span>Awaiting Search Query</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
