import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBackendWakeup } from '../hooks/useBackendWakeup'
import { Server, Wifi, CheckCircle, AlertCircle, Eye, X } from 'lucide-react'

const BackendWakeupLoader = ({ onClose, onSuccess }) => {
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [showExploreOption, setShowExploreOption] = useState(false)
  const navigate = useNavigate()
  const { status, progress, isReady, hasError, startWakeup } = useBackendWakeup()

  useEffect(() => {
    // Start wake-up process when component mounts
    startWakeup()

    // Show explore option after 3 seconds
    const exploreTimer = setTimeout(() => {
      setShowExploreOption(true)
    }, 3000)

    // Timer for elapsed time
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1)
    }, 1000)

    return () => {
      clearTimeout(exploreTimer)
      clearInterval(timer)
    }
  }, [startWakeup])

  useEffect(() => {
    // Handle successful wake-up
    if (isReady && onSuccess) {
      setTimeout(onSuccess, 1000) // Small delay to show completion
    }
  }, [isReady, onSuccess])

  const getStatusIcon = () => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-8 h-8 text-green-500" />
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-500" />
      case 'waking-up':
      case 'checking':
      default:
        return <Server className="w-8 h-8 text-blue-500 animate-pulse" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'ready':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      case 'waking-up':
      case 'checking':
      default:
        return 'bg-blue-500'
    }
  }

  const getMessage = () => {
    switch (status) {
      case 'ready':
        return 'Backend is ready! Connecting you now...'
      case 'error':
        return 'Having trouble connecting to our servers. Please try again.'
      case 'waking-up':
        return 'Waking up our servers... This usually takes 30-60 seconds.'
      case 'checking':
        return 'Checking server status...'
      default:
        return 'Preparing your experience...'
    }
  }

  const onExplore = () => {
    if (onClose) onClose()
    navigate('/')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl relative">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {getStatusIcon()}
            {(status === 'waking-up' || status === 'checking') && (
              <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
            )}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {status === 'ready' ? 'Ready to Go!' : 
           status === 'error' ? 'Connection Error' :
           'Preparing Your Experience'}
        </h2>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          {getMessage()}
        </p>

        {/* Progress Bar */}
        {status !== 'error' && (
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${getStatusColor()}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {Math.round(progress)}% complete
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {status === 'error' && (
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          )}

          {showExploreOption && (status === 'waking-up' || status === 'checking') && (
            <button
              onClick={onExplore}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors border border-gray-300"
            >
              Explore Landing Page While We Load
            </button>
          )}

          {status === 'ready' && (
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <Wifi className="w-5 h-5" />
              <span className="font-medium">Connected Successfully!</span>
            </div>
          )}
        </div>

        {/* Fun Facts Footer */}
        {(status === 'waking-up' || status === 'checking') && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              💡 Our server is hosted on Render and needs a moment to wake up from sleep mode.
              This ensures cost-effective hosting while maintaining great performance!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default BackendWakeupLoader