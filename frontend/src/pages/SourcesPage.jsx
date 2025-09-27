import { useState, useEffect } from 'react'
import { sourcesAPI } from '../utils/api'
import { 
  Shield, TrendingUp, AlertTriangle, CheckCircle, 
  ExternalLink, Calendar, BarChart3, Globe, Search,
  Filter, Star, Award
} from 'lucide-react'

const SourcesPage = () => {
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterReliability, setFilterReliability] = useState('all')
  const [sortBy, setSortBy] = useState('reliability')

  useEffect(() => {
    loadSources()
  }, [searchQuery, filterReliability, sortBy])

  const loadSources = async () => {
    try {
      setLoading(true)
      const params = {}
      if (searchQuery) params.search = searchQuery
      if (filterReliability !== 'all') params.reliability = filterReliability
      if (sortBy) params.sortBy = sortBy

      const response = await sourcesAPI.getSources(params)
      setSources(response.data.sources || [])
      setError(null)
    } catch (err) {
      console.error('Failed to load sources:', err)
      setError('Failed to load sources. Please try again.')
      setSources([])
    } finally {
      setLoading(false)
    }
  }

  const getReliabilityBadge = (score) => {
    if (score >= 85) return { color: 'bg-green-100 text-green-800', label: 'Very High', icon: CheckCircle }
    if (score >= 70) return { color: 'bg-blue-100 text-blue-800', label: 'High', icon: Shield }
    if (score >= 50) return { color: 'bg-yellow-100 text-yellow-800', label: 'Medium', icon: AlertTriangle }
    return { color: 'bg-red-100 text-red-800', label: 'Low', icon: AlertTriangle }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'academic-journal': return <Award className="w-5 h-5" />
      case 'news-publication': return <Globe className="w-5 h-5" />
      case 'government': return <Shield className="w-5 h-5" />
      default: return <Globe className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-green mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sources...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center animate-fade-in-up">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              <span className="green-highlight">Source</span> Reliability
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transparent tracking of news source credibility based on community fact-checking and verification outcomes.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-green focus:border-dark-green outline-none transition-colors"
                />
              </div>
              
              <select
                value={filterReliability}
                onChange={(e) => setFilterReliability(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-dark-green focus:border-dark-green outline-none transition-colors"
              >
                <option value="all">All Reliability</option>
                <option value="very-high">Very High (85+)</option>
                <option value="high">High (70-84)</option>
                <option value="medium">Medium (50-69)</option>
                <option value="low">Low (&lt;50)</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-dark-green focus:border-dark-green outline-none transition-colors"
              >
                <option value="reliability">Sort by Reliability</option>
                <option value="articles">Sort by Articles</option>
                <option value="name">Sort by Name</option>
                <option value="recent">Sort by Recent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sources Grid */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-700">{error}</p>
            <button 
              onClick={loadSources}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : sources.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sources Found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterReliability !== 'all' 
                ? 'No sources match your current filters. Try adjusting your search criteria.'
                : 'Sources will appear here as articles are submitted and verified by the community.'
              }
            </p>
            {(searchQuery || filterReliability !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setFilterReliability('all')
                }}
                className="bg-dark-green text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sources.map((source, index) => {
              const reliabilityBadge = getReliabilityBadge(source.reliabilityScore)
              const ReliabilityIcon = reliabilityBadge.icon
              const TypeIcon = getTypeIcon(source.type)
              
              return (
                <div 
                  key={source._id || index}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all animate-fade-in-up opacity-0"
                  style={{ 
                    animationDelay: `${0.4 + index * 0.1}s`, 
                    animationFillMode: 'forwards' 
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <TypeIcon />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{source.name}</h3>
                        <p className="text-sm text-gray-500">{source.domain}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${reliabilityBadge.color}`}>
                      <ReliabilityIcon className="w-4 h-4" />
                      <span>{source.reliabilityScore}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{source.totalArticles || 0}</div>
                      <div className="text-sm text-gray-600">Articles</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">{source.verifiedArticles || 0}</div>
                      <div className="text-sm text-gray-600">Verified</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-red-600">{source.disputedArticles || 0}</div>
                      <div className="text-sm text-gray-600">Disputed</div>
                    </div>
                  </div>

                  {source.specialties && source.specialties.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {source.specialties.slice(0, 3).map((specialty, idx) => (
                          <span key={idx} className="bg-secondary px-2 py-1 rounded text-xs text-dark-green">
                            {specialty}
                          </span>
                        ))}
                        {source.specialties.length > 3 && (
                          <span className="text-xs text-gray-500">+{source.specialties.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Est. {source.established || 'Unknown'}</span>
                      </div>
                      {source.recentAccuracy && (
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-4 h-4" />
                          <span>{source.recentAccuracy}% recent</span>
                        </div>
                      )}
                    </div>
                    <button className="text-dark-green hover:text-dark-green/80 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default SourcesPage