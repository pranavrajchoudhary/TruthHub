import { useState, useEffect } from 'react'
import { 
  Shield, TrendingUp, AlertTriangle, CheckCircle, 
  ExternalLink, Calendar, Award, Globe, Star,
  BarChart3, Users, FileText, Clock, X
} from 'lucide-react'
import { sourcesAPI } from '../utils/api'

const SourceReliabilityDashboard = ({ isOpen, onClose }) => {
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [trustFilter, setTrustFilter] = useState('all')
  const [sortBy, setSortBy] = useState('reliabilityScore')

  // Load sources from API
  useEffect(() => {
    if (!isOpen) return
    
    loadSources()
  }, [isOpen])

  const loadSources = async () => {
    try {
      setLoading(true)
      const response = await sourcesAPI.getSources({
        page: 1,
        limit: 100,
        sortBy: sortBy,
        sortOrder: 'desc'
      })
      
      setSources(response.data.sources || [])
      setError(null)
    } catch (err) {
      console.error('Failed to load sources:', err)
      setError('Failed to load sources')
      // Fallback to empty array instead of mock data
      setSources([])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const getTrustLevelColor = (level) => {
    switch (level) {
      case 'High': return 'text-green-600 bg-green-100'
      case 'Medium': return 'text-yellow-600 bg-yellow-100'
      case 'Low': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTrustLevel = (score) => {
    if (score >= 85) return 'High'
    if (score >= 70) return 'Medium'
    if (score >= 50) return 'Low'
    return 'Very Low'
  }

  const getReliabilityBarColor = (score) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const filteredSources = sources.filter(source => {
    const matchesSearch = (source.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (source.domain || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterType === 'all' ||
                         (filterType === 'high' && getTrustLevel(source.reliabilityScore || 0) === 'High') ||
                         (filterType === 'medium' && getTrustLevel(source.reliabilityScore || 0) === 'Medium') ||
                         (filterType === 'low' && getTrustLevel(source.reliabilityScore || 0) === 'Low')
    return matchesSearch && matchesFilter
  })

  const sortedSources = [...filteredSources].sort((a, b) => {
    switch (sortBy) {
      case 'reliability':
        return b.reliabilityScore - a.reliabilityScore
      case 'articles':
        return b.totalArticles - a.totalArticles
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Source Reliability Dashboard</h2>
            <p className="text-gray-600 text-sm mt-1">
              Track and analyze news source credibility and performance metrics
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-green focus:border-dark-green outline-none"
                />
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-dark-green focus:border-dark-green outline-none"
              >
                <option value="all">All Sources</option>
                <option value="high">High Reliability</option>
                <option value="medium">Medium Reliability</option>
                <option value="low">Low Reliability</option>
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-dark-green focus:border-dark-green outline-none"
              >
                <option value="reliability">Sort by Reliability</option>
                <option value="articles">Sort by Article Count</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="p-6 border-b">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {sources.filter(s => getTrustLevel(s.reliabilityScore || 0) === 'High').length}
              </div>
              <div className="text-gray-600 text-sm">High Reliability Sources</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {sources.reduce((sum, s) => sum + (s.totalArticles || 0), 0).toLocaleString()}
              </div>
              <div className="text-gray-600 text-sm">Total Articles Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {sources.length > 0 ? Math.round(sources.reduce((sum, s) => sum + (s.reliabilityScore || 0), 0) / sources.length) : 0}
              </div>
              <div className="text-gray-600 text-sm">Average Reliability Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {sources.reduce((sum, s) => sum + (s.expertEndorsements || 0), 0)}
              </div>
              <div className="text-gray-600 text-sm">Expert Endorsements</div>
            </div>
          </div>
        </div>

        {/* Sources List */}
        <div className="p-6">
          <div className="space-y-4">
            {sortedSources.map((source) => (
              <div
                key={source.id}
                className="border rounded-xl p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedSource(source)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-dark-green rounded-lg flex items-center justify-center">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{source.name}</h3>
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <span>{source.domain}</span>
                        <span>•</span>
                        <span>{source.type}</span>
                        <span>•</span>
                        <span>Est. {source.established}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTrustLevelColor(source.trustLevel)}`}>
                      {source.trustLevel} Trust
                    </span>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{source.reliabilityScore}</div>
                      <div className="text-xs text-gray-600">Reliability</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600">Total Articles</div>
                    <div className="font-semibold">{source.totalArticles.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Verified</div>
                    <div className="font-semibold text-green-600">{source.verifiedArticles.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Disputed</div>
                    <div className="font-semibold text-red-600">{source.disputedArticles}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Accuracy</div>
                    <div className="font-semibold">{source.recentAccuracy}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Bias Rating</div>
                    <div className="font-semibold">{source.biasRating}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Transparency</div>
                    <div className="font-semibold">{source.transparencyScore}/10</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {source.specialties.map((specialty, index) => (
                      <span key={index} className="bg-secondary px-2 py-1 rounded-full text-xs text-dark-green">
                        {specialty}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {source.peerReviewProcess && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Peer Reviewed</span>
                      </div>
                    )}
                    {source.impactFactor && (
                      <div className="flex items-center space-x-1 text-blue-600">
                        <Star className="w-4 h-4" />
                        <span className="text-sm">IF: {source.impactFactor}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reliability Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Reliability Trend</span>
                    <span className="text-sm font-medium">{source.reliabilityScore}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getReliabilityBarColor(source.reliabilityScore)}`}
                      style={{ width: `${source.reliabilityScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Source Modal */}
        {selectedSource && (
          <SourceDetailModal
            source={selectedSource}
            onClose={() => setSelectedSource(null)}
          />
        )}
      </div>
    </div>
  )
}

// Detailed Source Modal Component
const SourceDetailModal = ({ source, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{source.name}</h2>
            <p className="text-gray-600">{source.domain}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{source.reliabilityScore}</div>
              <div className="text-green-700 font-medium">Reliability Score</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{source.recentAccuracy}%</div>
              <div className="text-blue-700 font-medium">Recent Accuracy</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{source.transparencyScore}</div>
              <div className="text-purple-700 font-medium">Transparency Score</div>
            </div>
          </div>

          {/* Detailed Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Source Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{source.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Established:</span>
                  <span className="font-medium">{source.established}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bias Rating:</span>
                  <span className="font-medium">{source.biasRating}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Correction Policy:</span>
                  <span className="font-medium">{source.correctionPolicy}</span>
                </div>
                {source.impactFactor && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Impact Factor:</span>
                    <span className="font-medium">{source.impactFactor}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Articles:</span>
                  <span className="font-medium">{source.totalArticles.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Verified Articles:</span>
                  <span className="font-medium text-green-600">{source.verifiedArticles.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Disputed Articles:</span>
                  <span className="font-medium text-red-600">{source.disputedArticles}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expert Endorsements:</span>
                  <span className="font-medium">{source.expertEndorsements}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Specialties */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Specialties</h3>
            <div className="flex flex-wrap gap-2">
              {source.specialties.map((specialty, index) => (
                <span key={index} className="bg-secondary px-3 py-2 rounded-full text-sm text-dark-green font-medium">
                  {specialty}
                </span>
              ))}
            </div>
          </div>

          {/* Reliability Trend Chart (Mock) */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Reliability Trend (Last 5 Months)</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-end justify-between h-32 space-x-2">
                {source.trends.reliability.map((score, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div
                      className="bg-dark-green rounded-t w-full"
                      style={{ height: `${(score / 100) * 100}%` }}
                    ></div>
                    <div className="text-xs text-gray-600 mt-1">{score}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SourceReliabilityDashboard