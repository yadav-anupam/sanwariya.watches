import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu as MenuIcon, X, ShoppingBag, Phone, Instagram, User as UserIcon, LogOut } from 'lucide-react';
import { Logo } from './Logo';
import { BRAND_STATS } from '../data';

interface HeaderProps {
  activeTab: 'home' | 'menu' | 'about' | 'contact' | 'order-success';
  setActiveTab: (tab: 'home' | 'menu' | 'about' | 'contact' | 'order-success') => void;
  cartCount: number;
  onOpenCart: () => void;
  user: any;
  onOpenAuth: () => void;
  onSignOut: () => void;
  isAdmin?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  onOpenCart,
  user,
  onOpenAuth,
  onSignOut,
  isAdmin = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'menu', label: 'Menu' }, // preserving literal "Menu" requested by user
    { id: 'about', label: 'About Us' },
    { id: 'contact', label: 'Contact' }
  ] as const;

  const handleNavClick = (tab: 'home' | 'menu' | 'about' | 'contact' | 'order-success') => {
    setActiveTab(tab);
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header id="sticky-navbar" className="sticky top-0 z-50 w-full border-b border-neutral-900 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          
          {/* Logo */}
          <button onClick={() => handleNavClick('home')} className="cursor-pointer focus:outline-none">
            <Logo size="sm" />
          </button>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`relative py-2 text-sm font-sans tracking-wider uppercase font-semibold cursor-pointer transition-colors duration-300 ${
                  activeTab === item.id ? 'text-gold-400' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {item.label}
                {activeTab === item.id && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold-400"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </nav>

          {/* Header Action Icons */}
          <div className="flex items-center gap-3">
            {/* Instagram Quick Link */}
            <a
              href={BRAND_STATS.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex p-2 text-neutral-400 hover:text-gold-400 hover:bg-neutral-950 rounded-full transition-colors duration-300"
              aria-label="Instagram"
            >
              <Instagram size="18" />
            </a>

            {/* Live WhatsApp Call Quick Link */}
            <a
              href={`https://wa.me/91${BRAND_STATS.phone}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold-600/30 bg-gold-950/20 text-gold-400 text-xs font-sans tracking-wide font-bold hover:bg-gold-500 hover:text-black transition-all duration-300"
            >
              <Phone size="12" />
              <span>WhatsApp Support</span>
            </a>

            {/* Shopping Bag Icon with Badge */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 text-white hover:text-gold-400 hover:bg-neutral-950 rounded-full transition-colors cursor-pointer"
              aria-label="Open Shopping Bag"
            >
              <ShoppingBag size="20" />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold-500 text-[9px] font-bold text-black"
                >
                  {cartCount}
                </motion.span>
              )}
            </button>

            {/* Admin Portal Gateway - Prominent elegant trigger link */}
            <a
              href="/admin.html"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gold-500/20 bg-gold-500/5 hover:border-gold-500 hover:bg-gold-500/10 text-gold-400 hover:text-gold-300 text-[11px] font-sans font-bold tracking-wider uppercase transition-all duration-300 cursor-pointer mr-1"
            >
              <span>👑 Admin Portal</span>
            </a>

            {/* Client Authentication & Account Access */}
            <div className="hidden sm:flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-900">
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-[9px] font-mono text-gold-500 uppercase tracking-wider">
                      {isAdmin ? 'System Admin 👑' : 'Client Member'}
                    </span>
                    <span className="text-[11px] text-white font-sans font-bold max-w-[90px] truncate">
                      {user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </span>
                  </div>
                  <button
                    onClick={onSignOut}
                    className="p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-950 rounded-full transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut size="16" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-800 bg-neutral-950 hover:border-gold-500/50 hover:bg-neutral-900 text-neutral-300 hover:text-white text-[11px] font-sans font-bold tracking-wider uppercase transition-all duration-300 cursor-pointer"
                >
                  <UserIcon size="12" className="text-gold-400" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-neutral-400 hover:text-white md:hidden cursor-pointer focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {isOpen ? <X size="22" /> : <MenuIcon size="22" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Menu overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black md:hidden"
            />

            {/* Slide-out Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-neutral-950 border-l border-neutral-900 p-6 flex flex-col justify-between md:hidden"
            >
              <div className="flex flex-col gap-8">
                {/* Close & Header */}
                <div className="flex items-center justify-between">
                  <Logo size="sm" />
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-full bg-neutral-900 text-neutral-400 hover:text-white"
                  >
                    <X size="20" />
                  </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex flex-col gap-4">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`text-left py-3 px-4 rounded-lg text-sm font-sans tracking-wider uppercase font-semibold transition-all duration-300 ${
                        activeTab === item.id
                          ? 'bg-gold-500/10 text-gold-400 border-l-2 border-gold-500 pl-3'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Mobile Menu Footer Details */}
              <div className="flex flex-col gap-4 border-t border-neutral-900 pt-6">
                {/* Client Auth for Mobile */}
                {user ? (
                  <div className="p-3.5 rounded-xl border border-neutral-900 bg-neutral-950 flex flex-col gap-2.5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 font-sans font-bold text-sm">
                        {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-mono text-gold-500 uppercase tracking-wider">Client Member</p>
                        <p className="text-xs font-sans font-bold text-white truncate">
                          {user.user_metadata?.full_name || user.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onSignOut();
                        setIsOpen(false);
                      }}
                      className="w-full py-2 rounded-lg border border-red-950 bg-red-950/20 hover:bg-red-950/40 text-red-400 text-xs font-sans font-bold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogOut size="12" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      onOpenAuth();
                      setIsOpen(false);
                    }}
                    className="w-full py-3 rounded-lg border border-neutral-850 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-sans font-bold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserIcon size="12" className="text-gold-400" />
                    <span>Client Sign In</span>
                  </button>
                )}

                <a
                  href="/admin.html"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-gold-500/30 bg-gold-500/5 hover:bg-gold-500/10 text-gold-400 font-sans font-bold text-sm tracking-wide transition-all"
                >
                  <span>👑 Admin Portal</span>
                </a>

                <a
                  href={`https://wa.me/91${BRAND_STATS.phone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-gold-500 text-black font-sans font-bold text-sm hover:bg-gold-400 transition-colors"
                >
                  <Phone size="14" />
                  <span>WhatsApp Inquiry</span>
                </a>
                
                <div className="flex justify-center gap-4 text-xs text-neutral-500 font-mono">
                  <span>@sanwariya_watches</span>
                  <span>•</span>
                  <span>100% Authentic</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
