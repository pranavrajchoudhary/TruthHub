import axios from 'axios'

// Get the API URL and ensure it has the /api suffix
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl) {
    // If env URL doesn't end with /api, add it
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`
  }
  return 'http://localhost:5000/api'
}

const API_BASE_URL = getApiBaseUrl()
const BACKEND_BASE_URL = API_BASE_URL.replace('/api', '')

class BackendWakeupService {
  constructor() {
    this.isWakingUp = false
    this.isAwake = false
    this.wakeupPromise = null
    this.wakeupCallbacks = []
    this.statusCallbacks = []
    this.wakeupTimeout = 30000 // 30 seconds timeout
    
    // Debug logging
    console.log('🔧 BackendWakeupService initialized:')
    console.log('  API_BASE_URL:', API_BASE_URL)
    console.log('  BACKEND_BASE_URL:', BACKEND_BASE_URL)
    console.log('  VITE_API_URL:', import.meta.env.VITE_API_URL)
  }

  // Add callback for wake-up completion
  onWakeup(callback) {
    if (this.isAwake) {
      callback(true)
    } else {
      this.wakeupCallbacks.push(callback)
    }
  }

  // Add callback for status updates
  onStatusUpdate(callback) {
    this.statusCallbacks.push(callback)
  }

  // Remove callback
  removeCallback(callback) {
    this.wakeupCallbacks = this.wakeupCallbacks.filter(cb => cb !== callback)
    this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback)
  }

  // Notify status update callbacks
  notifyStatusUpdate(status, message) {
    this.statusCallbacks.forEach(callback => {
      try {
        callback(status, message)
      } catch (error) {
        console.error('Error in status callback:', error)
      }
    })
  }

  // Check if backend is already awake
  async checkBackendStatus() {
    try {
      this.notifyStatusUpdate('checking', 'Checking backend status...')
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      // Ensure we're calling the correct health endpoint
      const healthUrl = `${API_BASE_URL}/health`
      console.log('🏥 Checking health at:', healthUrl)

      const response = await axios.get(healthUrl, {
        signal: controller.signal,
        timeout: 5000
      })
      
      clearTimeout(timeoutId)
      
      if (response.status === 200) {
        this.isAwake = true
        this.notifyStatusUpdate('ready', 'Backend is ready!')
        return true
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Backend status check timed out')
      } else {
        console.log('Backend not ready:', error.message)
      }
      this.isAwake = false
    }
    return false
  }

  // Wake up the backend with options
  async wakeupBackend(options = {}) {
    const { onStatusChange } = options
    
    // Add status callback if provided
    if (onStatusChange) {
      this.statusCallbacks.push(onStatusChange)
    }
    
    // If already awake, return immediately
    if (this.isAwake) {
      if (onStatusChange) onStatusChange('ready')
      return Promise.resolve(true)
    }

    // If already waking up, return the existing promise
    if (this.isWakingUp && this.wakeupPromise) {
      return this.wakeupPromise
    }

    this.isWakingUp = true
    this.notifyStatusUpdate('waking-up', 'Waking up backend server...')

    this.wakeupPromise = new Promise(async (resolve, reject) => {
      const startTime = Date.now()
      let attempt = 0
      const maxAttempts = 6 // 6 attempts over 30 seconds
      
      const wakeupAttempt = async () => {
        attempt++
        
        try {
          console.log(`🔄 Wake-up attempt ${attempt}/${maxAttempts}`)
          this.notifyStatusUpdate('waking-up', `Attempt ${attempt}/${maxAttempts}: Connecting to server...`)
          
          // Try to wake up the backend - start with root endpoint to wake up the server
          let wakeupSuccess = false
          
          try {
            // First ping the root endpoint to wake up the server
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 8000)

            const response = await axios.get(`${BACKEND_BASE_URL}/`, {
              signal: controller.signal,
              timeout: 8000
            })
            
            clearTimeout(timeoutId)
            
            if (response.status === 200) {
              // Now try the health endpoint to confirm API is ready
              try {
                const healthController = new AbortController()
                const healthTimeoutId = setTimeout(() => healthController.abort(), 3000)

                const healthUrl = `${API_BASE_URL}/health`
                console.log('🏥 Checking health during wakeup at:', healthUrl)

                const healthResponse = await axios.get(healthUrl, {
                  signal: healthController.signal,
                  timeout: 3000
                })
                
                clearTimeout(healthTimeoutId)
                
                if (healthResponse.status === 200) {
                  wakeupSuccess = true
                }
              } catch (healthError) {
                console.log('Root endpoint responding but health endpoint not ready yet...')
                // Root is responding, so server is waking up - this counts as partial success
                // Let it continue trying
              }
              
              // If root endpoint is responding, consider it a success even if health isn't ready yet
              if (!wakeupSuccess) {
                wakeupSuccess = true
              }
            }
          } catch (rootError) {
            console.log('Root endpoint not responding, server still sleeping...')
          }
          
          if (wakeupSuccess) {
            console.log('✅ Backend wake-up successful!')
            this.isAwake = true
            this.isWakingUp = false
            this.notifyStatusUpdate('ready', 'Backend is now ready!')
            
            // Notify all callbacks
            this.wakeupCallbacks.forEach(callback => {
              try {
                callback(true)
              } catch (error) {
                console.error('Error in wakeup callback:', error)
              }
            })
            this.wakeupCallbacks = []
            
            resolve(true)
            return
          }
        } catch (error) {
          console.log(`Wakeup attempt ${attempt} failed:`, error.name)
        }
        
        // Check if we should continue trying
        const elapsed = Date.now() - startTime
        if (elapsed >= this.wakeupTimeout || attempt >= maxAttempts) {
          this.isWakingUp = false
          this.notifyStatusUpdate('error', 'Backend wakeup timed out. Please try again.')
          
          // Notify callbacks of failure
          this.wakeupCallbacks.forEach(callback => {
            try {
              callback(false)
            } catch (error) {
              console.error('Error in wakeup callback:', error)
            }
          })
          this.wakeupCallbacks = []
          
          reject(new Error('Backend wakeup timeout'))
          return
        }
        
        // Wait before next attempt (exponential backoff)
        const delay = Math.min(2000 + (attempt * 1000), 6000)
        setTimeout(wakeupAttempt, delay)
      }
      
      // Start the first attempt
      wakeupAttempt()
    })

    return this.wakeupPromise
  }

  // Initialize - check status and start wakeup if needed
  async initialize() {
    console.log('Initializing backend wakeup service...')
    
    // First check if backend is already awake
    const isAwake = await this.checkBackendStatus()
    
    if (!isAwake) {
      console.log('Backend is sleeping, starting wakeup process...')
      // Start wakeup process in background
      this.wakeupBackend().catch(error => {
        console.error('Background wakeup failed:', error)
      })
    } else {
      console.log('Backend is already awake!')
    }
  }

  // Get current status
  getStatus() {
    if (this.isAwake) return 'ready'
    if (this.isWakingUp) return 'waking-up'
    return 'idle'
  }

  // Reset the service (for testing or retry)
  reset() {
    this.isWakingUp = false
    this.isAwake = false
    this.wakeupPromise = null
    this.wakeupCallbacks = []
    this.statusCallbacks = []
  }
}

// Create singleton instance
let instance = null

class BackendWakeupServiceSingleton {
  static getInstance() {
    if (!instance) {
      instance = new BackendWakeupService()
    }
    return instance
  }
}

// Export both the class and convenience methods
export { BackendWakeupService, BackendWakeupServiceSingleton }
export default BackendWakeupServiceSingleton