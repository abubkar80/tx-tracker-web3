/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SEPOLIA_RPC_URL?: string
  readonly VITE_ETHERSCAN_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
