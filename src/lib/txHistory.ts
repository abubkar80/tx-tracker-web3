import { formatEther, formatUnits, type BrowserProvider } from 'ethers'
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

type RpcBlock = {
  timestamp?: string
  transactions?: Array<RpcTx | string>
}

type RpcTx = {
  hash: string
  from?: string
  to?: string | null
  value?: string
}

const HISTORY_LIMIT = 25
const RPC_LOOKBACK_BLOCKS = 40
const RPC_BATCH_SIZE = 8
const EXPLORER_TIMEOUT_MS = 12_000

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
  const response = await fetch(url, { signal: AbortSignal.timeout(EXPLORER_TIMEOUT_MS) })
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

function explorerQuery(base: string, action: string, address: string, extra?: Record<string, string>): URL {
  const url = new URL(base)
  url.searchParams.set('module', 'account')
  url.searchParams.set('action', action)
  url.searchParams.set('address', address)
  url.searchParams.set('page', '1')
  url.searchParams.set('offset', String(HISTORY_LIMIT))
  url.searchParams.set('sort', 'desc')
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      url.searchParams.set(key, value)
    }
  }
  return url
}

async function fetchExplorerHistory(
  address: string,
  source: 'blockscout' | 'etherscan',
  extra?: Record<string, string>,
): Promise<TxRecord[]> {
  const base = source === 'blockscout' ? BLOCKSCOUT_SEPOLIA_API : ETHERSCAN_V2_API
  const nativeUrl = explorerQuery(base, 'txlist', address, extra)
  const tokenUrl = explorerQuery(base, 'tokentx', address, extra)

  const [nativePayload, tokenPayload] = await Promise.all([
    fetchExplorerList(nativeUrl),
    fetchExplorerList(tokenUrl),
  ])

  const native = unwrapResult(nativePayload).map((tx) => toNativeRecord(tx, source))
  let tokens: TxRecord[] = []
  try {
    tokens = unwrapResult(tokenPayload).map((tx) => toTokenRecord(tx, source))
  } catch {
    tokens = []
  }

  return mergeHistory(native, tokens)
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

function isRpcTx(tx: RpcTx | string): tx is RpcTx {
  return typeof tx === 'object' && tx !== null && 'hash' in tx
}

async function getBlockWithTransactions(
  provider: BrowserProvider,
  blockNumber: number,
): Promise<{ timestamp: number; transactions: RpcTx[] } | null> {
  const tag = `0x${blockNumber.toString(16)}`
  const block = (await provider.send('eth_getBlockByNumber', [tag, true])) as RpcBlock | null
  if (!block) return null
  return {
    timestamp: Number(block.timestamp ?? 0),
    transactions: (block.transactions ?? []).filter(isRpcTx),
  }
}

async function scanRecentBlocks(
  provider: BrowserProvider,
  address: string,
): Promise<TxRecord[]> {
  const mine = address.toLowerCase()
  const current = await provider.getBlockNumber()
  const history: TxRecord[] = []

  const blockNumbers: number[] = []
  for (let i = 0; i < RPC_LOOKBACK_BLOCKS; i += 1) {
    const blockNumber = current - i
    if (blockNumber < 0) break
    blockNumbers.push(blockNumber)
  }

  for (let i = 0; i < blockNumbers.length; i += RPC_BATCH_SIZE) {
    const batch = blockNumbers.slice(i, i + RPC_BATCH_SIZE)
    const blocks = await Promise.all(
      batch.map((blockNumber) => getBlockWithTransactions(provider, blockNumber)),
    )

    for (const [index, block] of blocks.entries()) {
      const blockNumber = batch[index]
      if (!block || blockNumber === undefined) continue
      for (const tx of block.transactions) {
        const from = tx.from?.toLowerCase() ?? ''
        const to = tx.to?.toLowerCase() ?? ''
        if (from !== mine && to !== mine) continue
        history.push({
          hash: tx.hash,
          from: tx.from ?? 'Unknown',
          to: tx.to ?? 'Contract creation',
          valueEth: formatEther(tx.value || '0'),
          blockNumber,
          timestamp: block.timestamp || undefined,
          kind: 'native',
          isError: false,
          source: 'rpc',
        })
      }
    }
  }

  return history.sort((a, b) => b.blockNumber - a.blockNumber).slice(0, HISTORY_LIMIT)
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
      const transactions = await fetchExplorerHistory(address, 'blockscout')
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
          const transactions = await fetchExplorerHistory(address, 'etherscan', {
            chainid: SEPOLIA_CHAIN_ID.toString(),
            apikey: apiKey,
          })
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
  if (err instanceof DOMException && err.name === 'TimeoutError') {
    return 'explorer request timed out'
  }
  return err instanceof Error ? err.message : 'unknown error'
}
