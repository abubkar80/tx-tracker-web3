import { useCallback, useState } from 'react'
import { Contract, formatUnits, isAddress, type BrowserProvider } from 'ethers'
import { ERC20_ABI } from '../constants/abi'
import { getErrorMessage } from '../lib/errors'

export type Erc20Snapshot = {
  address: string
  name: string
  symbol: string
  decimals: number
  rawBalance: string
  formattedBalance: string
}

export function useErc20Read(provider: BrowserProvider | null, account: string | null) {
  const [data, setData] = useState<Erc20Snapshot | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const read = useCallback(
    async (contractAddress: string) => {
      if (!provider || !account) {
        setError('Connect a wallet first.')
        return
      }
      if (!isAddress(contractAddress)) {
        setError('Enter a valid contract address.')
        return
      }

      setLoading(true)
      setError(null)
      try {
        const token = new Contract(contractAddress, ERC20_ABI, provider)
        const [name, symbol, decimals, balance] = await Promise.all([
          token.name() as Promise<string>,
          token.symbol() as Promise<string>,
          token.decimals() as Promise<number>,
          token.balanceOf(account) as Promise<bigint>,
        ])
        const decimalCount = Number(decimals)
        setData({
          address: contractAddress,
          name,
          symbol,
          decimals: decimalCount,
          rawBalance: balance.toString(),
          formattedBalance: formatUnits(balance, decimalCount),
        })
      } catch (err) {
        setData(null)
        setError(
          `Failed to read ERC-20 data. Confirm the address is a token on the connected network. ${getErrorMessage(err)}`,
        )
      } finally {
        setLoading(false)
      }
    },
    [account, provider],
  )

  return { data, loading, error, read }
}
