# Sepolia Transaction Tracker

A small **TypeScript + React** dApp for Ethereum **Sepolia**. It connects an injected wallet (MetaMask and other EIP-1193 wallets), reads public contracts, and loads account history from a free explorer API.

This is a focused sample, not a production wallet or indexer.

## What it does

- **Wallet connect** — request accounts, show ETH balance, detect chain changes, and offer a switch to Sepolia.
- **Chainlink ETH/USD read** — calls `latestRoundData()` on the Sepolia ETH/USD aggregator. No wallet is required; this uses a public RPC.
- **ERC-20 read** — `name`, `symbol`, `decimals`, and `balanceOf` for a token address (Sepolia WETH / USDC presets included).
- **Transaction history** — native and ERC-20 transfers for the connected address via the free Blockscout Sepolia API. Optional Etherscan API key is a fallback. If explorers fail, the app scans the last 40 blocks over RPC.
- **Testnet-only write** — a labeled **0 ETH self-transfer** that is disabled off Sepolia. It spends gas only and does not move funds.

## How to run

```bash
npm install
npm run dev
```

Build check:

```bash
npm install
npm run build
```

Then open the printed local URL (Vite defaults to http://localhost:5173) and connect a wallet on **Sepolia**.

### Optional environment

Copy `.env.example` to `.env` if you want overrides. **Never commit secrets.**

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_SEPOLIA_RPC_URL` | No | Public JSON-RPC used for the ETH/USD feed. Defaults to PublicNode Sepolia. |
| `VITE_ETHERSCAN_API_KEY` | No | Free [Etherscan](https://etherscan.io/apis) key used only if Blockscout history fails. |

The app is usable without either variable.

## Architecture

```
src/
  App.tsx                 # layout / composition
  main.tsx
  constants/              # ABIs, Sepolia addresses, chain metadata
  hooks/                  # wallet, price feed, ERC-20, history
  components/             # UI for each path
  lib/                    # explorer clients, RPC helper, formatting
```

`ethers` v6 talks to the wallet (`BrowserProvider`) and to a read-only `JsonRpcProvider` for the price feed. Explorer HTTP calls live in `src/lib/txHistory.ts` so the UI does not scrape blocks unless it has to.

## Contract interactions

| Path | Network | Type | Contract / method |
| --- | --- | --- | --- |
| ETH/USD price | Sepolia | read | Chainlink aggregator `0x694AA1769357215DE4FAC081bf1f309aDC325306` → `latestRoundData()` |
| Token balance | connected chain | read | ERC-20 `name` / `symbol` / `decimals` / `balanceOf` |
| Self-transfer | Sepolia only | write | `eth_sendTransaction` of **0 ETH** to the connected address |

## Limitations

- History is **Sepolia-first**. Other chains only get a short RPC lookback.
- Blockscout / Etherscan can rate-limit. The RPC fallback only sees recent blocks and is not a full indexer.
- Public RPCs can be slow or reject browser CORS; set `VITE_SEPOLIA_RPC_URL` if the price feed fails.
- There is no ENS, no fiat conversion beyond the Chainlink feed, and no mainnet send flow.
- Do not use this app to move real funds.

## License

MIT
