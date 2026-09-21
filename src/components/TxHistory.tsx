import type { BrowserProvider } from 'ethers'
import { explorerTxUrl, formatTimestamp, shortenAddress } from '../lib/format'
import { useTxHistory } from '../hooks/useTxHistory'

type Props = {
  provider: BrowserProvider
  account: string
  chainId: bigint | null
}

export function TxHistory({ provider, account, chainId }: Props) {
  const { result, loading, error, fetchHistory } = useTxHistory(
    provider,
    account,
    chainId,
  )

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Account history</p>
          <h2>Recent transactions</h2>
        </div>
        <button type="button" onClick={() => void fetchHistory()} disabled={loading}>
          {loading ? 'Fetching…' : 'Fetch history'}
        </button>
      </div>
      <p className="muted">
        On Sepolia this uses the free Blockscout explorer API (native transfers plus ERC-20
        token transfers). An optional Etherscan key is a fallback. If both explorers fail,
        the app scans the last 40 blocks over RPC — that path still misses older activity.
      </p>

      {result && <p className="banner info">{result.note}</p>}

      {result && result.transactions.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Hash</th>
                <th>From</th>
                <th>To</th>
                <th className="num">Amount</th>
                <th className="num">Block</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {result.transactions.map((tx) => (
                <tr key={`${tx.hash}-${tx.kind}-${tx.tokenSymbol ?? ''}`}>
                  <td>
                    <span className="chip">
                      {tx.kind === 'erc20' ? tx.tokenSymbol || 'ERC-20' : 'ETH'}
                    </span>
                    {tx.isError && <span className="chip warn">failed</span>}
                  </td>
                  <td>
                    <a
                      href={explorerTxUrl(chainId, tx.hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {shortenAddress(tx.hash, 4)}
                    </a>
                  </td>
                  <td>{shortenAddress(tx.from)}</td>
                  <td>{shortenAddress(tx.to)}</td>
                  <td className="num">
                    {Number(tx.valueEth).toLocaleString(undefined, {
                      maximumFractionDigits: 6,
                    })}
                    {tx.kind === 'erc20' && tx.tokenSymbol ? ` ${tx.tokenSymbol}` : ' ETH'}
                  </td>
                  <td className="num">{tx.blockNumber}</td>
                  <td>{formatTimestamp(tx.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && <p className="banner error">{error}</p>}
    </section>
  )
}
