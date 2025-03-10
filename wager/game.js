// Sound effects
const collectSound = new Audio('collect.wav');
const gameOverSound = new Audio('gameover.wav');

// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Track time for smooth animations
let lastTime = 0;

// State variables
let walletConnected = false;
let paused = false;

// Global variables for rewards, levels, NFT bonus, etc.
let tokensEarned = 0;
let nftMultiplier = 1;
let level = 1;

// Player's score and high score
let score = 0;
let highScore = Number(localStorage.getItem('highScore')) || 0;

// Leaderboard (top 5 scores)
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];

// Object to track pressed keys
const keys = {};

// Keyboard event listeners
document.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'p') {
        paused = !paused;
        if (paused) {
            console.log("Game paused");
        } else {
            console.log("Game resumed");
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

// Touch control
let touchTarget = null;
canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    touchTarget = { x: touch.clientX - rect.left - square.width / 2, y: touch.clientY - rect.top - square.height / 2 };
});
canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    touchTarget = { x: touch.clientX - rect.left - square.width / 2, y: touch.clientY - rect.top - square.height / 2 };
});
canvas.addEventListener('touchend', function(e) {
    e.preventDefault();
    touchTarget = null;
});

// Define game objects
const square = { x: 50, y: 50, width: 24, height: 24, speed: 100 };
const token = { x: Math.random() * (canvas.width - 24), y: Math.random() * (canvas.height - 24), width: 24, height: 24 };
const hazard = { 
    x: Math.random() * (canvas.width - 24), 
    y: Math.random() * (canvas.height - 24), 
    width: 24, 
    height: 24, 
    dx: (Math.random() < 0.5 ? -1 : 1) * 80, 
    dy: (Math.random() < 0.5 ? -1 : 1) * 80 
};

// Wallet connection, NFT bonus y daily bonus
document.getElementById('connectWallet').addEventListener('click', async function() {
    if (window.ethereum) {
       await window.ethereum.request({ method: "eth_requestAccounts" });
       walletConnected = true;
       document.getElementById('menu').style.display = 'none';
       console.log("Wallet Connected!");
       
       let hasNFT = prompt("Do you hold an Adrian Gallery NFT? (yes/no)", "no");
       nftMultiplier = (hasNFT && hasNFT.toLowerCase() === "yes") ? 2 : 1;
       console.log("NFT multiplier set to " + nftMultiplier + "x.");
       
       let today = new Date().toISOString().slice(0,10);
       if (localStorage.getItem("dailyBonusDate") !== today) {
          let bonus = parseInt(prompt("Claim your daily bonus tokens? Enter amount (e.g., 5)", "5"), 10);
          if (bonus > 0) {
             tokensEarned += bonus;
             alert("Daily bonus claimed: " + bonus + " tokens!");
             localStorage.setItem("dailyBonusDate", today);
          }
       }
       
    } else {
       alert("No Ethereum provider found. Please install MetaMask.");
    }
});

// Listener for "Claim Rewards" button using ethers.js
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
         const contractAddress = "0xYourDummyContractAddress";
         const abi = [ "function claimReward(uint256 amount) public" ];
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

// Event listener for the Restart Game button on the Game Over overlay
document.getElementById('restartButton').addEventListener('click', function() {
    document.getElementById('gameOverOverlay').style.display = 'none';
    restartGame();
});

// Main game loop
function gameLoop(timestamp) {
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    if (walletConnected && !paused) update(deltaTime);
    draw();
    requestAnimationFrame(gameLoop);
}

// Update game state
function update(deltaTime) {
    if (keys['ArrowLeft']) square.x -= square.speed * deltaTime;
    if (keys['ArrowRight']) square.x += square.speed * deltaTime;
    if (keys['ArrowUp']) square.y -= square.speed * deltaTime;
    if (keys['ArrowDown']) square.y += square.speed * deltaTime;
    
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
    
    square.x = Math.max(0, Math.min(canvas.width - square.width, square.x));
    square.y = Math.max(0, Math.min(canvas.height - square.height, square.y));
    
    hazard.x += hazard.dx * deltaTime;
    hazard.y += hazard.dy * deltaTime;
    if (hazard.x <= 0 || hazard.x >= canvas.width - hazard.width) hazard.dx *= -1;
    if (hazard.y <= 0 || hazard.y >= canvas.height - hazard.height) hazard.dy *= -1;
    
    if (square.x < token.x + token.width &&
        square.x + square.width > token.x &&
        square.y < token.y + token.height &&
        square.y + square.height > token.y) {
        score += 10;
        collectSound.play();
        repositionToken();
        hazard.dx *= 1.02;
        hazard.dy *= 1.02;
    }
    
    if (square.x < hazard.x + hazard.width &&
        square.x + square.width > hazard.x &&
        square.y < hazard.y + hazard.height &&
        square.y + square.height > hazard.y) {
        gameOverSound.play();
        showGameOver();
    }
}

// Wager: coin toss to double or lose score
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

// Show custom Game Over overlay instead of alert
function showGameOver() {
    // Actualiza el mensaje con la puntuación final
    document.getElementById('finalScore').innerText = "Your final score: " + score;
    // Muestra el overlay
    document.getElementById('gameOverOverlay').style.display = 'block';
    // Actualiza leaderboard y calcula recompensas
    resetGameState();
}

// Reinicia el juego cuando se presiona Restart
function restartGame() {
    // Reinicia la posición del jugador y del hazard, y oculta mensajes si es necesario
    square.x = 50;
    square.y = 50;
    // Reinicia el juego (ya se reseteó la puntuación en resetGameState)
}

// Reset game state, update leaderboard, etc.
function resetGameState() {
    let finalScore = score;
    if (finalScore > highScore) { 
        highScore = finalScore; 
        localStorage.setItem('highScore', highScore); 
    }
    if (finalScore >= 50) {
         tokensEarned = Math.floor(finalScore / 50) * nftMultiplier;
         alert("You earned " + tokensEarned + " $ADRIAN tokens! Click 'Claim Rewards' to claim them.");
         document.getElementById('rewardSection').style.display = 'block';
    } else { 
         alert("Game Over!"); 
    }
    updateLeaderboard(finalScore);
    // Reinicia la puntuación
    score = 0;
    repositionToken();
    hazard.x = Math.random() * (canvas.width - hazard.width);
    hazard.y = Math.random() * (canvas.height - hazard.height);
    hazard.dx = (Math.random() < 0.5 ? -1 : 1) * 80;
    hazard.dy = (Math.random() < 0.5 ? -1 : 1) * 80;
}

// Leaderboard update
function updateLeaderboard(finalScore) {
    leaderboard.push(finalScore);
    leaderboard.sort((a, b) => b - a);
    leaderboard = leaderboard.slice(0, 5);
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

// Draw frame with dynamic background, UI and leaderboard
function draw() {
    level = Math.floor(score / 50) + 1;
    let grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, level % 2 === 0 ? '#111' : '#222');
    grad.addColorStop(1, level % 2 === 0 ? '#333' : '#444');
    ctx.fillStyle = grad;
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
    ctx.fillText("Level: " + level, 10, 60);
    ctx.fillText("Press 'W' to wager", 10, 80);
    
    // Leaderboard display
    ctx.fillText("Leaderboard:", canvas.width - 150, 20);
    for (let i = 0; i < leaderboard.length; i++) {
        ctx.fillText((i+1) + ". " + leaderboard[i], canvas.width - 150, 40 + i * 20);
    }
    
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
