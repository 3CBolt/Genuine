import React from 'react'

interface ExpirationWarningProps {
  timeRemaining: number
  onRefresh?: () => void
  onDismiss?: () => void
  formatTimeRemaining: (ms: number) => string
  theme?: 'light' | 'dark'
}

export const ExpirationWarning: React.FC<ExpirationWarningProps> = ({
  timeRemaining,
  onRefresh,
  onDismiss,
  formatTimeRemaining,
  theme = 'light'
}) => {
  const isCritical = timeRemaining < 10000 // Less than 10 seconds

  // Theme-based styling
  const getWarningStyles = () => {
    if (theme === 'dark') {
      return {
        container: isCritical 
          ? 'bg-red-900/20 border-red-500 text-red-200' 
          : 'bg-yellow-900/20 border-yellow-500 text-yellow-200',
        button: isCritical 
          ? 'bg-red-600 text-white hover:bg-red-700' 
          : 'bg-yellow-600 text-white hover:bg-yellow-700'
      }
    }
    return {
      container: isCritical 
        ? 'bg-red-50 border-red-400 text-red-800' 
        : 'bg-yellow-50 border-yellow-400 text-yellow-800',
      button: isCritical 
        ? 'bg-red-600 text-white hover:bg-red-700' 
        : 'bg-yellow-600 text-white hover:bg-yellow-700'
    }
  }

  const styles = getWarningStyles()

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 ${styles.container}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            isCritical ? 'bg-red-400' : 'bg-yellow-400'
          } animate-pulse`} />
          <div>
            <div className="font-medium">
              {isCritical ? 'Token Expiring Soon!' : 'Token Expiring Soon'}
            </div>
            <div className="text-sm opacity-75">
              Expires in {formatTimeRemaining(timeRemaining)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className={`px-3 py-1 text-xs rounded ${styles.button} transition-colors`}
            >
              Refresh
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-xs opacity-60 hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  )
} 