import { Erc20Reader } from './components/Erc20Reader'
import { PriceFeed } from './components/PriceFeed'
import { SelfTransfer } from './components/SelfTransfer'
import { TxHistory } from './components/TxHistory'
import { WalletPanel } from './components/WalletPanel'
import { useWallet } from './hooks/useWallet'
import './App.css'

export default function App() {
  const wallet = useWallet()

  return (
    <div className="app">
      <header className="hero">
        <p className="eyebrow">Sepolia sample dApp</p>
        <h1>Transaction Tracker</h1>
        <p className="lede">
          A small TypeScript React app that connects an injected wallet, reads Sepolia
          contracts, and loads account history from a free explorer API instead of only
          scanning the last few blocks.
        </p>
      </header>

      <PriceFeed />
      <WalletPanel wallet={wallet} />

      {wallet.account && wallet.provider && (
        <>
          <Erc20Reader
            provider={wallet.provider}
            account={wallet.account}
            chainId={wallet.chainId}
          />
          <SelfTransfer
            provider={wallet.provider}
            account={wallet.account}
            chainId={wallet.chainId}
            onSent={wallet.refreshBalance}
          />
          <TxHistory
            provider={wallet.provider}
            account={wallet.account}
            chainId={wallet.chainId}
          />
        </>
      )}

      <footer className="footer">
        <p>
          Not a production wallet. Default contract calls are read-only. The self-transfer
          is 0 ETH and Sepolia-only. Do not use this app to move real funds.
        </p>
      </footer>
    </div>
  )
}
