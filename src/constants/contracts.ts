export type NamedContract = {
  label: string
  address: `0x${string}`
  note: string
}

/** Well-known read-only targets on Sepolia. Addresses are public, not secrets. */
export const SEPOLIA_ETH_USD_FEED: NamedContract = {
  label: 'Chainlink ETH/USD',
  address: '0x694AA1769357215DE4FAC081bf1f309aDC325306',
  note: 'AggregatorV3 latestRoundData on Sepolia',
}

export const SEPOLIA_ERC20_PRESETS: NamedContract[] = [
  {
    label: 'WETH',
    address: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
    note: 'Wrapped Ether on Sepolia',
  },
  {
    label: 'USDC',
    address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    note: 'Circle USDC on Sepolia',
  },
]
