import React, { useState, useEffect } from 'react'

interface ComparisonPanelProps {
  isOpen: boolean
  onClose: () => void
  curves: string[]
  onCurvesChange: (curves: string[]) => void
  isLoading: boolean
  error: string | null
  onCompare: (curves: string[]) => Promise<void>
}

export const ComparisonPanel: React.FC<ComparisonPanelProps> = ({
  isOpen,
  onClose,
  curves,
  onCurvesChange,
  isLoading,
  error,
  onCompare,
}) => {
  const [localCurves, setLocalCurves] = useState<string[]>(curves)

  // Sync localCurves with curves prop when isOpen changes or curves prop changes
  useEffect(() => {
    setLocalCurves(curves)
  }, [curves, isOpen])

  if (!isOpen) {
    return null
  }

  const handleInputChange = (index: number, value: string) => {
    const updated = [...localCurves]
    updated[index] = value.toLowerCase().trim()
    setLocalCurves(updated)
  }

  const handleClearInput = (index: number) => {
    const updated = [...localCurves]
    updated[index] = ''
    setLocalCurves(updated)
  }

  const handleDone = async () => {
    onCurvesChange(localCurves)
    await onCompare(localCurves)
  }

  const getPlaceholder = (index: number): string => {
    return index === 0 ? 'main' : `PR-${123 + index}`
  }

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 998,
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: '320px',
          backgroundColor: '#ffffff',
          boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.15)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#333' }}>Compare Curves</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#999',
              padding: '0 8px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '20px',
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Error Message */}
          {error && (
            <div
              style={{
                backgroundColor: '#ffe6e6',
                color: '#c41e3a',
                padding: '12px',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          {/* Loading Message */}
          {isLoading && (
            <div
              style={{
                backgroundColor: '#e6f3ff',
                color: '#0066cc',
                padding: '12px',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              Loading curves...
            </div>
          )}

          {/* Curve Input Fields */}
          {localCurves.map((curve, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>
                Curve {index + 1}
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={curve}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  placeholder={getPlaceholder(index)}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    color: '#333',
                  }}
                />
                {curve && (
                  <button
                    onClick={() => handleClearInput(index)}
                    disabled={isLoading}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      fontSize: '20px',
                      color: '#999',
                      padding: '4px 8px',
                      lineHeight: 1,
                      opacity: isLoading ? 0.5 : 1,
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer with Done Button */}
        <div
          style={{
            padding: '20px',
            borderTop: '1px solid #eee',
            display: 'flex',
            gap: '12px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: '#f5f5f5',
              color: '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleDone}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            Done
          </button>
        </div>
      </div>
    </>
  )
}
