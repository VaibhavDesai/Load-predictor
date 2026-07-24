import React from 'react'
import { CurveData } from '../types'

interface MetadataPanelProps {
  data: CurveData
  title?: string
}

export const MetadataPanel: React.FC<MetadataPanelProps> = ({ data, title }) => {
  const meta = data.meta

  return (
    <div className="metadata">
      {title && <h2>{title}</h2>}
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
          <div className="metadata-value">
            {new Date(meta.generated_at).toLocaleString()}
          </div>
        </div>

        <div className="metadata-item">
          <div className="metadata-label">Data Range</div>
          <div className="metadata-value">
            {new Date(meta.data_range_start).toLocaleDateString()} to{' '}
            {new Date(meta.data_range_end).toLocaleDateString()}
          </div>
        </div>

        <div className="metadata-item">
          <div className="metadata-label">Total Samples</div>
          <div className="metadata-value">{meta.total_samples.toLocaleString()}</div>
        </div>

        <div className="metadata-item">
          <div className="metadata-label">Peak</div>
          <div className="metadata-value">{meta.summary.peak.value}</div>
        </div>

        <div className="metadata-item">
          <div className="metadata-label">Average</div>
          <div className="metadata-value">{meta.summary.average.toFixed(1)}</div>
        </div>

        <div className="metadata-item">
          <div className="metadata-label">Std Dev</div>
          <div className="metadata-value">{meta.summary.std_dev.toFixed(1)}</div>
        </div>

        <div className="metadata-item">
          <div className="metadata-label">Median</div>
          <div className="metadata-value">{meta.summary.median.toFixed(1)}</div>
        </div>

        <div className="metadata-item">
          <div className="metadata-label">Min</div>
          <div className="metadata-value">{meta.summary.min.toFixed(1)}</div>
        </div>

        <div className="metadata-item">
          <div className="metadata-label">Max</div>
          <div className="metadata-value">{meta.summary.max.toFixed(1)}</div>
        </div>
      </div>
    </div>
  )
}
