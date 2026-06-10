'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('juan@onda.bar')
  const [password, setPassword] = useState('OndaOS2025!Secure')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('Attempting login...')
      
      // Call auth API directly
      const response = await fetch('https://xqyktmvouaqryrcbmnvc.supabase.co/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxeWt0bXZvdWFxcnlyY2JtbnZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwOTAxMDIsImV4cCI6MjA5NjY2NjEwMn0.UGWfG-gRgb4HifZU-iYJGn1fVeOxlVy6x3fywc_XZo8',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()
      console.log('Auth response:', { status: response.status, hasToken: !!data.access_token })

      if (!response.ok || !data.access_token) {
        setError(data.error_description || 'Login failed. Check your email and password.')
        console.error('Login error:', data)
        return
      }

      // Store token in localStorage
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
      }))

      console.log('Login successful, redirecting...')
      // Redirect to home
      router.push('/')
    } catch (err) {
      const error = err as Error
      console.error('Login exception:', error)
      setError(error.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
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
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              disabled={loading}
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-slate-100 rounded-lg text-xs text-slate-600">
          <p className="font-semibold mb-2">Demo Credentials (Pre-filled):</p>
          <p>Email: juan@onda.bar</p>
          <p>Password: OndaOS2025!Secure</p>
        </div>

        <p className="text-center text-slate-600 text-sm mt-6">
          Built by{' '}
          <a href="https://www.aikobey.com" className="text-blue-600 hover:underline">
            AI Kobey
          </a>
        </p>
      </div>
    </div>
  )
}
