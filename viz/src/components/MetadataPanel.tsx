import React from 'react'
import { CurveData } from '../types'

interface MetadataPanelProps {
  data: CurveData
  title?: string
}

const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export const MetadataPanel: React.FC<MetadataPanelProps> = ({ data, title }) => {
  const meta = data.meta

  const formatInterval = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h`
  }

  const formatPeakTime = (slot: number, intervalSeconds: number = 1800) => {
    const intervalMinutes = intervalSeconds / 60
    const minuteOfDay = slot * intervalMinutes
    const hours = Math.floor(minuteOfDay / 60)
    const minutes = minuteOfDay % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }

  // Calculate per-weekday stats
  const weekdayStats = Object.entries(data.curves).map(([weekdayStr, slots]) => {
    const weekday = parseInt(weekdayStr)
    const values = Object.values(slots) as number[]
    return {
      weekday,
      name: WEEKDAY_NAMES[weekday - 1],
      peak: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
    }
  })

  const peakWeekday = weekdayStats.reduce((a, b) => (a.peak > b.peak ? a : b))
  const offPeakWeekday = weekdayStats.reduce((a, b) => (a.peak < b.peak ? a : b))

  return (
    <div className="metadata">
      {title && <h2>{title}</h2>}

      {/* Source Info */}
      <div className="metadata-section">
        <h3>Source</h3>
        <div className="metadata-grid">
          <div className="metadata-item">
            <div className="metadata-label">Environment</div>
            <div className="metadata-value">{meta.env}</div>
          </div>
          <div className="metadata-item">
            <div className="metadata-label">Region</div>
            <div className="metadata-value">{meta.region}</div>
          </div>
          <div className="metadata-item">
            <div className="metadata-label">Generated</div>
            <div className="metadata-value" style={{ fontSize: '12px' }}>
              {new Date(meta.generated_at).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Data Period & Processing */}
      <div className="metadata-section">
        <h3>Data Processing</h3>
        <div className="metadata-grid">
          <div className="metadata-item">
            <div className="metadata-label">Data Period</div>
            <div className="metadata-value" style={{ fontSize: '12px' }}>
              {new Date(meta.data_range_start).toLocaleDateString()} to{' '}
              {new Date(meta.data_range_end).toLocaleDateString()}
            </div>
          </div>
          <div className="metadata-item">
            <div className="metadata-label">Total Samples</div>
            <div className="metadata-value">{meta.total_samples.toLocaleString()}</div>
          </div>
          <div className="metadata-item">
            <div className="metadata-label">Aggregation Interval</div>
            <div className="metadata-value">{formatInterval(meta.aggregation_interval || 1800)}</div>
          </div>
          <div className="metadata-item">
            <div className="metadata-label">Aggregation Method</div>
            <div className="metadata-value">{meta.aggregation_method || 'mean'}</div>
          </div>
        </div>
      </div>

      {/* Capacity Planning Stats */}
      <div className="metadata-section">
        <h3>Capacity Planning</h3>
        <div className="metadata-grid">
          <div className="metadata-item">
            <div className="metadata-label">Peak Capacity Needed</div>
            <div className="metadata-value" style={{ color: '#ff6b35', fontWeight: 'bold', fontSize: '24px' }}>
              {meta.summary.peak.value}
            </div>
            <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
              {`${WEEKDAY_NAMES[meta.summary.peak.weekday - 1]} at ${formatPeakTime(meta.summary.peak.slot, meta.aggregation_interval || 1800)}`}
            </div>
          </div>

          <div className="metadata-item">
            <div className="metadata-label">Busiest Day</div>
            <div className="metadata-value" style={{ color: '#0066cc', fontWeight: '600' }}>
              {peakWeekday.name}
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              Peak: {Math.round(peakWeekday.peak)} | Avg: {Math.round(peakWeekday.avg)}
            </div>
          </div>

          <div className="metadata-item">
            <div className="metadata-label">Quietest Day</div>
            <div className="metadata-value" style={{ color: '#999', fontWeight: '600' }}>
              {offPeakWeekday.name}
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              Peak: {Math.round(offPeakWeekday.peak)} | Avg: {Math.round(offPeakWeekday.avg)}
            </div>
          </div>

          <div className="metadata-item">
            <div className="metadata-label">Peak vs Off-Peak</div>
            <div className="metadata-value" style={{ fontWeight: '600' }}>
              {(peakWeekday.peak / offPeakWeekday.peak).toFixed(1)}×
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              {peakWeekday.name} vs {offPeakWeekday.name}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
