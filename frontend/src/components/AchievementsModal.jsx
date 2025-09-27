import { useState, useEffect } from 'react'
import { Trophy, Star, Award, CheckCircle, Target, X } from 'lucide-react'
import { authAPI } from '../utils/api'

const AchievementsModal = ({ isOpen, onClose }) => {
  const [achievements, setAchievements] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadAchievements()
    }
  }, [isOpen])

  const loadAchievements = async () => {
    try {
      setLoading(true)
      const response = await authAPI.getUserAchievements()
      setAchievements(response.data)
    } catch (error) {
      console.error('Failed to load achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAchievementIcon = (achievementId) => {
    if (achievementId.includes('article')) return <Trophy className="w-6 h-6" />
    if (achievementId.includes('fact')) return <CheckCircle className="w-6 h-6" />
    if (achievementId.includes('reputation')) return <Star className="w-6 h-6" />
    if (achievementId.includes('vote')) return <Target className="w-6 h-6" />
    return <Award className="w-6 h-6" />
  }

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'bg-green-500'
    if (progress >= 75) return 'bg-blue-500'
    if (progress >= 50) return 'bg-yellow-500'
    if (progress >= 25) return 'bg-orange-500'
    return 'bg-gray-300'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Achievements</h2>
            <p className="text-gray-600 text-sm mt-1">
              Track your progress and unlock rewards
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dark-green"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(achievements).map(([achievementId, achievement]) => (
                <div
                  key={achievementId}
                  className={`border rounded-xl p-4 transition-all ${
                    achievement.earned
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        achievement.earned
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {getAchievementIcon(achievementId)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-semibold ${
                          achievement.earned ? 'text-green-900' : 'text-gray-900'
                        }`}>
                          {achievement.name}
                          {achievement.earned && (
                            <CheckCircle className="w-4 h-4 text-green-500 inline ml-2" />
                          )}
                        </h3>
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          achievement.earned
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          +{achievement.points} pts
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        {achievement.description}
                      </p>
                      
                      {!achievement.earned && (
                        <div>
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{Math.round(achievement.progress)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${getProgressColor(achievement.progress)}`}
                              style={{ width: `${Math.min(achievement.progress, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AchievementsModal