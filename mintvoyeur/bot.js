require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { ethers } = require("ethers");

// Cargar variables de entorno
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const WS_RPC_URL = process.env.ALCHEMY_WS_BASE;

// Iniciar bot de Discord
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// Conectar a Base usando WebSocket
const provider = new ethers.WebSocketProvider(WS_RPC_URL);

// Datos del contrato (Reemplaza con tu contrato si cambia)
const CONTRACT_ADDRESS = "0x591d156c6ec4a514627dd711f31819f8b98d1c83";
const EVENT_TOPIC = "0x3f2c9d57c068687834f0de942a9babb9e5acab57d516d3480a3c16ee165a4273"; // TokensMinted event

// Crear un filtro para detectar eventos de mint
const filter = {
    address: CONTRACT_ADDRESS,
    topics: [EVENT_TOPIC]
};

// Escuchar eventos de minting en Base
provider.on(filter, async (log) => {
    try {
        // Extraer datos del evento
        const mintedTo = "0x" + log.topics[1].slice(26); // Dirección del minter
        const quantityMinted = parseInt(log.data, 16); // Cantidad minteada

        console.log(`🚀 Nuevo mint detectado: ${mintedTo} ha minteado ${quantityMinted} NFTs.`);

        // Enviar mensaje a Discord
        const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
        if (channel) {
            channel.send(`🚀 **Nuevo Mint!** **${mintedTo}** ha minteado **${quantityMinted}** NFTs en Base. 🎉`);
        }
    } catch (error) {
        console.error("❌ Error al procesar el evento de mint:", error);
    }
});

// Conectar el bot a Discord
client.once("ready", () => {
    console.log(`✅ Bot conectado como ${client.user.tag}!`);
});

client.login(DISCORD_TOKEN);
