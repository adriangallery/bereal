// raffle.js

// Variables globales para conexión y ethers.js
let provider;
let signer;
let userAccount = "";

// Direcciones de las colecciones NFT
const baseAddress = "0xC38E2Ae060440c9269CcEB8C0EA8019a66Ce8927";       // BASE
const ethereumAddress = "0x789e35a999c443fE6089544056f728239B8ffeE7";  // ETHEREUM

// ABI mínimo para ERC721 (solo la función balanceOf)
const erc721ABI = [
  "function balanceOf(address owner) view returns (uint256)"
];

// Función para conectar la wallet (MetaMask)
async function connectWallet() {
  if (!window.ethereum) {
    alert("Necesitas instalar MetaMask para continuar.");
    return;
  }
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  userAccount = await signer.getAddress();
  document.getElementById("accountDisplayRaffle").innerText = "Wallet conectada: " + userAccount;
}

// Función para verificar si la wallet posee al menos un NFT de alguna colección
async function verifyNFT() {
  if (!userAccount) {
    document.getElementById("statusMessage").innerText = "Por favor, conecta tu wallet primero.";
    return false;
  }
  try {
    const baseContract = new ethers.Contract(baseAddress, erc721ABI, provider);
    const ethereumContract = new ethers.Contract(ethereumAddress, erc721ABI, provider);
    
    const baseBalance = await baseContract.balanceOf(userAccount);
    const ethereumBalance = await ethereumContract.balanceOf(userAccount);
    
    // Retorna true si tiene al menos 1 NFT en alguna colección
    if (baseBalance.gt(0) || ethereumBalance.gt(0)) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error al verificar NFT:", error);
    return false;
  }
}

// Función para registrar en el Raffle
async function registerForRaffle() {
  // Verificar que la wallet esté conectada y cumpla con los requisitos
  const hasNFT = await verifyNFT();
  if (!hasNFT) {
    document.getElementById("statusMessage").innerText = "No se encontró un NFT válido en tu wallet.";
    return;
  }
  
  document.getElementById("statusMessage").innerText = "¡Registro exitoso! Estás participando en el Raffle.";
  
  // Aquí podrías agregar lógica adicional, como enviar la dirección a tu backend
}

// Asignar eventos a los botones
document.getElementById("connectWalletButton").addEventListener("click", connectWallet);
document.getElementById("registerButton").addEventListener("click", registerForRaffle);
