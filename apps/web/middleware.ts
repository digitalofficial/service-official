import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password', '/auth/callback', '/auth/accept-invite', '/public', '/pay', '/api/pay', '/api/public', '/api/portal', '/api/auth', '/privacy', '/terms']
const AUTH_ROUTES = ['/auth/login', '/auth/register']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  const isPublicRoute = PUBLIC_ROUTES.some(r => path.startsWith(r))
  const isAuthRoute = AUTH_ROUTES.some(r => path.startsWith(r))

  // Allow homepage for unauthenticated users
  if (!user && path === '/') {
    return supabaseResponse
  }

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', path)
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|opengraph-image|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
