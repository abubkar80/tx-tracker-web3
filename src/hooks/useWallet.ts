import { useCallback, useEffect, useState } from 'react'
import { BrowserProvider, formatEther } from 'ethers'
import { getErrorMessage, isUserRejected } from '../lib/errors'
import {
  SEPOLIA_ADD_CHAIN_PARAMS,
  SEPOLIA_CHAIN_HEX,
} from '../constants/networks'

export type WalletState = {
  account: string | null
  chainId: bigint | null
  provider: BrowserProvider | null
  ethBalance: string | null
  connecting: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
  switchToSepolia: () => Promise<void>
  refreshBalance: () => Promise<void>
}

async function readWallet(provider: BrowserProvider) {
  const signer = await provider.getSigner()
  const address = await signer.getAddress()
  const network = await provider.getNetwork()
  const balance = await provider.getBalance(address)
  return {
    account: address,
    chainId: network.chainId,
    ethBalance: formatEther(balance),
  }
}

export function useWallet(): WalletState {
  const [account, setAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<bigint | null>(null)
  const [provider, setProvider] = useState<BrowserProvider | null>(null)
  const [ethBalance, setEthBalance] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hydrate = useCallback(async (nextProvider: BrowserProvider) => {
    const snapshot = await readWallet(nextProvider)
    setProvider(nextProvider)
    setAccount(snapshot.account)
    setChainId(snapshot.chainId)
    setEthBalance(snapshot.ethBalance)
  }, [])

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('No injected wallet found. Install MetaMask (or a similar EIP-1193 wallet) and retry.')
      return
    }

    setConnecting(true)
    setError(null)
    try {
      const nextProvider = new BrowserProvider(window.ethereum)
      await nextProvider.send('eth_requestAccounts', [])
      await hydrate(nextProvider)
    } catch (err) {
      if (isUserRejected(err)) {
        setError('Wallet connection was rejected.')
      } else {
        setError(getErrorMessage(err))
      }
    } finally {
      setConnecting(false)
    }
  }, [hydrate])

  const disconnect = useCallback(() => {
    setAccount(null)
    setChainId(null)
    setProvider(null)
    setEthBalance(null)
    setError(null)
  }, [])

  const refreshBalance = useCallback(async () => {
    if (!provider || !account) return
    const balance = await provider.getBalance(account)
    setEthBalance(formatEther(balance))
  }, [account, provider])

  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum) {
      setError('No injected wallet found.')
      return
    }
    setError(null)
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_HEX }],
      })
    } catch (err) {
      const code = err && typeof err === 'object' && 'code' in err ? err.code : undefined
      if (code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [SEPOLIA_ADD_CHAIN_PARAMS],
        })
        return
      }
      if (isUserRejected(err)) {
        setError('Network switch was rejected.')
        return
      }
      setError(getErrorMessage(err))
    }
  }, [])

  useEffect(() => {
    const injected = window.ethereum
    if (!injected) return

    const onAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect()
        return
      }
      const nextProvider = new BrowserProvider(injected)
      void hydrate(nextProvider).catch((err) => setError(getErrorMessage(err)))
    }

    const onChainChanged = () => {
      const nextProvider = new BrowserProvider(injected)
      void hydrate(nextProvider).catch((err) => setError(getErrorMessage(err)))
    }

    injected.on('accountsChanged', onAccountsChanged)
    injected.on('chainChanged', onChainChanged)

    const nextProvider = new BrowserProvider(injected)
    void nextProvider
      .send('eth_accounts', [])
      .then((accounts: string[]) => {
        if (accounts.length > 0) return hydrate(nextProvider)
      })
      .catch(() => {
        /* ignore silent hydrate failures */
      })

    return () => {
      injected.removeListener('accountsChanged', onAccountsChanged)
      injected.removeListener('chainChanged', onChainChanged)
    }
  }, [disconnect, hydrate])

  return {
    account,
    chainId,
    provider,
    ethBalance,
    connecting,
    error,
    connect,
    disconnect,
    switchToSepolia,
    refreshBalance,
  }
}
