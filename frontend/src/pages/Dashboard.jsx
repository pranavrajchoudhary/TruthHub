import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ArticleCard, FactCheckModal, ArticleSubmissionForm } from '../components/ArticleComponents'
import SourceReliabilityDashboard from '../components/SourceReliabilityDashboard'
import RealTimeNotifications from '../components/RealTimeNotifications'
import AchievementsModal from '../components/AchievementsModal'
import ToastNotification from '../components/ToastNotification'
import SmoothCursor from '../components/SmoothCursor'
import CommunityPage from './CommunityPage'
import SourcesPage from './SourcesPage'
import Analytics from './Analytics'
import { articlesAPI, notificationsAPI, authAPI } from '../utils/api'
import { 
  Globe, Search, Bell, User, Menu, X, Plus, Home, TrendingUp, 
  Shield, Users, BookOpen, Settings, LogOut, Filter,
  CheckCircle, AlertTriangle, Clock, BarChart3, Calendar, Trophy
} from 'lucide-react'

// Real data state
const useArticlesData = () => {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadArticles = async (filters = {}) => {
    try {
      setLoading(true)
      const response = await articlesAPI.getArticles(filters)
      setArticles(response.data.articles || [])
      setError(null)
    } catch (err) {
      console.error('Failed to load articles:', err)
      setError('Failed to load articles. Please try again.')
      setArticles([])
    } finally {
      setLoading(false)
    }
  }

  return { articles, loading, error, loadArticles }
}

const Dashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { articles, loading, error, loadArticles } = useArticlesData()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [factCheckModalOpen, setFactCheckModalOpen] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [sourceReliabilityOpen, setSourceReliabilityOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [achievementsOpen, setAchievementsOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [dateRange, setDateRange] = useState('all')
  const [credibilityRange, setCredibilityRange] = useState([0, 100])
  const [sourceReliability, setSourceReliability] = useState('all')
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [userStats, setUserStats] = useState({
    submittedArticles: 0,
    disputedArticles: 0,
    articlesVerified: 0
  })

  // Load articles on component mount and when filters change
  useEffect(() => {
    const filters = {}
    if (selectedCategory !== 'all') filters.category = selectedCategory
    if (searchQuery) filters.search = searchQuery
    if (filterType !== 'all') filters.status = filterType
    if (dateRange !== 'all') filters.dateRange = dateRange
    if (sourceReliability !== 'all') filters.sourceReliability = sourceReliability
    
    loadArticles(filters)
  }, [selectedCategory, searchQuery, filterType, dateRange, sourceReliability])

  // Load notifications count
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await notificationsAPI.getUserNotifications({ unread: true })
        setUnreadNotifications(response.data.notifications?.length || 0)
      } catch (err) {
        console.error('Failed to load notifications:', err)
      }
    }
    loadNotifications()
  }, [])

  // Load user statistics function
  const loadUserStats = useCallback(async () => {
    try {
      const response = await authAPI.getUserStats()
      setUserStats(response.data)
    } catch (err) {
      console.error('Failed to load user stats:', err)
    }
  }, [])

  // Load user statistics on mount
  useEffect(() => {
    loadUserStats()
  }, [loadUserStats])

  const categories = [
    { id: 'all', name: 'All News', icon: <Home className="w-5 h-5" />, path: '/dashboard', isCategory: true },
    { id: 'politics', name: 'Politics', icon: <Users className="w-5 h-5" />, path: '/dashboard', isCategory: true },
    { id: 'technology', name: 'Technology', icon: <Globe className="w-5 h-5" />, path: '/dashboard', isCategory: true },
    { id: 'environment', name: 'Environment', icon: <TrendingUp className="w-5 h-5" />, path: '/dashboard', isCategory: true },
    { id: 'health', name: 'Health', icon: <Shield className="w-5 h-5" />, path: '/dashboard', isCategory: true },
    { id: 'social', name: 'Social', icon: <Users className="w-5 h-5" />, path: '/dashboard', isCategory: true },
    { id: 'science', name: 'Science', icon: <BookOpen className="w-5 h-5" />, path: '/dashboard', isCategory: true },
    { id: 'sources', name: 'Source Reliability', icon: <BarChart3 className="w-5 h-5" />, path: '/dashboard/sources' },
    { id: 'community', name: 'Community', icon: <Users className="w-5 h-5" />, path: '/dashboard/community' },
    { id: 'analytics', name: 'Analytics', icon: <TrendingUp className="w-5 h-5" />, path: '/dashboard/analytics' }
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleFactCheck = (article) => {
    setSelectedArticle(article)
    setFactCheckModalOpen(true)
  }

  const handleDiscuss = (article) => {
    console.log('Discussing article:', article.title)
    // Navigate to community page with article discussion
    navigate(`/dashboard/community?article=${article._id}&discuss=true`)
  }

  const handleVote = async (articleId, voteType) => {
    try {
      const response = await articlesAPI.voteArticle(articleId, voteType)
      
      // Return the vote data for local state updates
      return response.data
    } catch (error) {
      console.error('Failed to vote:', error)
      
      // Handle specific error messages
      const errorMessage = error.response?.data?.message || 'Failed to vote. Please try again.'
      const isOwnArticle = errorMessage.includes('cannot vote on your own article')
      
      setToast({
        message: isOwnArticle ? "You can't vote on your own article" : errorMessage,
        type: 'error'
      })
      throw error
    }
  }

  const handleDeleteArticle = async (articleId) => {
    if (!window.confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      return
    }

    try {
      await articlesAPI.deleteArticle(articleId)
      setToast({
        message: 'Article deleted successfully',
        type: 'success'
      })
      // Refresh articles to remove the deleted one
      loadArticles()
    } catch (error) {
      console.error('Failed to delete article:', error)
      setToast({
        message: 'Failed to delete article. Please try again.',
        type: 'error'
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SmoothCursor />
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform lg:translate-x-0 flex flex-col`}>
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-dark-green rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-dark-green">TruthHub</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User Profile */}
        <div className="p-6 border-b bg-primary animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-dark-green rounded-full flex items-center justify-center glow-effect pulse-glow">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">{user?.username}</div>
              <div className="text-sm text-gray-600">
                <span className="font-medium text-green-600">{user?.reputation || 0} pts</span> • 
                Level: {user?.level || 'Novice'}
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-between text-sm">
            <div>
              <div className="font-medium text-gray-900">{userStats.articlesVerified || 0}</div>
              <div className="text-gray-600">Verified</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">{userStats.submittedArticles || 0}</div>
              <div className="text-gray-600">Submitted</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">{userStats.disputedArticles || 0}</div>
              <div className="text-gray-600">Disputed</div>
            </div>
          </div>
          
          {/* Achievements Button */}
          <div className="mt-4">
            <button
              onClick={() => setAchievementsOpen(true)}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all font-medium flex items-center justify-center space-x-2"
            >
              <Trophy className="w-4 h-4" />
              <span>View Achievements</span>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-2">
          {categories.map((category) => {
            // Handle page navigation (community, sources)
            if (category.path && !category.isCategory) {
              return (
                <NavLink
                  key={category.id}
                  to={category.path}
                  className={({ isActive }) => `w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-secondary text-dark-green font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {category.icon}
                  <span>{category.name}</span>
                </NavLink>
              )
            }
            // Handle category filtering (all, politics, tech, etc.)
            return (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id)
                  navigate('/dashboard')
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  selectedCategory === category.id && window.location.pathname === '/dashboard'
                    ? 'bg-secondary text-dark-green font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.icon}
                <span>{category.name}</span>
              </button>
            )
          })}
        </nav>


      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-gray-500 hover:text-gray-700"
                >
                  <Menu className="w-6 h-6" />
                </button>
                
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search news articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-green focus:border-dark-green outline-none smooth-transition hover-lift"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* User Actions */}
                <button className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-100">
                  <Settings className="w-5 h-5" />
                </button>
                
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5" />
                </button>

                {/* Advanced Filters */}
                <div className="flex items-center space-x-2">
                  {/* Status Filter */}
                  <div className="relative">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-dark-green focus:border-dark-green outline-none appearance-none smooth-transition hover-lift"
                    >
                      <option value="all">All Status</option>
                      <option value="verified">Verified</option>
                      <option value="disputed">Disputed</option>
                      <option value="pending">Under Review</option>
                    </select>
                    <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Date Range Filter */}
                  <div className="relative">
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-dark-green focus:border-dark-green outline-none appearance-none smooth-transition hover-lift"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="year">This Year</option>
                    </select>
                    <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Source Reliability Filter */}
                  <div className="relative">
                    <select
                      value={sourceReliability}
                      onChange={(e) => setSourceReliability(e.target.value)}
                      className="bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-dark-green focus:border-dark-green outline-none appearance-none smooth-transition hover-lift"
                    >
                      <option value="all">All Sources</option>
                      <option value="high">High Reliability</option>
                      <option value="medium">Medium Reliability</option>
                      <option value="low">Low Reliability</option>
                    </select>
                    <Shield className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <button 
                  onClick={() => setSubmitModalOpen(true)}
                  className="bg-dark-green text-white px-4 py-2 rounded-lg hover-lift smooth-transition button-press glow-effect flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Submit Article</span>
                </button>

                <button 
                  onClick={() => setNotificationsOpen(true)}
                  className="relative text-gray-500 hover:text-gray-700 smooth-transition hover-lift button-press"
                >
                  <Bell className="w-6 h-6" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse glow-effect">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1">
          <Routes>
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/sources" element={<SourcesPage />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/" element={
              <div className="p-6">
                <DashboardHome 
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  filterType={filterType}
                  setFilterType={setFilterType}
                  handleFactCheck={handleFactCheck}
                  handleDiscuss={handleDiscuss}
                  handleVote={handleVote}
                  handleDeleteArticle={handleDeleteArticle}
                  currentUser={user}
                  articles={articles}
                  loading={loading}
                  error={error}
                />
              </div>
            } />
          </Routes>
        </main>
      </div>

      {/* Modals */}
      <FactCheckModal
        isOpen={factCheckModalOpen}
        onClose={() => setFactCheckModalOpen(false)}
        article={selectedArticle}
      />
      
      <ArticleSubmissionForm
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        onSubmit={async (data) => {
          try {
            console.log('Submitting article:', data)
            const response = await articlesAPI.submitArticle(data)
            
            // Refresh articles and user stats after successful submission
            loadArticles()
            loadUserStats()
            
            setSubmitModalOpen(false)
            
            // Show success notification with points and achievements
            const pointsEarned = response.data.pointsEarned || 50
            const newAchievements = response.data.newAchievements || []
            const levelUp = response.data.levelUp
            
            if (levelUp) {
              setToast({
                message: `🎉 Level Up! You've reached ${levelUp.to} level! +${pointsEarned} points earned!`,
                type: 'achievement',
                achievements: newAchievements
              })
            } else if (newAchievements.length > 0) {
              setToast({
                message: `Article submitted! +${pointsEarned} points earned!`,
                type: 'achievement',
                achievements: newAchievements
              })
            } else {
              setToast({
                message: `Article submitted successfully! +${pointsEarned} points earned!`,
                type: 'points'
              })
            }
          } catch (error) {
            console.error('Failed to submit article:', error)
            alert('Failed to submit article. Please try again.')
          }
        }}
      />

      <SourceReliabilityDashboard
        isOpen={sourceReliabilityOpen}
        onClose={() => setSourceReliabilityOpen(false)}
      />

      <RealTimeNotifications
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onNotificationUpdate={(unreadCount) => setUnreadNotifications(unreadCount)}
      />

      <AchievementsModal
        isOpen={achievementsOpen}
        onClose={() => setAchievementsOpen(false)}
      />

      {/* Toast Notifications */}
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          achievements={toast.achievements}
          onClose={() => setToast(null)}
        />
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

