import React from 'react'

interface ExpirationWarningProps {
  timeRemaining: number
  onRefresh?: () => void
  onDismiss?: () => void
  formatTimeRemaining: (ms: number) => string
}

export const ExpirationWarning: React.FC<ExpirationWarningProps> = ({
  timeRemaining,
  onRefresh,
  onDismiss,
  formatTimeRemaining
}) => {
  const isCritical = timeRemaining < 10000 // Less than 10 seconds

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 ${
      isCritical 
        ? 'bg-red-50 border-red-400 text-red-800' 
        : 'bg-yellow-50 border-yellow-400 text-yellow-800'
    }`}>
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
              className={`px-3 py-1 text-xs rounded ${
                isCritical 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-yellow-600 text-white hover:bg-yellow-700'
              } transition-colors`}
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