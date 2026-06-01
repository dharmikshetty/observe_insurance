import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabaseClient'
import CustomersTable from './components/CustomersTable'
import CallLogsTable from './components/CallLogsTable'
import './index.css'

const REFRESH_INTERVAL = Number(import.meta.env.VITE_SYNC_INTERVAL_MS) || 60_000

export default function App() {
  const [customers, setCustomers] = useState([])
  const [logs, setLogs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [lastSync, setLastSync]   = useState(null)
  const [error, setError]         = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [customersRes, logsRes] = await Promise.all([
        supabase.from('customers').select('*').order('name'),
        supabase
          .from('call_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(50)
      ])

      if (customersRes.error) throw customersRes.error
      if (logsRes.error) throw logsRes.error

      setCustomers(customersRes.data ?? [])
      setLogs(logsRes.data ?? [])
      setLastSync(new Date())
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, REFRESH_INTERVAL)
    return () => clearInterval(id)
  }, [fetchData])

  return (
    <div className="app">
      <header>
        <div className="header-left">
          <h1>Observe Insurance</h1>
          <span className="badge">Live Dashboard</span>
        </div>
        <div className="header-right">
          {import.meta.env.VITE_VOICE_URL && (
            <button 
              onClick={() => window.open(import.meta.env.VITE_VOICE_URL, '_blank', 'noopener,noreferrer')}
              className="voice-btn"
              style={{ marginRight: '16px' }}
            >
              📞 Start Call
            </button>
          )}
          <div className="live-dot-container">
            <div className="live-dot-pulse" />
            <div className="live-dot" />
          </div>
          <span className="sync-text">
            {lastSync ? `Synced ${lastSync.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Syncing…'}
          </span>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <span>⚠️</span>
          <span><strong>Database error:</strong> {error}</span>
        </div>
      )}

      <div className="grid">
        <CustomersTable rows={customers} loading={loading} />
        <CallLogsTable  rows={logs}      loading={loading} />
      </div>
    </div>
  )
}
