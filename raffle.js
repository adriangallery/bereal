// raffle.js

// Se asume que la wallet se conecta desde el menú y se guarda en window.menuUserAccount.
let userAccount = window.menuUserAccount || "";
if (userAccount) {
  document.getElementById("accountDisplayRaffle").innerText = "Wallet conectada: " + userAccount;
} else {
  document.getElementById("accountDisplayRaffle").innerText = "Wallet no conectada.";
}

// Callback para que el menú actualice la wallet conectada.
window.onMenuWalletConnected = function() {
  userAccount = window.menuUserAccount;
  document.getElementById("accountDisplayRaffle").innerText = "Wallet conectada: " + userAccount;
};

// Direcciones de las colecciones NFT
const baseAddress = "0xC38E2Ae060440c9269CcEB8C0EA8019a66Ce8927";       // BASE (en Base chain)
const ethereumAddress = "0x789e35a999c443fE6089544056f728239B8ffeE7";  // ETHEREUM (en Ethereum mainnet)

// ABI mínimo para ERC721 (solo balanceOf)
const erc721ABI = [
  "function balanceOf(address owner) view returns (uint256)"
];

/**
 * Verifica que la wallet tenga al menos un NFT en:
 * - La colección BASE (en Base chain)
 * - O la colección ETHEREUM (en Ethereum mainnet)
 *
 * Se utilizan dos providers distintos para acceder a cada red.
 * Asegúrate de reemplazar el endpoint de Base con uno válido para esa red.
 */
async function verifyNFT() {
  if (!userAccount) {
    document.getElementById("statusMessage").innerText = "Por favor, conecta tu wallet primero.";
    return false;
  }
  try {
    // Provider para Ethereum mainnet
    const providerEthereum = ethers.getDefaultProvider("homestead");
    // Provider para la red BASE: reemplaza la URL por un endpoint válido para Base mainnet
    const providerBase = new ethers.providers.JsonRpcProvider("https://mainnet.base.org");
    
    // Instanciar los contratos en cada red
    const baseContract = new ethers.Contract(baseAddress, erc721ABI, providerBase);
    const ethereumContract = new ethers.Contract(ethereumAddress, erc721ABI, providerEthereum);
    
    // Consultar el balance de NFT en cada contrato
    const baseBalance = await baseContract.balanceOf(userAccount);
    const ethereumBalance = await ethereumContract.balanceOf(userAccount);
    
    console.log("Base balance:", baseBalance.toString());
    console.log("Ethereum balance:", ethereumBalance.toString());
    
    // Retorna true si alguno de los balances es mayor a 0
    return baseBalance.gt(0) || ethereumBalance.gt(0);
  } catch (error) {
    console.error("Error al verificar NFT:", error);
    return false;
  }
}

// Función para registrar en el Raffle
async function registerForRaffle() {
  const hasNFT = await verifyNFT();
  if (!hasNFT) {
    document.getElementById("statusMessage").innerText = "No se encontró un NFT válido en tu wallet.";
    return;
  }
  
  document.getElementById("statusMessage").innerText = "¡Registro exitoso! Estás participando en el Raffle.";
  // Aquí puedes agregar lógica adicional, como enviar la dirección al backend.
}

// Asignar el evento al botón de registro
document.getElementById("registerButton").addEventListener("click", registerForRaffle);
