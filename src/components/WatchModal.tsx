import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, MessageSquare, ShieldCheck, Truck, RotateCcw, Plus, Minus } from 'lucide-react';
import { WatchProduct } from '../types';
import { BRAND_STATS } from '../data';

interface WatchModalProps {
  product: WatchProduct | null;
  onClose: () => void;
  onAddToCart: (product: WatchProduct, quantity: number) => void;
  onQuickCheckout: (product: WatchProduct, quantity: number) => void;
}

export const WatchModal: React.FC<WatchModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onQuickCheckout
}) => {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrease = () => {
    setQuantity(quantity + 1);
  };

  const handleWhatsAppInstantBuy = () => {
    const text = `✨ *INSTANT INQUIRY - SANWARIYA WATCHES* ✨\n\n` +
      `Hello! I am highly interested in ordering/inquiring about this premium timepiece:\n\n` +
      `⌚ *Model:* ${product.name}\n` +
      `🏷️ *Brand:* ${product.brand}\n` +
      `💵 *Price:* ₹${product.price} (Qty: ${quantity})\n` +
      `📦 *Total value:* ₹${product.price * quantity}\n\n` +
      `Please confirm if this timepiece is currently in stock for immediate shipment! 🚀`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/91${BRAND_STATS.phone}?text=${encodedText}`, '_blank');
  };

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-neutral-950 border border-neutral-900 rounded-3xl overflow-hidden shadow-2xl z-10 my-8 flex flex-col max-h-[90vh]"
        >
          {/* Header with prominent Close (Cross) Button above the image */}
          <div className="w-full flex justify-between items-center px-6 py-4 border-b border-neutral-900 bg-neutral-950 sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400">
                TIMEPIECE VIEW
              </span>
            </div>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-800 hover:border-gold-500/40 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-gold-400 transition-all duration-200 cursor-pointer text-xs font-sans font-bold uppercase tracking-wider"
              aria-label="Close product details"
            >
              <X size="14" />
              <span>Close</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 overflow-y-auto flex-1">
            {/* Image Section */}
            <div className="relative h-72 md:h-full min-h-[350px] md:min-h-[450px] bg-neutral-950 flex items-center justify-center p-6 md:p-8 overflow-hidden border-b md:border-b-0 md:border-r border-neutral-900">
              <img
                src={product.image}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-full w-auto h-auto object-contain transition-transform duration-700 hover:scale-105"
              />
              {/* Product Badge Tag */}
              <div className="absolute top-6 left-6">
                <span className="px-4 py-1.5 rounded-full bg-gold-500 text-black font-sans text-[10px] tracking-widest font-extrabold uppercase">
                  {product.tag}
                </span>
              </div>
              {discount > 0 && (
                <div className="absolute bottom-6 left-6">
                  <span className="px-3 py-1 rounded-lg bg-red-600 text-white font-mono text-xs font-bold uppercase">
                    Save {discount}%
                  </span>
                </div>
              )}
            </div>

            {/* Information Section */}
            <div className="p-6 sm:p-8 flex flex-col justify-between">
              <div>
                {/* Brand & Stock */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono tracking-widest uppercase text-gold-500 font-bold">
                    {product.brand}
                  </span>
                  <span className={`text-[10px] font-sans uppercase tracking-widest font-extrabold px-2.5 py-1 rounded-full ${
                    product.inStock 
                      ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-red-950/40 text-red-400 border border-red-500/20'
                  }`}>
                    {product.inStock ? '✓ In Stock' : 'Out of Stock'}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-serif text-2xl sm:text-3xl text-white tracking-wide mb-3 font-semibold">
                  {product.name}
                </h3>

                {/* Price tag */}
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-2xl font-mono font-bold text-gold-400">₹{product.price}</span>
                  {product.originalPrice && (
                    <span className="text-sm font-mono text-neutral-500 line-through">₹{product.originalPrice}</span>
                  )}
                </div>

                {/* GST and Shipping Info */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 mb-5 text-[11px] text-neutral-500 font-sans">
                  <span>• GST: {product.gstPercentage && product.gstPercentage > 0 ? `${product.gstPercentage}%` : 'Included'}</span>
                  <span>• Shipping: {product.shippingCharges && product.shippingCharges > 0 ? `₹${product.shippingCharges}` : 'Free Express Delivery'}</span>
                </div>

                {/* Description */}
                <p className="text-neutral-400 text-sm leading-relaxed mb-6 font-sans">
                  {product.description}
                </p>

                {/* Specifications List */}
                <div className="border-t border-b border-neutral-900 py-4 mb-6">
                  <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-white mb-3">
                    Technical Specifications
                  </h4>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                    <div>
                      <span className="block text-neutral-500 uppercase font-mono tracking-wide text-[10px]">CASE SIZE</span>
                      <span className="text-neutral-300 font-semibold">{product.specs.case}</span>
                    </div>
                    <div>
                      <span className="block text-neutral-500 uppercase font-mono tracking-wide text-[10px]">MOVEMENT</span>
                      <span className="text-neutral-300 font-semibold">{product.specs.movement}</span>
                    </div>
                    <div>
                      <span className="block text-neutral-500 uppercase font-mono tracking-wide text-[10px]">WATER RESISTANCE</span>
                      <span className="text-neutral-300 font-semibold">{product.specs.waterResistance}</span>
                    </div>
                    <div>
                      <span className="block text-neutral-500 uppercase font-mono tracking-wide text-[10px]">STRAP MATERIAL</span>
                      <span className="text-neutral-300 font-semibold">{product.specs.strap}</span>
                    </div>
                  </div>
                </div>


              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 mt-auto">
                {product.inStock ? (
                  <>
                    <div className="flex gap-4 items-center mb-1">
                      <span className="text-xs font-sans text-neutral-400 font-bold uppercase tracking-wider">
                        QUANTITY:
                      </span>
                      <div className="flex items-center gap-4 bg-neutral-900 px-4 py-1.5 rounded-full border border-neutral-800">
                        <button
                          onClick={handleDecrease}
                          className="text-neutral-400 hover:text-white cursor-pointer"
                        >
                          <Minus size="14" />
                        </button>
                        <span className="text-sm font-mono font-bold text-white min-w-6 text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={handleIncrease}
                          className="text-neutral-400 hover:text-white cursor-pointer"
                        >
                          <Plus size="14" />
                        </button>
                      </div>
                      <span className="text-xs font-mono text-neutral-500 ml-auto flex flex-col items-end gap-0.5">
                        <span className="text-[10px]">
                          Subtotal: ₹{(product.price * quantity).toLocaleString('en-IN')}
                        </span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Add to Bag */}
                      <button
                        onClick={() => {
                          onAddToCart(product, quantity);
                          onClose();
                        }}
                        className="py-3 px-4 rounded-xl border border-gold-500/40 bg-gold-950/10 hover:bg-gold-500 hover:text-black text-gold-400 font-sans font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all duration-300"
                      >
                        <ShoppingCart size="14" />
                        <span>Add To Bag</span>
                      </button>

                      {/* Buy on WhatsApp */}
                      <button
                        onClick={() => {
                          onQuickCheckout(product, quantity);
                          onClose();
                        }}
                        className="py-3 px-4 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-sans font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        <ShoppingCart size="14" />
                        <span>Instant Buy</span>
                      </button>
                    </div>

                    {/* Back to Store Cross Button */}
                    <button
                      onClick={onClose}
                      className="w-full mt-2 py-3 px-4 rounded-xl border border-neutral-900 hover:border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 font-sans font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
                    >
                      <X size="14" />
                      <span>Back to Store</span>
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleWhatsAppInstantBuy}
                      className="py-4 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-gold-400 font-sans font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <MessageSquare size="14" />
                      <span>Inquire About Restock</span>
                    </button>

                    <button
                      onClick={onClose}
                      className="py-3 px-4 rounded-xl border border-neutral-900 hover:border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 font-sans font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
                    >
                      <X size="14" />
                      <span>Back to Store</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
