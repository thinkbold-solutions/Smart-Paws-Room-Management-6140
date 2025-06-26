import { createClient } from '@supabase/supabase-js'

// Your Supabase credentials
const SUPABASE_URL = 'https://rkklxvzpzuqoaygsahbs.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJra2x4dnpwenVxb2F5Z3NhaGJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NDg2OTUsImV4cCI6MjA2MTEyNDY5NX0.ZuUNCkYQhFtaX2tbCS0eYjFV9cFh3QlzGvrnHX8bt_c'

// Create and export the Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})

export default supabase
export { supabase as supabaseClient }