// Get the canvas and its context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Track time for smooth animations
let lastTime = 0;

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

// Player's score
let score = 0;

// Object to track pressed keys
const keys = {};

// Listen for keydown events
document.addEventListener('keydown', (event) => {
    keys[event.key] = true;
});

// Listen for keyup events
document.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});

// The main game loop
function gameLoop(timestamp) {
    // Calculate delta time in seconds
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    
    update(deltaTime);
    draw();
    
    // Request the next animation frame
    requestAnimationFrame(gameLoop);
}

// Update the game state (move the square based on input)
function update(deltaTime) {
    // Move left/right
    if (keys['ArrowLeft']) {
        square.x -= square.speed * deltaTime;
    }
    if (keys['ArrowRight']) {
        square.x += square.speed * deltaTime;
    }
    // Move up/down
    if (keys['ArrowUp']) {
        square.y -= square.speed * deltaTime;
    }
    if (keys['ArrowDown']) {
        square.y += square.speed * deltaTime;
    }
    
    // Keep the square within the canvas bounds
    square.x = Math.max(0, Math.min(canvas.width - square.width, square.x));
    square.y = Math.max(0, Math.min(canvas.height - square.height, square.y));
    
    // Check collision between the square and the token
    if (square.x < token.x + token.width &&
        square.x + square.width > token.x &&
        square.y < token.y + token.height &&
        square.y + square.height > token.y) {
        
        // Increase score and reposition token
        score += 10;
        repositionToken();
    }
}

// Function to reposition the token randomly within the canvas
function repositionToken() {
    token.x = Math.random() * (canvas.width - token.width);
    token.y = Math.random() * (canvas.height - token.height);
}

// Draw the current game frame
function draw() {
    // Clear the canvas with a dark background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw the collectible token as a red square
    ctx.fillStyle = '#f00';
    ctx.fillRect(token.x, token.y, token.width, token.height);
    
    // Draw the player square
    ctx.fillStyle = '#0f0';
    ctx.fillRect(square.x, square.y, square.width, square.height);
    
    // Display the score in the top left corner
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText('Score: ' + score, 10, 20);
}

// Start the game loop
requestAnimationFrame(gameLoop);
