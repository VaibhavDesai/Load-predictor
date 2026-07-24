import React from 'react'
import { CurveData, ChartPoint, WEEKDAY_NAMES } from '../types'
import { curveToChartPoints, formatTime, formatWeekday, getYAxisDomain } from '../utils'

interface CurveChartProps {
  data: CurveData
  title?: string
}

export const CurveChart: React.FC<CurveChartProps> = ({ data, title }) => {
  const points = curveToChartPoints(data.curves)
  const [yMin, yMax] = getYAxisDomain(points)

  if (points.length === 0) {
    return <div className="error">No data to display</div>
  }

  // Simple SVG chart
  const width = 1200
  const height = 400
  const padding = { top: 40, right: 40, bottom: 60, left: 60 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Scale functions
  const xScale = (x: number) => (x / (7 * 24 * 60)) * chartWidth
  const yScale = (y: number) => chartHeight - ((y - yMin) / (yMax - yMin)) * chartHeight

  // Generate path
  const pathData = points
    .map((p, i) => {
      const x = padding.left + xScale(p.x)
      const y = padding.top + yScale(p.y)
      return i === 0 ? `M${x},${y}` : `L${x},${y}`
    })
    .join(' ')

  // Grid lines for weekdays
  const dayLines = Array.from({ length: 8 }).map((_, i) => {
    const x = padding.left + (i / 7) * chartWidth
    return (
      <line
        key={`grid-${i}`}
        x1={x}
        y1={padding.top}
        x2={x}
        y2={padding.top + chartHeight}
        stroke="#e0e0e0"
        strokeWidth="1"
        strokeDasharray="4,4"
      />
    )
  })

  // Y-axis grid
  const yGridLines = Array.from({ length: 6 }).map((_, i) => {
    const y = padding.top + (i / 5) * chartHeight
    return (
      <line
        key={`y-grid-${i}`}
        x1={padding.left}
        y1={y}
        x2={padding.left + chartWidth}
        y2={y}
        stroke="#e0e0e0"
        strokeWidth="1"
        strokeDasharray="2,2"
      />
    )
  })

  return (
    <div className="chart-container">
      {title && <h2>{title}</h2>}
      <svg width={width} height={height} style={{ border: '1px solid #e0e0e0' }}>
        {/* Grid */}
        {dayLines}
        {yGridLines}

        {/* Axes */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + chartHeight}
          stroke="#000"
          strokeWidth="2"
        />
        <line
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={padding.left + chartWidth}
          y2={padding.top + chartHeight}
          stroke="#000"
          strokeWidth="2"
        />

        {/* Curve line */}
        <path d={pathData} stroke="#0066cc" strokeWidth="2" fill="none" />

        {/* Area under curve */}
        <path
          d={`${pathData} L${padding.left + chartWidth},${padding.top + chartHeight} L${padding.left},${padding.top + chartHeight}`}
          fill="#0066cc"
          fillOpacity="0.1"
        />

        {/* Y-axis labels */}
        {Array.from({ length: 6 }).map((_, i) => {
          const value = yMin + ((yMax - yMin) * i) / 5
          const y = padding.top + ((5 - i) / 5) * chartHeight
          return (
            <text key={`y-label-${i}`} x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="12">
              {Math.round(value)}
            </text>
          )
        })}

        {/* X-axis labels (days) */}
        {WEEKDAY_NAMES.map((day, i) => {
          const x = padding.left + ((i + 0.5) / 7) * chartWidth
          return (
            <text
              key={`x-label-${i}`}
              x={x}
              y={padding.top + chartHeight + 20}
              textAnchor="middle"
              fontSize="12"
            >
              {day}
            </text>
          )
        })}
      </svg>
      <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
        Hover over chart for details (feature: coming soon)
      </p>
    </div>
  )
}
