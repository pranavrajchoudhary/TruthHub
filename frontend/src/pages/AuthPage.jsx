import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Globe, Mail, Lock, User, ArrowLeft } from 'lucide-react'
import BackendWakeupServiceSingleton from '../utils/backendWakeup'
import BackendWakeupLoader from '../components/BackendWakeupLoader'
import SmoothCursor from '../components/SmoothCursor'

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [backendStatus, setBackendStatus] = useState('checking')
  const [showWakeupLoader, setShowWakeupLoader] = useState(false)
  
  const { login, register, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  // Check backend status on component mount
  useEffect(() => {
    const wakeupService = BackendWakeupServiceSingleton.getInstance()
    
    // Check current status
    const currentStatus = wakeupService.getStatus()
    setBackendStatus(currentStatus)
    
    // If backend is not ready, show the loader
    if (currentStatus !== 'ready') {
      setShowWakeupLoader(true)
      
      // Start wake-up process if needed
      wakeupService.wakeupBackend({
        onStatusChange: (status) => {
          setBackendStatus(status)
          if (status === 'ready') {
            setShowWakeupLoader(false)
          }
        }
      })
    }
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!isLogin && !formData.name.trim()) {
      newErrors.name = 'Full name is required'
    }
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    }
    
    if (!isLogin && !formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!isLogin && formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }
    
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formErrors = validateForm()
    
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }
    
    setIsLoading(true)
    setErrors({})
    
    try {
      let result
      
      if (isLogin) {
        result = await login({
          username: formData.username,
          password: formData.password
        })
      } else {
        result = await register({
          name: formData.name,
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      }
      
      if (result.success) {
        navigate('/dashboard')
      }
      // Error handling is now done in AuthContext with toasts
    } catch (error) {
      console.error('Auth error:', error)
      // Error handling is now done in AuthContext with toasts
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-6 overflow-hidden">
      <SmoothCursor />
      
      {/* Backend Wake-up Loader */}
      {showWakeupLoader && (
        <BackendWakeupLoader
          onClose={() => setShowWakeupLoader(false)}
          onSuccess={() => setShowWakeupLoader(false)}
        />
      )}
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-secondary opacity-10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent opacity-10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-dark-green opacity-10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-dark-green hover:text-gray-700 smooth-transition mb-6 group hover-lift"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 smooth-transition" />
            Back to Home
          </Link>
          
          <div className="flex items-center justify-center space-x-3 mb-6 animate-scale-in">
            <div className="w-12 h-12 bg-dark-green rounded-xl flex items-center justify-center glow-effect pulse-glow">
              <Globe className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-dark-green">TruthHub</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Welcome Back' : 'Join TruthHub'}
          </h1>
          <p className="text-gray-600">
            {isLogin 
              ? 'Continue your fact-checking journey' 
              : 'Start combating misinformation today'
            }
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl card-shadow-lg p-8 hover-lift smooth-transition">
          {/* Tab Switcher */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium smooth-transition button-press ${
                isLogin 
                  ? 'bg-white text-dark-green shadow-sm glow-effect' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium smooth-transition button-press ${
                !isLogin 
                  ? 'bg-white text-dark-green shadow-sm glow-effect' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-dark-green focus:border-dark-green outline-none smooth-transition hover-lift ${
                    errors.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your username"
                />
              </div>
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username}</p>
              )}
            </div>

            {/* Name Field (only for signup) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-dark-green focus:border-dark-green outline-none transition-all ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>
            )}

            {/* Email Field (only for signup) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-dark-green focus:border-dark-green outline-none transition-all ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
            )}

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-dark-green focus:border-dark-green outline-none transition-all ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your password"
                />
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Form Error */}
            {errors.form && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{errors.form}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-dark-green text-white py-3 px-4 rounded-lg font-semibold hover-lift smooth-transition button-press glow-effect pulse-glow ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </div>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Additional Options */}
          <div className="mt-6 text-center">
            {isLogin && (
              <a href="#" className="text-dark-green hover:underline text-sm">
                Forgot your password?
              </a>
            )}
            
            {!isLogin && (
              <p className="text-xs text-gray-600 mt-4">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-dark-green hover:underline">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="text-dark-green hover:underline">Privacy Policy</a>
              </p>
            )}
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-8 text-center animate-fade-in-up opacity-0" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
          <p className="text-gray-600 text-sm mb-4">Join thousands of fact-checkers worldwide</p>
          <div className="flex justify-center space-x-6 text-xs text-gray-500">
            <div className="flex items-center animate-fade-in-left opacity-0" style={{ animationDelay: '0.7s', animationFillMode: 'forwards' }}>
              <div className="w-2 h-2 bg-secondary rounded-full mr-2 animate-pulse"></div>
              Collaborative Verification
            </div>
            <div className="flex items-center animate-fade-in-up opacity-0" style={{ animationDelay: '0.9s', animationFillMode: 'forwards' }}>
              <div className="w-2 h-2 bg-accent rounded-full mr-2 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              Source Reliability
            </div>
            <div className="flex items-center animate-fade-in-right opacity-0" style={{ animationDelay: '1.1s', animationFillMode: 'forwards' }}>
              <div className="w-2 h-2 bg-dark-green rounded-full mr-2 animate-pulse" style={{ animationDelay: '1s' }}></div>
              Community Trust
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage