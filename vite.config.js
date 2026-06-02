/* global process */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createClient } from '@supabase/supabase-js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const supabaseUrl = env.VITE_SUPABASE_URL
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY

  let supabase
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey)
  }

  const localApiPlugin = () => ({
    name: 'local-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, `http://${req.headers.host}`)

        if (url.pathname === '/api/customers') {
          if (!supabase) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Supabase configuration missing locally' }))
            return
          }
          const limit = parseInt(url.searchParams.get('limit') || '10', 10)
          try {
            const { data, error, count } = await supabase
              .from('customers')
              .select('name, phone_normalized, policy_number, claim_id, claim_status, claim_type, claim_amount, docs_required', { count: 'exact' })
              .order('name')
              .range(0, limit - 1)
            if (error) throw error
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ data, count }))
          } catch (err) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: err.message || String(err) }))
          }
          return
        }

        if (url.pathname === '/api/logs') {
          if (!supabase) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Supabase configuration missing locally' }))
            return
          }
          const limit = parseInt(url.searchParams.get('limit') || '10', 10)
          try {
            const { data, error, count } = await supabase
              .from('call_logs')
              .select('timestamp, caller_name, caller_phone, sentiment, escalated, summary', { count: 'exact' })
              .order('timestamp', { ascending: false })
              .range(0, limit - 1)
            if (error) throw error
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ data, count }))
          } catch (err) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: err.message || String(err) }))
          }
          return
        }

        next()
      })
    }
  })

  return {
    plugins: [react(), localApiPlugin()],
  }
})
