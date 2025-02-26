// components/menu2.js

if (typeof ethers === 'undefined') {
  console.error("ethers.js no está cargado");
}

window.menuConnectWallet = async function() {
  console.log("menuConnectWallet() invoked");
  if (window.ethereum) {
    window.menuProvider = new ethers.providers.Web3Provider(window.ethereum);
    try {
      console.log("Solicitando cuentas desde el menú...");
      await window.menuProvider.send("eth_requestAccounts", []);
      window.menuSigner = window.menuProvider.getSigner();
      window.menuUserAccount = await window.menuSigner.getAddress();
      console.log("Cuenta conectada (menú):", window.menuUserAccount);
      
      // Actualiza el texto del botón con los emojis y la dirección abreviada
      const btn = document.getElementById("menuConnectButton");
      if (btn) {
        btn.innerHTML = `🟦🟥 ${window.menuUserAccount.slice(0, 6)}...${window.menuUserAccount.slice(-4)}`;
      }
      
      // Llama al callback si está definido
      if (typeof window.onMenuWalletConnected === "function") {
        window.onMenuWalletConnected();
      }
    } catch (error) {
      console.error("Error conectando la wallet en el menú:", error);
      alert("Error conectando la wallet desde el menú. Revisa la consola para detalles.");
    }
  } else {
    alert("MetaMask no está instalado!");
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  if (window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await provider.listAccounts();
    if (accounts.length > 0) {
      window.menuProvider = provider;
      window.menuSigner = provider.getSigner();
      window.menuUserAccount = accounts[0];
      const btn = document.getElementById("menuConnectButton");
      if (btn) {
        btn.innerHTML = `🟦🟥 ${window.menuUserAccount.slice(0, 6)}...${window.menuUserAccount.slice(-4)}`;
      }
      if (typeof window.onMenuWalletConnected === "function") {
        window.onMenuWalletConnected();
      }
    }
  }
});
