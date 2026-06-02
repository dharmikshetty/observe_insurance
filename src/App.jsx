import { useEffect, useState, useCallback, useRef } from 'react'
import CustomersTable from './components/CustomersTable'
import CallLogsTable from './components/CallLogsTable'
import './index.css'

const REFRESH_INTERVAL = Number(import.meta.env.VITE_SYNC_INTERVAL_MS) || 60_000

export default function App() {
  const [customers, setCustomers] = useState([])
  const [customersLimit, setCustomersLimit] = useState(10)
  const [customersCount, setCustomersCount] = useState(0)
  const [loadingCustomers, setLoadingCustomers] = useState(true)

  const [logs, setLogs]           = useState([])
  const [logsLimit, setLogsLimit] = useState(10)
  const [logsCount, setLogsCount] = useState(0)
  const [loadingLogs, setLoadingLogs] = useState(true)

  const [lastSync, setLastSync]   = useState(null)
  const [error, setError]         = useState(null)

  const customersLoadedRef = useRef(false)
  const logsLoadedRef = useRef(false)

  const fetchCustomers = useCallback(async (limit, isInitial = false) => {
    if (isInitial) setLoadingCustomers(true)
    setError(null)
    try {
      const res = await fetch(`/api/customers?limit=${limit}`)
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || 'Failed to fetch customers')
      }
      const json = await res.json()
      setCustomers(json.data ?? [])
      setCustomersCount(json.count ?? 0)
      setLastSync(new Date())
    } catch (err) {
      console.error('Error fetching customers:', err)
      setError(err.message || String(err))
    } finally {
      setLoadingCustomers(false)
    }
  }, [])

  const fetchLogs = useCallback(async (limit, isInitial = false) => {
    if (isInitial) setLoadingLogs(true)
    setError(null)
    try {
      const res = await fetch(`/api/logs?limit=${limit}`)
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || 'Failed to fetch call logs')
      }
      const json = await res.json()
      setLogs(json.data ?? [])
      setLogsCount(json.count ?? 0)
      setLastSync(new Date())
    } catch (err) {
      console.error('Error fetching call logs:', err)
      setError(err.message || String(err))
    } finally {
      setLoadingLogs(false)
    }
  }, [])

  const fetchAllData = useCallback(async (cLimit, lLimit) => {
    setError(null)
    try {
      await Promise.all([
        fetchCustomers(cLimit, false),
        fetchLogs(lLimit, false)
      ])
    } catch (err) {
      console.error('All data sync failed:', err);
    }
  }, [fetchCustomers, fetchLogs])

  // Sync / initial load of customers when limit changes
  useEffect(() => {
    let active = true;
    const initTimer = setTimeout(() => {
      if (active) {
        const isInitial = !customersLoadedRef.current;
        if (isInitial) {
          customersLoadedRef.current = true;
        }
        fetchCustomers(customersLimit, isInitial);
      }
    }, 0);
    return () => {
      active = false;
      clearTimeout(initTimer);
    };
  }, [customersLimit, fetchCustomers])

  // Sync / initial load of logs when limit changes
  useEffect(() => {
    let active = true;
    const initTimer = setTimeout(() => {
      if (active) {
        const isInitial = !logsLoadedRef.current;
        if (isInitial) {
          logsLoadedRef.current = true;
        }
        fetchLogs(logsLimit, isInitial);
      }
    }, 0);
    return () => {
      active = false;
      clearTimeout(initTimer);
    };
  }, [logsLimit, fetchLogs])

  // Periodic refresh
  useEffect(() => {
    let active = true;
    const intervalId = setInterval(() => {
      if (active) {
        fetchAllData(customersLimit, logsLimit);
      }
    }, REFRESH_INTERVAL);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [customersLimit, logsLimit, fetchAllData])

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
              onClick={() => {
                const rawUrl = import.meta.env.VITE_VOICE_URL;
                if (!rawUrl) return;
                const cleanUrl = rawUrl.replace(/^["'\\%22%27\s]+|["'\\%22%27\s]+$/gi, '');
                window.open(cleanUrl, '_blank', 'noopener,noreferrer');
              }}
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
        <CustomersTable 
          rows={customers} 
          loading={loadingCustomers} 
          totalCount={customersCount}
          onLoadMore={() => setCustomersLimit(prev => prev + 10)}
        />
        <CallLogsTable  
          rows={logs}      
          loading={loadingLogs} 
          totalCount={logsCount}
          onLoadMore={() => setLogsLimit(prev => prev + 10)}
        />
      </div>
    </div>
  )
}
