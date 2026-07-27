import React, { useState, useEffect } from 'react'
import { CurveData } from './types'
import { parseCurveJSON } from './utils'
import { CurveChart } from './components/CurveChart'
import { MetadataPanel } from './components/MetadataPanel'
import { Heatmap } from './components/Heatmap'

function App() {
  const [curveData, setCurveData] = useState<CurveData | null>(null)
  const [curveData2, setCurveData2] = useState<CurveData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [mode, setMode] = useState<'single' | 'compare'>('single')
  const [sourceUrl, setSourceUrl] = useState<string>('')
  const [sourceUrl2, setSourceUrl2] = useState<string>('')

  useEffect(() => {
    const loadCurvesFromUrl = async () => {
      const params = new URLSearchParams(window.location.search)
      const curveUrl = params.get('curve')
      const compareUrl = params.get('compare')
      const withUrl = params.get('with')

      try {
        setLoading(true)
        setError('')

        if (compareUrl && withUrl) {
          // Compare mode
          setMode('compare')
          const [data1, data2] = await Promise.all([
            fetchCurveFromUrl(compareUrl),
            fetchCurveFromUrl(withUrl),
          ])
          setCurveData(data1)
          setCurveData2(data2)
          setSourceUrl(compareUrl)
          setSourceUrl2(withUrl)
        } else if (curveUrl) {
          // Single curve mode
          setMode('single')
          const data = await fetchCurveFromUrl(curveUrl)
          setCurveData(data)
          setSourceUrl(curveUrl)
        } else {
          // Load default curve from main branch
          setMode('single')
          const defaultUrl =
            'https://raw.githubusercontent.com/VaibhavDesai/Load-predictor/main/data/curves/cprod_amer.json'
          try {
            const data = await fetchCurveFromUrl(defaultUrl)
            setCurveData(data)
            setSourceUrl(defaultUrl)
          } catch (err) {
            // Default curve not available, show empty state
            setCurveData(null)
          }
        }
      } catch (err) {
        setError(
          `Failed to load curve: ${err instanceof Error ? err.message : 'Unknown error'}`
        )
        setCurveData(null)
        setCurveData2(null)
      } finally {
        setLoading(false)
      }
    }

    loadCurvesFromUrl()
  }, [])

  const fetchCurveFromUrl = async (url: string): Promise<CurveData> => {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch curve (${response.status} ${response.statusText})`)
    }
    const content = await response.text()
    return parseCurveJSON(content)
  }

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
        <h1>Load Predictor - Curve Visualization</h1>
        <p>Interactive visualization and comparison of load prediction curves</p>
      </div>

      <div className="controls">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div className="tab-container">
            <button
              className={`tab ${mode === 'single' ? 'active' : ''}`}
              onClick={() => setMode('single')}
            >
              Single Curve
            </button>
            <button
              className={`tab ${mode === 'compare' ? 'active' : ''}`}
              onClick={() => setMode('compare')}
            >
              Compare Curves
            </button>
          </div>
          {mode === 'single' && curveData && sourceUrl && (
            <div style={{ fontSize: '13px', color: '#999' }}>
              📊 {curveData.meta.env.toUpperCase()}_{curveData.meta.region.toUpperCase()} {getSourceDisplay(sourceUrl)}
            </div>
          )}
        </div>

        {error && <div className="error">{error}</div>}
        {loading && <div className="loading">Loading curve from GitHub...</div>}
      </div>

      {mode === 'single' && curveData && (
        <>
          <MetadataPanel data={curveData} />
          <div style={{ marginBottom: '24px' }}>
            <CurveChart data={curveData} title="Meeting Pattern Curve" />
          </div>
          <Heatmap data={curveData} />
        </>
      )}

      {mode === 'compare' && curveData && curveData2 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              {sourceUrl && (
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                  {getSourceDisplay(sourceUrl)}
                </div>
              )}
              <MetadataPanel data={curveData} title="Curve 1" />
              <CurveChart data={curveData} title="Curve 1" />
            </div>
            <div>
              {sourceUrl2 && (
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                  {getSourceDisplay(sourceUrl2)}
                </div>
              )}
              <MetadataPanel data={curveData2} title="Curve 2" />
              <CurveChart data={curveData2} title="Curve 2" />
            </div>
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
