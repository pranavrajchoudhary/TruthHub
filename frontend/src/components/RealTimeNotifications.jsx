import { useState, useEffect } from 'react'
import { 
  Bell, X, CheckCircle, AlertTriangle, Clock, Users, 
  MessageSquare, TrendingUp, Shield, Award 
} from 'lucide-react'
import { notificationsAPI } from '../utils/api'

const RealTimeNotifications = ({ isOpen, onClose, onNotificationUpdate }) => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  // Load notifications from API
  useEffect(() => {
    if (!isOpen) return
    
    loadNotifications()
    
    // Set up polling for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadNotifications()
    }, 30000)

    return () => clearInterval(interval)
  }, [isOpen])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const response = await notificationsAPI.getUserNotifications({
        page: 1,
        limit: 50
      })
      
      const formattedNotifications = response.data.notifications.map(notif => ({
        id: notif._id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        timestamp: notif.timeAgo || formatTimeAgo(notif.createdAt),
        icon: getNotificationIcon(notif.type),
        color: notif.color || 'blue',
        read: notif.isRead,
        actionable: notif.actionable,
        link: notif.actionUrl
      }))
      
      setNotifications(formattedNotifications)
      setError(null)
      
      // Update unread count in parent component
      const unreadCount = formattedNotifications.filter(n => !n.read).length
      onNotificationUpdate?.(unreadCount)
    } catch (err) {
      console.error('Failed to load notifications:', err)
      setError('Failed to load notifications')
      // Fallback to empty array for now
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const getNotificationIcon = (type) => {
    const iconMap = {
      'article_verified': CheckCircle,
      'fact_check_disputed': AlertTriangle,
      'reputation_milestone': Award,
      'new_discussion': MessageSquare,
      'trending_article': TrendingUp,
      'expert_endorsement': Shield,
      'community_activity': Users,
      'default': Clock
    }
    return iconMap[type] || iconMap.default
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  }

  if (!isOpen) return null

  const getIconColor = (color) => {
    const colors = {
      green: 'text-green-600 bg-green-100',
      red: 'text-red-600 bg-red-100',
      blue: 'text-blue-600 bg-blue-100',
      purple: 'text-purple-600 bg-purple-100',
      orange: 'text-orange-600 bg-orange-100',
      gray: 'text-gray-600 bg-gray-100'
    }
    return colors[color] || colors.gray
  }

  const markAsRead = async (id) => {
    try {
      await notificationsAPI.markNotificationAsRead(id)
      setNotifications(prev => {
        const updated = prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
        // Update unread count in parent
        const unreadCount = updated.filter(n => !n.read).length
        onNotificationUpdate?.(unreadCount)
        return updated
      })
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllNotificationsAsRead()
      setNotifications(prev => {
        const updated = prev.map(notif => ({ ...notif, read: true }))
        // Update unread count in parent (should be 0 now)
        onNotificationUpdate?.(0)
        return updated
      })
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
    }
  }

  const deleteNotification = async (id) => {
    try {
      await notificationsAPI.deleteNotification(id)
      setNotifications(prev => prev.filter(notif => notif.id !== id))
    } catch (err) {
      console.error('Failed to delete notification:', err)
    }
  }

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read
    if (filter === 'actionable') return notif.actionable
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-16 px-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bell className="w-6 h-6 text-dark-green" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-600">
                {unreadCount} unread • {notifications.length} total
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-dark-green text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-dark-green text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('actionable')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === 'actionable'
                  ? 'bg-dark-green text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Actionable ({notifications.filter(n => n.actionable).length})
            </button>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-dark-green hover:text-opacity-80 text-sm font-medium transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-500">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-red-300 mx-auto mb-4" />
              <p className="text-red-500">{error}</p>
              <button 
                onClick={loadNotifications}
                className="mt-2 text-dark-green hover:text-opacity-80 text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No notifications to show</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => {
                const IconComponent = notification.icon
                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => {
                      markAsRead(notification.id)
                      if (notification.actionable && notification.link) {
                        // In real app, navigate to the link
                        console.log('Navigate to:', notification.link)
                      }
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(notification.color)}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </p>
                            <p className={`text-sm mt-1 ${!notification.read ? 'text-gray-700' : 'text-gray-600'}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {notification.timestamp}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notification.id)
                              }}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {notification.actionable && (
                          <div className="mt-3">
                            <button className="text-dark-green hover:text-opacity-80 text-sm font-medium transition-colors">
                              Take Action →
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 text-center">
          <button className="text-dark-green hover:text-opacity-80 text-sm font-medium transition-colors">
            View All Notifications
          </button>
        </div>
      </div>
    </div>
  )
}

export default RealTimeNotifications