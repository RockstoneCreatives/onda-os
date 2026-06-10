import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // For now, allow all requests through
  // Auth will be handled client-side with redirects in page components
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
