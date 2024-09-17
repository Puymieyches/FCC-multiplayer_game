require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const socket = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();

app.use(helmet());
app.use(helmet.noCache());
app.use(helmet.hidePoweredBy({ setTo: "PHP 7.4.3" }));
app.use((req, res, next) => {
  res.setHeader("X-Powered-By", "PHP 7.4.3");
  next();
});

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//For FCC testing purposes and enables user to connect from outside the hosting platform
app.use(cors({origin: '*'})); 

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  }); 

//For FCC testing purposes
fccTestingRoutes(app);
    
// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const portNum = process.env.PORT || 3000;

// Set up server and tests
const server = app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

// Socket.io Stuff

const io = socket(server);

let players = {};
let collectible = {
  x: Math.floor(Math.random() * 640),
  y: Math.floor(Math.random() * 480),
  width: 10,
  height: 10,
  value: 1,
  id: uuidv4()
};

io.on('connection', (client) => {

  console.log('Player connected: ', client.id);
  
  // Send current state of the game to the new player
  client.emit('gameState', { players, collectible });
  
  // Listen out for new players, update the player list
  client.on('newPlayer', (player) => {
    player.id = client.id
    players[client.id] = player;
    client.emit('updateId', client.id);
    io.emit('updatePlayers', players);
  });

  // Listen out for player movement, implement movement logic
  client.on('movePlayer', (updatedPlayerPosition) => {
    players[client.id].x = updatedPlayerPosition.x;
    players[client.id].y = updatedPlayerPosition.y;
    io.emit('gameState', { players, collectible });
  });

  client.on('collected', () => {
    
    players[client.id].score += collectible.value;
        
    collectible = {
      x: Math.floor(Math.random() * 640),
      y: Math.floor(Math.random() * 480),
      width: 10,
      height: 10,
      value: 1,
      id: uuidv4()
    };
    
    const scoreArr = Object.values(players);
    
    io.emit('updateRank', scoreArr);
    console.log(players);
    

    io.emit('gameState', { players, collectible });
  });

  client.on('disconnect', () => {
    console.log('Player disconnected: ', client.id);
    delete players[client.id];
    io.emit('updatePlayers', players);
  });

});

module.exports = app; // For testing
