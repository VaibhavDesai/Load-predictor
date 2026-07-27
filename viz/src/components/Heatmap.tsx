import React, { useMemo } from 'react'
import { CurveData, WEEKDAY_NAMES } from '../types'

interface HeatmapProps {
  data: CurveData
}

export const Heatmap: React.FC<HeatmapProps> = ({ data }) => {
  const { heatmapData, min, max } = useMemo(() => {
    let globalMin = Infinity
    let globalMax = -Infinity

    // Create matrix: rows = timeslots (0-47), columns = weekdays (1-7)
    const matrix: number[][] = Array(48)
      .fill(null)
      .map(() => Array(7).fill(0))

    Object.entries(data.curves).forEach(([weekdayStr, slots]) => {
      const weekday = parseInt(weekdayStr)
      Object.entries(slots).forEach(([slotStr, value]) => {
        const slot = parseInt(slotStr)
        const numValue = typeof value === 'number' ? value : 0
        matrix[slot][weekday - 1] = numValue
        globalMin = Math.min(globalMin, numValue)
        globalMax = Math.max(globalMax, numValue)
      })
    })

    return { heatmapData: matrix, min: globalMin, max: globalMax }
  }, [data.curves])

  const getColor = (value: number) => {
    if (value === 0) return '#ffffff'
    const normalized = (value - min) / (max - min)
    // Color scale: light blue (low) → dark blue (high)
    const hue = 210 // blue
    const lightness = 100 - normalized * 60 // 100% (white) to 40% (dark blue)
    return `hsl(${hue}, 100%, ${lightness}%)`
  }

  const intervalMinutes = (data.meta.aggregation_interval || 1800) / 60

  const getTimeLabel = (slot: number) => {
    const minutes = slot * intervalMinutes
    const hour = Math.floor(minutes / 60)
    const minute = minutes % 60
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }

  return (
    <div className="heatmap-container" style={{ padding: '20px', background: '#ffffff', borderRadius: '8px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#333' }}>
        Load Distribution by Time and Day
      </h3>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            borderCollapse: 'collapse',
            fontSize: '12px',
            width: '100%',
          }}
        >
          <thead>
            <tr>
              <th style={{ padding: '8px', textAlign: 'center', fontWeight: 600, color: '#666' }}>Time</th>
              {WEEKDAY_NAMES.map((day) => (
                <th key={day} style={{ padding: '8px', textAlign: 'center', fontWeight: 600, color: '#666' }}>
                  {day.substring(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heatmapData.map((row, slotIndex) => (
              <tr key={slotIndex}>
                <td style={{ padding: '4px 8px', textAlign: 'right', fontSize: '11px', color: '#999' }}>
                  {getTimeLabel(slotIndex)}
                </td>
                {row.map((value, dayIndex) => (
                  <td
                    key={`${slotIndex}-${dayIndex}`}
                    style={{
                      padding: '8px',
                      background: getColor(value),
                      cursor: 'pointer',
                      transition: 'opacity 0.2s',
                      border: '1px solid #e0e0e0',
                      position: 'relative',
                      textAlign: 'center',
                    }}
                    title={`${WEEKDAY_NAMES[dayIndex]} ${getTimeLabel(slotIndex)}: ${Math.round(value)} meetings`}
                    onMouseEnter={(e) => {
                      const elem = e.currentTarget as HTMLElement
                      elem.style.opacity = '0.8'
                      elem.style.boxShadow = '0 0 4px rgba(0, 102, 204, 0.3)'
                    }}
                    onMouseLeave={(e) => {
                      const elem = e.currentTarget as HTMLElement
                      elem.style.opacity = '1'
                      elem.style.boxShadow = 'none'
                    }}
                  >
                    <span style={{ fontSize: '10px', color: value > (min + max) / 2 ? '#fff' : '#666', fontWeight: 500 }}>
                      {Math.round(value)}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '16px', display: 'flex', gap: '16px', alignItems: 'center', fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '20px', height: '20px', background: getColor(min), border: '1px solid #ddd' }}></div>
          <span>Low ({Math.round(min)})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '20px', height: '20px', background: getColor((min + max) / 2), border: '1px solid #ddd' }}></div>
          <span>Medium ({Math.round((min + max) / 2)})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '20px', height: '20px', background: getColor(max), border: '1px solid #ddd' }}></div>
          <span>High ({Math.round(max)})</span>
        </div>
      </div>
    </div>
  )
}
