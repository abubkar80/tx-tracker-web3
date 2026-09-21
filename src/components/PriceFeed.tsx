import { SEPOLIA_ETH_USD_FEED } from '../constants/contracts'
import { explorerAddressUrl, formatTimestamp } from '../lib/format'
import { sepoliaRpcUrl } from '../lib/providers'
import { useEthUsdPrice } from '../hooks/useEthUsdPrice'

export function PriceFeed() {
  const { price, loading, error, refresh } = useEthUsdPrice()
  const usd = price ? Number(price.usd) : null

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Safe read path · no wallet required</p>
          <h2>Sepolia ETH/USD</h2>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={loading}>
          {loading ? 'Reading…' : 'Refresh'}
        </button>
      </div>
      <p className="muted">
        Calls <code>latestRoundData()</code> on the Chainlink aggregator{' '}
        <a
          href={explorerAddressUrl(11155111n, SEPOLIA_ETH_USD_FEED.address)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {SEPOLIA_ETH_USD_FEED.address}
        </a>{' '}
        through a public Sepolia RPC ({sepoliaRpcUrl()}).
      </p>
      {price && (
        <dl className="stat-grid">
          <div>
            <dt>Feed</dt>
            <dd>{price.description}</dd>
          </div>
          <div>
            <dt>ETH price</dt>
            <dd>
              {usd !== null && Number.isFinite(usd)
                ? `$${usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                : `$${price.usd}`}
            </dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>{formatTimestamp(price.updatedAt)}</dd>
          </div>
          <div>
            <dt>Round</dt>
            <dd>{price.roundId}</dd>
          </div>
        </dl>
      )}
      {error && <p className="banner error">{error}</p>}
    </section>
  )
}
