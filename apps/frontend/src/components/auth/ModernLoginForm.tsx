'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, LogIn, Loader2, Bot, Sparkles, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { DEMO_MODE } from '@/lib/demo-mode';
import { validateLogin } from '@/lib/validation';

interface LoginFormProps {
  onSuccess?: () => void;
}

export function ModernLoginForm({ onSuccess }: LoginFormProps) {
  const { login, loading } = useAuth();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isValidEmail, setIsValidEmail] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '', color: '' });

  useEffect(() => {
    // Check if user was redirected after account deletion
    if (searchParams.get('deleted') === 'true') {
      setSuccessMessage('Your account has been successfully deleted. Thank you for using our service.');
    }
  }, [searchParams]);

  // Validate email in real-time
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValidEmail(emailRegex.test(formData.email));
  }, [formData.email]);

  // Calculate password strength (proactive feedback)
  useEffect(() => {
    if (!formData.password) {
      setPasswordStrength({ score: 0, text: '', color: '' });
      return;
    }

    let score = 0;
    let text = '';
    let color = '';

    // Length check
    if (formData.password.length >= 8) score += 1;
    if (formData.password.length >= 12) score += 1;

    // Character variety checks
    if (/[a-z]/.test(formData.password)) score += 1;
    if (/[A-Z]/.test(formData.password)) score += 1;
    if (/[0-9]/.test(formData.password)) score += 1;
    if (/[^A-Za-z0-9]/.test(formData.password)) score += 1;

    // Set feedback based on score
    if (score <= 2) {
      text = 'Weak password';
      color = 'text-red-600';
    } else if (score <= 4) {
      text = 'Good password';
      color = 'text-yellow-600';
    } else {
      text = 'Strong password';
      color = 'text-green-600';
    }

    setPasswordStrength({ score, text, color });
  }, [formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormErrors({});

    // Skip validation in demo mode for easier testing
    if (!DEMO_MODE) {
      const validationResult = validateLogin(formData);
      
      if (!validationResult.success) {
        setFormErrors(validationResult.errors || {});
        return;
      }
    }

    try {
      await login(formData);
      onSuccess?.();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Demo Mode Banner */}
      <AnimatePresence>
        {DEMO_MODE && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center py-3 z-50 shadow-lg"
          >
            <div className="flex items-center justify-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span className="font-medium">🎭 DEMO MODE ACTIVE - Use any credentials to login</span>
              <Sparkles className="w-4 h-4" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Login Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/25 mb-6"
          >
            <Bot className="w-8 h-8 text-white" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-gray-900 mb-2"
          >
            Sign in to your account
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-700 font-medium"
          >
            Access your <span className="text-indigo-600 font-semibold">proactive AI</span> platform
          </motion.p>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl shadow-black/10 p-8 relative overflow-hidden"
        >
          {/* Glass morphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-white/10 rounded-3xl" />
          
          <div className="relative z-10">
            {/* Form Header */}
            <div className="flex items-center justify-center space-x-2 mb-6">
              <LogIn className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-900">Login</h2>
            </div>

            {/* Success/Error Messages */}
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-4 bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-2xl"
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-green-800">{successMessage}</p>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="mb-4 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-2xl"
                >
                  <p className="text-sm text-red-800">{error}</p>
                </motion.div>
              )}

              {DEMO_MODE && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-2xl"
                >
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-800">
                      <strong>Demo Mode:</strong> Use any credentials to explore the full CRM system.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    disabled={loading}
                    className={`
                      w-full px-4 py-3 bg-white/80 backdrop-blur-sm border rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent
                      transition-all duration-300 pr-10
                      ${formErrors.email 
                        ? 'border-red-300 bg-red-50/50' 
                        : formData.email && isValidEmail
                        ? 'border-green-300 bg-green-50/50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  />
                  
                  {/* Validation Indicator */}
                  <AnimatePresence>
                    {formData.email && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {isValidEmail ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-orange-300 rounded-full" />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <AnimatePresence>
                  {isValidEmail && formData.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-xs text-green-600 flex items-center space-x-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Valid email address</span>
                    </motion.p>
                  )}
                  
                  {formErrors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-xs text-red-600"
                    >
                      {formErrors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    disabled={loading}
                    className={`
                      w-full px-4 py-3 bg-white/80 backdrop-blur-sm border rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent
                      transition-all duration-300 pr-12 text-gray-900 placeholder-gray-500
                      ${formErrors.password 
                        ? 'border-red-300 bg-red-50/50' 
                        : formData.password 
                        ? 'border-green-300 bg-green-50/30 hover:border-green-400'
                        : 'border-gray-200 hover:border-gray-300 focus:border-indigo-400'
                      }
                    `}
                  />
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-indigo-600 transition-colors duration-200 rounded-md hover:bg-indigo-50"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </motion.button>
                </div>
                
                {/* Proactive Password Strength Indicator */}
                <AnimatePresence>
                  {formData.password && passwordStrength.text && !DEMO_MODE && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center space-x-2 mt-1"
                    >
                      <div className="flex space-x-1">
                        {[...Array(6)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 w-3 rounded-full transition-all duration-300 ${
                              i < passwordStrength.score
                                ? passwordStrength.score <= 2
                                  ? 'bg-red-400'
                                  : passwordStrength.score <= 4
                                  ? 'bg-yellow-400'
                                  : 'bg-green-400'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`text-xs font-medium ${passwordStrength.color}`}>
                        {passwordStrength.text}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <AnimatePresence>
                  {formErrors.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-xs text-red-600"
                    >
                      {formErrors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || (!DEMO_MODE && (!isValidEmail || !formData.password))}
                className={`w-full py-3 rounded-xl font-medium shadow-lg transition-all duration-300
                          focus:outline-none focus:ring-2 focus:ring-indigo-500/50
                          ${loading || (!DEMO_MODE && (!isValidEmail || !formData.password))
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-gray-400/25' 
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/25'
                          }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In</span>
                    </>
                  )}
                </div>
              </motion.button>
            </form>

            {/* Divider */}
            <div className="my-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200/50" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/90 backdrop-blur-sm text-gray-800 font-semibold rounded-full border border-gray-200/50 shadow-md">
                    Don&apos;t have an account?
                  </span>
                </div>
              </div>
            </div>

            {/* Create Account Button */}
            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-white/90 backdrop-blur-sm border border-gray-200/50 text-gray-800 font-semibold
                          hover:bg-white hover:border-indigo-300/60 hover:text-indigo-700 hover:shadow-lg hover:shadow-indigo-500/15
                          focus:outline-none focus:ring-2 focus:ring-indigo-500/50 
                          transition-all duration-300 rounded-xl group shadow-md"
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>Create New Account</span>
                  <motion.div
                    initial={{ x: 0 }}
                    whileHover={{ x: 2 }}
                    className="group-hover:text-indigo-600 transition-colors"
                  >
                    →
                  </motion.div>
                </div>
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Demo Credentials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-6"
        >
          <p className="text-sm text-gray-700 font-medium bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30 shadow-sm">
            Demo: admin@demo.com / password123
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}