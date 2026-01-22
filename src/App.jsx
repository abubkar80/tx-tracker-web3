import { useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';

// Simple ERC20 ABI (enough to read balance and symbol)
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function symbol() view returns (string)",
  "function name() view returns (string)"
];

function App() {
  const [wallet, setWallet] = useState(null);
  const [contractAddr, setContractAddr] = useState('');
  const [contractData, setContractData] = useState(null);
  const [error, setError] = useState('');

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError('MetaMask not found');
        return;
      }
      
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      
      setWallet({
        address: accounts[0],
        network: network.name,
        provider
      });
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const readContract = async () => {
    try {
      const contract = new Contract(contractAddr, ERC20_ABI, wallet.provider);
      const name = await contract.name();
      const symbol = await contract.symbol();
      const balance = await contract.balanceOf(wallet.address);
      
      setContractData({ name, symbol, balance: balance.toString() });
      setError('');
    } catch (err) {
      setError('Failed to read contract: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px' }}>
      <h1>Transaction Tracker</h1>
      
      {!wallet ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <p>✅ Connected: {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</p>
          
          <div style={{ marginTop: '2rem' }}>
            <input 
              type="text"
              placeholder="Contract address (0x...)"
              value={contractAddr}
              onChange={(e) => setContractAddr(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
            />
            <button onClick={readContract} style={{ marginTop: '0.5rem' }}>
              Read Contract
            </button>
          </div>
          
          {contractData && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f0f0' }}>
              <h3>{contractData.name} ({contractData.symbol})</h3>
              <p>Your balance: {contractData.balance}</p>
            </div>
          )}
        </div>
      )}
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default App;