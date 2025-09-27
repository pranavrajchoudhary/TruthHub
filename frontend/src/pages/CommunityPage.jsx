import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  MessageSquare, 
  ThumbsUp, 
  Users, 
  Trophy, 
  Plus,
  Search,
  Shield,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import { discussionsAPI, authAPI } from '../utils/api'

const CommunityPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // State management
  const [activeTab, setActiveTab] = useState('discussions')
  const [discussions, setDiscussions] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'discussions') {
      loadDiscussions()
    } else if (activeTab === 'leaderboard') {
      loadLeaderboard()
    }
  }, [activeTab, searchQuery])

  const loadDiscussions = async () => {
    try {
      setLoading(true)
      const params = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        search: searchQuery || undefined
      }
      const response = await discussionsAPI.getDiscussions(params)
      setDiscussions(response.data.discussions || [])
    } catch (error) {
      console.error('Failed to load discussions:', error)
      setDiscussions([])
    } finally {
      setLoading(false)
    }
  }

  const loadLeaderboard = async () => {
    try {
      setLoading(true)
      const response = await authAPI.getLeaderboard({ limit: 20, sortBy: 'reputation' })
      setLeaderboard(response.data || [])
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
      setLeaderboard([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDiscussion = async (discussionData) => {
    try {
      const response = await discussionsAPI.createDiscussion(discussionData)
      setDiscussions(prev => [response.data.discussion, ...prev])
      setShowCreateModal(false)
    } catch (error) {
      console.error('Failed to create discussion:', error)
      alert('Failed to create discussion. Please try again.')
    }
  }

  const handleDiscussionClick = (discussion) => {
    navigate(`/discussion/${discussion._id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              <span className="text-green-600">Community</span> Hub
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect with fellow fact-checkers, share expertise, and build a more trustworthy news ecosystem.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('discussions')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'discussions'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageSquare className="w-5 h-5 inline mr-2" />
                Discussions
              </button>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'leaderboard'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Trophy className="w-5 h-5 inline mr-2" />
                Leaderboard
              </button>
              <button
                onClick={() => setActiveTab('guidelines')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'guidelines'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BookOpen className="w-5 h-5 inline mr-2" />
                Guidelines
              </button>
            </div>

            {activeTab === 'discussions' && user && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Discussion
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'discussions' && (
          <DiscussionsTab
            discussions={discussions}
            loading={loading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onDiscussionClick={handleDiscussionClick}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardTab
            leaderboard={leaderboard}
            loading={loading}
          />
        )}

        {activeTab === 'guidelines' && <GuidelinesTab />}
      </div>

      {/* Create Discussion Modal */}
      {showCreateModal && (
        <CreateDiscussionModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateDiscussion}
        />
      )}
    </div>
  )
}

// Discussions Tab Component
const DiscussionsTab = ({ discussions, loading, searchQuery, onSearchChange, onDiscussionClick }) => {
  return (
    <div>
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search discussions..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
        </div>
      </div>

      {/* Discussions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : discussions.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No discussions found</h3>
            <p className="text-gray-500">Start a new discussion to get the conversation going!</p>
          </div>
        ) : (
          discussions.map((discussion) => (
            <DiscussionCard
              key={discussion._id}
              discussion={discussion}
              onClick={() => onDiscussionClick(discussion)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// Discussion Card Component
const DiscussionCard = ({ discussion, onClick }) => {
  return (
    <div 
      className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-green-600">
            {discussion.title}
          </h3>
          
          <p className="text-gray-600 mb-4 line-clamp-2">
            {discussion.content.substring(0, 150)}...
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>by {discussion.author?.username || 'Unknown'}</span>
              <span>•</span>
              <span>{new Date(discussion.createdAt).toLocaleDateString()}</span>
              {discussion.category && (
                <>
                  <span>•</span>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {discussion.category}
                  </span>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <ThumbsUp className="w-4 h-4 mr-1" />
                <span>{discussion.upvotes || 0}</span>
              </div>
              <div className="flex items-center">
                <MessageSquare className="w-4 h-4 mr-1" />
                <span>{discussion.replies?.length || 0} replies</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Leaderboard Tab Component
const LeaderboardTab = ({ leaderboard, loading }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Community Leaderboard</h2>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No leaderboard data</h3>
          <p className="text-gray-500">Leaderboard will appear as users become active in the community.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {leaderboard.map((user, index) => (
            <LeaderboardCard key={user._id} user={user} rank={index + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

// Leaderboard Card Component
const LeaderboardCard = ({ user, rank }) => {
  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-600 bg-yellow-50'
    if (rank === 2) return 'text-gray-600 bg-gray-50'
    if (rank === 3) return 'text-orange-600 bg-orange-50'
    return 'text-gray-600 bg-gray-50'
  }

  const getRankIcon = (rank) => {
    if (rank <= 3) return <Trophy className="w-5 h-5" />
    return <span className="font-bold">{rank}</span>
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRankColor(rank)}`}>
          {getRankIcon(rank)}
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-900">{user.username}</h3>
          <p className="text-sm text-gray-500">Level {user.level || 'Beginner'}</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-6 text-sm">
        <div className="text-center">
          <div className="font-semibold text-gray-900">{user.reputation || 0}</div>
          <div className="text-gray-500">Reputation</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-gray-900">{user.contributionsCount || 0}</div>
          <div className="text-gray-500">Contributions</div>
        </div>
      </div>
    </div>
  )
}

// Guidelines Tab Component
const GuidelinesTab = () => {
  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Community Guidelines</h2>
      
      <div className="space-y-6">
        {/* General Guidelines */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <Shield className="w-6 h-6 text-green-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900">General Guidelines</h3>
          </div>
          <div className="space-y-3 text-gray-700">
            <p>• <strong>Be respectful:</strong> Treat all community members with respect and courtesy.</p>
            <p>• <strong>Stay on topic:</strong> Keep discussions relevant to fact-checking and news analysis.</p>
            <p>• <strong>No spam or self-promotion:</strong> Avoid excessive posting or promotional content.</p>
            <p>• <strong>Use reliable sources:</strong> Always cite credible sources when making claims.</p>
            <p>• <strong>Be constructive:</strong> Provide helpful feedback and constructive criticism.</p>
          </div>
        </div>

        {/* Discussion Guidelines */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <MessageSquare className="w-6 h-6 text-blue-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900">Discussion Guidelines</h3>
          </div>
          <div className="space-y-3 text-gray-700">
            <p>• <strong>Clear titles:</strong> Use descriptive titles that clearly explain your topic.</p>
            <p>• <strong>Detailed content:</strong> Provide context and background information.</p>
            <p>• <strong>Evidence-based:</strong> Support your points with evidence and sources.</p>
            <p>• <strong>Acknowledge uncertainty:</strong> It's okay to express uncertainty or ask questions.</p>
            <p>• <strong>Update when necessary:</strong> Edit your posts if new information becomes available.</p>
          </div>
        </div>

        {/* Fact-Checking Standards */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <CheckCircle className="w-6 h-6 text-purple-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900">Fact-Checking Standards</h3>
          </div>
          <div className="space-y-3 text-gray-700">
            <p>• <strong>Multiple sources:</strong> Cross-reference information with multiple credible sources.</p>
            <p>• <strong>Primary sources:</strong> Prefer primary sources over secondary reporting when available.</p>
            <p>• <strong>Context matters:</strong> Consider the full context, not just isolated statements.</p>
            <p>• <strong>Transparency:</strong> Be transparent about your methodology and limitations.</p>
            <p>• <strong>Bias awareness:</strong> Acknowledge and account for potential biases in sources.</p>
          </div>
        </div>

        {/* Community Standards */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900">Prohibited Content</h3>
          </div>
          <div className="space-y-3 text-gray-700">
            <p>• <strong>Harassment:</strong> Personal attacks, harassment, or threatening behavior.</p>
            <p>• <strong>Misinformation:</strong> Deliberately spreading false or misleading information.</p>
            <p>• <strong>Hate speech:</strong> Content that promotes hatred or discrimination.</p>
            <p>• <strong>Illegal content:</strong> Content that violates applicable laws.</p>
            <p>• <strong>Privacy violations:</strong> Sharing private information without consent.</p>
          </div>
        </div>

        {/* Reporting */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <Info className="w-6 h-6 text-indigo-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900">Reporting Issues</h3>
          </div>
          <div className="space-y-3 text-gray-700">
            <p>If you encounter content that violates these guidelines, please report it to the moderators.</p>
            <p>We review all reports and take appropriate action to maintain a healthy community environment.</p>
            <p>For urgent issues, you can contact the moderation team directly.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Create Discussion Modal Component
const CreateDiscussionModal = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('general')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    onSubmit({
      title: title.trim(),
      content: content.trim(),
      category
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Start New Discussion</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What would you like to discuss?"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              >
                <option value="general">General Discussion</option>
                <option value="fact-checking">Fact Checking</option>
                <option value="sources">Source Analysis</option>
                <option value="methodology">Methodology</option>
                <option value="tools">Tools & Resources</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts, questions, or insights..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                rows="6"
                required
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={!title.trim() || !content.trim()}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                Create Discussion
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CommunityPage