'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('juan@onda.bar')
  const [password, setPassword] = useState('OndaOS2025!Secure')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message || 'Login failed')
        return
      }

      if (data.session) {
        toast.success('Logged in successfully')
        router.push('/')
      }
    } catch (err) {
      const error = err as Error
      toast.error(error.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-onda-surface">
      <div className="w-full max-w-md p-8 bg-white rounded-lg border border-onda-border">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Onda OS</h1>
          <p className="text-slate-600 mt-2">Wine Menu Generator</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-onda-border rounded-lg focus:outline-none focus:ring-2 focus:ring-onda-accent"
              placeholder="juan@onda.bar"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-onda-border rounded-lg focus:outline-none focus:ring-2 focus:ring-onda-accent"
              placeholder="••••••••"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-onda-accent text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-onda-surface rounded-lg text-xs text-slate-600">
          <p className="font-semibold mb-2">Demo Credentials:</p>
          <p>Email: juan@onda.bar</p>
          <p>Password: OndaOS2025!Secure</p>
        </div>

        <p className="text-center text-slate-600 text-sm mt-6">
          Built by{' '}
          <a href="https://www.aikobey.com" className="text-onda-accent hover:underline">
            AI Kobey
          </a>
        </p>
      </div>
    </div>
  )
}
