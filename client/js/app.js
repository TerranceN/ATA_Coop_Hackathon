
// A cross-browser requestAnimationFrame
// See https://hacks.mozilla.org/2011/08/animating-with-javascript-from-setinterval-to-requestanimationframe/
var requestAnimFrame = (function(){
    return window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(callback){
            window.setTimeout(callback, 1000 / 60);
        };
})();

// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 512;
canvas.height = 480;
document.body.appendChild(canvas);

// The main game loop
var lastTime;
function main() {
    var now = Date.now();
    var dt = (now - lastTime) / 1000.0;

    update(dt);
    render();

    lastTime = now;
    requestAnimFrame(main);
};

function init() {
    lastTime = Date.now();
    main();
}

// Game state
var player = {
    pos: [100, 100],
    size: 15
};

var gameTime = 0;

// Speed in pixels per second
var playerSpeed = 200;

// Update game objects
function update(dt) {
    gameTime += dt;

    handleInput(dt);
    updateEntities(dt);

    checkCollisions();
};

function handleInput(dt) {
    if(input.isDown('DOWN') || input.isDown('s')) {
        player.pos[1] += playerSpeed * dt;
    }

    if(input.isDown('UP') || input.isDown('w')) {
        player.pos[1] -= playerSpeed * dt;
    }

    if(input.isDown('LEFT') || input.isDown('a')) {
        player.pos[0] -= playerSpeed * dt;
    }

    if(input.isDown('RIGHT') || input.isDown('d')) {
        player.pos[0] += playerSpeed * dt;
    }

    if(input.isDown('SPACE')) {
        //
    }
}

function updateEntities(dt) {

}

function checkCollisions() {
    checkPlayerBounds();
}

function checkPlayerBounds() {
    // Check bounds
    if(player.pos[0] < player.size) {
        player.pos[0] = player.size;
    }
    else if(player.pos[0] > canvas.width - player.size) {
        player.pos[0] = canvas.width - player.size;
    }

    if(player.pos[1] < player.size) {
        player.pos[1] = player.size;
    }
    else if(player.pos[1] > canvas.height - player.size) {
        player.pos[1] = canvas.height - player.size;
    }
}

// Draw everything
function render() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render the player 
    ctx.beginPath();
    ctx.arc(player.pos[0], player.pos[1], player.size, 0, 2 * Math.PI, false);
    ctx.fillStyle = "rgba(192, 255, 192, 1.0)";//'#ccffcc';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#003300';
    ctx.stroke();
};
init();
