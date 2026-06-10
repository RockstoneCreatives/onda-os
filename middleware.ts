import { createServerClient, serializeCookieHeader, parseCookieHeader } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get('cookie') ?? '')
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session if needed
  await supabase.auth.getSession()

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protect routes
  const isAuthRoute = request.nextUrl.pathname === '/login'
  const isPublicRoute = request.nextUrl.pathname === '/'

  if (!session && !isAuthRoute) {
    // Redirect to login if not authenticated
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session && isAuthRoute) {
    // Redirect to home if already authenticated and trying to access login
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
