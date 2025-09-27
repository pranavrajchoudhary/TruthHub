import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, Eye, MessageSquare, Calendar } from 'lucide-react'
import { articlesAPI, authAPI } from '../utils/api'

const Analytics = () => {
  const [stats, setStats] = useState({
    totalViews: 0,
    totalEngagement: 0,
    topArticles: [],
    recentActivity: []
  })
  const [platformStats, setPlatformStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const [userStatsRes, platformStatsRes] = await Promise.all([
        authAPI.getUserStats(),
        authAPI.getPlatformStats()
      ])
      
      setStats(userStatsRes.data)
      setPlatformStats(platformStatsRes.data)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dark-green"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-1">Track your contribution and platform insights</p>
      </div>

      {/* Personal Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Articles Submitted</p>
              <p className="text-2xl font-bold text-gray-900">{stats.submittedArticles || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Fact Checks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.factChecksSubmitted || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Verified Articles</p>
              <p className="text-2xl font-bold text-gray-900">{stats.articlesVerified || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Disputed Articles</p>
              <p className="text-2xl font-bold text-gray-900">{stats.disputedArticles || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Overview */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{platformStats.totalArticles?.toLocaleString() || 0}</div>
            <div className="text-sm text-gray-600">Total Articles</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{platformStats.totalUsers?.toLocaleString() || 0}</div>
            <div className="text-sm text-gray-600">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{platformStats.totalFactChecks?.toLocaleString() || 0}</div>
            <div className="text-sm text-gray-600">Fact Checks</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {stats.recentActivity && stats.recentActivity.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {stats.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-600">
                    Status: <span className={`font-medium ${
                      activity.status === 'verified' ? 'text-green-600' :
                      activity.status === 'disputed' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {activity.status}
                    </span>
                    {activity.credibilityScore && (
                      <span className="ml-2">
                        • Credibility: {activity.credibilityScore}%
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Analytics