import { useState } from 'react';
import { BrowserProvider } from 'ethers';

function App() {
  const [wallet, setWallet] = useState(null);
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
        network: network.name
      });
      setError('');
    } catch (err) {
      setError(err.message);
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
          <p>Network: {wallet.network}</p>
        </div>
      )}
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default App;