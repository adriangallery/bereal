// Sound effects
const collectSound = new Audio('collect.wav');
const gameOverSound = new Audio('gameover.wav');

// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Time tracking
let lastTime = 0;

// State variables
let walletConnected = false;
let paused = false;

// Global game variables
let tokensEarned = 0;
let nftMultiplier = 1;
let level = 1;

// Camera shake variables
let shakeTime = 0;

// Particle array (for token pickup effect)
let particles = [];

// Scores and leaderboard
let score = 0;
let highScore = Number(localStorage.getItem('highScore')) || 0;
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];

// Key tracking
const keys = {};
document.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'p') {
    paused = !paused;
    if (!paused) {
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

// Touch event listeners (agregando {passive: false})
canvas.addEventListener('touchstart', function(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  touchTarget = { 
    x: touch.clientX - rect.left - square.width / 2, 
    y: touch.clientY - rect.top - square.height / 2 
  };
}, { passive: false });

canvas.addEventListener('touchmove', function(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  touchTarget = { 
    x: touch.clientX - rect.left - square.width / 2, 
    y: touch.clientY - rect.top - square.height / 2 
  };
}, { passive: false });

canvas.addEventListener('touchend', function(e) {
  e.preventDefault();
  touchTarget = null;
}, { passive: false });

// Touch target variable
let touchTarget = null;

// Game objects
const square = { x: 50, y: 50, width: 24, height: 24, speed: 100 };
const token = { 
  x: Math.random() * (canvas.width - 24), 
  y: Math.random() * (canvas.height - 24), 
  width: 24, 
  height: 24 
};
const hazard = { 
  x: Math.random() * (canvas.width - 24), 
  y: Math.random() * (canvas.height - 24), 
  width: 24, 
  height: 24, 
  dx: (Math.random() < 0.5 ? -1 : 1) * 80, 
  dy: (Math.random() < 0.5 ? -1 : 1) * 80 
};

// Modal helper functions
function showModal(id) {
  document.getElementById(id).style.display = 'flex';
}
function hideModal(id) {
  document.getElementById(id).style.display = 'none';
}
function showMessage(msg, callback) {
  document.getElementById('messageText').innerText = msg;
  showModal('messageModal');
  document.getElementById('messageOk').onclick = function() {
    hideModal('messageModal');
    if (callback) callback();
  };
}

// Wallet connection & modals
document.getElementById('connectWallet').addEventListener('click', async function() {
  if (window.ethereum) {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    walletConnected = true;
    hideModal('menu');
    console.log("Wallet Connected!");
    showModal('nftModal');
  } else {
    showMessage("No Ethereum provider found. Please install MetaMask.");
  }
});
document.getElementById('nftYes').addEventListener('click', function() {
  nftMultiplier = 2;
  console.log("NFT multiplier set to 2x.");
  hideModal('nftModal');
  checkDailyBonus();
});
document.getElementById('nftNo').addEventListener('click', function() {
  nftMultiplier = 1;
  console.log("NFT multiplier set to 1x.");
  hideModal('nftModal');
  checkDailyBonus();
});
function checkDailyBonus() {
  let today = new Date().toISOString().slice(0,10);
  if (localStorage.getItem("dailyBonusDate") !== today) {
    showModal('dailyBonusModal');
  }
}
document.getElementById('dailyBonusConfirm').addEventListener('click', function() {
  let bonus = parseInt(document.getElementById('dailyBonusInput').value, 10);
  if (bonus > 0) {
    tokensEarned += bonus;
    showMessage("Daily bonus claimed: " + bonus + " tokens!");
    localStorage.setItem("dailyBonusDate", new Date().toISOString().slice(0,10));
  }
  hideModal('dailyBonusModal');
});

// Claim Rewards using ethers.js
document.getElementById('claimRewards').addEventListener('click', async function() {
  if (tokensEarned > 0) {
    try {
      if (!window.ethereum) {
        showMessage("No Ethereum provider found. Please install MetaMask.");
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
      showMessage("Rewards claimed on-chain: " + tokensEarned + " $ADRIAN tokens!");
      tokensEarned = 0;
      document.getElementById('rewardSection').style.display = 'none';
    } catch (error) {
      console.error(error);
      showMessage("Error claiming tokens on-chain.");
    }
  } else {
    showMessage("No rewards to claim.");
  }
});

// Restart Game button on Game Over overlay
document.getElementById('restartButton').addEventListener('click', function() {
  hideModal('gameOverOverlay');
  restartGame();
});

// Particle effect for token pickup
function spawnParticles(x, y, count) {
  for (let i = 0; i < count; i++) {
    let angle = Math.random() * 2 * Math.PI;
    let speed = Math.random() * 50 + 30;
    let lifetime = Math.random() * 0.5 + 0.5;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      lifetime: lifetime,
      alpha: 1
    });
  }
}

// Main game loop
function gameLoop(timestamp) {
  const deltaTime = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  
  if (shakeTime > 0) {
    shakeTime -= deltaTime;
  }
  
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
  
  // Update hazard
  hazard.x += hazard.dx * deltaTime;
  hazard.y += hazard.dy * deltaTime;
  if (hazard.x <= 0 || hazard.x >= canvas.width - hazard.width) hazard.dx *= -1;
  if (hazard.y <= 0 || hazard.y >= canvas.height - hazard.height) hazard.dy *= -1;
  
  // Collision with token
  if (square.x < token.x + token.width &&
      square.x + square.width > token.x &&
      square.y < token.y + token.height &&
      square.y + square.height > token.y) {
    score += 10;
    collectSound.play();
    spawnParticles(token.x + token.width / 2, token.y + token.height / 2, 20);
    repositionToken();
    hazard.dx *= 1.02;
    hazard.dy *= 1.02;
  }
  
  // Collision with hazard
  if (square.x < hazard.x + hazard.width &&
      square.x + square.width > hazard.x &&
      square.y < hazard.y + hazard.height &&
      square.y + square.height > hazard.y) {
    gameOverSound.play();
    shakeTime = 0.5;
    showGameOver();
  }
  
  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx * deltaTime;
    p.y += p.vy * deltaTime;
    p.lifetime -= deltaTime;
    p.alpha = p.lifetime;
    if (p.lifetime <= 0) {
      particles.splice(i, 1);
    }
  }
}