const DashboardHome = ({ 
  selectedCategory, 
  searchQuery, 
  filterType, 
  handleFactCheck, 
  handleDiscuss,
  handleVote,
  handleDeleteArticle,
  currentUser,
  articles,
  loading,
  error
}) => {
  const [platformStats, setPlatformStats] = useState({
    totalArticles: 0,
    verifiedArticles: 0,
    underReviewArticles: 0,
    disputedArticles: 0
  })

  // Load platform statistics
  useEffect(() => {
    const loadPlatformStats = async () => {
      try {
        const response = await authAPI.getPlatformStats()
        setPlatformStats(response.data)
      } catch (err) {
        console.error('Failed to load platform stats:', err)
      }
    }
    loadPlatformStats()
  }, [])
  const categories = [
    { id: 'all', name: 'All News' },
    { id: 'politics', name: 'Politics' },
    { id: 'technology', name: 'Technology' },
    { id: 'environment', name: 'Environment' },
    { id: 'health', name: 'Health' },
    { id: 'social', name: 'Social' },
    { id: 'science', name: 'Science' }
  ]

  // Filter articles on client side for immediate feedback
  const filteredArticles = articles.filter(article => {
    const matchesSearch = !searchQuery || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesSearch
  })

  return (
    <>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">{platformStats.totalArticles.toLocaleString()}</div>
              <div className="text-gray-600">Total Articles</div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">{platformStats.verifiedArticles.toLocaleString()}</div>
              <div className="text-gray-600">Verified</div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-600">{platformStats.underReviewArticles.toLocaleString()}</div>
              <div className="text-gray-600">Under Review</div>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-600">{platformStats.disputedArticles.toLocaleString()}</div>
              <div className="text-gray-600">Disputed</div>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Articles Feed */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedCategory === 'all' ? 'Latest News' : `${categories.find(c => c.id === selectedCategory)?.name} News`}
          </h2>
          <div className="text-sm text-gray-600">
            {loading ? 'Loading...' : `${filteredArticles.length} articles found`}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dark-green"></div>
            <span className="ml-3 text-gray-600">Loading articles...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-700 font-medium">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-600">Try adjusting your search or filters to find more articles.</p>
          </div>
        ) : (
          filteredArticles.map((article) => (
            <ArticleCard
              key={article._id || article.id}
              article={article}
              currentUser={currentUser}
              onFactCheck={handleFactCheck}
              onDiscuss={handleDiscuss}
              onVote={handleVote}
              onDelete={handleDeleteArticle}
            />
          ))
        )}
      </div>
    </>
  )
}

export default Dashboard