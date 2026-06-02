const STATUS_STYLES = {
  'Approved': {
    bg: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.25)',
    color: '#34d399',
    dot: '#10b981'
  },
  'Under Review': {
    bg: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.25)',
    color: '#60a5fa',
    dot: '#3b82f6'
  },
  'Denied': {
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.25)',
    color: '#f87171',
    dot: '#ef4444'
  },
  'Pending Documentation': {
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.25)',
    color: '#fbbf24',
    dot: '#f59e0b'
  },
  'Closed': {
    bg: 'rgba(107, 114, 128, 0.1)',
    border: 'rgba(107, 114, 128, 0.25)',
    color: '#9ca3af',
    dot: '#6b7280'
  }
}

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES['Closed']
  return (
    <span className="pill-badge" style={{
      background: style.bg,
      borderColor: style.border,
      color: style.color
    }}>
      <span className="status-dot" style={{ background: style.dot }} />
      {status ?? '—'}
    </span>
  )
}

export default function CustomersTable({ rows, loading, totalCount, onLoadMore }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>Customers &amp; Claims</h2>
        <span className="count">{loading && rows.length === 0 ? '…' : totalCount}</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Policy</th>
              <th>Claim ID</th>
              <th>Status</th>
              <th>Type</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'center' }}>Docs Required</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="empty">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="empty">No customers found.</td></tr>
            ) : rows.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{r.name}</td>
                <td style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.phone_normalized}</td>
                <td style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>{r.policy_number}</td>
                <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{r.claim_id ?? '—'}</td>
                <td><StatusBadge status={r.claim_status} /></td>
                <td>
                  <span style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    color: '#94a3b8'
                  }}>
                    {r.claim_type ?? '—'}
                  </span>
                </td>
                <td style={{
                  textAlign: 'right',
                  fontWeight: 600,
                  color: r.claim_amount != null ? '#f1f5f9' : '#475569'
                }}>
                  {r.claim_amount != null ? `$${Number(r.claim_amount).toLocaleString()}` : '—'}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {r.docs_required ? (
                    <span style={{
                      color: '#fb923c',
                      background: 'rgba(251, 146, 60, 0.1)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      ⚠ Required
                    </span>
                  ) : (
                    <span style={{ color: '#475569', fontSize: '0.8rem' }}>None</span>
                  )}
                </td>
              </tr>
            ))}
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
