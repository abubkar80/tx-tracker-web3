import { useCallback, useEffect, useState } from 'react'
import { Contract, formatUnits } from 'ethers'
import { CHAINLINK_AGGREGATOR_ABI } from '../constants/abi'
import { SEPOLIA_ETH_USD_FEED } from '../constants/contracts'
import { getErrorMessage } from '../lib/errors'
import { createSepoliaReadProvider } from '../lib/providers'

export type EthUsdPrice = {
  description: string
  usd: string
  updatedAt: number
  roundId: string
}

export function useEthUsdPrice() {
  const [price, setPrice] = useState<EthUsdPrice | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    const provider = createSepoliaReadProvider()
    try {
      const feed = new Contract(
        SEPOLIA_ETH_USD_FEED.address,
        CHAINLINK_AGGREGATOR_ABI,
        provider,
      )
      const [decimals, description, round] = await Promise.all([
        feed.decimals() as Promise<bigint | number>,
        feed.description() as Promise<string>,
        feed.latestRoundData() as Promise<
          readonly [bigint, bigint, bigint, bigint, bigint] & {
            roundId: bigint
            answer: bigint
            updatedAt: bigint
          }
        >,
      ])
      const answer = round.answer ?? round[1]
      const updatedAt = round.updatedAt ?? round[3]
      const roundId = round.roundId ?? round[0]
      setPrice({
        description,
        usd: formatUnits(answer, decimals),
        updatedAt: Number(updatedAt),
        roundId: roundId.toString(),
      })
    } catch (err) {
      setPrice(null)
      setError(
        `Could not read ${SEPOLIA_ETH_USD_FEED.label}: ${getErrorMessage(err)}`,
      )
    } finally {
      setLoading(false)
      provider.destroy()
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { price, loading, error, refresh }
}
