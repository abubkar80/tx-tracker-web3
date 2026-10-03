import { useState } from 'react'
import { parseEther, type BrowserProvider } from 'ethers'
import { isSepolia } from '../constants/networks'
import { explorerTxUrl } from '../lib/format'
import { getErrorMessage, isUserRejected } from '../lib/errors'

type Props = {
  provider: BrowserProvider
  account: string
  chainId: bigint | null
  onSent?: () => Promise<void> | void
}

export function SelfTransfer({ provider, account, chainId, onSent }: Props) {
  const [status, setStatus] = useState<string | null>(null)
  const [hash, setHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const sepolia = isSepolia(chainId)

  const sendZeroToSelf = async () => {
    setError(null)
    setHash(null)
    setStatus(null)
    if (!sepolia) {
      setError('This write path is disabled off Sepolia.')
      return
    }

    setSending(true)
    try {
      const signer = await provider.getSigner()
      const tx = await signer.sendTransaction({
        to: account,
        value: parseEther('0'),
      })
      setHash(tx.hash)
      setStatus('Submitted. Waiting for confirmation…')
      await tx.wait()
      setStatus('Confirmed 0 ETH self-transfer on Sepolia.')
      await onSent?.()
    } catch (err) {
      if (isUserRejected(err)) {
        setError('Transaction was rejected in the wallet.')
      } else {
        setError(getErrorMessage(err))
      }
      setStatus(null)
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Testnet-only write · labeled</p>
          <h2>0 ETH self-transfer</h2>
        </div>
        <span className="chip warn">Sepolia only</span>
      </div>
      <p className="muted">
        Sends a <strong>0 ETH</strong> transaction to your own address. It spends a little
        gas and does not move funds. Use it to generate a tx you can then load in history.
        The button stays disabled on mainnet and other chains.
      </p>
      <button type="button" onClick={() => void sendZeroToSelf()} disabled={!sepolia || sending}>
        {sending ? 'Sending…' : 'Send 0 ETH to myself'}
      </button>
      {status && <p className="banner ok">{status}</p>}
      {hash && (
        <p>
          <a href={explorerTxUrl(chainId, hash)} target="_blank" rel="noopener noreferrer">
            View transaction
          </a>
        </p>
      )}
      {error && <p className="banner error">{error}</p>}
    </section>
  )
}
