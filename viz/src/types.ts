export interface CurveMeta {
  generated_at: string
  env: string
  region: string
  data_range_start: string
  data_range_end: string
  total_samples: number
  summary: {
    peak: {
      weekday: number
      slot: number
      value: number
    }
    average: number
    std_dev: number
    min: number
    max: number
    median: number
  }
}

export interface Curves {
  [weekday: string]: {
    [slot: string]: number
  }
}

export interface CurveData {
  meta: CurveMeta
  curves: Curves
}

export interface ChartPoint {
  x: number
  y: number
  slot: number
  weekday: number
}

export const WEEKDAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]
