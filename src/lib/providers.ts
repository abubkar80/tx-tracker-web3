import { JsonRpcProvider } from 'ethers'
import { DEFAULT_SEPOLIA_RPC } from '../constants/networks'

export function sepoliaRpcUrl(): string {
  const fromEnv = import.meta.env.VITE_SEPOLIA_RPC_URL?.trim()
  return fromEnv || DEFAULT_SEPOLIA_RPC
}

export function createSepoliaReadProvider(): JsonRpcProvider {
  return new JsonRpcProvider(sepoliaRpcUrl(), 11155111, { staticNetwork: true })
}