// Wager: coin toss to double or lose score
function wager() {
  if (score > 0) {
    let outcome = Math.random();
    if (outcome < 0.5) {
      showMessage("Wager failed! You lost your score.");
      score = 0;
    } else {
      score *= 2;
      showMessage("Wager succeeded! Your score doubled.");
    }
  } else {
    showMessage("No score to wager!");
  }
}

// Reposition token randomly
function repositionToken() {
  token.x = Math.random() * (canvas.width - token.width);
  token.y = Math.random() * (canvas.height - token.height);
}

// Show Game Over overlay and reset game state
function showGameOver() {
  document.getElementById('finalScore').innerText = "Your final score: " + score;
  showModal('gameOverOverlay');
  resetGameState();
}

// Restart game (triggered by Game Over overlay)
function restartGame() {
  square.x = 50;
  square.y = 50;
}

// Reset game state, update leaderboard and rewards
function resetGameState() {
  let finalScore = score;
  if (finalScore > highScore) {
    highScore = finalScore;
    localStorage.setItem('highScore', highScore);
  }
  if (finalScore >= 50) {
    tokensEarned = Math.floor(finalScore / 50) * nftMultiplier;
    showMessage("You earned " + tokensEarned + " $ADRIAN tokens! Click 'Claim Rewards' to claim them.");
    document.getElementById('rewardSection').style.display = 'block';
  } else {
    showMessage("Game Over!");
  }
  updateLeaderboard(finalScore);
  score = 0;
  repositionToken();
  hazard.x = Math.random() * (canvas.width - hazard.width);
  hazard.y = Math.random() * (canvas.height - hazard.height);
  hazard.dx = (Math.random() < 0.5 ? -1 : 1) * 80;
  hazard.dy = (Math.random() < 0.5 ? -1 : 1) * 80;
}

// Update leaderboard (top 5 scores)
function updateLeaderboard(finalScore) {
  leaderboard.push(finalScore);
  leaderboard.sort((a, b) => b - a);
  leaderboard = leaderboard.slice(0, 5);
  localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

// Draw frame with dynamic background, UI, shake and particles
function draw() {
  let offsetX = 0, offsetY = 0;
  if (shakeTime > 0) {
    let shakeIntensity = shakeTime * 10;
    offsetX = (Math.random() - 0.5) * shakeIntensity;
    offsetY = (Math.random() - 0.5) * shakeIntensity;
    ctx.save();
    ctx.translate(offsetX, offsetY);
  }
  
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
  
  for (let p of particles) {
    ctx.fillStyle = "rgba(255,255,255," + p.alpha + ")";
    ctx.fillRect(p.x, p.y, 2, 2);
  }
  
  ctx.fillStyle = '#fff';
  ctx.font = '16px Arial';
  ctx.fillText('Score: ' + score, 10, 20);
  ctx.fillText('High Score: ' + highScore, 10, 40);
  ctx.fillText("Level: " + level, 10, 60);
  ctx.fillText("Press 'W' to wager", 10, 80);
  
  ctx.fillText("Leaderboard:", canvas.width - 150, 20);
  for (let i = 0; i < leaderboard.length; i++) {
    ctx.fillText((i+1) + ". " + leaderboard[i], canvas.width - 150, 40 + i * 20);
  }
  
  if (paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText('PAUSED', canvas.width / 2 - 50, canvas.height / 2);
    ctx.font = '16px Arial';
    ctx.fillText("Press 'P' to resume", canvas.width / 2 - 70, canvas.height / 2 + 30);
  }
  
  if (shakeTime > 0) {
    ctx.restore();
  }
}

requestAnimationFrame(gameLoop);
