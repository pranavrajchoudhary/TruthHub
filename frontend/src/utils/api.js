import axios from 'axios';

// Get the API URL and ensure it has the /api suffix
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl) {
    // If env URL doesn't end with /api, add it
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`
  }
  return 'http://localhost:5000/api'
}

const apiBaseUrl = getApiBaseUrl()
console.log('🔧 API initialized with baseURL:', apiBaseUrl)

// Create axios instance with base configuration
const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  getUserStats: () => api.get('/auth/stats'),
  getPlatformStats: () => api.get('/auth/platform-stats'),
  getPublicProfile: (username) => api.get(`/auth/user/${username}`),
  getLeaderboard: (params = {}) => api.get('/auth/leaderboard', { params }),
  getUserAchievements: () => api.get('/auth/achievements'),
};

export const articlesAPI = {
  getArticles: (params) => api.get('/articles', { params }),
  getArticleById: (id) => api.get(`/articles/${id}`),
  submitArticle: (data) => {
    // Check if data is FormData (for file uploads) or regular object
    const isFormData = data instanceof FormData
    return api.post('/articles', data, {
      headers: isFormData ? {
        'Content-Type': 'multipart/form-data'
      } : {
        'Content-Type': 'application/json'
      }
    })
  },
  analyzeUrl: (url) => api.post('/articles/analyze-url', { url }),
  voteArticle: (id, voteType) => api.post(`/articles/${id}/vote`, { voteType }),
  deleteArticle: (id) => api.delete(`/articles/${id}`),
  getRankedArticles: (params) => api.get('/articles/ranked', { params }),
  getTrendingArticles: () => api.get('/articles/trending'),
  getArticlesByCategory: (category, params) => api.get(`/articles/category/${category}`, { params }),
  getUserArticles: (params) => api.get('/articles/user/my-articles', { params }),
};

export const factChecksAPI = {
  submitFactCheck: (articleId, data) => api.post(`/factchecks/article/${articleId}`, data),
  getFactChecksForArticle: (articleId, params) => api.get(`/factchecks/article/${articleId}`, { params }),
  voteOnFactCheck: (factCheckId, voteType) => api.post(`/factchecks/${factCheckId}/vote`, { voteType }),
  getUserFactChecks: (params) => api.get('/factchecks/user/my-factchecks', { params }),
  getFactCheckById: (id) => api.get(`/factchecks/${id}`),
  updateFactCheck: (id, data) => api.put(`/factchecks/${id}`, data),
  getTrendingFactChecks: () => api.get('/factchecks/trending'),
};

export const sourcesAPI = {
  getSources: (params) => api.get('/sources', { params }),
  getSourceByDomain: (domain) => api.get(`/sources/${domain}`),
  getSourceAnalytics: (domain, params) => api.get(`/sources/${domain}/analytics`, { params }),
  getTopSources: (params) => api.get('/sources/top', { params }),
  compareSourcesReliability: (domains) => api.get('/sources/compare', { params: { domains } }),
};

export const communityAPI = {
  getLeaderboard: (params) => api.get('/community/leaderboard', { params }),
  getCommunityStats: () => api.get('/community/stats'),
  getUserActivityFeed: (params) => api.get('/community/activity', { params }),
  getUserBadges: () => api.get('/community/badges'),
  updateUserLevel: () => api.post('/community/level-up'),
  getTrendingTopics: (params) => api.get('/community/trending', { params }),
};

export const discussionsAPI = {
  getDiscussions: (params) => api.get('/discussions', { params }),
  getDiscussionById: (id) => api.get(`/discussions/${id}`),
  createDiscussion: (data) => api.post('/discussions', data),
  addReply: (discussionId, data) => api.post(`/discussions/${discussionId}/replies`, data),
  voteDiscussion: (discussionId, data) => api.post(`/discussions/${discussionId}/vote`, data),
  voteReply: (discussionId, replyId, data) => api.post(`/discussions/${discussionId}/vote`, { ...data, replyId }),
  deleteDiscussion: (id) => api.delete(`/discussions/${id}`),
  deleteReply: (discussionId, replyId) => api.delete(`/discussions/${discussionId}/replies/${replyId}`),
  editReply: (discussionId, replyId, data) => api.put(`/discussions/${discussionId}/replies/${replyId}`, data),
};

export const notificationsAPI = {
  getUserNotifications: (params) => api.get('/notifications', { params }),
  markNotificationAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllNotificationsAsRead: () => api.put('/notifications/mark-all-read'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  getNotificationSettings: () => api.get('/notifications/settings'),
  updateNotificationSettings: (data) => api.put('/notifications/settings', data),
  getNotificationStats: () => api.get('/notifications/stats'),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;