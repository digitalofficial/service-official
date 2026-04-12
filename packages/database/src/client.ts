// Server-only exports (uses next/headers)
export { createServerSupabaseClient, createServiceRoleClient } from './client-server'

// Re-export browser client for backwards compat in server contexts
export { createClient } from './client-browser'
