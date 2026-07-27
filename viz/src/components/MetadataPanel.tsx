import React from 'react'
import { CurveData } from '../types'

interface MetadataPanelProps {
  data: CurveData
  title?: string
  isComparison?: boolean
}

const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const StatCard: React.FC<{ label: string; value: string | number; unit?: string; highlight?: boolean }> = ({
  label,
  value,
  unit,
  highlight,
}) => (
  <div
    style={{
      background: highlight ? '#f0f7ff' : '#fafafa',
      border: `1px solid ${highlight ? '#d0e8ff' : '#e0e0e0'}`,
      borderRadius: '8px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    }}
  >
    <div style={{ fontSize: '12px', fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {label}
    </div>
    <div style={{ fontSize: '24px', fontWeight: 700, color: highlight ? '#0066cc' : '#333' }}>
      {value}
      {unit && <span style={{ fontSize: '14px', color: '#666', fontWeight: 500, marginLeft: '4px' }}>{unit}</span>}
    </div>
  </div>
)

export const MetadataPanel: React.FC<MetadataPanelProps> = ({ data, title, isComparison }) => {
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
    <div style={{ padding: '24px', background: '#ffffff', borderRadius: '12px', marginBottom: '24px' }}>
      {title && <h2 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 600, color: '#333' }}>{title}</h2>}

      {/* Source Section */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Source
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <StatCard label="Environment" value={meta.env} />
          <StatCard label="Region" value={meta.region} />
          <StatCard label="Generated" value={new Date(meta.generated_at).toLocaleDateString()} />
        </div>
      </div>

      {/* Data Processing Section */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Data Processing
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <StatCard
            label="Data Period"
            value={`${new Date(meta.data_range_start).toLocaleDateString()} → ${new Date(meta.data_range_end).toLocaleDateString()}`}
          />
          <StatCard label="Total Samples" value={meta.total_samples.toLocaleString()} />
          <StatCard label="Interval" value={formatInterval(meta.aggregation_interval || 1800)} />
          <StatCard label="Aggregation" value={meta.aggregation_method || 'mean'} />
        </div>
      </div>

      {/* Comparison Info */}
      {isComparison && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Comparison Info
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
            Showing stats for primary curve. Toggle legend items in chart to compare patterns.
          </p>
        </div>
      )}

      {/* Capacity Planning Section */}
      {!isComparison && (
        <div>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Capacity Planning
          </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {/* Peak Capacity - Large Card */}
          <div
            style={{
              gridColumn: '1 / 2',
              background: 'linear-gradient(135deg, #ff6b35 0%, #ff8555 100%)',
              borderRadius: '8px',
              padding: '20px',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '140px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 500, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Peak Capacity Needed
            </div>
            <div>
              <div style={{ fontSize: '42px', fontWeight: 700, lineHeight: 1 }}>
                {Math.round(meta.summary.peak.value)}
              </div>
              <div style={{ fontSize: '13px', opacity: 0.85, marginTop: '8px' }}>
                {WEEKDAY_NAMES[meta.summary.peak.weekday - 1]} at{' '}
                {formatPeakTime(meta.summary.peak.slot, meta.aggregation_interval || 1800)}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateRows: 'repeat(2, 1fr)', gap: '16px' }}>
            <StatCard label="Busiest Day" value={peakWeekday.name} highlight={true} />
            <StatCard label="Quietest Day" value={offPeakWeekday.name} />
          </div>

          {/* Detailed Stats */}
          <div style={{ gridColumn: '1 / 3', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div style={{ background: '#fafafa', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px', fontWeight: 500 }}>Busiest Peak</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#0066cc' }}>{Math.round(peakWeekday.peak)}</div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{peakWeekday.name}</div>
            </div>

            <div style={{ background: '#fafafa', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px', fontWeight: 500 }}>Busiest Avg</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#666' }}>{Math.round(peakWeekday.avg)}</div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{peakWeekday.name}</div>
            </div>

            <div style={{ background: '#fafafa', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px', fontWeight: 500 }}>Quietest Peak</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#999' }}>{Math.round(offPeakWeekday.peak)}</div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{offPeakWeekday.name}</div>
            </div>

            <div style={{ background: '#fafafa', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px', fontWeight: 500 }}>Peak vs Off-Peak</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#0066cc' }}>
                {(peakWeekday.peak / offPeakWeekday.peak).toFixed(1)}×
              </div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>ratio</div>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  )
}
