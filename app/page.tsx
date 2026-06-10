import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { WineListClient } from '@/components/wine-list-client'

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Fetch all wines
  const { data: wines, error } = await supabase
    .from('wines')
    .select('*')
    .eq('status', 'Active')
    .order('colour_style')
    .order('country')

  if (error) {
    console.error('Error fetching wines:', error)
    return <div>Error loading wines</div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Onda OS</h1>
              <p className="text-slate-600 mt-2">Wine Inventory & Menu Generator</p>
            </div>
            <div className="space-x-4">
              <Link
                href="/menu/new"
                className="inline-block px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
              >
                Create Menu
              </Link>
              <form action="/api/auth/signout" method="POST" className="inline">
                <button
                  type="submit"
                  className="px-6 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900">Wine List</h2>
            <p className="text-slate-600 mt-1">{wines?.length || 0} wines available</p>
          </div>

          <WineListClient initialWines={wines || []} />
        </div>
      </main>
    </div>
  )
}
