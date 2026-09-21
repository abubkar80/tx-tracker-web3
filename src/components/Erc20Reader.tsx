import { useState } from 'react'
import type { BrowserProvider } from 'ethers'
import { SEPOLIA_ERC20_PRESETS } from '../constants/contracts'
import { isSepolia } from '../constants/networks'
import { explorerAddressUrl, formatAmount } from '../lib/format'
import { useErc20Read } from '../hooks/useErc20Read'

type Props = {
  provider: BrowserProvider
  account: string
  chainId: bigint | null
}

export function Erc20Reader({ provider, account, chainId }: Props) {
  const [address, setAddress] = useState<string>(SEPOLIA_ERC20_PRESETS[0].address)
  const { data, loading, error, read } = useErc20Read(provider, account)
  const sepolia = isSepolia(chainId)

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Contract read</p>
          <h2>ERC-20 token</h2>
        </div>
      </div>
      <p className="muted">
        Reads <code>name</code>, <code>symbol</code>, <code>decimals</code>, and{' '}
        <code>balanceOf(your address)</code> on the connected chain. Presets are Sepolia
        WETH and USDC.
      </p>

      {sepolia && (
        <div className="preset-row">
          {SEPOLIA_ERC20_PRESETS.map((token) => (
            <button
              key={token.address}
              type="button"
              className={address === token.address ? undefined : 'secondary'}
              onClick={() => setAddress(token.address)}
            >
              {token.label}
            </button>
          ))}
        </div>
      )}

      <label className="field">
        <span>Contract address</span>
        <input
          value={address}
          onChange={(event) => setAddress(event.target.value.trim())}
          placeholder="0x…"
          spellCheck={false}
        />
      </label>

      <button type="button" onClick={() => void read(address)} disabled={loading}>
        {loading ? 'Reading…' : 'Read token'}
      </button>

      {data && (
        <dl className="stat-grid">
          <div>
            <dt>Token</dt>
            <dd>
              {data.name} ({data.symbol})
            </dd>
          </div>
          <div>
            <dt>Your balance</dt>
            <dd>
              {formatAmount(data.formattedBalance)} {data.symbol}
            </dd>
          </div>
          <div>
            <dt>Decimals</dt>
            <dd>{data.decimals}</dd>
          </div>
          <div>
            <dt>Contract</dt>
            <dd>
              <a
                href={explorerAddressUrl(chainId, data.address)}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on explorer
              </a>
            </dd>
          </div>
        </dl>
      )}

      {error && <p className="banner error">{error}</p>}
    </section>
  )
}
