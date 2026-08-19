import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY

console.log('--- DEBUG ENV VARS ---')
console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Found' : 'MISSING')
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Found' : 'MISSING')

if (!supabaseUrl || !supabaseAnonKey) {
    // This might happen during build time or if env vars are missing
    console.error('CRITICAL: Supabase URL or Anon Key is missing. Check your .env file.')
}

export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
)
