import { useState } from 'react';
import { BrowserProvider, Contract, formatEther } from 'ethers';

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function symbol() view returns (string)",
  "function name() view returns (string)"
];

function App() {
  const [wallet, setWallet] = useState(null);
  const [contractAddr, setContractAddr] = useState('');
  const [contractData, setContractData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const fetchTransactions = async () => {
  setLoading(true);
  setError('');
  
  try {
    const currentBlock = await wallet.provider.getBlockNumber();
    console.log('Current block:', currentBlock);
    
    const history = [];
    
    // Check last 5 blocks only
    for (let i = 0; i < 5; i++) {
      const blockNum = currentBlock - i;
      const block = await wallet.provider.getBlock(blockNum, true);
      
      if (block && block.transactions) {
        for (const tx of block.transactions) {
          const txFrom = tx.from ? tx.from.toLowerCase() : '';
          const txTo = tx.to ? tx.to.toLowerCase() : '';
          const myAddr = wallet.address.toLowerCase();
          
          if (txFrom === myAddr || txTo === myAddr) {
            history.push({
              hash: tx.hash,
              from: tx.from || 'Unknown',
              to: tx.to || 'Contract Creation',
              value: formatEther(tx.value),
              blockNumber: blockNum
            });
          }
        }
      }
    }
    
    setTransactions(history);
    
    if (history.length === 0) {
      setError('No transactions in last 5 blocks. Send a new transaction to test.');
    }
  } catch (err) {
    console.error('Fetch error:', err);
    setError('Failed: ' + err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{ padding: '2rem', maxWidth: '800px' , textAlign : 'center'}}>
      <h1>Transaction Tracker</h1>
      
      {!wallet ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <p>✅ Connected: {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</p>
          
          {/* CONTRACT READING SECTION */}
          <div style={{ marginTop: '2rem', borderTop: '1px solid #ccc', paddingTop: '1rem' }}>
            <h2>Read Contract</h2>
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
            
            {contractData && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f0f0', color: '#000' }}>
                <h3>{contractData.name} ({contractData.symbol})</h3>
                <p>Your balance: {contractData.balance}</p>
              </div>
            )}
          </div>

          {/* TRANSACTION HISTORY SECTION */}
          <div style={{ marginTop: '2rem', borderTop: '1px solid #ccc', paddingTop: '1rem' }}>
            <h2>Recent Transactions</h2>
            <button onClick={fetchTransactions} disabled={loading}>
              {loading ? 'Loading...' : 'Fetch My Transactions'}
            </button>
            
            {transactions.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#000' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #000' }}>
                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>Hash</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>From</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>To</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem' }}>Value (ETH)</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem' }}>Block</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #ccc' }}>
                        <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>
                          <a 
                          href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#0066cc' }}
                          >
                          {tx.hash.slice(0, 10)}...
                          </a>
                        </td>
                        <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>
                          {tx.from.slice(0, 6)}...
                        </td>
                        <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>
                          {typeof tx.to === 'string' ? tx.to.slice(0, 6) + '...' : tx.to}
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                          {parseFloat(tx.value).toFixed(4)}
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                          {tx.blockNumber}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      
      {error && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#ffebee', color: '#c62828' }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default App;