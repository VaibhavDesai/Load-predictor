import React, { useState, useEffect } from 'react'
import { CurveData } from './types'
import { parseCurveJSON } from './utils'
import { CurveChart } from './components/CurveChart'
import { MetadataPanel } from './components/MetadataPanel'
import { Heatmap } from './components/Heatmap'
import { ComparisonPanel } from './components/ComparisonPanel'
import { mapCurveIdentifierToUrl } from './utils/curveMapper'

function App() {
  const [curveData, setCurveData] = useState<CurveData | null>(null)
  const [curveData2, setCurveData2] = useState<CurveData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [mode, setMode] = useState<'single' | 'compare'>('single')
  const [sourceUrl, setSourceUrl] = useState<string>('')
  const [sourceUrl2, setSourceUrl2] = useState<string>('')
  const [compareCurves, setCompareCurves] = useState<CurveData[]>([])
  const [comparisonPanelOpen, setComparisonPanelOpen] = useState(false)
  const [comparisonCurveIds, setComparisonCurveIds] = useState<string[]>(['main'])
  const [comparisonError, setComparisonError] = useState<string>('')
  const [comparisonLoading, setComparisonLoading] = useState(false)

  const fetchCurveFromUrl = async (url: string): Promise<CurveData> => {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch curve (${response.status} ${response.statusText})`)
    }
    const content = await response.text()
    return parseCurveJSON(content)
  }

  const loadComparisonCurves = async (curveIds: string[]) => {
    const filledIds = curveIds.filter((id) => id.length > 0)

    if (filledIds.length < 2) {
      setComparisonError('Add at least 2 curves to compare')
      return
    }

    setComparisonLoading(true)
    setComparisonError('')

    try {
      if (!curveData) {
        throw new Error('Load a single curve first')
      }

      const env = curveData.meta.env
      const region = curveData.meta.region

      const urls = filledIds.map((id) => {
        const url = mapCurveIdentifierToUrl(id, env, region)
        return { id, url }
      })

      const fetchPromises = urls.map((u) =>
        fetchCurveFromUrl(u.url).catch((err) => {
          throw new Error(`Failed to load ${u.id}: ${err.message}`)
        })
      )

      const curves = await Promise.all(fetchPromises)
      setCompareCurves(curves)
      setMode('compare')
      setComparisonPanelOpen(false)

      const curveParam = filledIds.join(',')
      window.history.replaceState(null, '', `?curves=${curveParam}`)
    } catch (err) {
      setComparisonError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setComparisonLoading(false)
    }
  }

  useEffect(() => {
    const loadCurvesFromUrl = async () => {
      const params = new URLSearchParams(window.location.search)
      const curveUrl = params.get('curve')
      const curvesParam = params.get('curves')

      try {
        setLoading(true)
        setError('')

        if (curvesParam) {
          const ids = curvesParam.split(',')
          setComparisonCurveIds(ids)

          if (!curveData) {
            const mainUrl =
              'https://raw.githubusercontent.com/VaibhavDesai/Load-predictor/main/data/curves/cprod_amer.json'
            const data = await fetchCurveFromUrl(mainUrl)
            setCurveData(data)
          }

          await loadComparisonCurves(ids)
        } else if (curveUrl) {
          setMode('single')
          const data = await fetchCurveFromUrl(curveUrl)
          setCurveData(data)
          setSourceUrl(curveUrl)
        } else {
          setMode('single')
          const defaultUrl =
            'https://raw.githubusercontent.com/VaibhavDesai/Load-predictor/main/data/curves/cprod_amer.json'
          try {
            const data = await fetchCurveFromUrl(defaultUrl)
            setCurveData(data)
            setSourceUrl(defaultUrl)
          } catch (err) {
            setCurveData(null)
          }
        }
      } catch (err) {
        setError(
          `Failed to load curve: ${err instanceof Error ? err.message : 'Unknown error'}`
        )
        setCurveData(null)
        setCompareCurves([])
      } finally {
        setLoading(false)
      }
    }

    loadCurvesFromUrl()
  }, [])

  const getSourceDisplay = (url: string): string => {
    if (!url) return ''
    // Extract branch name from GitHub raw URL
    // Format: https://raw.githubusercontent.com/VaibhavDesai/Load-predictor/BRANCH/data/curves/...
    try {
      const urlObj = new URL(url)
      const parts = urlObj.pathname.split('/')
      const branchIndex = parts.findIndex((p) => p === 'Load-predictor') + 1
      return branchIndex > 0 && parts[branchIndex] ? `from branch: ${parts[branchIndex]}` : ''
    } catch {
      return ''
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1 style={{ color: '#000', fontWeight: 800, fontSize: '32px' }}>Load Predictor - Curve Visualization</h1>
        <p>Interactive visualization and comparison of load prediction curves</p>
      </div>

      <div className="controls">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="tab-container">
            <button
              className={`tab ${mode === 'single' ? 'active' : ''}`}
              onClick={() => {
                setMode('single')
                window.history.replaceState(null, '', window.location.pathname)
              }}
            >
              Single Curve
            </button>
            {mode === 'compare' && (
              <button
                className={`tab ${mode === 'compare' ? 'active' : ''}`}
                onClick={() => {}}
                style={{ cursor: 'default' }}
              >
                Compare ({compareCurves.length})
              </button>
            )}
          </div>
          {mode === 'single' && (
            <button
              onClick={() => setComparisonPanelOpen(true)}
              style={{
                padding: '8px 16px',
                background: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Compare
            </button>
          )}
        </div>

        {error && <div className="error">{error}</div>}
        {loading && <div className="loading">Loading curve from GitHub...</div>}
      </div>

      <ComparisonPanel
        isOpen={comparisonPanelOpen}
        onClose={() => setComparisonPanelOpen(false)}
        curves={comparisonCurveIds}
        onCurvesChange={setComparisonCurveIds}
        isLoading={comparisonLoading}
        error={comparisonError}
        onCompare={loadComparisonCurves}
      />

      {mode === 'single' && curveData && (
        <>
          {sourceUrl && (
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '16px' }}>
              📊 {curveData.meta.env.toUpperCase()}_{curveData.meta.region.toUpperCase()} {getSourceDisplay(sourceUrl)}
            </div>
          )}
          <MetadataPanel data={curveData} />
          <div style={{ marginBottom: '24px' }}>
            <CurveChart data={curveData} />
          </div>
          <Heatmap data={curveData} />
        </>
      )}

      {mode === 'compare' && compareCurves.length > 0 && curveData && (
        <>
          <div style={{ fontSize: '12px', color: '#999', marginBottom: '16px' }}>
            📊 Comparing {compareCurves.length} curves
          </div>
          <MetadataPanel data={curveData} title="Primary Curve" isComparison={true} />
          <div style={{ marginBottom: '24px' }}>
            <CurveChart data={compareCurves} isComparison={true} />
          </div>
        </>
      )}

      {!loading && !curveData && (
        <div
          style={{
            background: 'white',
            padding: '40px',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#999',
          }}
        >
          <p style={{ fontSize: '18px', marginBottom: '10px' }}>
            {mode === 'single'
              ? 'No curve data found. Use a URL parameter to load a curve.'
              : 'No curve data found. Use URL parameters to compare curves.'}
          </p>
          <p style={{ fontSize: '14px', color: '#ccc' }}>
            Example: ?curve=https://raw.githubusercontent.com/VaibhavDesai/Load-predictor/main/data/curves/cprod_amer.json
          </p>
        </div>
      )}
    </div>
  )
}

export default App
