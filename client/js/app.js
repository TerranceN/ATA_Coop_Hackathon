
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

var world = {
    width: 1000,
    height: 1000
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
    else if(player.pos[0] > world.width - player.size) {
        player.pos[0] = world.width - player.size;
    }

    if(player.pos[1] < player.size) {
        player.pos[1] = player.size;
    }
    else if(player.pos[1] > world.height - player.size) {
        player.pos[1] = world.height - player.size;
    }
}

// Draw everything
function render() {
    var screen_offset = {
        x: canvas.width/2 - player.pos[0],
        y: canvas.height/2 - player.pos[1]
    };

    // Fill the screen gray (the out of bounds area)
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Fill the area of the world that is in bounds as white
    ctx.beginPath();
    ctx.rect(screen_offset.x, screen_offset.y, world.width, world.height);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Draw a grid        
    var gridunit = 20;
    ctx.beginPath();
    for (var x = screen_offset.x % gridunit; x <= canvas.width; x += gridunit) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }
    for (var y = screen_offset.y % gridunit; y <= canvas.height; y += gridunit) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#999999';
    ctx.stroke();

    // outline the edge of the world
    ctx.beginPath();
    ctx.rect(screen_offset.x, screen_offset.y, world.width, world.height);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000';
    ctx.stroke();

    // Render the player 
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height/2, player.size, 0, 2 * Math.PI, false);
    ctx.fillStyle = "rgba(192, 255, 192, 1.0)";//'#ccffcc';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#003300';
    ctx.stroke();
};
init();
