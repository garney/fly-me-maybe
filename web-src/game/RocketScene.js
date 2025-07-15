import Phaser from 'phaser';

export default class RocketScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RocketScene' });
        this.rocket = null;
        this.isLaunched = false;
        this.socket = null;
        this.crashPoint = null;
        this.countdownText = null;
        this.waitingText = null;
        this.roundWaitText = null;
        // Add player-related properties
        this.playerInfo = null;
        this.playerInfoText = null;
        this.playerListText = null;
        this.players = [];
    }

    init(data) {
        this.socket = data.socket;
        console.log('🪵 ~ RocketScene ~ init ~ this.socket:', this.socket);
        // Enable physics
        this.physics.start();
    }

    preload() {
        // Load assets
        this.load.image('rocket', '/assets/rocket2.png');
        this.load.image('smoke', '/assets/smoke2.png');
        this.load.image('explosion', '/assets/explosion2.png');
        
        // Preload mountain with specific dimensions for better performance
        this.load.image('mountains-mid2', '/assets/mountains-mid2.png', {
            frameWidth: 800,  // Adjust based on your actual image width
            frameHeight: 400  // Adjust based on your actual image height
        });
    }

    create() {
        // Set white background
        this.cameras.main.setBackgroundColor('#333333');

        // Set world bounds to be very wide to allow for camera movement
        this.physics.world.setBounds(0, 0, 10000, 600);

        // Create optimized mountain background
        const gameHeight = this.cameras.main.height;
        this.gameWidth = this.cameras.main.width;
        
        this.mountainsMid2 = this.add.tileSprite(
            this.gameWidth / 2,
            gameHeight - 50,
            this.gameWidth * 2, // Make wider to reduce tile repetition
            400,
            'mountains-mid2'
        );
        this.mountainsMid2.setScrollFactor(0); // Fix to camera
        this.mountainsMid2.setDepth(0); // Ensure it's behind everything

        // Create rocket sprite in the middle of the screen
        const centerX = this.cameras.main.width / 2;
        const centerY = 520;
        this.rocket = this.add.sprite(centerX, centerY, 'rocket');
        this.rocket.setScale(0.2);
        // Enable physics on the rocket
        this.physics.add.existing(this.rocket, false);

        // Create particle emitter for smoke
        this.smokeEmitter = this.add.particles(0, 0, 'smoke', {
            speed: { min: 50, max: 100 },
            scale: { start: 0.2, end: 0.1 }, // Reduced scale reduction
            alpha: { start: 0.5, end: 0.3 }, // Reduced alpha reduction
            lifespan: 2000, // Increased lifespan
            frequency: 50,
            emitting: false,
            follow: this.rocket,
            followOffset: { x: -40, y: 0 },
            angle: { min: 180, max: 180 },
            blendMode: 'ADD',
            quantity: 2 // Emit more particles
        });

        // Create explosion sprite (initially hidden)
        this.explosion = this.add.sprite(0, 0, 'explosion');
        this.explosion.setVisible(false);
        this.explosion.setScale(0.5);

        // Add countdown text
        this.countdownText = this.add.text(this.gameWidth / 2, gameHeight / 2, '', {
            fontFamily: '"Astro", Arial, sans-serif',
            fontSize: '64px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        });
        this.countdownText.setOrigin(0.5);
        this.countdownText.setScrollFactor(0);
        this.countdownText.setDepth(1);

        // Add waiting text
        this.waitingText = this.add.text(this.gameWidth / 2, gameHeight / 2 - 100, 'Waiting for players...', {
            fontFamily: '"Astro", Arial, sans-serif',
            fontSize: '32px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        });
        this.waitingText.setOrigin(0.5);
        this.waitingText.setScrollFactor(0);
        this.waitingText.setDepth(1);

        // Add round wait text
        this.roundWaitText = this.add.text(this.gameWidth / 2, gameHeight / 2 + 50, '', {
            fontFamily: '"Astro", Arial, sans-serif',
            fontSize: '48px',
            fill: '#ff0',
            stroke: '#000',
            strokeThickness: 4
        });
        this.roundWaitText.setOrigin(0.5);
        this.roundWaitText.setScrollFactor(0);
        this.roundWaitText.setDepth(1);
        this.roundWaitText.setVisible(false);

        // Add player info text (top right)
        this.playerInfoText = this.add.text(this.gameWidth - 20, 20, '', {
            fontFamily: '"Astro", Arial, sans-serif',
            fontSize: '24px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 2,
            align: 'right'
        });
        this.playerInfoText.setOrigin(1, 0); // Align to top right
        this.playerInfoText.setScrollFactor(0); // Fix to camera
        this.playerInfoText.setDepth(1);

        // Add player list text (right side)
        this.playerListText = this.add.text(this.gameWidth - 20, 80, '', {
            fontFamily: '"Astro", Arial, sans-serif',
            fontSize: '20px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 2,
            align: 'right'
        });
        this.playerListText.setOrigin(1, 0); // Align to right
        this.playerListText.setScrollFactor(0); // Fix to camera
        this.playerListText.setDepth(1);

        // Listen for crash point from server
        this.socket.connection.on('crashPoint', (point) => {
            this.crashPoint = point;
            console.log('Received crash point:', point);
        });
        this.socket.connection.on('playerUpdate', (playerDetails) => {
            console.log('🪵 ~ RocketScene ~ setupSocketListeners ~ playerDetails:', playerDetails);
        });

        // Setup socket listeners
        this.setupSocketListeners();

        // Request game start
        this.socket.connection.emit('requestGameStart');
        // this.smokeEmitter.start();
    }

    setupSocketListeners() {
        // Listen for waiting state
        this.socket.connection.on('waitingForPlayers', (playerCount) => {
            this.waitingText.setText(`Waiting for players... (${playerCount} players)`);
            this.waitingText.setVisible(true);
            this.countdownText.setVisible(false);
            this.roundWaitText.setVisible(false);
        });

        // Listen for countdown
        this.socket.connection.on('countdown', (count) => {
            this.waitingText.setVisible(false);
            this.roundWaitText.setVisible(false);
            this.countdownText.setVisible(true);
            this.countdownText.setText(count.toString());
            
            // Add a small scale animation
            this.tweens.add({
                targets: this.countdownText,
                scale: { from: 1.2, to: 1 },
                duration: 500,
                ease: 'Power1'
            });
        });

        // Listen for round wait period
        this.socket.connection.on('roundWait', (timeLeft) => {
            this.waitingText.setVisible(false);
            this.countdownText.setVisible(false);
            this.roundWaitText.setVisible(true);
            this.roundWaitText.setText(`Next round in: ${timeLeft}s`);
        });

        // Listen for game start
        this.socket.connection.on('gameStart', (data) => {
            this.crashPoint = data.crashPoint;
            this.countdownText.setVisible(false);
            this.roundWaitText.setVisible(false);
            this.startLaunch();
        });

        // Listen for game cancelled
        this.socket.connection.on('gameCancelled', (reason) => {
            this.waitingText.setText(reason + '\nWaiting for players...');
            this.waitingText.setVisible(true);
            this.countdownText.setVisible(false);
            this.roundWaitText.setVisible(false);
        });

        // Listen for game in progress
        this.socket.connection.on('gameInProgress', (state) => {
            if (state === 'round_end') {
                this.resetGameState();
            }
        });
    }

    setupPlayerListeners() {
        // Listen for current player info
        this.socket.connection.on('playerUpdate', (playerDetails) => {
            this.playerInfo = playerDetails;
            this.updatePlayerInfoText();
        });

        // Listen for all players update
        this.socket.connection.on('players', (updatedPlayers) => {
            this.players = updatedPlayers;
            this.updatePlayerListText();
        });
    }

    updatePlayerInfoText() {
        if (this.playerInfo) {
            this.playerInfoText.setText(
                `${this.playerInfo.name}\nCredits: ${this.playerInfo.credits || 0}`
            );
        }
    }

    updatePlayerListText() {
        if (this.players.length > 0) {
            const playerList = this.players
                .map(player => `${player.name}: ${player.credits || 0}`)
                .join('\n');
            this.playerListText.setText(playerList);
        } else {
            this.playerListText.setText('No other players');
        }
    }

    startLaunch() {
        this.isLaunched = true;
        
        // Initial vertical launch
        this.tweens.add({
            targets: this.rocket,
            y: 150,
            duration: 2000,
            ease: 'Power1',
            onComplete: () => {
                // After reaching height, rotate and move forward
                this.tweens.add({
                    targets: this.rocket,
                    angle: 90,
                    duration: 1000,
                    ease: 'Power1',
                    onComplete: () => {
                        this.horizontalFlight();
                    }
                });
            }
        });
    }

    horizontalFlight() {
        // Make camera follow the rocket with offset
        this.cameras.main.startFollow(this.rocket, true);
        this.cameras.main.setFollowOffset(0, -150);
        
        // Start emitting smoke
        this.smokeEmitter.start();
        
        
        
        // Request crash point from server
        this.socket.connection.emit('requestCrashPoint');
    }

    update() {
        
        // console.log('🪵 ~ RocketScene ~ update ~ this.isLaunched:', this.isLaunched);
        if (this.isLaunched && this.rocket.angle === 90) {
            // Move rocket forward using physics velocity - increased speed
            this.rocket.body.setVelocityX(600); // Doubled the speed from 300 to 600
            this.rocket.body.setVelocityY(-100)

            // Update parallax backgrounds
            // this.mountainsBack.tilePositionX += 0.1;
            // this.mountainsMid1.tilePositionX += 0.2;
            this.mountainsMid2.tilePositionX += 3;
            // this.mountainsMid2.tilePositionY += .1;
            // this.mountainsMid2.tilePositionY += (0.1 * (Math.random() * 0.5 < 0.5 ? 1 : -1));

            // Check for crash point
            console.log('🪵 ~ RocketScene ~ update ~ this.crashPoint:', this.crashPoint, this.rocket.x);
            const xWithOffsset = this.rocket.x - this.gameWidth / 2;
            if (this.crashPoint && xWithOffsset >= this.crashPoint) {
                this.crash();
            }
        }
    }

    resetGameState() {
        // Reset rocket position and properties
        this.isLaunched = false;
        this.rocket.setVisible(true);
        this.rocket.setPosition(this.cameras.main.width / 2, 520);
        this.rocket.setAngle(0);
        this.rocket.body.setVelocity(0, 0);
        
        // Reset camera
        this.cameras.main.stopFollow();
        this.cameras.main.setScroll(0, 0);
        
        // Reset effects
        this.explosion.setVisible(false);
        this.explosion.setAlpha(1);
        this.smokeEmitter.stop();
    }

    crash() {
        this.isLaunched = false;
        this.smokeEmitter.stop();
        
        // Stop all tweens (shaking) on the rocket
        this.tweens.killTweensOf(this.rocket);
        
        // Stop rocket movement
        this.rocket.body.setVelocity(0);
        
        // Show explosion at rocket position
        this.explosion.setPosition(this.rocket.x, this.rocket.y);
        this.explosion.setVisible(true);
        this.rocket.setVisible(false);

        // Animate explosion
        this.tweens.add({
            targets: this.explosion,
            scale: 1,
            alpha: 0,
            duration: 1000,
            ease: 'Power1',
            onComplete: () => {
                // Notify server about round end
                this.socket.connection.emit('roundEnd');
                this.resetGameState();
            }
        });
    }
} 