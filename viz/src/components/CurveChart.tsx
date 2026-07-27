import React, { useMemo } from 'react'
import Plot from 'react-plotly.js'
import { CurveData, WEEKDAY_NAMES } from '../types'

interface CurveChartProps {
  data: CurveData | CurveData[]
  title?: string
  isComparison?: boolean
}

interface PlotlyTrace {
  x: number[]
  y: number[]
  customdata: string[]
  name: string
  type: 'scatter'
  mode: 'lines'
  line: { color: string; width: number }
  fill: 'tozeroy'
  fillcolor: string
  hovertemplate: string
  visible: boolean
}

const COLORS = ['#0066cc', '#00a86b', '#ff6b35', '#f7b801', '#c41e3a', '#8b5fbf', '#ff69b4']

export const CurveChart: React.FC<CurveChartProps> = ({ data, title, isComparison }) => {
  const { traces, yMin, yMax } = useMemo(() => {
    const traces: PlotlyTrace[] = []
    let globalYMin = Infinity
    let globalYMax = -Infinity

    const curveArray = Array.isArray(data) ? data : [data]
    if (curveArray.length === 0) {
      return { traces: [], yMin: 0, yMax: 100 }
    }
    const intervalSeconds = curveArray[0].meta.aggregation_interval || 1800
    const intervalMinutes = intervalSeconds / 60

    curveArray.forEach((curveData, curveIndex) => {
      Object.entries(curveData.curves).forEach(([weekdayStr, slots], dayIndex) => {
        const weekday = parseInt(weekdayStr)
        const dayName = WEEKDAY_NAMES[weekday - 1]
        const x: number[] = []
        const y: number[] = []
        const customData: string[] = []

        const sortedSlots = Object.entries(slots).sort(
          ([a], [b]) => parseInt(a) - parseInt(b)
        )

        sortedSlots.forEach(([slotStr, value]) => {
          const slot = parseInt(slotStr)
          const minuteOfDay = slot * intervalMinutes
          const hour = Math.floor(minuteOfDay / 60)
          const minute = minuteOfDay % 60
          const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`

          x.push(slot)
          y.push(value as number)

          const curveLabel =
            curveArray.length > 1
              ? `${curveData.meta.env.toUpperCase()}_${curveData.meta.region.toUpperCase()}`
              : dayName
          customData.push(
            curveArray.length > 1 ? `${curveLabel} ${dayName} ${timeStr}` : `${dayName} ${timeStr}`
          )

          globalYMin = Math.min(globalYMin, value as number)
          globalYMax = Math.max(globalYMax, value as number)
        })

        let color: string
        if (curveArray.length > 1) {
          color = COLORS[curveIndex % COLORS.length]
        } else {
          color = COLORS[dayIndex % COLORS.length]
        }

        traces.push({
          x,
          y,
          customdata: customData,
          name:
            curveArray.length > 1
              ? `${curveData.meta.env.toUpperCase()}_${curveData.meta.region.toUpperCase()}`
              : dayName,
          type: 'scatter',
          mode: 'lines',
          line: {
            color: color,
            width: 2.5,
          },
          fill: 'tozeroy',
          fillcolor: color + '1a',
          hovertemplate:
            `<b>%{customdata}</b><br>` + 'Load: %{y:,.0f}<br>' + '<extra></extra>',
          visible: true,
        })
      })
    })

    const padding = (globalYMax - globalYMin) * 0.1
    return {
      traces,
      yMin: Math.max(0, globalYMin - padding),
      yMax: globalYMax + padding,
    }
  }, [data])

  if (traces.length === 0) {
    return <div className="error">No data to display</div>
  }

  const layout = {
    title: title || undefined,
    xaxis: {
      title: 'Timeslot (30-min intervals)',
      range: [0, 47],
      gridcolor: '#e0e0e0',
    },
    yaxis: {
      title: 'Load (Count)',
      range: [yMin, yMax],
      gridcolor: '#e0e0e0',
    },
    plot_bgcolor: '#fafafa',
    paper_bgcolor: '#ffffff',
    height: 400,
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
