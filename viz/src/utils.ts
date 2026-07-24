import { CurveData, Curves, ChartPoint, WEEKDAY_NAMES } from './types'

export function parseCurveJSON(jsonStr: string): CurveData {
  return JSON.parse(jsonStr) as CurveData
}

export function curveToChartPoints(curves: Curves): ChartPoint[] {
  const points: ChartPoint[] = []
  const slotsPerDay = 24 * 60 // 1440 slots per day

  for (const [weekdayStr, slots] of Object.entries(curves)) {
    const weekday = parseInt(weekdayStr)
    for (const [slotStr, value] of Object.entries(slots)) {
      const slot = parseInt(slotStr)
      // X-axis: cumulative minutes from Monday 00:00
      const x = (weekday - 1) * slotsPerDay + slot

      points.push({
        x,
        y: value as number,
        slot,
        weekday,
      })
    }
  }

  return points.sort((a, b) => a.x - b.x)
}

export function formatTime(slot: number): string {
  const hours = Math.floor(slot / 60)
  const minutes = slot % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

export function formatWeekday(weekday: number): string {
  return WEEKDAY_NAMES[weekday - 1] || `Day ${weekday}`
}

export function calculateDifference(
  current: ChartPoint[],
  previous: ChartPoint[]
): { points: ChartPoint[]; percentages: number[] } {
  const percentages: number[] = []
  const points = current.map((point) => {
    const prevPoint = previous.find((p) => p.x === point.x)
    let pct = 0

    if (prevPoint && prevPoint.y > 0) {
      pct = ((point.y - prevPoint.y) / prevPoint.y) * 100
    } else if (prevPoint?.y === 0 && point.y > 0) {
      pct = 100
    }

    percentages.push(pct)
    return point
  })

  return { points, percentages }
}

export function getYAxisDomain(points: ChartPoint[]): [number, number] {
  if (points.length === 0) return [0, 100]

  const values = points.map((p) => p.y)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const padding = (max - min) * 0.1

  return [Math.max(0, min - padding), max + padding]
}

export async function fetchFromGitHub(
  owner: string,
  repo: string,
  path: string,
  ref: string = 'main'
): Promise<string> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(
      `Failed to fetch from GitHub: ${response.status} ${response.statusText}`
    )
  }

  const data = (await response.json()) as { content: string }
  return Buffer.from(data.content, 'base64').toString('utf-8')
}
