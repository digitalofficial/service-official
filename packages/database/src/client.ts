// Server-only exports (uses next/headers)
export { createServerSupabaseClient } from './client-server'

// Re-export browser client for backwards compat in server contexts
export { createClient, createServiceRoleClient } from './client-browser'
