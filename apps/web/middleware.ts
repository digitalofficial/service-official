import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/callback', '/public']
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

  // First try getSession to see if the token can be parsed at all
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  // Then validate with getUser (hits Supabase API)
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isPublicRoute = PUBLIC_ROUTES.some(r => path.startsWith(r))
  const isAuthRoute = AUTH_ROUTES.some(r => path.startsWith(r))

  // Debug logging
  if (!isPublicRoute) {
    const allCookies = request.cookies.getAll().map(c => c.name)
    const sbCookies = allCookies.filter(n => n.includes('sb-') || n.includes('supabase'))
    const chunk0 = request.cookies.get('sb-quonrljpcqjkekedncla-auth-token.0')?.value?.substring(0, 50)
    console.log(`[middleware] ${path}`)
    console.log(`  session: ${session ? 'YES (user: ' + session.user?.id + ')' : 'NO'} | sessionError: ${sessionError?.message ?? 'none'}`)
    console.log(`  user: ${user?.id ?? 'none'} | authError: ${authError?.message ?? 'none'}`)
    console.log(`  sb-cookies: [${sbCookies.join(', ')}] | chunk0: ${chunk0 ?? 'empty'}`)
  }

  // Redirect unauthenticated users to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', path)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
