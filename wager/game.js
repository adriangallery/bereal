// Get the canvas and its context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Track time for smooth animations
let lastTime = 0;

// Define the square object with initial position, size, and speed
const square = {
    x: 50,
    y: 50,
    width: 24,
    height: 24,
    speed: 100 // pixels per second
};

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
}

// Draw the game frame
function draw() {
    // Clear the canvas
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw the square
    ctx.fillStyle = '#0f0';
    ctx.fillRect(square.x, square.y, square.width, square.height);
}

// Start the game loop
requestAnimationFrame(gameLoop);
