'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, UserPlus, Loader2, Bot, Sparkles, CheckCircle, User, Building, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { DEMO_MODE } from '@/lib/demo-mode';
import { validateRegister } from '@/lib/validation';
import { themeText, statusColors, cn } from '@/utils/theme-colors';

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function ModernRegisterForm({ onSuccess }: RegisterFormProps) {
  const { register, loading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidEmail, setIsValidEmail] = useState(false);
  const [isValidName, setIsValidName] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '', color: '' });
  const [passwordsMatch, setPasswordsMatch] = useState(false);

  // Validate email in real-time
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValidEmail(emailRegex.test(formData.email));
  }, [formData.email]);

  // Validate name in real-time
  useEffect(() => {
    setIsValidName(formData.name.trim().length >= 2);
  }, [formData.name]);

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
      color = statusColors.error.text;
    } else if (score <= 4) {
      text = 'Good password';
      color = statusColors.warning.text;
    } else {
      text = 'Strong password';
      color = statusColors.success.text;
    }

    setPasswordStrength({ score, text, color });
  }, [formData.password]);

  // Check password confirmation match
  useEffect(() => {
    if (formData.confirmPassword && formData.password) {
      setPasswordsMatch(formData.password === formData.confirmPassword);
    } else {
      setPasswordsMatch(false);
    }
  }, [formData.password, formData.confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormErrors({});

    // Check password confirmation
    if (formData.password !== formData.confirmPassword) {
      setFormErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    // Skip validation in demo mode for easier testing
    if (!DEMO_MODE) {
      const validationResult = validateRegister(formData);
      
      if (!validationResult.success) {
        setFormErrors(validationResult.errors || {});
        return;
      }
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        company: formData.company || undefined
      });
      onSuccess?.();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const isFormValid = () => {
    if (DEMO_MODE) return true;
    return isValidEmail && isValidName && formData.password && passwordsMatch;
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
              <span className="font-medium">🎭 DEMO MODE ACTIVE - Use any credentials to register</span>
              <Sparkles className="w-4 h-4" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Register Container */}
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
            Join the AI revolution
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-700 font-medium"
          >
            Create your account on the <span className="text-indigo-600 font-semibold">proactive AI</span> platform
          </motion.p>
        </div>

        {/* Register Form */}
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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-semibold text-gray-900">Create Account</h2>
              </div>
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Login
                </motion.button>
              </Link>
            </div>

            {/* Error Messages */}
            <AnimatePresence>
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
                      <strong>Demo Mode:</strong> Use any credentials to explore the full AI platform.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Register Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    disabled={loading}
                    className={`
                      w-full px-4 py-3 pl-12 bg-white/80 backdrop-blur-sm border rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent
                      transition-all duration-300 text-gray-900 placeholder-gray-500
                      ${formErrors.name 
                        ? 'border-red-300 bg-red-50/50' 
                        : formData.name && isValidName
                        ? 'border-green-300 bg-green-50/30 hover:border-green-400'
                        : 'border-gray-200 hover:border-gray-300 focus:border-indigo-400'
                      }
                    `}
                  />
                  
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  
                  {/* Validation Indicator */}
                  <AnimatePresence>
                    {formData.name && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {isValidName ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-orange-300 rounded-full" />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <AnimatePresence>
                  {isValidName && formData.name && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-xs text-green-600 flex items-center space-x-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Valid name</span>
                    </motion.p>
                  )}
                  
                  {formErrors.name && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-xs text-red-600"
                    >
                      {formErrors.name}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

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
                      transition-all duration-300 pr-10 text-gray-900 placeholder-gray-500
                      ${formErrors.email 
                        ? 'border-red-300 bg-red-50/50' 
                        : formData.email && isValidEmail
                        ? 'border-green-300 bg-green-50/30 hover:border-green-400'
                        : 'border-gray-200 hover:border-gray-300 focus:border-indigo-400'
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

              {/* Company Field */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900">Company Name <span className="text-gray-600">(Optional)</span></label>
                <div className="relative">
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Enter your company name"
                    disabled={loading}
                    className="w-full px-4 py-3 pl-12 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl
                              focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent
                              transition-all duration-300 text-gray-900 placeholder-gray-500
                              hover:border-gray-300 focus:border-indigo-400"
                  />
                  
                  <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
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
                    placeholder="Create a strong password"
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

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    disabled={loading}
                    className={`
                      w-full px-4 py-3 bg-white/80 backdrop-blur-sm border rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent
                      transition-all duration-300 pr-12 text-gray-900 placeholder-gray-500
                      ${formErrors.confirmPassword 
                        ? 'border-red-300 bg-red-50/50' 
                        : formData.confirmPassword && passwordsMatch
                        ? 'border-green-300 bg-green-50/30 hover:border-green-400'
                        : formData.confirmPassword && !passwordsMatch
                        ? 'border-red-300 bg-red-50/30'
                        : 'border-gray-200 hover:border-gray-300 focus:border-indigo-400'
                      }
                    `}
                  />
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-indigo-600 transition-colors duration-200 rounded-md hover:bg-indigo-50"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </motion.button>
                </div>
                
                {/* Password Match Indicator */}
                <AnimatePresence>
                  {formData.confirmPassword && formData.password && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className={`text-xs flex items-center space-x-1 ${
                        passwordsMatch ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {passwordsMatch ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          <span>Passwords match</span>
                        </>
                      ) : (
                        <>
                          <div className="w-3 h-3 border border-red-400 rounded-full" />
                          <span>Passwords don&apos;t match</span>
                        </>
                      )}
                    </motion.div>
                  )}
                  
                  {formErrors.confirmPassword && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-xs text-red-600"
                    >
                      {formErrors.confirmPassword}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || (!DEMO_MODE && !isFormValid())}
                className={`w-full py-3 rounded-xl font-medium shadow-lg transition-all duration-300
                          focus:outline-none focus:ring-2 focus:ring-indigo-500/50
                          ${loading || (!DEMO_MODE && !isFormValid())
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-gray-400/25' 
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/25'
                          }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Account</span>
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
                    Already have an account?
                  </span>
                </div>
              </div>
            </div>

            {/* Sign In Button */}
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-white/90 backdrop-blur-sm border border-gray-200/50 text-gray-800 font-semibold
                          hover:bg-white hover:border-indigo-300/60 hover:text-indigo-700 hover:shadow-lg hover:shadow-indigo-500/15
                          focus:outline-none focus:ring-2 focus:ring-indigo-500/50 
                          transition-all duration-300 rounded-xl group shadow-md"
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>Sign In Instead</span>
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
            Join the future of AI-powered CRM automation
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}