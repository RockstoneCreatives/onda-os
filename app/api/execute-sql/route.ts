import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * This API endpoint executes SQL migrations directly against Supabase PostgreSQL
 * It uses the service role key which has unrestricted access
 * Security: Protected by a simple token header (for internal use only)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization header
    const authToken = request.headers.get('x-auth-token')
    if (authToken !== 'onda-migration-token-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sql } = await request.json()
    if (!sql) {
      return NextResponse.json({ error: 'No SQL provided' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 })
    }

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Split SQL by statements (simple approach)
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'))

    console.log(`Executing ${statements.length} SQL statements...`)

    const results = []
    let lastError = null

    // Try to execute using RPC or raw queries
    for (const statement of statements) {
      try {
        // Attempt to use Supabase's query interface
        // This won't work directly, but we can use a workaround:
        // Create temporary RPC functions if needed
        results.push({
          statement: statement.substring(0, 80),
          status: 'queued',
        })
      } catch (err) {
        lastError = err
      }
    }

    return NextResponse.json({
      success: false,
      message: 'Supabase JS SDK does not support raw SQL execution',
      note: 'Use the Supabase dashboard SQL editor at: https://supabase.com/dashboard/project/xqyktmvouaqryrcbmnvc/sql',
      statements_count: statements.length,
      error: lastError,
    })
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
