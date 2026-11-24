import Phaser from 'phaser';

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.playerHealth = 100;
    this.score = 0;
    this.dragonActive = false;
  }

  preload() {
    // Create simple graphics for game assets
    const graphics = this.add.graphics();

    // Knight sprite (blue armor)
    graphics.fillStyle(0x3498db);
    graphics.drawRect(0, 0, 40, 60);
    graphics.fillRect(5, 10, 30, 10); // Helmet
    graphics.fillRect(15, 15, 10, 5); // Sword hilt
    graphics.fillRect(12, 25, 10, 25); // Body
    graphics.fillRect(8, 35, 15, 3); // Sword
    graphics.generateTexture('player', -20, -20, 60, 80);

    // Dragon sprite (red)
    graphics.clear();
    graphics.fillStyle(0xe74c3c);
    graphics.fillCircle(0, 20, 30); // Head
    graphics.fillRect(-35, 15, 70, 40); // Body
    graphics.fillCircle(-45, 25, 15); // Tail
    graphics.fillRect(-55, 25, 15, 8); // Tail top
    graphics.fillRect(-55, 33, 15, 8); // Tail bottom
    graphics.generateTexture('dragon', -50, -25, 100, 80);

    // Ground
    graphics.clear();
    graphics.fillStyle(0x8b4513);
    graphics.fillRect(0, 0, 800, 32);
    graphics.generateTexture('ground', 0, 0, 800, 32);

    graphics.destroy();
  }

  create() {
    // Create player (knight)
    this.player = this.physics.add.sprite(100, 450, 'player').setCollideWorldBounds(true);
    this.player.setSize(40, 60).setOffset(10, 20);

    // Create ground
    this.ground = this.physics.add.staticImage(400, 568, 'ground').setAllowGravity(false);

    // Player controls
    this.cursors = this.input.keyboard.createCursorKeys();

    // Score and health text
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '24px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: 8
    });

    this.healthText = this.add.text(16, 50, 'Health: 100', {
      fontSize: '24px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: 8
    });

    // Message text (game over / victory)
    this.messageText = this.add.text(400, 300, '', {
      fontSize: '32px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      align: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: 16
    }).setOrigin(0.5).setVisible(false);

    // Create buttons
    this.restartButton = this.add.text(340, 520, 'Restart', {
      fontSize: '20px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: 10
    }).setOrigin(0.5).setVisible(false);
    this.restartButton.setInteractive({ useHandCursor: true });
    this.restartButton.on('pointerover', () => this.restartButton.setStyle({ backgroundColor: 'rgba(52, 152, 219, 0.7)' }));
    this.restartButton.on('pointerout', () => this.restartButton.setStyle({ backgroundColor: 'rgba(0, 0, 0, 0.5)' }));
    this.restartButton.on('pointerdown', () => this.restartGame());

    this.endButton = this.add.text(520, 520, 'End Game', {
      fontSize: '20px',
      fill: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: 10
    }).setOrigin(0.5).setVisible(false);
    this.endButton.setInteractive({ useHandCursor: true });
    this.endButton.on('pointerover', () => this.endButton.setStyle({ backgroundColor: 'rgba(231, 76, 60, 0.7)' }));
    this.endButton.on('pointerout', () => this.endButton.setStyle({ backgroundColor: 'rgba(0, 0, 0, 0.5)' }));
    this.endButton.on('pointerdown', () => this.endGame());

    // Spawn dragons over time
    this.dragonSpawnTimer = this.time.addEvent({
      delay: 3000,
      callback: this.spawnDragon,
      callbackScope: this,
      loop: true
    });

    // Start combat timer for victory condition
    this.combatTimer = this.time.addEvent({
      delay: 60000,
      callback: this.checkVictory,
      callbackScope: this
    });
  }

  spawnDragon() {
    if (!this.dragonActive) {
      this.dragon = this.physics.add.sprite(850, Phaser.Math.Between(100, 500), 'dragon')
        .setFlipX(true);
      this.dragon.setSize(40, 50).setOffset(10, 0);
      this.dragon.setCollideWorldBounds(true);
      this.dragon.setVelocityX(-200);
      this.dragonActive = true;
    }
  }

  checkVictory() {
    // Victory: player survived 60 seconds without dying
    if (this.playerHealth > 0) {
      this.messageText.setText('Victory!\nYou survived the dragon attacks!');
      this.messageText.setVisible(true);
      this.restartButton.setVisible(true);
      this.endButton.setVisible(true);
      this.player.setVisible(false);
      this.scoreText.setVisible(false);
      this.healthText.setVisible(false);
      this.dragonSpawnTimer.remove(false);
      this.combatTimer.remove(false);
    }
  }

  update() {
    if (this.playerHealth <= 0) return;

    // Player movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-200);
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(200);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    // Player jump
    if (this.cursors.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-400);
    }

    // Dragon AI - chase player
    if (this.dragon && this.dragon.active) {
      const distance = Phaser.Math.Distance.Between(this.dragon.x, this.dragon.y, this.player.x, this.player.y);
      if (distance < 200) {
        this.dragon.setVelocityX(-250);
      }

      // Check for collision with player
      if (Phaser.Math.Distance.Between(this.dragon.x, this.dragon.y, this.player.x, this.player.y) < 30) {
        this.playerHealth -= 5;
        this.healthText.setText(`Health: ${this.playerHealth}`);

        if (this.playerHealth <= 0) {
          this.endGame();
          return;
        }
        this.player.setVelocityY(-150);
      }

      // Remove dragon when off screen
      if (this.dragon.x < -100) {
        this.dragon.destroy();
        this.dragonActive = false;
      }
    }

    // Score increases over time
    this.score += 0.1;
    this.scoreText.setText(`Score: ${Math.floor(this.score)}`);
  }

  restartGame() {
    // Reset game state
    this.playerHealth = 100;
    this.score = 0;
    this.dragonActive = false;
    this.messageText.setVisible(false);
    this.restartButton.setVisible(false);
    this.endButton.setVisible(false);

    // Reset text elements
    this.scoreText.setText('Score: 0');
    this.healthText.setText('Health: 100');
    this.scoreText.setVisible(true);
    this.healthText.setVisible(true);

    // Show player again
    this.player.setVisible(true);
    this.player.body.enable = true;

    // Reset player position
    this.player.x = 100;
    this.player.y = 450;
    this.player.setVelocity(0, 0);

    // Clear any existing dragon
    if (this.dragon && this.dragon.active) {
      this.dragon.destroy();
    }

    // Restart timers
    this.dragonSpawnTimer = this.time.addEvent({
      delay: 3000,
      callback: this.spawnDragon,
      callbackScope: this,
      loop: true
    });

    this.combatTimer = this.time.addEvent({
      delay: 60000,
      callback: this.checkVictory,
      callbackScope: this
    });
  }

  endGame() {
    this.playerHealth = 0;
    this.messageText.setText('Game Over!\nYou were defeated by the dragon.');
    this.messageText.setVisible(true);
    this.restartButton.setVisible(true);
    this.endButton.setVisible(true);

    // Stop dragon spawning and combat timer
    if (this.dragonSpawnTimer) this.dragonSpawnTimer.remove(false);
    if (this.combatTimer) this.combatTimer.remove(false);

    // Hide player
    this.player.setVisible(false);

    // Hide score/health
    this.scoreText.setVisible(false);
    this.healthText.setVisible(false);
  }
}

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false
    }
  },
  scene: GameScene
};

// Start the game
const game = new Phaser.Game(config);

// Export for testing
export { game, GameScene };