import type { Eip1193Provider } from 'ethers'

type EthereumEventMap = {
  accountsChanged: (accounts: string[]) => void
  chainChanged: (chainId: string) => void
  disconnect: () => void
}

interface EthereumProvider extends Eip1193Provider {
  on<K extends keyof EthereumEventMap>(event: K, handler: EthereumEventMap[K]): void
  removeListener<K extends keyof EthereumEventMap>(
    event: K,
    handler: EthereumEventMap[K],
  ): void
}

declare global {
  interface Window {
    ethereum?: EthereumProvider
  }
}

export {}
