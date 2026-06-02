/* global process */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

let supabase;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey)
}

export default async function handler(req, res) {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase configuration missing on server' })
  }

  const limit = parseInt(req.query.limit || '10', 10)
  if (isNaN(limit) || limit <= 0) {
    return res.status(400).json({ error: 'Invalid limit parameter' })
  }

  try {
    const { data, error, count } = await supabase
      .from('call_logs')
      .select('timestamp, caller_name, caller_phone, sentiment, escalated, summary', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(0, limit - 1)

    if (error) throw error

    return res.status(200).json({ data, count })
  } catch (err) {
    console.error('API Error /api/logs:', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
}
