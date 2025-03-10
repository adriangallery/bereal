// Sound effects
const collectSound = new Audio('collect.wav');
const gameOverSound = new Audio('gameover.wav');

// Get the canvas and its context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Track time for smooth animations
let lastTime = 0;

// State variable for wallet connection
let walletConnected = false;

// Variable to track if the game is paused
let paused = false;

// Global variable for tokens earned in the current game over
let tokensEarned = 0;

// Variable for NFT bonus multiplier (default 1; will be set to 2 if the user holds an NFT)
let nftMultiplier = 1;

// Define the square (player) object with initial position, size, and speed
const square = {
    x: 50,
    y: 50,
    width: 24,
    height: 24,
    speed: 100 // pixels per second
};

// Define the collectible token object
const token = {
    x: Math.random() * (canvas.width - 24),
    y: Math.random() * (canvas.height - 24),
    width: 24,
    height: 24
};

// Define the hazard object (risk element)
const hazard = {
    x: Math.random() * (canvas.width - 24),
    y: Math.random() * (canvas.height - 24),
    width: 24,
    height: 24,
    dx: (Math.random() < 0.5 ? -1 : 1) * 80,
    dy: (Math.random() < 0.5 ? -1 : 1) * 80
};

// Player's score and high score (using localStorage)
let score = 0;
let highScore = Number(localStorage.getItem('highScore')) || 0;

// Object to track pressed keys
const keys = {};

// Keyboard event listeners
document.addEventListener('keydown', (event) => {
    // Toggle pause with "P"
    if (event.key.toLowerCase() === 'p') {
        paused = !paused;
        if (paused) {
            console.log("Game paused");
        } else {
            console.log("Game resumed");
            // Reset lastTime to avoid jump in deltaTime
            lastTime = performance.now();
        }
    } else if (event.key.toLowerCase() === 'w') {
        wager();
    } else {
        keys[event.key] = true;
    }
});
document.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});

// Touch control variable to store the target position
let touchTarget = null;

// Touch event listeners
canvas.addEventListener('touchstart', function(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const touchX = touch.clientX - rect.left;
  const touchY = touch.clientY - rect.top;
  touchTarget = { x: touchX - square.width / 2, y: touchY - square.height / 2 };
});
canvas.addEventListener('touchmove', function(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const touchX = touch.clientX - rect.left;
  const touchY = touch.clientY - rect.top;
  touchTarget = { x: touchX - square.width / 2, y: touchY - square.height / 2 };
});
canvas.addEventListener('touchend', function(e) {
  e.preventDefault();
  touchTarget = null;
});

// Wallet connection event listener (simulate wallet connection)
document.getElementById('connectWallet').addEventListener('click', async function() {
    // Conectar la wallet
    if (window.ethereum) {
       await window.ethereum.request({ method: "eth_requestAccounts" });
       walletConnected = true;
       document.getElementById('menu').style.display = 'none';
       console.log("Wallet Connected!");
       
       // Preguntar al usuario si posee un NFT de Adrian Gallery (simulado)
       let hasNFT = prompt("Do you hold an Adrian Gallery NFT? (yes/no)", "no");
       if (hasNFT && hasNFT.toLowerCase() === "yes") {
          nftMultiplier = 2;
          console.log("NFT bonus activated! Multiplier set to 2x.");
       } else {
          nftMultiplier = 1;
          console.log("No NFT bonus. Multiplier remains 1x.");
       }
    } else {
       alert("No Ethereum provider found. Please install MetaMask.");
    }
});

// Event listener for the "Claim Rewards" button using ethers.js
document.getElementById('claimRewards').addEventListener('click', async function() {
   if (tokensEarned > 0) {
      try {
         if (!window.ethereum) {
            alert("No Ethereum provider found. Please install MetaMask.");
            return;
         }
         await window.ethereum.request({ method: "eth_requestAccounts" });
         const provider = new ethers.providers.Web3Provider(window.ethereum);
         const signer = provider.getSigner();

         // Dirección y ABI dummy del contrato (actualízalos con los reales)
         const contractAddress = "0xYourDummyContractAddress";
         const abi = [
            "function claimReward(uint256 amount) public"
         ];

         const contract = new ethers.Contract(contractAddress, abi, signer);
         let tx = await contract.claimReward(tokensEarned);
         await tx.wait();
         alert("Rewards claimed on-chain: " + tokensEarned + " $ADRIAN tokens!");
         tokensEarned = 0;
         document.getElementById('rewardSection').style.display = 'none';
      } catch (error) {
         console.error(error);
         alert("Error claiming tokens on-chain.");
      }
   } else {
      alert("No rewards to claim.");
   }
});

