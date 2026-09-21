import { isSepolia, networkLabel } from '../constants/networks'
import { explorerAddressUrl, formatAmount, shortenAddress } from '../lib/format'
import type { WalletState } from '../hooks/useWallet'

type Props = {
  wallet: WalletState
}

export function WalletPanel({ wallet }: Props) {
  const onSepolia = isSepolia(wallet.chainId)

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">EIP-1193 wallet</p>
          <h2>Wallet</h2>
        </div>
        {wallet.account ? (
          <button type="button" className="secondary" onClick={wallet.disconnect}>
            Disconnect
          </button>
        ) : (
          <button type="button" onClick={() => void wallet.connect()} disabled={wallet.connecting}>
            {wallet.connecting ? 'Connecting…' : 'Connect wallet'}
          </button>
        )}
      </div>

      {!wallet.account && (
        <p className="muted">
          Connect MetaMask (or another injected wallet) to read an ERC-20 balance, fetch
          your Sepolia history, and optionally send a 0 ETH self-transfer on testnet.
        </p>
      )}

      {wallet.account && (
        <dl className="stat-grid">
          <div>
            <dt>Account</dt>
            <dd>
              <a
                href={explorerAddressUrl(wallet.chainId, wallet.account)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {shortenAddress(wallet.account, 6)}
              </a>
            </dd>
          </div>
          <div>
            <dt>Network</dt>
            <dd>
              {networkLabel(wallet.chainId)}
              {wallet.chainId !== null && (
                <span className="chip">chain {wallet.chainId.toString()}</span>
              )}
            </dd>
          </div>
          <div>
            <dt>ETH balance</dt>
            <dd>
              {wallet.ethBalance !== null ? `${formatAmount(wallet.ethBalance)} ETH` : '—'}
            </dd>
          </div>
        </dl>
      )}

      {wallet.account && !onSepolia && (
        <div className="banner warn">
          <p>
            This sample is built for Sepolia. ERC-20 presets, explorer history, and the
            0 ETH self-transfer are disabled or degraded on other networks.
          </p>
          <button type="button" onClick={() => void wallet.switchToSepolia()}>
            Switch to Sepolia
          </button>
        </div>
      )}

      {wallet.error && <p className="banner error">{wallet.error}</p>}
    </section>
  )
}
