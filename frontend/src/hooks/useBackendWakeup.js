import { useState, useEffect, useCallback } from 'react'
import BackendWakeupServiceSingleton from '../utils/backendWakeup'

export const useBackendWakeup = () => {
  const [status, setStatus] = useState('checking')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)

  const wakeupService = BackendWakeupServiceSingleton.getInstance()

  useEffect(() => {
    // Get initial status
    const currentStatus = wakeupService.getStatus()
    setStatus(currentStatus)
  }, [])

  const startWakeup = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setProgress(0)

    try {
      await wakeupService.wakeupBackend({
        onStatusChange: (newStatus) => {
          setStatus(newStatus)
          
          // Update progress based on status
          switch (newStatus) {
            case 'checking':
              setProgress(10)
              break
            case 'waking-up':
              setProgress(50)
              break
            case 'ready':
              setProgress(100)
              setIsLoading(false)
              break
            case 'error':
              setProgress(0)
              setIsLoading(false)
              setError('Failed to wake up backend')
              break
            default:
              break
          }
        }
      })
    } catch (err) {
      setError(err.message)
      setIsLoading(false)
      setProgress(0)
    }
  }, [wakeupService])

  const isReady = status === 'ready'
  const isWakingUp = status === 'waking-up' || status === 'checking'
  const hasError = status === 'error' || error !== null

  return {
    status,
    isLoading,
    error,
    progress,
    isReady,
    isWakingUp,
    hasError,
    startWakeup,
    wakeupService
  }
}

export default useBackendWakeup