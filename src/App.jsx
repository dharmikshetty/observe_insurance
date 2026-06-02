import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from './supabaseClient'
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
      const { data, error: err, count } = await supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .order('name')
        .range(0, limit - 1)

      if (err) throw err

      setCustomers(data ?? [])
      setCustomersCount(count ?? 0)
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
      const { data, error: err, count } = await supabase
        .from('call_logs')
        .select('*', { count: 'exact' })
        .order('timestamp', { ascending: false })
        .range(0, limit - 1)

      if (err) throw err

      setLogs(data ?? [])
      setLogsCount(count ?? 0)
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
        supabase
          .from('customers')
          .select('*', { count: 'exact' })
          .order('name')
          .range(0, cLimit - 1)
          .then(res => {
            if (res.error) throw res.error
            setCustomers(res.data ?? [])
            setCustomersCount(res.count ?? 0)
          }),
        supabase
          .from('call_logs')
          .select('*', { count: 'exact' })
          .order('timestamp', { ascending: false })
          .range(0, lLimit - 1)
          .then(res => {
            if (res.error) throw res.error
            setLogs(res.data ?? [])
            setLogsCount(res.count ?? 0)
          })
      ])
      setLastSync(new Date())
    } catch (err) {
      console.error('Error refreshing dashboard data:', err)
      setError(err.message || String(err))
    }
  }, [])

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
