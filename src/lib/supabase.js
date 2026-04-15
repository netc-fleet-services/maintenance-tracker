import { createClient } from '@supabase/supabase-js'

// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file
// (and as GitHub Actions secrets for the deploy workflow)
const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      ?? 'YOUR_SUPABASE_URL'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
