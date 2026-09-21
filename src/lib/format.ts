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

/** Trim a decimal string without going through Number(), which loses wei precision. */
export function formatAmount(value: string, maxFractionDigits = 6): string {
  const negative = value.startsWith('-')
  const unsigned = negative ? value.slice(1) : value
  const [whole, fraction = ''] = unsigned.split('.')
  const trimmedFraction = fraction.slice(0, maxFractionDigits).replace(/0+$/, '')
  const rendered = trimmedFraction ? `${whole}.${trimmedFraction}` : whole
  return negative ? `-${rendered}` : rendered
}
