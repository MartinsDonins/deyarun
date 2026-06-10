import { useState, useEffect, useCallback } from 'react'
import { getAuthToken } from '../../utils/auth'

// Admin-only EveryPay payment diagnostics panel.
// - Loads configuration (no secrets) on mount
// - "Test connection" verifies authenticated connectivity to the gateway
// - "Test payment" creates a real 0.10 EUR one-off payment and surfaces the
//   FULL EveryPay error so admins can see why production payment creation fails.

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'

interface Diagnostics {
  configured: boolean
  environment: string
  baseURL: string
  effectiveApiBase?: string
  accountName: string | null
  apiUser: string | null
  warnings?: string[]
  env: Record<string, boolean>
}

type ResultState = { type: 'connection' | 'payment'; ok: boolean; data: unknown } | null

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getAuthToken()}`,
})

export default function PaymentDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null)
  const [loadingDiag, setLoadingDiag] = useState(false)
  const [busy, setBusy] = useState<null | 'connection' | 'payment'>(null)
  const [result, setResult] = useState<ResultState>(null)
  const [error, setError] = useState<string | null>(null)

  const loadDiagnostics = useCallback(async () => {
    setLoadingDiag(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/admin/payment/diagnostics`, { headers: authHeaders() })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`)
      setDiagnostics(json.diagnostics)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Neizdevās ielādēt konfigurāciju')
    } finally {
      setLoadingDiag(false)
    }
  }, [])

  useEffect(() => {
    loadDiagnostics()
  }, [loadDiagnostics])

  const runTestConnection = async () => {
    setBusy('connection')
    setResult(null)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/admin/payment/test-connection`, {
        method: 'POST',
        headers: authHeaders(),
      })
      const json = await res.json()
      setResult({ type: 'connection', ok: !!json.success, data: json.result ?? json })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Savienojuma pārbaude neizdevās')
    } finally {
      setBusy(null)
    }
  }

  const runTestPayment = async () => {
    setBusy('payment')
    setResult(null)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/admin/payment/test-payment`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ amountCents: 10 }),
      })
      const json = await res.json()
      setResult({ type: 'payment', ok: !!json.success, data: json.result ?? json })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Testa maksājums neizdevās')
    } finally {
      setBusy(null)
    }
  }

  const isProd = diagnostics?.environment === 'production'

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            💳 Maksājumu diagnostika (EveryPay)
          </h2>
          <p className="text-sm text-gray-400">Tikai administratoriem — pārbauda savienojumu un maksājuma izveidi.</p>
        </div>
        <button
          onClick={loadDiagnostics}
          disabled={loadingDiag}
          className="px-3 py-1.5 text-sm bg-surface border border-gray-700 rounded-lg text-white hover:border-coral disabled:opacity-50"
        >
          {loadingDiag ? 'Ielādē…' : '↻ Atjaunot'}
        </button>
      </div>

      {/* Configuration summary */}
      {diagnostics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="bg-surface border border-gray-700 rounded-lg p-3">
            <div className="text-xs text-gray-400">Vide</div>
            <div className={`font-medium ${isProd ? 'text-green-300' : 'text-yellow-300'}`}>
              {isProd ? 'PRODUCTION' : 'TEST / DEMO'}
            </div>
            <div className="text-xs text-gray-500 mt-1 break-all">{diagnostics.baseURL}</div>
            {diagnostics.effectiveApiBase && (
              <div className="text-xs text-gray-500 mt-1 break-all">
                → {diagnostics.effectiveApiBase}/payments/oneoff
              </div>
            )}
          </div>
          <div className="bg-surface border border-gray-700 rounded-lg p-3">
            <div className="text-xs text-gray-400">Konts / Lietotājs</div>
            <div className="font-medium text-white">{diagnostics.accountName || '—'}</div>
            <div className="text-xs text-gray-500 mt-1">api_user: {diagnostics.apiUser || '—'}</div>
          </div>
          <div className="bg-surface border border-gray-700 rounded-lg p-3 sm:col-span-2">
            <div className="text-xs text-gray-400 mb-1">Vides mainīgie</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(diagnostics.env).map(([key, present]) => (
                <span
                  key={key}
                  className={`px-2 py-1 text-xs rounded border ${
                    present
                      ? 'bg-green-900/30 text-green-300 border-green-700'
                      : 'bg-red-900/30 text-red-300 border-red-700'
                  }`}
                >
                  {present ? '✓' : '✗'} {key}
                </span>
              ))}
            </div>
            {!diagnostics.configured && (
              <div className="text-xs text-red-300 mt-2">
                ⚠️ Konfigurācija nepilnīga — iztrūkst kāds no obligātajiem mainīgajiem.
              </div>
            )}
            {diagnostics.warnings?.map((w, i) => (
              <div key={i} className="text-xs text-yellow-300 mt-2">
                ⚠️ {w}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={runTestConnection}
          disabled={busy !== null}
          className="px-4 py-2 bg-blue-900/30 text-blue-300 border border-blue-700 rounded-lg hover:bg-blue-800/50 disabled:opacity-50"
        >
          {busy === 'connection' ? 'Pārbauda…' : '🔌 Pārbaudīt savienojumu'}
        </button>
        <button
          onClick={runTestPayment}
          disabled={busy !== null}
          className="px-4 py-2 bg-coral/20 text-coral border border-coral rounded-lg hover:bg-coral/30 disabled:opacity-50"
        >
          {busy === 'payment' ? 'Veido…' : '💶 Inicializēt testa maksājumu (0.10 EUR)'}
        </button>
      </div>

      {error && (
        <div className="mt-4 bg-red-900/30 text-red-300 border border-red-700 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-4">
          <div
            className={`flex items-center gap-2 mb-2 font-medium ${
              result.ok ? 'text-green-300' : 'text-red-300'
            }`}
          >
            <span>{result.ok ? '✅' : '❌'}</span>
            <span>
              {result.type === 'connection' ? 'Savienojuma rezultāts' : 'Testa maksājuma rezultāts'}:{' '}
              {result.ok ? 'veiksmīgi' : 'kļūda'}
            </span>
          </div>

          {/* Quick payment link if available */}
          {result.type === 'payment' &&
            result.ok &&
            typeof result.data === 'object' &&
            result.data !== null &&
            'paymentLink' in (result.data as Record<string, unknown>) && (
              <a
                href={String((result.data as Record<string, unknown>).paymentLink)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mb-2 text-coral underline text-sm break-all"
              >
                Atvērt maksājuma lapu →
              </a>
            )}

          <pre className="bg-black/40 border border-gray-700 rounded-lg p-3 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap break-words">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
