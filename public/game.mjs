import Player from './Player.mjs';
import Collectible from './Collectible.mjs';

const socket = io();
const canvas = document.getElementById('game-window');
const gameInfo = document.getElementById('game-info');
const context = canvas.getContext('2d');

let collectible = {};
let players = {};
let keysPressed = {};

let player = new Player({
    x: Math.floor(Math.random() * canvas.width),
    y: Math.floor(Math.random() * canvas.height),
    score: 0,
});

socket.on('connect', () => {
    socket.emit('newPlayer', player);    
});

socket.on('updateId', (newId) => {
    player.id = newId;
})

document.addEventListener('keydown', (event) => {
    keysPressed[event.key.toLowerCase()] = true;
});

document.addEventListener('keyup', (event) => {
    delete keysPressed[event.key.toLowerCase()];
});

const handleMovement = (player) => {

    const speed = 3;
    let moved = false;

    if (keysPressed['arrowleft'] || keysPressed['a']) {
        player.movePlayer('left', speed);
        moved = true;
    }
    if (keysPressed['arrowright'] || keysPressed['d']) {
        player.movePlayer('right', speed);
        moved = true;
    }
    if (keysPressed['arrowup'] || keysPressed['w']) {
        player.movePlayer('up', speed);
        moved = true;
    }
    if (keysPressed['arrowdown'] || keysPressed['s']) {
        player.movePlayer('down', speed);
        moved = true;
    }

    if (moved) {
        socket.emit('movePlayer', player);
    }

    if (player.collision(collectible)) {   
        socket.emit('collected', player);
    }
};

socket.on('updateRank', (playersArr) => {
    const output = player.calculateRank(playersArr);   
    gameInfo.textContent = output;
});

socket.on('gameState', (gameState) => {
    players = gameState.players;
    collectible = gameState.collectible;
    renderGame();
});

socket.on('updatePlayers', (updatedPlayers) => {
    players = updatedPlayers;
    renderGame();
})

const renderGame = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Render all players
    for (let id in players) {
        const player = players[id];
        context.fillStyle = 'blue';
        context.fillRect(player.x, player.y, 20, 20);
    }

    // Render the collectible
    context.fillStyle = 'red',
    context.fillRect(collectible.x, collectible.y, 10, 10);
};

const gameLoop = () => {
    handleMovement(player);
    requestAnimationFrame(gameLoop);
};

gameLoop();
