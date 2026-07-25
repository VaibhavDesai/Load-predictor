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

  const formatPeakTime = (minuteOfDay: number) => {
    const hours = Math.floor(minuteOfDay / 60)
    const minutes = minuteOfDay % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }

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

      {/* Statistics */}
      <div className="metadata-section">
        <h3>Load Statistics</h3>
        <div className="metadata-grid">
          <div className="metadata-item">
            <div className="metadata-label">Peak Load</div>
            <div className="metadata-value" style={{ color: '#ff6b35', fontWeight: 'bold' }}>
              {meta.summary.peak.value}
            </div>
            <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
              {`${WEEKDAY_NAMES[meta.summary.peak.weekday - 1]} at ${formatPeakTime(meta.summary.peak.slot)}`}
            </div>
          </div>

          <div className="metadata-item">
            <div className="metadata-label">Average Load</div>
            <div className="metadata-value">{meta.summary.average.toFixed(1)}</div>
            <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>mean across all slots</div>
          </div>

          <div className="metadata-item">
            <div className="metadata-label">Median Load</div>
            <div className="metadata-value">{meta.summary.median.toFixed(1)}</div>
            <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>50th percentile</div>
          </div>

          <div className="metadata-item">
            <div className="metadata-label">Std Dev</div>
            <div className="metadata-value">{meta.summary.std_dev.toFixed(1)}</div>
            <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>load variability</div>
          </div>

          <div className="metadata-item">
            <div className="metadata-label">Min Load</div>
            <div className="metadata-value" style={{ color: '#999' }}>{meta.summary.min.toFixed(1)}</div>
          </div>

          <div className="metadata-item">
            <div className="metadata-label">Max Load</div>
            <div className="metadata-value" style={{ color: '#ff6b35' }}>{meta.summary.max.toFixed(1)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
