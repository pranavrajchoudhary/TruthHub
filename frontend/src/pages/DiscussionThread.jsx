import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  ArrowLeft,
  Reply,
  Edit,
  Trash2
} from 'lucide-react'
import { discussionsAPI } from '../utils/api'

const DiscussionThread = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [discussion, setDiscussion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [editingReply, setEditingReply] = useState(null)
  const [editContent, setEditContent] = useState('')

  useEffect(() => {
    if (id) {
      loadDiscussion()
    }
  }, [id])

  const loadDiscussion = async () => {
    try {
      setLoading(true)
      const response = await discussionsAPI.getDiscussionById(id)
      setDiscussion(response.data.discussion)
    } catch (error) {
      console.error('Failed to load discussion:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddReply = async (e) => {
    e.preventDefault()
    if (!replyContent.trim()) return

    try {
      await discussionsAPI.addReply(id, { 
        content: replyContent, 
        parentReplyId: replyingTo 
      })
      setReplyContent('')
      setReplyingTo(null)
      loadDiscussion() // Reload to show new reply
    } catch (error) {
      console.error('Failed to add reply:', error)
      alert('Failed to add reply')
    }
  }

  const handleEditReply = async (e) => {
    e.preventDefault()
    if (!editContent.trim()) return

    try {
      await discussionsAPI.editReply(id, editingReply, { content: editContent })
      setEditingReply(null)
      setEditContent('')
      loadDiscussion() // Reload to show updated reply
    } catch (error) {
      console.error('Failed to edit reply:', error)
      alert('Failed to edit reply')
    }
  }

  const handleDeleteReply = async (replyId) => {
    if (!confirm('Are you sure you want to delete this reply?')) return

    try {
      await discussionsAPI.deleteReply(id, replyId)
      loadDiscussion() // Reload to remove deleted reply
    } catch (error) {
      console.error('Failed to delete reply:', error)
      alert('Failed to delete reply')
    }
  }

  const handleVoteDiscussion = async (voteType) => {
    try {
      const response = await discussionsAPI.voteDiscussion(id, { voteType })
      setDiscussion(prev => ({
        ...prev,
        upvotes: response.data.upvotes,
        downvotes: response.data.downvotes,
        userVote: response.data.userVote
      }))
    } catch (error) {
      console.error('Failed to vote on discussion:', error)
      
      if (error.response?.status === 403 && error.response?.data?.isOwnContent) {
        alert("You can't vote on your own discussion")
      } else {
        alert(error.response?.data?.message || 'Failed to vote')
      }
    }
  }

  const handleVoteReply = async (replyId, voteType) => {
    try {
      await discussionsAPI.voteReply(id, replyId, { voteType })
      loadDiscussion() // Reload to get updated vote counts
    } catch (error) {
      console.error('Failed to vote on reply:', error)
      
      if (error.response?.status === 403 && error.response?.data?.isOwnContent) {
        alert("You can't vote on your own reply")
      } else {
        alert(error.response?.data?.message || 'Failed to vote on reply')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!discussion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Discussion not found</h2>
          <p className="text-gray-600 mb-4">The discussion you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/dashboard/community')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Back to Community
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate('/dashboard/community')}
            className="flex items-center text-green-600 hover:text-green-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Community
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Discussion */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{discussion.title}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
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
              <div className="prose max-w-none mb-4">
                <p className="text-gray-700 whitespace-pre-wrap">{discussion.content}</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => handleVoteDiscussion('upvote')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    discussion.userVote === 'upvote' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{discussion.upvotes || 0}</span>
                </button>
                <button 
                  onClick={() => handleVoteDiscussion('downvote')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    discussion.userVote === 'downvote' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span>{discussion.downvotes || 0}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Replies */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Replies ({discussion.replies?.length || 0})
          </h2>
          
          <div className="space-y-4">
            {discussion.replies?.map((reply) => (
              <div key={reply._id} className="border-l-4 border-green-200 pl-6 ml-4 bg-gray-50 rounded-r-lg py-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{reply.userId?.username || reply.author?.username || 'Unknown'}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(reply.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {user && (reply.userId?._id === user._id || reply.author?._id === user._id) && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingReply(reply._id)
                          setEditContent(reply.content)
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteReply(reply._id)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                {editingReply === reply._id ? (
                  <form onSubmit={handleEditReply} className="mb-4">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      rows="3"
                    />
                    <div className="flex space-x-2 mt-2">
                      <button
                        type="submit"
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingReply(null)
                          setEditContent('')
                        }}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mb-4">
                    <p className="text-gray-700 mb-2 whitespace-pre-wrap">{reply.content}</p>
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => handleVoteReply(reply._id, 'upvote')}
                        className={`flex items-center space-x-1 text-sm transition-colors ${
                          reply.userVote === 'upvote' 
                            ? 'text-green-600' 
                            : 'text-gray-400 hover:text-green-600'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>{reply.upvotes || 0}</span>
                      </button>
                      <button 
                        onClick={() => handleVoteReply(reply._id, 'downvote')}
                        className={`flex items-center space-x-1 text-sm transition-colors ${
                          reply.userVote === 'downvote' 
                            ? 'text-red-600' 
                            : 'text-gray-400 hover:text-red-600'
                        }`}
                      >
                        <ThumbsDown className="w-4 h-4" />
                        <span>{reply.downvotes || 0}</span>
                      </button>
                      <button
                        onClick={() => setReplyingTo(reply._id)}
                        className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Reply className="w-4 h-4" />
                        <span>Reply</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Add Reply Form */}
          {user && (
            <form onSubmit={handleAddReply} className="mt-6 pt-6 border-t">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {replyingTo ? 'Reply to comment' : 'Add your reply'}
                </label>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  rows="4"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={!replyContent.trim()}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Post Reply
                </button>
                {replyingTo && (
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default DiscussionThread