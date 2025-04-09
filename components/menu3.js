// Función para conectar la wallet
async function menuConnectWallet() {
  if (window.ethereum) {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      
      // Actualizar el botón con la dirección acortada
      const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
      document.getElementById('menuConnectButton').innerHTML = `🟦🟥 ${shortAddress}`;
      
      // Emitir evento personalizado para notificar a otros scripts
      window.dispatchEvent(new CustomEvent('walletConnected', { detail: { address } }));
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  } else {
    alert('Please install MetaMask to use this feature');
  }
}

// Escuchar cambios en la cuenta de MetaMask
if (window.ethereum) {
  window.ethereum.on('accountsChanged', (accounts) => {
    if (accounts.length === 0) {
      // Wallet desconectada
      document.getElementById('menuConnectButton').innerHTML = '🟦🟥 Connect Wallet';
    } else {
      // Wallet conectada o cambiada
      const shortAddress = `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`;
      document.getElementById('menuConnectButton').innerHTML = `🟦🟥 ${shortAddress}`;
    }
  });
} 