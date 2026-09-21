import { useCallback, useEffect, useState } from 'react'
import type { BrowserProvider } from 'ethers'
import {
  fetchAddressHistory,
  type TxHistoryResult,
} from '../lib/txHistory'
import { getErrorMessage } from '../lib/errors'

export function useTxHistory(
  provider: BrowserProvider | null,
  account: string | null,
  chainId: bigint | null,
) {
  const [result, setResult] = useState<TxHistoryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    if (!provider || !account) {
      setError('Connect a wallet first.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const next = await fetchAddressHistory(provider, account, chainId)
      setResult(next)
    } catch (err) {
      setResult(null)
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [account, chainId, provider])

  useEffect(() => {
    if (!provider || !account) {
      setResult(null)
      setError(null)
      return
    }
    void fetchHistory()
  }, [account, fetchHistory, provider])

  return { result, loading, error, fetchHistory }
}