// Main game loop
function gameLoop(timestamp) {
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    
    // Only update game state if wallet is connected and game is not paused
    if (walletConnected && !paused) {
      update(deltaTime);
    }
    draw();
    
    requestAnimationFrame(gameLoop);
}

// Update game state
function update(deltaTime) {
    // Keyboard controls
    if (keys['ArrowLeft']) {
        square.x -= square.speed * deltaTime;
    }
    if (keys['ArrowRight']) {
        square.x += square.speed * deltaTime;
    }
    if (keys['ArrowUp']) {
        square.y -= square.speed * deltaTime;
    }
    if (keys['ArrowDown']) {
        square.y += square.speed * deltaTime;
    }
    
    // Touch controls
    if (touchTarget) {
      let dx = touchTarget.x - square.x;
      let dy = touchTarget.y - square.y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 1) {
          let move = square.speed * deltaTime;
          if (move > distance) move = distance;
          square.x += (dx / distance) * move;
          square.y += (dy / distance) * move;
      }
    }
    
    // Keep the square within canvas bounds
    square.x = Math.max(0, Math.min(canvas.width - square.width, square.x));
    square.y = Math.max(0, Math.min(canvas.height - square.height, square.y));
    
    // Update hazard position
    hazard.x += hazard.dx * deltaTime;
    hazard.y += hazard.dy * deltaTime;
    
    // Bounce hazard off canvas edges
    if (hazard.x <= 0 || hazard.x >= canvas.width - hazard.width) {
        hazard.dx *= -1;
    }
    if (hazard.y <= 0 || hazard.y >= canvas.height - hazard.height) {
        hazard.dy *= -1;
    }
    
    // Collision detection for token
    if (square.x < token.x + token.width &&
        square.x + square.width > token.x &&
        square.y < token.y + token.height &&
        square.y + square.height > token.y) {
        score += 10;
        collectSound.play();
        repositionToken();
        // Increase hazard speed slightly for increased difficulty
        hazard.dx *= 1.02;
        hazard.dy *= 1.02;
    }
    
    // Collision detection for hazard
    if (square.x < hazard.x + hazard.width &&
        square.x + square.width > hazard.x &&
        square.y < hazard.y + hazard.height &&
        square.y + square.height > hazard.y) {
        gameOverSound.play();
        resetGame();
    }
}

// Function to simulate a wager: coin toss to double score or lose it all
function wager() {
    if (score > 0) {
        let outcome = Math.random();
        if (outcome < 0.5) {
            alert("Wager failed! You lost your score.");
            score = 0;
        } else {
            score *= 2;
            alert("Wager succeeded! Your score doubled.");
        }
    } else {
        alert("No score to wager!");
    }
}

// Reposition token randomly
function repositionToken() {
    token.x = Math.random() * (canvas.width - token.width);
    token.y = Math.random() * (canvas.height - token.height);
}

// Reset game state after game over and simulate token reward
function resetGame() {
    let finalScore = score;
    if (finalScore > highScore) {
        highScore = finalScore;
        localStorage.setItem('highScore', highScore);
    }
    // Calculate tokens earned with NFT bonus applied (1 token per 50 points)
    if (finalScore >= 50) {
         tokensEarned = Math.floor(finalScore / 50) * nftMultiplier;
         alert("Game Over! You earned " + tokensEarned + " $ADRIAN tokens! Click 'Claim Rewards' to claim them.");
         document.getElementById('rewardSection').style.display = 'block';
    } else {
         alert("Game Over!");
    }
    square.x = 50;
    square.y = 50;
    score = 0;
    repositionToken();
    hazard.x = Math.random() * (canvas.width - hazard.width);
    hazard.y = Math.random() * (canvas.height - hazard.height);
    hazard.dx = (Math.random() < 0.5 ? -1 : 1) * 80;
    hazard.dy = (Math.random() < 0.5 ? -1 : 1) * 80;
}

// Draw game frame
function draw() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#f00';
    ctx.fillRect(token.x, token.y, token.width, token.height);
    
    ctx.fillStyle = '#a0f';
    ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height);
    
    ctx.fillStyle = '#0f0';
    ctx.fillRect(square.x, square.y, square.width, square.height);
    
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText('Score: ' + score, 10, 20);
    ctx.fillText('High Score: ' + highScore, 10, 40);
    ctx.fillText("Press 'W' to wager", 10, 60);
    
    if (paused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.fillText('PAUSED', canvas.width / 2 - 50, canvas.height / 2);
        ctx.font = '16px Arial';
        ctx.fillText("Press 'P' to resume", canvas.width / 2 - 70, canvas.height / 2 + 30);
    }
}

requestAnimationFrame(gameLoop);
