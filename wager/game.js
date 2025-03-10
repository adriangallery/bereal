// Get the canvas and its context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Track time for smooth animations
let lastTime = 0;

// State variable for wallet connection
let walletConnected = false;

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

// Player's score
let score = 0;

// Object to track pressed keys
const keys = {};

// Keyboard event listeners
document.addEventListener('keydown', (event) => {
    keys[event.key] = true;
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
document.getElementById('connectWallet').addEventListener('click', function() {
    walletConnected = true;
    document.getElementById('menu').style.display = 'none';
    console.log("Wallet Connected!");
});

// Main game loop
function gameLoop(timestamp) {
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    
    // Only update game state if wallet is connected
    if (walletConnected) {
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
        repositionToken();
    }
    
    // Collision detection for hazard
    if (square.x < hazard.x + hazard.width &&
        square.x + square.width > hazard.x &&
        square.y < hazard.y + hazard.height &&
        square.y + square.height > hazard.y) {
        alert("Game Over!");
        resetGame();
    }
}

// Reposition token randomly
function repositionToken() {
    token.x = Math.random() * (canvas.width - token.width);
    token.y = Math.random() * (canvas.height - token.height);
}

// Reset game state after game over
function resetGame() {
    square.x = 50;
    square.y = 50;
    score = 0;
    repositionToken();
    hazard.x = Math.random() * (canvas.width - hazard.width);
    hazard.y = Math.random() * (canvas.height - hazard.height);
}

// Draw game frame
function draw() {
    // Clear canvas
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw token
    ctx.fillStyle = '#f00';
    ctx.fillRect(token.x, token.y, token.width, token.height);
    
    // Draw hazard
    ctx.fillStyle = '#a0f';
    ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height);
    
    // Draw player
    ctx.fillStyle = '#0f0';
    ctx.fillRect(square.x, square.y, square.width, square.height);
    
    // Display score
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText('Score: ' + score, 10, 20);
}

// Start the game loop
requestAnimationFrame(gameLoop);
