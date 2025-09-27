import { useState, useEffect } from 'react'
import { CheckCircle, X, Trophy, Star } from 'lucide-react'

const ToastNotification = ({ message, type = 'success', achievements = [], onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for animation to complete
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'achievement':
        return <Trophy className="w-5 h-5" />
      case 'points':
        return <Star className="w-5 h-5" />
      default:
        return <CheckCircle className="w-5 h-5" />
    }
  }

  const getColors = () => {
    switch (type) {
      case 'achievement':
        return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
      case 'points':
        return 'bg-gradient-to-r from-green-400 to-blue-500 text-white'
      default:
        return 'bg-white text-gray-900 border border-gray-200'
    }
  }

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className={`rounded-lg shadow-lg p-4 max-w-sm ${getColors()}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          
          <div className="flex-1">
            <p className="font-medium">{message}</p>
            
            {achievements.length > 0 && (
              <div className="mt-2 space-y-1">
                {achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm opacity-90">
                    <Trophy className="w-4 h-4" />
                    <span>{achievement.name} (+{achievement.points} pts)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={() => {
              setIsVisible(false)
              setTimeout(onClose, 300)
            }}
            className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ToastNotification