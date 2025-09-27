import { BackendWakeupService } from '../utils/backendWakeup'

// Test script for backend wake-up service
const testWakeupService = async () => {
  console.log('🧪 Testing Backend Wake-up Service...')
  
  const service = BackendWakeupService.getInstance()
  
  try {
    await service.wakeupBackend({
      onStatusChange: (status) => {
        console.log(`📡 Status: ${status}`)
      }
    })
    
    console.log('✅ Wake-up service test completed successfully!')
  } catch (error) {
    console.error('❌ Wake-up service test failed:', error)
  }
}

// Export for use in development
export { testWakeupService }

// Auto-run if this file is imported directly
if (typeof window !== 'undefined') {
  window.testWakeupService = testWakeupService
  console.log('🔧 Backend wake-up test function available as window.testWakeupService()')
}