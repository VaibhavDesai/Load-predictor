import React, { useMemo } from 'react'
import Plot from 'react-plotly.js'
import { CurveData, WEEKDAY_NAMES } from '../types'
import { getYAxisDomain } from '../utils'

interface CurveChartProps {
  data: CurveData
  title?: string
}

const COLORS = ['#0066cc', '#00a86b', '#ff6b35', '#f7b801', '#c41e3a', '#8b5fbf', '#ff69b4']

export const CurveChart: React.FC<CurveChartProps> = ({ data, title }) => {
  const { traces, yMin, yMax } = useMemo(() => {
    const traces: any[] = []
    let globalYMin = Infinity
    let globalYMax = -Infinity

    // Determine interval from metadata (default 1800 seconds = 30 minutes)
    const intervalSeconds = data.meta.aggregation_interval || 1800
    const intervalMinutes = intervalSeconds / 60

    // Create one trace per weekday, with x-axis showing full week (0-168 hours)
    Object.entries(data.curves).forEach(([weekdayStr, slots], dayIndex) => {
      const weekday = parseInt(weekdayStr)
      const dayName = WEEKDAY_NAMES[weekday - 1]
      const dayStartHour = (weekday - 1) * 24 // Day 1 starts at 0, Day 2 at 24, etc.
      const x: number[] = []
      const y: number[] = []
      const customData: string[] = []

      // Sort slots numerically
      const sortedSlots = Object.entries(slots).sort(
        ([a], [b]) => parseInt(a) - parseInt(b)
      )

      sortedSlots.forEach(([slotStr, value]) => {
        const slot = parseInt(slotStr)
        const minuteOfDay = slot * intervalMinutes
        const hour = Math.floor(minuteOfDay / 60)
        const minute = minuteOfDay % 60
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`

        // Cumulative hours from start of week
        x.push(dayStartHour + minuteOfDay / 60)
        y.push(value as number)
        customData.push(`${dayName} ${timeStr}`)

        globalYMin = Math.min(globalYMin, value as number)
        globalYMax = Math.max(globalYMax, value as number)
      })

      traces.push({
        x,
        y,
        customdata: customData,
        name: dayName,
        type: 'scatter',
        mode: 'lines',
        line: {
          color: COLORS[dayIndex % COLORS.length],
          width: 2.5,
        },
        fill: 'tozeroy',
        fillcolor: COLORS[dayIndex % COLORS.length] + '1a', // Add transparency
        hovertemplate:
          `<b>%{customdata}</b><br>` +
          'Load: %{y:,.0f}<br>' +
          '<extra></extra>',
        visible: true,
      })
    })

    const padding = (globalYMax - globalYMin) * 0.1
    return {
      traces,
      yMin: Math.max(0, globalYMin - padding),
      yMax: globalYMax + padding,
    }
  }, [data.curves])

  if (traces.length === 0) {
    return <div className="error">No data to display</div>
  }

  const layout = {
    title: title || undefined,
    xaxis: {
      title: 'Day of Week',
      range: [0, 168],
      tickvals: [12, 36, 60, 84, 108, 132, 156],
      ticktext: WEEKDAY_NAMES,
      gridcolor: '#e0e0e0',
    },
    yaxis: {
      title: 'Load (Count)',
      range: [yMin, yMax],
      gridcolor: '#e0e0e0',
    },
    plot_bgcolor: '#fafafa',
    paper_bgcolor: '#ffffff',
    height: 450,
    margin: { l: 60, r: 40, t: 40, b: 60 },
    hovermode: 'x unified',
    legend: {
      orientation: 'h',
      y: -0.15,
      x: 0,
      bgcolor: 'rgba(255, 255, 255, 0.8)',
      bordercolor: '#e0e0e0',
      borderwidth: 1,
    },
  }

  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d'],
    modeBarButtonsToAdd: [
      {
        name: 'Toggle spike lines',
        icon: { width: 500, height: 500, path: 'M0 0L500 0L500 500L0 500Z' },
        click: () => {},
      },
    ],
  }

  return (
    <div className="chart-container">
      <Plot
        data={traces}
        layout={layout}
        config={config}
        style={{ width: '100%' }}
      />
    </div>
  )
}
