import {
  formatEther,
  formatUnits,
  type BrowserProvider,
  type TransactionResponse,
} from 'ethers'
import {
  BLOCKSCOUT_SEPOLIA_API,
  ETHERSCAN_V2_API,
  isSepolia,
  SEPOLIA_CHAIN_ID,
} from '../constants/networks'

export type TxKind = 'native' | 'erc20'

export type TxRecord = {
  hash: string
  from: string
  to: string
  valueEth: string
  blockNumber: number
  timestamp?: number
  kind: TxKind
  tokenSymbol?: string
  isError: boolean
  source: 'blockscout' | 'etherscan' | 'rpc'
}

type ExplorerTx = {
  hash: string
  from: string
  to: string
  value: string
  blockNumber: string
  timeStamp?: string
  isError?: string
  tokenSymbol?: string
  tokenDecimal?: string
}

const HISTORY_LIMIT = 25
const RPC_LOOKBACK_BLOCKS = 40

function etherscanApiKey(): string {
  return import.meta.env.VITE_ETHERSCAN_API_KEY?.trim() ?? ''
}

function toNativeRecord(
  tx: ExplorerTx,
  source: TxRecord['source'],
): TxRecord {
  return {
    hash: tx.hash,
    from: tx.from,
    to: tx.to || 'Contract creation',
    valueEth: formatEther(tx.value || '0'),
    blockNumber: Number(tx.blockNumber),
    timestamp: tx.timeStamp ? Number(tx.timeStamp) : undefined,
    kind: 'native',
    isError: tx.isError === '1',
    source,
  }
}

function toTokenRecord(
  tx: ExplorerTx,
  source: TxRecord['source'],
): TxRecord {
  const decimals = Number(tx.tokenDecimal ?? '18')
  const raw = BigInt(tx.value || '0')
  return {
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    valueEth: formatUnits(raw, Number.isFinite(decimals) ? decimals : 18),
    blockNumber: Number(tx.blockNumber),
    timestamp: tx.timeStamp ? Number(tx.timeStamp) : undefined,
    kind: 'erc20',
    tokenSymbol: tx.tokenSymbol,
    isError: false,
    source,
  }
}

