export const SEPOLIA_CHAIN_ID = 11155111n
export const SEPOLIA_CHAIN_HEX = '0xaa36a7'

export type NetworkInfo = {
  name: string
  explorer: string
  nativeSymbol: string
}

export const NETWORKS: Record<string, NetworkInfo> = {
  '1': {
    name: 'Ethereum Mainnet',
    explorer: 'https://etherscan.io',
    nativeSymbol: 'ETH',
  },
  '11155111': {
    name: 'Sepolia',
    explorer: 'https://sepolia.etherscan.io',
    nativeSymbol: 'SepoliaETH',
  },
}

export const SEPOLIA_ADD_CHAIN_PARAMS = {
  chainId: SEPOLIA_CHAIN_HEX,
  chainName: 'Sepolia',
  nativeCurrency: {
    name: 'SepoliaETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
}

export const DEFAULT_SEPOLIA_RPC =
  'https://ethereum-sepolia-rpc.publicnode.com'

export const BLOCKSCOUT_SEPOLIA_API = 'https://eth-sepolia.blockscout.com/api'
export const ETHERSCAN_V2_API = 'https://api.etherscan.io/v2/api'

export function networkLabel(chainId: bigint | null): string {
  if (chainId === null) return 'Not connected'
  return NETWORKS[chainId.toString()]?.name ?? `Chain ${chainId.toString()}`
}

export function isSepolia(chainId: bigint | null): boolean {
  return chainId === SEPOLIA_CHAIN_ID
}
