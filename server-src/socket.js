
import shortId from 'shortid';
const playerStore = require('./playerStore');

export default class Socket {
  constructor(socket) {
    this.socket = socket;
    this.playerId = null;
    this.playerData = null;
    console.log(socket.id, 'CONNECTED');
    this.setup();
  }

  // Track connected players and game state
  static players = new Map(); // Map of socket.id to player data
  static gameState = 'waiting'; // waiting, countdown, playing
  static countdownTimer = null;
  static roundTimer = null;
  static ROUND_WAIT_TIME = 20; // seconds between rounds

  startCountdown = () => {
    console.log('startCountdown', Socket.gameState);
    if (Socket.gameState !== 'waiting' || Socket.countdownTimer) return;
    
    Socket.gameState = 'countdown';
    let count = 5;
    
    // Emit initial countdown
    Socket.io.emit('countdown', count);
    
    Socket.countdownTimer = setInterval(() => {
      count--;
      Socket.io.emit('countdown', count);
      
      if (count <= 0) {
        clearInterval(Socket.countdownTimer);
        Socket.countdownTimer = null;
        Socket.gameState = 'playing';
        
        // Generate same crash point for all players
        const crashPoint = this.generateCrashPoint();
        Socket.io.emit('gameStart', { crashPoint });
      }
    }, 1000);
  }

  startRoundTimer = () => {
    if (Socket.gameState !== 'round_end' || Socket.roundTimer) return;

    let timeLeft = Socket.ROUND_WAIT_TIME;
    Socket.io.emit('roundWait', timeLeft);

    Socket.roundTimer = setInterval(() => {
      timeLeft--;
      Socket.io.emit('roundWait', timeLeft);

      if (timeLeft === 0) {
        clearInterval(Socket.roundTimer);
        Socket.roundTimer = null;
        Socket.gameState = 'waiting';
        this.startCountdown();
      }
    }, 1000);
  }

  handleRoundEnd = () => {
    Socket.gameState = 'round_end';
    this.startRoundTimer();
  }

  generateCrashPoint = () => {
    return Math.floor(Math.random() * (1200 - 600) + 600);
  }

  broadcastPlayers = () => {
    const players = Array.from(Socket.players.values()).map(p => ({
      id: p.id,
      name: p.name
    }));
    Socket.io.emit('players', players);
    
  }

  initializePlayer = async (data) => {
    const { playerId } = data;
    if (!playerId) return;

    const player = await playerStore.getPlayer(playerId);
    if (!player) return;

    this.playerId = playerId;
    this.playerData = player;
    Socket.players.set(this.socket.id, player);
    this.broadcastPlayers();
    this.requestGameStart();

    this.socket.emit('playerUpdate', player);
    console.log('player', player)
  }

  requestGameStart = () => {
    // Only start if we're in waiting state and player is initialized
    if (!this.playerData) return;
    
    console.log('🪵 ~ Socket ~ Socket.players.size:', Socket.players.size);
    if (Socket.gameState === 'waiting') {
      if (Socket.players.size >= 1) {
        this.startCountdown();
      } else {
        this.socket.emit('waitingForPlayers', Socket.players.size);
      }
    } else {
      // Inform player of current state
      this.socket.emit('gameInProgress', Socket.gameState);
    }
  }

  setup = () => {
    console.log('setup');
    this.socket.on('disconnect', this.onDisconnect);
    this.socket.on('reconnect', this.onReconnect);
    this.socket.on('initializePlayer', this.initializePlayer);
    this.socket.on('requestGameStart', this.requestGameStart);
    this.socket.on('roundEnd', this.handleRoundEnd);
    
    this.socket.emit('connectionSetup', Socket.gameState);
  }

  destroy = () => {
    console.log('destroy');
    // Remove player from the map
    if (this.playerId) {
      Socket.players.delete(this.socket.id);
      this.broadcastPlayers();
    }
    
    // If game is in countdown and not enough players, cancel countdown
    if (Socket.gameState === 'countdown' && Socket.players.size < 1) {
      clearInterval(Socket.countdownTimer);
      Socket.gameState = 'waiting';
      Socket.io.emit('gameCancelled', 'Not enough players');
    }
    
    this.socket.off('disconnect', this.onDisconnect);
    this.socket.off('reconnect', this.onReconnect);
    this.socket.off('initializePlayer', this.initializePlayer);
    this.socket.off('requestGameStart', this.requestGameStart);
    this.socket.off('roundEnd', this.handleRoundEnd);
  }

  onDisconnect = () => {
    console.log('disconnect');
    this.destroy();
  }

  onReconnect = () => {
    console.log('reconnect');
    this.setup();
  }

  static init(server) {
    const io = require('socket.io')(server);
    Socket.io = io;
    io.on('connection', (socket) => {
      new Socket(socket);
    });
    return io;
  }
}