async function fetchExplorerList(
  url: URL,
): Promise<{ status: string; message: string; result: ExplorerTx[] | string }> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Explorer HTTP ${response.status}`)
  }
  return response.json() as Promise<{
    status: string
    message: string
    result: ExplorerTx[] | string
  }>
}

function unwrapResult(
  payload: { status: string; message: string; result: ExplorerTx[] | string },
): ExplorerTx[] {
  if (payload.status !== '1' || !Array.isArray(payload.result)) {
    const hint =
      typeof payload.result === 'string' ? payload.result : payload.message
    if (/no transactions/i.test(hint)) return []
    throw new Error(hint || 'Explorer API returned no results')
  }
  return payload.result
}

async function fetchBlockscout(address: string): Promise<TxRecord[]> {
  const nativeUrl = new URL(BLOCKSCOUT_SEPOLIA_API)
  nativeUrl.searchParams.set('module', 'account')
  nativeUrl.searchParams.set('action', 'txlist')
  nativeUrl.searchParams.set('address', address)
  nativeUrl.searchParams.set('page', '1')
  nativeUrl.searchParams.set('offset', String(HISTORY_LIMIT))
  nativeUrl.searchParams.set('sort', 'desc')

  const tokenUrl = new URL(BLOCKSCOUT_SEPOLIA_API)
  tokenUrl.searchParams.set('module', 'account')
  tokenUrl.searchParams.set('action', 'tokentx')
  tokenUrl.searchParams.set('address', address)
  tokenUrl.searchParams.set('page', '1')
  tokenUrl.searchParams.set('offset', String(HISTORY_LIMIT))
  tokenUrl.searchParams.set('sort', 'desc')

  const [nativePayload, tokenPayload] = await Promise.all([
    fetchExplorerList(nativeUrl),
    fetchExplorerList(tokenUrl),
  ])

  const native = unwrapResult(nativePayload).map((tx) =>
    toNativeRecord(tx, 'blockscout'),
  )
  let tokens: TxRecord[] = []
  try {
    tokens = unwrapResult(tokenPayload).map((tx) => toTokenRecord(tx, 'blockscout'))
  } catch {
    tokens = []
  }

  return mergeHistory(native, tokens)
}

async function fetchEtherscan(address: string, apiKey: string): Promise<TxRecord[]> {
  const url = new URL(ETHERSCAN_V2_API)
  url.searchParams.set('chainid', SEPOLIA_CHAIN_ID.toString())
  url.searchParams.set('module', 'account')
  url.searchParams.set('action', 'txlist')
  url.searchParams.set('address', address)
  url.searchParams.set('page', '1')
  url.searchParams.set('offset', String(HISTORY_LIMIT))
  url.searchParams.set('sort', 'desc')
  url.searchParams.set('apikey', apiKey)

  const payload = await fetchExplorerList(url)
  return unwrapResult(payload).map((tx) => toNativeRecord(tx, 'etherscan'))
}

function mergeHistory(...lists: TxRecord[][]): TxRecord[] {
  const byHash = new Map<string, TxRecord>()
  for (const list of lists) {
    for (const tx of list) {
      const key = `${tx.hash}:${tx.kind}:${tx.tokenSymbol ?? ''}`
      if (!byHash.has(key)) byHash.set(key, tx)
    }
  }
  return [...byHash.values()]
    .sort((a, b) => b.blockNumber - a.blockNumber)
    .slice(0, HISTORY_LIMIT)
}

async function scanRecentBlocks(
  provider: BrowserProvider,
  address: string,
): Promise<TxRecord[]> {
  const mine = address.toLowerCase()
  const current = await provider.getBlockNumber()
  const history: TxRecord[] = []

  for (let i = 0; i < RPC_LOOKBACK_BLOCKS; i += 1) {
    const blockNumber = current - i
    if (blockNumber < 0) break
    const block = await provider.getBlock(blockNumber, true)
    if (!block) continue

    for (const tx of block.prefetchedTransactions as TransactionResponse[]) {
      const from = tx.from?.toLowerCase() ?? ''
      const to = tx.to?.toLowerCase() ?? ''
      if (from !== mine && to !== mine) continue
      history.push({
        hash: tx.hash,
        from: tx.from,
        to: tx.to ?? 'Contract creation',
        valueEth: formatEther(tx.value),
        blockNumber,
        timestamp: block.timestamp,
        kind: 'native',
        isError: false,
        source: 'rpc',
      })
    }
  }

  return history
}

export type TxHistoryResult = {
  transactions: TxRecord[]
  source: TxRecord['source'] | 'none'
  note: string
}

export async function fetchAddressHistory(
  provider: BrowserProvider,
  address: string,
  chainId: bigint | null,
): Promise<TxHistoryResult> {
  if (isSepolia(chainId)) {
    try {
      const transactions = await fetchBlockscout(address)
      return {
        transactions,
        source: 'blockscout',
        note: transactions.length
          ? 'Loaded from the free Blockscout Sepolia explorer API (no key required).'
          : 'Blockscout has no recent native or ERC-20 transfers for this address.',
      }
    } catch (blockscoutError) {
      const apiKey = etherscanApiKey()
      if (apiKey) {
        try {
          const transactions = await fetchEtherscan(address, apiKey)
          return {
            transactions,
            source: 'etherscan',
            note: 'Blockscout failed; used the optional Etherscan API key fallback.',
          }
        } catch {
          // fall through to RPC scan
        }
      }
      const transactions = await scanRecentBlocks(provider, address)
      return {
        transactions,
        source: transactions.length ? 'rpc' : 'none',
        note: `Explorer APIs failed (${getShortMessage(blockscoutError)}). Fell back to scanning the last ${RPC_LOOKBACK_BLOCKS} blocks over RPC, which misses older history.`,
      }
    }
  }

  const transactions = await scanRecentBlocks(provider, address)
  return {
    transactions,
    source: transactions.length ? 'rpc' : 'none',
    note: `Explorer history is wired for Sepolia only. On this network the app scans the last ${RPC_LOOKBACK_BLOCKS} blocks over RPC.`,
  }
}

function getShortMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'unknown error'
}
