// Get the canvas and its context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Variables to manage time
let lastTime = 0;

// Basic game loop using requestAnimationFrame
function gameLoop(timestamp) {
    // Calculate delta time for smooth animations
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    update(deltaTime);
    draw();
    
    // Request the next frame
    requestAnimationFrame(gameLoop);
}

// Update game state (for now, it's empty)
function update(deltaTime) {
    // Future: update positions, handle input, etc.
}

// Draw the current frame
function draw() {
    // Clear the canvas with a dark background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw a sample 24x24 pixel green square (as placeholder art)
    ctx.fillStyle = '#0f0';
    ctx.fillRect(50, 50, 24, 24);
}

// Start the game loop
requestAnimationFrame(gameLoop);
