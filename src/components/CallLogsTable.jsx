import { useState } from 'react'

function fmtTime(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const SENTIMENT_STYLES = {
  positive: {
    bg: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.25)',
    color: '#34d399',
    icon: '😊'
  },
  neutral: {
    bg: 'rgba(148, 163, 184, 0.1)',
    border: 'rgba(148, 163, 184, 0.25)',
    color: '#94a3b8',
    icon: '😐'
  },
  negative: {
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.25)',
    color: '#f87171',
    icon: '😢'
  }
}

function SentimentBadge({ sentiment }) {
  const style = SENTIMENT_STYLES[sentiment?.toLowerCase()] ?? SENTIMENT_STYLES.neutral
  const label = sentiment ? (sentiment.charAt(0).toUpperCase() + sentiment.slice(1).toLowerCase()) : 'Neutral'

  return (
    <span className="pill-badge" style={{
      background: style.bg,
      borderColor: style.border,
      color: style.color,
      padding: '2px 10px',
      fontSize: '0.75rem'
    }}>
      <span style={{ marginRight: '4px' }}>{style.icon}</span>
      {label}
    </span>
  )
}

function CallLogSummary({ text }) {
  const [expanded, setExpanded] = useState(false)
  if (!text) return '—'
  if (text.length <= 20) return text

  return (
    <span>
      {expanded ? text : `${text.slice(0, 20)}...`}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'none',
          border: 'none',
          color: '#a5b4fc',
          cursor: 'pointer',
          padding: 0,
          marginLeft: '8px',
          fontWeight: 600,
          fontSize: '0.75rem',
          textDecoration: 'underline',
          display: 'inline-block'
        }}
      >
        {expanded ? 'Show less' : 'Read more'}
      </button>
    </span>
  )
}

export default function CallLogsTable({ rows, loading, totalCount, onLoadMore }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>Call Logs</h2>
        <span className="count">{loading && rows.length === 0 ? '…' : totalCount}</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: '15%' }}>Time</th>
              <th style={{ width: '15%' }}>Caller</th>
              <th style={{ width: '15%' }}>Phone</th>
              <th style={{ width: '15%' }}>Sentiment</th>
              <th style={{ width: '10%' }}>Escalated</th>
              <th style={{ width: '30%' }}>Summary</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="empty">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="empty">No calls logged yet.</td></tr>
            ) : rows.map((r, idx) => {
              const hasRealName = r.caller_name && r.caller_name !== 'Unknown' && r.caller_name !== 'TEST'
              const isEscalated = r.escalated

              return (
                <tr key={r.timestamp ? `${r.timestamp}-${idx}` : idx}>
                  <td style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>
                    {fmtTime(r.timestamp)}
                  </td>
                  <td style={{
                    fontWeight: hasRealName ? 600 : 400,
                    color: hasRealName ? '#f1f5f9' : '#64748b'
                  }}>
                    {r.caller_name ?? '—'}
                  </td>
                  <td style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {r.caller_phone && r.caller_phone !== 'Unknown' ? r.caller_phone : '—'}
                  </td>
                  <td>
                    <SentimentBadge sentiment={r.sentiment} />
                  </td>
                  <td>
                    {isEscalated ? (
                      <span className="pill-badge" style={{
                        background: 'rgba(245, 158, 11, 0.1)',
                        borderColor: 'rgba(245, 158, 11, 0.3)',
                        color: '#fb923c',
                        padding: '2px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        boxShadow: '0 0 10px rgba(245, 158, 11, 0.05)'
                      }}>
                        🚨 Yes
                      </span>
                    ) : (
                      <span style={{ color: '#475569', fontSize: '0.8rem' }}>No</span>
                    )}
                  </td>
                  <td style={{
                    color: '#94a3b8',
                    maxWidth: 320,
                    whiteSpace: 'normal',
                    lineHeight: '1.4',
                    fontSize: '0.8rem',
                    padding: '12px 20px'
                  }}>
                    <CallLogSummary text={r.summary} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {rows.length < totalCount && (
        <div className="card-footer">
          <button 
            onClick={onLoadMore} 
            className="load-more-btn" 
            disabled={loading}
          >
            {loading ? 'Loading...' : 'View More'}
          </button>
        </div>
      )}
    </div>
  )
}
