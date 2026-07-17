import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus, HelpCircle, Loader2, CheckCircle2, ArrowLeft, Key } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (user: any) => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowPassword(false);
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      setSuccessMsg('Successfully signed in!');
      if (onAuthSuccess && data.user) {
        onAuthSuccess(data.user);
      }
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword || !fullName) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            display_name: fullName,
          },
        },
      });

      if (error) {
        throw error;
      }

      // Check if user is auto-confirmed or if an email confirmation was sent
      if (data.session) {
        setSuccessMsg('Account created successfully! Logging you in...');
        if (onAuthSuccess && data.user) {
          onAuthSuccess(data.user);
        }
        setTimeout(() => {
          onClose();
          resetForm();
        }, 1200);
      } else {
        setSuccessMsg('Registration successful! Please check your email inbox to verify your account.');
        setTimeout(() => {
          setMode('signin');
          setErrorMsg(null);
        }, 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during sign up.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      if (error) {
        throw error;
      }

      setSuccessMsg('Password reset instructions have been sent to your email.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-neutral-850 bg-neutral-950 p-6 sm:p-8 shadow-2xl z-10"
        >
          {/* Subtle upper light gradient */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-gold-400 to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-850 transition-colors cursor-pointer"
            aria-label="Close Authentication Screen"
          >
            <X size="18" />
          </button>

          {/* Header Branding */}
          <div className="text-center mb-6">
            <span className="text-[10px] font-mono tracking-[0.25em] text-gold-500 uppercase">
              Sanwariya Watches
            </span>
            <h3 className="text-xl font-sans font-bold text-white tracking-wide mt-1">
              {mode === 'signin' && 'Client Portal Access'}
              {mode === 'signup' && 'Create Luxury Account'}
              {mode === 'forgot' && 'Reset Secure Passcode'}
            </h3>
            <p className="text-xs text-neutral-400 mt-1.5">
              {mode === 'signin' && 'Log in to track orders, save favorites & request custom horology.'}
              {mode === 'signup' && 'Unlock complete access to customized collections and priority support.'}
              {mode === 'forgot' && 'Enter your email to receive standard security instructions.'}
            </p>
          </div>

          {/* Status Message Banners */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-xs text-red-400 flex items-start gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg border border-green-500/20 bg-green-500/10 text-xs text-green-400 flex items-start gap-2"
            >
              <CheckCircle2 size="14" className="text-green-400 mt-0.5 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* Core Auth Forms */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-[10px] font-mono tracking-wider text-neutral-400 uppercase mb-1.5">
                  Corporate / Client Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size="15" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-gold-500 transition-colors"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-mono tracking-wider text-neutral-400 uppercase">
                    Secure Code / Password
                  </label>
                  <button
                    type="button"
                    onClick={() => handleModeChange('forgot')}
                    className="text-[10px] font-sans font-medium text-gold-400 hover:text-gold-300 transition-colors cursor-pointer"
                  >
                    Forgot Code?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size="15" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 pl-11 pr-11 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-gold-500 transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size="15" /> : <Eye size="15" />}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-sans font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <Loader2 size="14" className="animate-spin" />
                ) : (
                  <LogIn size="14" />
                )}
                <span>{isLoading ? 'Verifying Credentials...' : 'Sign In To Account'}</span>
              </button>

              {/* Quick toggle to Register */}
              <p className="text-center text-xs text-neutral-400 mt-4 pt-2 border-t border-neutral-900">
                New to Sanwariya Watches?{' '}
                <button
                  type="button"
                  onClick={() => handleModeChange('signup')}
                  className="font-semibold text-gold-400 hover:text-gold-300 transition-colors cursor-pointer"
                >
                  Create An Account
                </button>
              </p>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-mono tracking-wider text-neutral-400 uppercase mb-1.5">
                  Full Name / Client Title
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size="15" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-gold-500 transition-colors"
                    placeholder="E.g. Dr. Raghav Singhania"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] font-mono tracking-wider text-neutral-400 uppercase mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size="15" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-gold-500 transition-colors"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-mono tracking-wider text-neutral-400 uppercase mb-1.5">
                  Password (Min 6 Characters)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size="15" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 pl-11 pr-11 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-gold-500 transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size="15" /> : <Eye size="15" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[10px] font-mono tracking-wider text-neutral-400 uppercase mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size="15" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-gold-500 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Sign Up Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-sans font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <Loader2 size="14" className="animate-spin" />
                ) : (
                  <UserPlus size="14" />
                )}
                <span>{isLoading ? 'Creating Account...' : 'Generate New Account'}</span>
              </button>

              {/* Quick toggle to Login */}
              <p className="text-center text-xs text-neutral-400 mt-4 pt-2 border-t border-neutral-900">
                Already have a client account?{' '}
                <button
                  type="button"
                  onClick={() => handleModeChange('signin')}
                  className="font-semibold text-gold-400 hover:text-gold-300 transition-colors cursor-pointer"
                >
                  Sign In Here
                </button>
              </p>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-[10px] font-mono tracking-wider text-neutral-400 uppercase mb-1.5">
                  Registered Account Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size="15" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-gold-500 transition-colors"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {/* Reset Password Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-sans font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 size="14" className="animate-spin" />
                ) : (
                  <Key size="14" />
                )}
                <span>{isLoading ? 'Sending Request...' : 'Send Secure Reset Link'}</span>
              </button>

              {/* Back to Sign In Link */}
              <button
                type="button"
                onClick={() => handleModeChange('signin')}
                className="w-full py-2 flex items-center justify-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft size="14" />
                <span>Back to Sign In</span>
              </button>
            </form>
          )}

          {/* Security Guarantee Footnote */}
          <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-mono text-neutral-500">
            <span>🛡️ SSL Secure Connection</span>
            <span>•</span>
            <span>Sanwariya Cloud Crypt</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
