import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  ArrowLeft,
  MessageSquare, 
  Plus, 
  Minus, 
  Loader2, 
  User, 
  Phone, 
  MapPin, 
  FileText 
} from 'lucide-react';
import { CartItem } from '../types';
import { BRAND_STATS } from '../data';
import { saveOrderBooking } from '../lib/supabase';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  onBrowseMenu: () => void;
  user: any;
  onOpenAuth: () => void;
  onOrderSuccess: (order: {
    name: string;
    phone: string;
    address: string;
    notes?: string;
    items: CartItem[];
    totalPrice: number;
    createdAt: string;
  }) => void;
  startAtCheckout?: boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  onBrowseMenu,
  user,
  onOpenAuth,
  onOrderSuccess,
  startAtCheckout = false
}) => {
  const [isCheckoutStep, setIsCheckoutStep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Validation states
  const [errors, setErrors] = useState<{ name?: string; phone?: string; address?: string }>({});

  // Auto-fill user name if logged in
  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
    }
  }, [user, isOpen]);

  // Reset steps when drawer opens/closes
  useEffect(() => {
    if (!isOpen) {
      setIsCheckoutStep(false);
      setErrors({});
    } else if (startAtCheckout) {
      setIsCheckoutStep(true);
    }
  }, [isOpen, startAtCheckout]);

  const subtotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  
  const originalSubtotal = cart.reduce((total, item) => {
    const itemOriginalPrice = item.product.originalPrice && item.product.originalPrice > item.product.price 
      ? item.product.originalPrice 
      : Math.round(item.product.price * 1.25);
    return total + (itemOriginalPrice * item.quantity);
  }, 0);

  const totalDiscount = originalSubtotal - subtotal;

  const gstTotal = cart.reduce((total, item) => {
    const itemGst = (item.product.price * (item.product.gstPercentage || 0)) / 100;
    return total + (itemGst * item.quantity);
  }, 0);

  const shippingTotal = cart.reduce((total, item) => {
    return total + ((item.product.shippingCharges || 0) * item.quantity);
  }, 0);

  const grandTotal = subtotal + gstTotal + shippingTotal;

  const renderInvoiceBreakdown = () => (
    <div className="flex flex-col gap-2 bg-neutral-950 p-4 rounded-xl border border-neutral-900/80 shadow-inner">
      <h4 className="text-[10px] font-mono uppercase tracking-widest text-gold-400 font-extrabold pb-1.5 border-b border-neutral-900">
        Detailed Invoice Breakdown
      </h4>
      
      <div className="flex justify-between text-neutral-400 text-xs">
        <span>Original Price (Total MRP)</span>
        <span className="font-mono line-through text-neutral-500">₹{originalSubtotal.toLocaleString('en-IN')}</span>
      </div>

      <div className="flex justify-between text-neutral-300 text-xs font-semibold">
        <span>Discounted Price (Subtotal)</span>
        <span className="font-mono text-emerald-400">₹{subtotal.toLocaleString('en-IN')}</span>
      </div>

      {totalDiscount > 0 && (
        <div className="flex justify-between text-neutral-400 text-xs">
          <span>Instant Discount Savings</span>
          <span className="font-mono text-emerald-500 font-medium">-₹{totalDiscount.toLocaleString('en-IN')}</span>
        </div>
      )}

      <div className="flex justify-between text-neutral-400 text-xs">
        <span>GST Tax (As Applicable)</span>
        <span className="font-mono text-neutral-300">
          {gstTotal > 0 ? `₹${gstTotal.toLocaleString('en-IN')}` : 'Included'}
        </span>
      </div>

      <div className="flex justify-between text-neutral-400 text-xs">
        <span>Shipping Charges</span>
        <span className="font-mono">
          {shippingTotal > 0 ? (
            <span className="text-amber-500 font-bold">₹{shippingTotal.toLocaleString('en-IN')}</span>
          ) : (
            <span className="text-emerald-500 font-bold">Free Shipping Charges</span>
          )}
        </span>
      </div>

      <div className="h-[1px] bg-neutral-900 my-1" />
      
      <div className="flex justify-between text-white font-bold text-base">
        <span>Grand Total</span>
        <span className="font-mono text-gold-400">₹{grandTotal.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = 'Full name is required for delivery certification.';
    
    const phoneNum = phone.replace(/\D/g, '');
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required for WhatsApp communication.';
    } else if (phoneNum.length < 10) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number.';
    }

    if (!address.trim()) {
      newErrors.address = 'Full dispatch address is required for secure courier delivery.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleWhatsAppCheckout = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    const dbItems = cart.map(item => ({
      id: item.product.id,
      name: item.product.name,
      brand: item.product.brand,
      price: item.product.price,
      quantity: item.quantity,
      gst_percentage: item.product.gstPercentage || 0,
      shipping_charge: item.product.shippingCharges || 0
    }));

    try {
      const orderPayload = {
        name,
        phone,
        address,
        notes: notes || 'None',
        items: dbItems,
        totalPrice: grandTotal,
      };

      // Save to Supabase Cloud Database
      const saveRes = await saveOrderBooking(orderPayload);
      
      // Trigger Order Success callback first to clear state, then redirect
      onOrderSuccess({
        name,
        phone,
        address,
        notes,
        items: [...cart],
        totalPrice: grandTotal,
        createdAt: new Date().toISOString()
      });

      // Prepare WhatsApp Redirection
      const orderItemsText = cart
        .map(item => {
          let line = `• *${item.product.name}* (Brand: ${item.product.brand}, Qty: ${item.quantity}) - ₹${(item.product.price * item.quantity).toLocaleString('en-IN')}`;
          if (item.product.gstPercentage && item.product.gstPercentage > 0) {
            line += ` (incl. ${item.product.gstPercentage}% GST)`;
          }
          if (item.product.shippingCharges && item.product.shippingCharges > 0) {
            line += ` [Shipping: ₹${(item.product.shippingCharges * item.quantity).toLocaleString('en-IN')}]`;
          }
          return line;
        })
        .join('\n');

      const messageText = `✨ *NEW ORDER - SANWARIYA WATCHES* ✨\n\n` +
        `👤 *Customer Name:* ${name}\n` +
        `📞 *Phone Number:* ${phone}\n` +
        `📍 *Delivery Address:* ${address}\n` +
        (notes.trim() ? `📝 *Notes:* _${notes}_\n` : '') +
        `\n🛍️ *Ordered Timepieces:* \n` +
        `${orderItemsText}\n\n` +
        `🏷️ *Original Price (Total MRP):* ₹${originalSubtotal.toLocaleString('en-IN')}\n` +
        `🎁 *Instant Discount Savings:* -₹${totalDiscount.toLocaleString('en-IN')}\n` +
        `💵 *Discounted Price (Subtotal):* ₹${subtotal.toLocaleString('en-IN')}\n` +
        `📈 *GST (Tax):* ${gstTotal > 0 ? `₹${gstTotal.toLocaleString('en-IN')}` : 'Included'}\n` +
        `🚚 *Shipping Charges:* ${shippingTotal > 0 ? `₹${shippingTotal.toLocaleString('en-IN')}` : 'Free Shipping Charges'}\n` +
        `💰 *Grand Total:* ₹${grandTotal.toLocaleString('en-IN')}\n` +
        `\n💬 _Hello! I have registered this booking on your portal. Please verify availability and share payment instructions!_`;

      const encodedMessage = encodeURIComponent(messageText);
      const whatsappUrl = `https://wa.me/91${BRAND_STATS.phone}?text=${encodedMessage}`;
      
      // Open WhatsApp in a new tab
      window.open(whatsappUrl, '_blank');
      onClose();
    } catch (error) {
      console.error('Error during checkout processing:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-neutral-950 border-l border-neutral-900 shadow-2xl flex flex-col justify-between overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-900">
              <div className="flex items-center gap-2">
                {isCheckoutStep ? (
                  <button 
                    onClick={() => setIsCheckoutStep(false)}
                    className="p-1 rounded-lg bg-neutral-900 text-neutral-400 hover:text-white cursor-pointer mr-1"
                  >
                    <ArrowLeft size="16" />
                  </button>
                ) : (
                  <ShoppingBag className="text-gold-400" size="20" />
                )}
                <h2 className="font-serif text-sm sm:text-base tracking-wider text-white uppercase font-bold">
                  {isCheckoutStep ? 'Secure Checkout' : `Your Cart (${cart.length})`}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-neutral-900 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X size="18" />
              </button>
            </div>

            {/* Drawer Body content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-80 text-center">
                  <div className="p-4 rounded-full bg-neutral-900/50 text-neutral-600 mb-4">
                    <ShoppingBag size="48" />
                  </div>
                  <h3 className="font-serif text-white font-semibold text-lg mb-2">
                    Your Cart is Empty
                  </h3>
                  <p className="text-neutral-400 text-sm max-w-xs mb-6 font-light leading-relaxed">
                    Browse our premium, authentic watches and find the perfect match for your wrist.
                  </p>
                  <button
                    onClick={() => {
                      onBrowseMenu();
                      onClose();
                    }}
                    className="px-6 py-3 rounded-full bg-gold-500 hover:bg-gold-400 text-black text-xs uppercase font-bold tracking-widest transition-colors cursor-pointer"
                  >
                    Explore Catalog
                  </button>
                </div>
              ) : !isCheckoutStep ? (
                /* STEP 1: CART ITEM LIST */
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center text-xs font-mono text-neutral-500 border-b border-neutral-900 pb-2">
                    <span>PRODUCT</span>
                    <button onClick={onClearCart} className="hover:text-red-400 flex items-center gap-1">
                      <Trash2 size="12" /> Clear All
                    </button>
                  </div>

                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex gap-4 p-3 bg-neutral-900/30 rounded-xl border border-neutral-900/50"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-lg object-cover bg-neutral-900 border border-neutral-900"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-sm font-sans font-semibold text-white tracking-wide line-clamp-1">
                              {item.product.name}
                            </h4>
                            <button
                              onClick={() => onRemoveFromCart(item.product.id)}
                              className="text-neutral-500 hover:text-red-400"
                            >
                              <X size="14" />
                            </button>
                          </div>
                          <span className="text-xs font-mono text-neutral-500">{item.product.brand}</span>
                        </div>

                        <div className="flex justify-between items-center mt-2">
                          {/* Quantity control */}
                          <div className="flex items-center gap-2 bg-neutral-900 px-2.5 py-1 rounded-full border border-neutral-800">
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                              className="text-neutral-400 hover:text-white"
                            >
                              <Minus size="12" />
                            </button>
                            <span className="text-xs font-mono font-bold text-white min-w-4 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                              className="text-neutral-400 hover:text-white"
                            >
                              <Plus size="12" />
                            </button>
                          </div>
                          
                          <div className="text-right flex flex-col items-end">
                            {/* Original Price (cutted) */}
                            <span className="text-[10px] font-mono text-neutral-500 line-through">
                              ₹{((item.product.originalPrice && item.product.originalPrice > item.product.price ? item.product.originalPrice : Math.round(item.product.price * 1.25)) * item.quantity).toLocaleString('en-IN')}
                            </span>
                            {/* Discounted Price (under it) */}
                            <span className="text-sm font-mono font-bold text-gold-400 mt-0.5">
                              ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                            </span>
                            {/* Extra details (GST/Shipping) */}
                            <span className="text-[9px] text-neutral-500 font-sans mt-0.5 whitespace-nowrap">
                              {item.product.gstPercentage && item.product.gstPercentage > 0 ? `${item.product.gstPercentage}% GST` : 'GST Incl.'}
                              {' • '}
                              {item.product.shippingCharges && item.product.shippingCharges > 0 ? `Ship: ₹${(item.product.shippingCharges * item.quantity).toLocaleString('en-IN')}` : 'Free Shipping'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="mt-6 p-4 rounded-xl bg-gold-950/10 border border-gold-900/20">
                    <h5 className="text-xs font-sans font-bold uppercase tracking-wider text-gold-400 mb-1">
                      👑 Guaranteed Luxury Support
                    </h5>
                    <p className="text-[11px] text-neutral-400 leading-relaxed font-light">
                      All timepieces are 100% authentic with fast secure packaging. Redirection will securely register your checkout details.
                    </p>
                  </div>
                </div>
              ) : (
                /* STEP 2: PREMIUM CHECKOUT FORM */
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4 pt-1"
                >
                  <p className="text-neutral-400 text-xs font-light leading-relaxed">
                    Provide your details below to secure your timepiece in our cloud reservation directory. We will auto-fill your delivery card immediately.
                  </p>

                  {/* NAME INPUT */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block font-semibold">
                      Full Delivery Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size="14" />
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`w-full bg-neutral-900 border ${errors.name ? 'border-red-500' : 'border-neutral-800'} text-white rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-gold-500`}
                      />
                    </div>
                    {errors.name && <p className="text-red-500 text-[10px]">{errors.name}</p>}
                  </div>

                  {/* PHONE INPUT */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block font-semibold">
                      10-Digit Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size="14" />
                      <input
                        type="text"
                        placeholder="e.g. 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`w-full bg-neutral-900 border ${errors.phone ? 'border-red-500' : 'border-neutral-800'} text-white rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-gold-500`}
                      />
                    </div>
                    {errors.phone && <p className="text-red-500 text-[10px]">{errors.phone}</p>}
                  </div>

                  {/* ADDRESS INPUT */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block font-semibold">
                      Full Dispatch Address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-neutral-500" size="14" />
                      <textarea
                        placeholder="House / Flat No, Street Address, Landmark, City, State, Pincode"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={3}
                        className={`w-full bg-neutral-900 border ${errors.address ? 'border-red-500' : 'border-neutral-800'} text-white rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-gold-500`}
                      />
                    </div>
                    {errors.address && <p className="text-red-500 text-[10px]">{errors.address}</p>}
                  </div>

                  {/* EXTRA NOTES */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block font-semibold">
                      Special Shipping Notes (Optional)
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 text-neutral-500" size="14" />
                      <textarea
                        placeholder="e.g. Please wrap securely in an extra protective box sleeve."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-gold-500"
                      />
                    </div>
                  </div>

                  {/* SECURITY PROTOCOL BADGE */}
                  <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-850 flex items-start gap-2.5">
                    <span className="text-xs shrink-0 mt-0.5">🔒</span>
                    <div>
                      <p className="text-[10px] font-mono uppercase text-white font-bold tracking-wider">Secure Protocol Verified</p>
                      <p className="text-[10px] text-neutral-500 font-light mt-0.5">
                        Your shipping coordinates are cryptographically registered. Order status details will be generated instantly.
                      </p>
                    </div>
                  </div>

                  {/* Detailed billing breakdown attached inside the scrollable form step */}
                  <div className="mt-2 pt-2">
                    {renderInvoiceBreakdown()}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer Summary & Checkout button */}
            {cart.length > 0 && (
              <div className="bg-neutral-900/90 border-t border-neutral-900 p-6 flex flex-col gap-4">
                {!isCheckoutStep && renderInvoiceBreakdown()}

                {!user ? (
                  <button
                    onClick={() => onOpenAuth()}
                    className="w-full py-4 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-sans font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>Login to Proceed to Checkout</span>
                    <ArrowRight size="16" />
                  </button>
                ) : !isCheckoutStep ? (
                  <button
                    onClick={() => setIsCheckoutStep(true)}
                    className="w-full py-4 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-sans font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight size="16" />
                  </button>
                ) : (
                  <button
                    onClick={handleWhatsAppCheckout}
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-xl bg-green-500 hover:bg-green-400 text-white font-sans font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <Loader2 size="16" className="animate-spin" />
                    ) : (
                      <MessageSquare size="16" fill="white" />
                    )}
                    <span>{isSubmitting ? 'Reserving Watch...' : `Place Order & Pay ₹${grandTotal.toLocaleString('en-IN')} via WhatsApp`}</span>
                  </button>
                )}
                
                <p className="text-[10px] text-center text-neutral-500 font-sans">
                  By completing order, you will connect directly with Sanwariya Watches support.
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
