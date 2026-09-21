import { NETWORKS } from '../constants/networks'

export function shortenAddress(value: string, chars = 4): string {
  if (value.length <= chars * 2 + 2) return value
  return `${value.slice(0, chars + 2)}…${value.slice(-chars)}`
}

export function explorerAddressUrl(chainId: bigint | null, address: string): string {
  const base = chainId ? NETWORKS[chainId.toString()]?.explorer : undefined
  return `${base ?? 'https://sepolia.etherscan.io'}/address/${address}`
}

export function explorerTxUrl(chainId: bigint | null, hash: string): string {
  const base = chainId ? NETWORKS[chainId.toString()]?.explorer : undefined
  return `${base ?? 'https://sepolia.etherscan.io'}/tx/${hash}`
}

export function formatTimestamp(seconds?: number): string {
  if (!seconds) return '—'
  return new Date(seconds * 1000).toLocaleString()
}
