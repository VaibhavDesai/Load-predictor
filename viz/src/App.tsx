import React, { useState } from 'react'
import { CurveData } from './types'
import { parseCurveJSON } from './utils'
import { CurveChart } from './components/CurveChart'
import { MetadataPanel } from './components/MetadataPanel'

function App() {
  const [curveData, setCurveData] = useState<CurveData | null>(null)
  const [curveData2, setCurveData2] = useState<CurveData | null>(null)
  const [error, setError] = useState<string>('')
  const [mode, setMode] = useState<'single' | 'compare'>('single')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isSecond: boolean = false) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const data = parseCurveJSON(content)

        if (isSecond) {
          setCurveData2(data)
        } else {
          setCurveData(data)
        }
        setError('')
      } catch (err) {
        setError(`Failed to parse JSON: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }
    reader.readAsText(file)
  }

  const handlePasteJSON = (jsonStr: string, isSecond: boolean = false) => {
    try {
      const data = parseCurveJSON(jsonStr)
      if (isSecond) {
        setCurveData2(data)
      } else {
        setCurveData(data)
      }
      setError('')
    } catch (err) {
      setError(`Failed to parse JSON: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Load Predictor - Curve Visualization</h1>
        <p>Interactive visualization and comparison of load prediction curves</p>
      </div>

      <div className="controls">
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

        {error && <div className="error">{error}</div>}

        {mode === 'single' && (
          <div>
            <div className="control-row">
              <div className="control-group">
                <label>Upload Curve JSON</label>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => handleFileChange(e, false)}
                />
              </div>
            </div>

            <div className="control-row">
              <div className="control-group" style={{ flex: 1 }}>
                <label>Or paste JSON</label>
                <textarea
                  placeholder="Paste curve JSON here..."
                  onPaste={(e) => {
                    const text = e.clipboardData.getData('text/plain')
                    handlePasteJSON(text, false)
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {mode === 'compare' && (
          <div>
            <div style={{ marginBottom: '20px', fontSize: '14px', fontWeight: '600' }}>
              Curve 1 (Current)
            </div>
            <div className="control-row">
              <div className="control-group">
                <label>Upload Curve JSON</label>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => handleFileChange(e, false)}
                />
              </div>
            </div>

            <div className="control-row">
              <div className="control-group" style={{ flex: 1 }}>
                <label>Or paste JSON</label>
                <textarea
                  placeholder="Paste current curve JSON..."
                  onPaste={(e) => {
                    const text = e.clipboardData.getData('text/plain')
                    handlePasteJSON(text, false)
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: '30px', marginBottom: '20px', fontSize: '14px', fontWeight: '600' }}>
              Curve 2 (Previous/Baseline)
            </div>
            <div className="control-row">
              <div className="control-group">
                <label>Upload Curve JSON</label>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => handleFileChange(e, true)}
                />
              </div>
            </div>

            <div className="control-row">
              <div className="control-group" style={{ flex: 1 }}>
                <label>Or paste JSON</label>
                <textarea
                  placeholder="Paste baseline curve JSON..."
                  onPaste={(e) => {
                    const text = e.clipboardData.getData('text/plain')
                    handlePasteJSON(text, true)
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {mode === 'single' && curveData && (
        <>
          <MetadataPanel data={curveData} title="Curve Information" />
          <CurveChart data={curveData} title="Meeting Pattern Curve" />
        </>
      )}

      {mode === 'compare' && curveData && curveData2 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <MetadataPanel data={curveData} title="Current Curve" />
              <CurveChart data={curveData} title="Current Curve" />
            </div>
            <div>
              <MetadataPanel data={curveData2} title="Baseline Curve" />
              <CurveChart data={curveData2} title="Baseline Curve" />
            </div>
          </div>
        </>
      )}

      {mode === 'compare' && curveData && !curveData2 && (
        <div className="error">Please load both curves to compare</div>
      )}

      {!curveData && (
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
              ? 'Upload or paste a curve JSON file to get started'
              : 'Upload or paste curve JSON files to compare'}
          </p>
        </div>
      )}
    </div>
  )
}

export default App
