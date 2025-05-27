// Game Elements
const gameContainer = document.getElementById('game-container');
const tawhirimatea = document.getElementById('tawhirimatea');
const blastContainer = document.getElementById('blast-container');
const cloudContainer = document.getElementById('cloud-container');
const powerupContainer = document.getElementById('powerup-container');
const stars = document.querySelectorAll('.star');

// Game State
const DEBUG = false; // Set to false for production
let gameBounds = gameContainer.getBoundingClientRect();
let blockedStars = new Set();
let rapidFire = false;
let shieldActive = false;
let multiShotActive = false;
let score = 0;
let gameActive = true;
let spaceKeyPressed = false;
let currentLevel = 1;
let isPaused = false; 
const maxLevels = 3;
const levelScoreThreshold = 500;
window.cloudSpeed = 2; // Initialize cloud speed

// Add this to the beginning of your script.js
function preloadImages() {
  const imagePaths = [
    'images/tawhirimatea.png',
    'images/cloud.png',
    'images/dark-cloud.png',
    'images/storm-cloud.png',
    'images/star.png',
    'images/blast.png',
    'images/powerup-rapid.png',
    'images/powerup-shield.png',
    'images/powerup-slow.png',
    'images/powerup-blast.png',
    'images/powerup-multi.png'
  ];
  
  const preloadPromises = imagePaths.map(path => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(path);
      img.onerror = () => reject(`Failed to load image: ${path}`);
      img.src = path;
    });
  });
  
  return Promise.all(preloadPromises);
}

// Single initialization when page loads
window.addEventListener('DOMContentLoaded', async () => {
  loadLeaderboard();

  try {
    await preloadImages();
    log('🖼️ Images loaded successfully');
    log('🔊 Sounds loaded successfully');
  } catch (error) {
    log('⚠️ Error loading assets:', error);
  }

  // Create score display element (but don't show it yet)
  const scoreDisplay = document.createElement('div');
  scoreDisplay.id = 'score-display';
  scoreDisplay.style.display = 'none'; // Hidden initially
  gameContainer.appendChild(scoreDisplay);

  // Show main menu (NOT start the game)
  showMainMenu();
  
  // Start background music
  soundManager.playBgMusic();
});

// Add this to your Game State section in the existing code
let playerName = "Player"; // Default player name
let leaderboard = [];

// Leaderboard Configuration
const MAX_LEADERBOARD_ENTRIES = 5; // Maximum number of entries to display/store

// Load leaderboard data from localStorage
function loadLeaderboard() {
  try {
    const savedLeaderboard = localStorage.getItem('tawLeaderboard');
    if (savedLeaderboard) {
      leaderboard = JSON.parse(savedLeaderboard);
      log('Leaderboard loaded from localStorage');
    } else {
      // Initialize with some default scores if no leaderboard exists
      leaderboard = [
        { name: "Maui", score: 1500 },
        { name: "Tane", score: 1000 },
        { name: "Hine", score: 750 },
        { name: "Tangaroa", score: 500 },
        { name: "Rongo", score: 250 }
      ];
      saveLeaderboard();
      log('Default leaderboard created');
    }
  } catch (error) {
    log('Error loading leaderboard: ' + error);
    leaderboard = [];
  }
}

// Save leaderboard data to localStorage
function saveLeaderboard() {
  try {
    localStorage.setItem('tawLeaderboard', JSON.stringify(leaderboard));
    log('Leaderboard saved to localStorage');
  } catch (error) {
    log('Error saving leaderboard: ' + error);
  }
}

// Add a new score to the leaderboard
function addScoreToLeaderboard(name, score) {
  console.log("Adding score to leaderboard:", name, score);
  
  // Add the new score
  leaderboard.push({ name, score });
  
  // Sort the leaderboard by score (highest first)
  leaderboard.sort((a, b) => b.score - a.score);
  
  // Log the sorted leaderboard (for debugging)
  console.log("Sorted leaderboard:", JSON.stringify(leaderboard));
  
  // Keep only the top MAX_LEADERBOARD_ENTRIES
  if (leaderboard.length > MAX_LEADERBOARD_ENTRIES) {
    leaderboard = leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES);
  }
  
  // Save the updated leaderboard
  saveLeaderboard();
  
  // Return true if the score made it onto the leaderboard
  return leaderboard.some(entry => entry.name === name && entry.score === score);
}

// Check if a score qualifies for the leaderboard
function isHighScore(score) {
  console.log("Checking if score is high score:", score);
  console.log("Current leaderboard:", leaderboard);
  
  // Always a high score if we have fewer than MAX_LEADERBOARD_ENTRIES entries
  if (leaderboard.length < MAX_LEADERBOARD_ENTRIES) {
    console.log("Leaderboard not full, is a high score");
    return true;
  }
  
  // Force sort the leaderboard (highest first)
  leaderboard.sort((a, b) => b.score - a.score);
  console.log("Sorted leaderboard:", leaderboard);
  
  // Get the lowest score in the leaderboard
  const lowestScore = leaderboard[leaderboard.length - 1].score;
  
  console.log("Lowest score in leaderboard:", lowestScore);
  console.log("Is current score higher?", score > lowestScore);
  
  // Return true if the current score is higher than the lowest score
  return score > lowestScore;
}

// Show the leaderboard screen
function showLeaderboard() {
  // Create leaderboard overlay
  const overlay = document.createElement('div');
  overlay.className = 'leaderboard-overlay';
  overlay.style.position = 'absolute';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 20, 0.85)';
  overlay.style.color = 'white';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.zIndex = '20';
  overlay.style.fontFamily = 'sans-serif';
  
  // Create leaderboard title
  const title = document.createElement('h2');
  title.textContent = 'High Scores';
  title.style.color = 'gold';
  title.style.marginBottom = '20px';
  title.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.5)';
  
  // Create leaderboard table
  const table = document.createElement('div');
  table.style.width = '80%';
  table.style.maxWidth = '300px';
  table.style.marginBottom = '30px';
  
  // Add header row
  const headerRow = document.createElement('div');
  headerRow.style.display = 'flex';
  headerRow.style.justifyContent = 'space-between';
  headerRow.style.borderBottom = '2px solid #33ccff';
  headerRow.style.paddingBottom = '5px';
  headerRow.style.marginBottom = '10px';
  headerRow.style.fontWeight = 'bold';
  
  const rankHeader = document.createElement('div');
  rankHeader.textContent = 'Rank';
  rankHeader.style.width = '20%';
  
  const nameHeader = document.createElement('div');
  nameHeader.textContent = 'Name';
  nameHeader.style.width = '50%';
  
  const scoreHeader = document.createElement('div');
  scoreHeader.textContent = 'Score';
  scoreHeader.style.width = '30%';
  scoreHeader.style.textAlign = 'right';
  
  headerRow.appendChild(rankHeader);
  headerRow.appendChild(nameHeader);
  headerRow.appendChild(scoreHeader);
  table.appendChild(headerRow);
  
  // Add entries
  leaderboard.forEach((entry, index) => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.padding = '8px 0';
    row.style.borderBottom = '1px solid rgba(51, 204, 255, 0.3)';
    
    // Highlight the current player's score
    if (entry.name === playerName && entry.score === score) {
      row.style.backgroundColor = 'rgba(51, 204, 255, 0.2)';
      row.style.borderRadius = '4px';
      row.style.padding = '8px 5px';
      row.style.margin = '0 -5px';
    }
    
    const rankCell = document.createElement('div');
    rankCell.textContent = `${index + 1}`;
    rankCell.style.width = '20%';
    
    const nameCell = document.createElement('div');
    nameCell.textContent = entry.name;
    nameCell.style.width = '50%';
    nameCell.style.overflow = 'hidden';
    nameCell.style.textOverflow = 'ellipsis';
    nameCell.style.whiteSpace = 'nowrap';
    
    const scoreCell = document.createElement('div');
    scoreCell.textContent = entry.score;
    scoreCell.style.width = '30%';
    scoreCell.style.textAlign = 'right';
    
    row.appendChild(rankCell);
    row.appendChild(nameCell);
    row.appendChild(scoreCell);
    table.appendChild(row);
  });
  
  // Create close button
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.style.padding = '10px 20px';
  closeButton.style.fontSize = '16px';
  closeButton.style.backgroundColor = '#33ccff';
  closeButton.style.border = 'none';
  closeButton.style.borderRadius = '5px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.marginTop = '20px';
  
  closeButton.addEventListener('click', () => {
    overlay.remove();
    if (!gameActive) {
      showMainMenu();
    } else {
      resumeGame();
    }
  });
  
  overlay.appendChild(title);
  overlay.appendChild(table);
  overlay.appendChild(closeButton);
  gameContainer.appendChild(overlay);
}

// Modify the Game Over Screen to include name input for high scores
function showGameOver() {
  gameActive = false;
  
  // Debug info
  console.log("*** GAME OVER ***");
  console.log("Final score:", score);
  console.log("Current leaderboard:", leaderboard);
  
  // Check if it's a high score
  // Make sure leaderboard is sorted
  leaderboard.sort((a, b) => b.score - a.score);
  const isHighScoreResult = isHighScore(score);
  console.log("Is high score?", isHighScoreResult);
  
  // Force high score for testing - set to false for normal operation
  const forceHighScore = false;
  
  // Play game over sound
  soundManager.play('gameOver');
  
  // Stop background music
  soundManager.stopBgMusic();

  // Create a game over screen
  const gameOverScreen = document.createElement('div');
  gameOverScreen.style.position = 'absolute';
  gameOverScreen.style.top = '0';
  gameOverScreen.style.left = '0';
  gameOverScreen.style.width = '100%';
  gameOverScreen.style.height = '100%';
  gameOverScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  gameOverScreen.style.display = 'flex';
  gameOverScreen.style.flexDirection = 'column';
  gameOverScreen.style.justifyContent = 'center';
  gameOverScreen.style.alignItems = 'center';
  gameOverScreen.style.zIndex = '10';
  
  const gameOverText = document.createElement('h2');
  gameOverText.textContent = '💀 Game Over';
  gameOverText.style.color = 'white';
  gameOverText.style.marginBottom = '20px';
  
  const finalScore = document.createElement('p');
  finalScore.textContent = `Final Score: ${score}`;
  finalScore.style.color = 'white';
  finalScore.style.marginBottom = '30px';
  
  gameOverScreen.appendChild(gameOverText);
  gameOverScreen.appendChild(finalScore);
  
  // Check if the score qualifies for the leaderboard
  if (isHighScoreResult || forceHighScore) {
    console.log("Showing high score input");
    
    const highScoreMsg = document.createElement('p');
    highScoreMsg.textContent = 'New High Score!';
    highScoreMsg.style.color = 'gold';
    highScoreMsg.style.fontWeight = 'bold';
    highScoreMsg.style.marginBottom = '15px';
    
    // Improved name input container
    const nameInput = document.createElement('div');
    nameInput.style.marginBottom = '20px';
    nameInput.style.display = 'flex';
    nameInput.style.flexDirection = 'column';
    nameInput.style.alignItems = 'center';
    nameInput.style.width = '80%';
    nameInput.style.maxWidth = '300px';
    
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Enter your name:';
    nameLabel.style.color = 'white';
    nameLabel.style.marginBottom = '10px';
    nameLabel.style.fontSize = '16px';
    
    // Improved input field
    const inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.value = playerName;
    inputField.placeholder = 'Your name here';
    inputField.maxLength = 15;
    inputField.style.padding = '12px 15px';
    inputField.style.width = '100%';
    inputField.style.fontSize = '16px';
    inputField.style.borderRadius = '5px';
    inputField.style.border = '2px solid #33ccff';
    inputField.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    inputField.style.color = 'white';
    inputField.style.textAlign = 'center';
    inputField.style.boxShadow = '0 0 10px rgba(51, 204, 255, 0.5)';
    inputField.style.outline = 'none';
    
    // Add focus styles
    inputField.addEventListener('focus', () => {
      inputField.style.border = '2px solid #66ffff';
      inputField.style.boxShadow = '0 0 15px rgba(102, 255, 255, 0.7)';
    });
    
    inputField.addEventListener('blur', () => {
      inputField.style.border = '2px solid #33ccff';
      inputField.style.boxShadow = '0 0 10px rgba(51, 204, 255, 0.5)';
    });
    
    // Select all text when focused for easy replacement
    inputField.addEventListener('focus', () => {
      inputField.select();
    });
    
    // Focus the input field
    setTimeout(() => inputField.focus(), 100);
    
    // Improved submit button
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit Score';
    submitButton.style.padding = '12px 25px';
    submitButton.style.fontSize = '16px';
    submitButton.style.backgroundColor = '#33ccff';
    submitButton.style.border = 'none';
    submitButton.style.borderRadius = '5px';
    submitButton.style.cursor = 'pointer';
    submitButton.style.marginTop = '20px';
    submitButton.style.color = 'white';
    submitButton.style.fontWeight = 'bold';
    submitButton.style.boxShadow = '0 0 10px rgba(51, 204, 255, 0.5)';
    submitButton.style.transition = 'all 0.2s ease';
    
    // Button hover effect
    submitButton.addEventListener('mouseenter', () => {
      submitButton.style.backgroundColor = '#66ddff';
      submitButton.style.boxShadow = '0 0 15px rgba(102, 221, 255, 0.7)';
    });
    
    submitButton.addEventListener('mouseleave', () => {
      submitButton.style.backgroundColor = '#33ccff';
      submitButton.style.boxShadow = '0 0 10px rgba(51, 204, 255, 0.5)';
    });
    
    submitButton.addEventListener('click', () => {
      soundManager.play('menuSelect');
      
      // Get the player name and trim whitespace
      let name = inputField.value.trim();
      
      // If empty, use default name
      if (!name) {
        name = "Player";
      }
      
      // Store the name for future use
      playerName = name;
      
      // Add to leaderboard
      console.log("Adding score to leaderboard:", playerName, score);
      addScoreToLeaderboard(playerName, score);
      
      // Play high score sound
      soundManager.play('highScore');
      
      // Remove game over screen and show leaderboard
      gameOverScreen.remove();
      showLeaderboard();
    });
    
    // Also allow submission with Enter key
    inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        submitButton.click();
      }
    });
    
    nameInput.appendChild(nameLabel);
    nameInput.appendChild(inputField);
    nameInput.appendChild(submitButton);
    
    gameOverScreen.appendChild(highScoreMsg);
    gameOverScreen.appendChild(nameInput);
  } else {
    console.log("Not showing high score input");
    
    // If not a high score, show play again button
    const restartButton = document.createElement('button');
    restartButton.textContent = 'Play Again';
    restartButton.style.padding = '10px 20px';
    restartButton.style.fontSize = '18px';
    restartButton.style.backgroundColor = '#33ccff';
    restartButton.style.border = 'none';
    restartButton.style.borderRadius = '5px';
    restartButton.style.cursor = 'pointer';
    restartButton.style.marginRight = '10px';
    
    const viewLeaderboardButton = document.createElement('button');
    viewLeaderboardButton.textContent = 'View High Scores';
    viewLeaderboardButton.style.padding = '10px 20px';
    viewLeaderboardButton.style.fontSize = '18px';
    viewLeaderboardButton.style.backgroundColor = '#aa88ff';
    viewLeaderboardButton.style.border = 'none';
    viewLeaderboardButton.style.borderRadius = '5px';
    viewLeaderboardButton.style.cursor = 'pointer';
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    
    restartButton.addEventListener('click', () => {
      soundManager.play('menuSelect');
      gameOverScreen.remove();
      resetGame();
    });
    
    viewLeaderboardButton.addEventListener('click', () => {
      soundManager.play('menuSelect');
      gameOverScreen.remove();
      showLeaderboard();
    });
    
    buttonContainer.appendChild(restartButton);
    buttonContainer.appendChild(viewLeaderboardButton);
    gameOverScreen.appendChild(buttonContainer);
  }
  
  gameContainer.appendChild(gameOverScreen);
  
  // Clear all intervals
  clearAllIntervals();
}

// Create a main menu with leaderboard access
function showMainMenu() {
  // Create menu overlay
  const menuOverlay = document.createElement('div');
  menuOverlay.className = 'menu-overlay';
  menuOverlay.style.position = 'absolute';
  menuOverlay.style.top = '0';
  menuOverlay.style.left = '0';
  menuOverlay.style.width = '100%';
  menuOverlay.style.height = '100%';
  menuOverlay.style.backgroundColor = 'rgba(0, 10, 30, 0.9)';
  menuOverlay.style.display = 'flex';
  menuOverlay.style.flexDirection = 'column';
  menuOverlay.style.justifyContent = 'center';
  menuOverlay.style.alignItems = 'center';
  menuOverlay.style.zIndex = '30';
  
  // Create game title
  const gameTitle = document.createElement('h1');
  gameTitle.textContent = 'Tāwhirimātea';
  gameTitle.style.color = '#33ccff';
  gameTitle.style.fontSize = '36px';
  gameTitle.style.marginBottom = '10px';
  gameTitle.style.textShadow = '0 0 10px rgba(51, 204, 255, 0.7)';
  
  // Create subtitle
  const subtitle = document.createElement('p');
  subtitle.textContent = 'Guardian of the Stars';
  subtitle.style.color = 'white';
  subtitle.style.fontSize = '18px';
  subtitle.style.marginBottom = '40px';
  subtitle.style.opacity = '0.8';
  
  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.flexDirection = 'column';
  buttonContainer.style.gap = '15px';
  buttonContainer.style.width = '200px';
  
  // Create play button
  const playButton = document.createElement('button');
  playButton.textContent = 'Play Game';
  playButton.style.padding = '12px 20px';
  playButton.style.fontSize = '18px';
  playButton.style.backgroundColor = '#33ccff';
  playButton.style.border = 'none';
  playButton.style.borderRadius = '5px';
  playButton.style.cursor = 'pointer';
  playButton.style.fontWeight = 'bold';
  
  // Create leaderboard button
  const leaderboardButton = document.createElement('button');
  leaderboardButton.textContent = 'High Scores';
  leaderboardButton.style.padding = '10px 20px';
  leaderboardButton.style.fontSize = '16px';
  leaderboardButton.style.backgroundColor = '#aa88ff';
  leaderboardButton.style.border = 'none';
  leaderboardButton.style.borderRadius = '5px';
  leaderboardButton.style.cursor = 'pointer';
  
  // Create how to play button
  const howToPlayButton = document.createElement('button');
  howToPlayButton.textContent = 'How To Play';
  howToPlayButton.style.padding = '10px 20px';
  howToPlayButton.style.fontSize = '16px';
  howToPlayButton.style.backgroundColor = '#66dd99';
  howToPlayButton.style.border = 'none';
  howToPlayButton.style.borderRadius = '5px';
  howToPlayButton.style.cursor = 'pointer';
  
  // Add event listeners
  playButton.addEventListener('click', async () => {
  await soundManager.preloadSounds();     // 1. Preload sounds (guaranteed after click)
  soundManager.play('menuSelect');        // 2. Play menu select sound
  soundManager.play('gameStart');         // 3. Play game start sound
  soundManager.playBgMusic();             // 4. Start background music
  menuOverlay.remove();
  resetGame();
});

  leaderboardButton.addEventListener('click', async () => {
  await soundManager.preloadSounds();
  soundManager.play('menuSelect');
  menuOverlay.remove();
  showLeaderboard();
});

  howToPlayButton.addEventListener('click', async () => {
  await soundManager.preloadSounds();
  soundManager.play('menuSelect');
  menuOverlay.remove();
  showInstructions();
});
  
  // Assemble menu
  buttonContainer.appendChild(playButton);
  buttonContainer.appendChild(leaderboardButton);
  buttonContainer.appendChild(howToPlayButton);
  
  menuOverlay.appendChild(gameTitle);
  menuOverlay.appendChild(subtitle);
  menuOverlay.appendChild(buttonContainer);
  
  gameContainer.appendChild(menuOverlay);
}

// Show instructions
function showInstructions() {
  const instructionsOverlay = document.createElement('div');
  instructionsOverlay.style.position = 'absolute';
  instructionsOverlay.style.top = '0';
  instructionsOverlay.style.left = '0';
  instructionsOverlay.style.width = '100%';
  instructionsOverlay.style.height = '100%';
  instructionsOverlay.style.backgroundColor = 'rgba(0, 10, 30, 0.9)';
  instructionsOverlay.style.color = 'white';
  instructionsOverlay.style.display = 'flex';
  instructionsOverlay.style.flexDirection = 'column';
  instructionsOverlay.style.justifyContent = 'center';
  instructionsOverlay.style.alignItems = 'center';
  instructionsOverlay.style.padding = '20px';
  instructionsOverlay.style.boxSizing = 'border-box';
  instructionsOverlay.style.zIndex = '20';
  
  const title = document.createElement('h2');
  title.textContent = 'How To Play';
  title.style.color = '#66dd99';
  title.style.marginBottom = '20px';
  
  const instructions = document.createElement('div');
  instructions.style.width = '80%';
  instructions.style.maxWidth = '400px';
  instructions.style.textAlign = 'left';
  instructions.style.marginBottom = '20px';
  instructions.style.fontSize = '14px';
  instructions.style.lineHeight = '1.5';
  
  instructions.innerHTML = `
    <p><strong>Goal:</strong> Protect the stars from falling clouds.</p>
    <p><strong>Controls:</strong></p>
    <ul style="padding-left: 20px; margin-bottom: 15px;">
      <li>Arrow keys or A/D to move left/right</li>
      <li>Space to shoot</li>
      <li>P to pause the game</li>
    </ul>
    <p><strong>Power-ups:</strong></p>
    <ul style="padding-left: 20px;">
      <li>Rapid Fire - Shoots automatically</li>
      <li>Shield - Protects from clouds</li>
      <li>Multi Shot - Fires three blasts</li>
      <li>Blast Wave - Destroys all clouds</li>
      <li>Slow Time - Slows down clouds</li>
    </ul>
  `;
  
  const backButton = document.createElement('button');
  backButton.textContent = 'Back to Menu';
  backButton.style.padding = '10px 20px';
  backButton.style.fontSize = '16px';
  backButton.style.backgroundColor = '#66dd99';
  backButton.style.border = 'none';
  backButton.style.borderRadius = '5px';
  backButton.style.cursor = 'pointer';
  backButton.style.marginTop = '20px';
  
  backButton.addEventListener('click', () => {
    instructionsOverlay.remove();
    showMainMenu();
  });
  
  instructionsOverlay.appendChild(title);
  instructionsOverlay.appendChild(instructions);
  instructionsOverlay.appendChild(backButton);
  
  gameContainer.appendChild(instructionsOverlay);
}

// Update the original checkGameOver function to use the new showGameOver function
function checkGameOver() {
  if (blockedStars.size >= 5) {
    gameActive = false;
    showGameOver();
    clearAllIntervals();
  }
}

// Add a "View High Scores" button to the pause menu
function pauseGame() {
  // Set game state flag
  isPaused = true;
  
  // Clear all intervals
  if (cloudSpawnInterval) clearInterval(cloudSpawnInterval);
  if (powerupSpawnInterval) clearInterval(powerupSpawnInterval);
  if (rapidFireInterval) clearInterval(rapidFireInterval);

  // Stop the game loop
  if (animationFrameId) cancelAnimationFrame(animationFrameId);

  // Pause falling clouds and blasts
  document.querySelectorAll('.cloud, .blast, .powerup').forEach(element => {
    element.dataset.pausedTop = element.style.top; // Save current position
    element.style.animationPlayState = 'paused'; // Pause CSS animations
  });

  // Create pause menu
  const pauseMenu = document.createElement('div');
  pauseMenu.id = 'pause-menu';
  pauseMenu.style.position = 'absolute';
  pauseMenu.style.top = '50%';
  pauseMenu.style.left = '50%';
  pauseMenu.style.transform = 'translate(-50%, -50%)';
  pauseMenu.style.backgroundColor = 'rgba(0, 10, 30, 0.9)';
  pauseMenu.style.color = 'white';
  pauseMenu.style.padding = '20px';
  pauseMenu.style.borderRadius = '10px';
  pauseMenu.style.display = 'flex';
  pauseMenu.style.flexDirection = 'column';
  pauseMenu.style.gap = '15px';
  pauseMenu.style.zIndex = '25';
  
  const pauseTitle = document.createElement('h2');
  pauseTitle.textContent = 'Game Paused';
  pauseTitle.style.textAlign = 'center';
  pauseTitle.style.margin = '0 0 10px 0';
  
  const resumeButton = document.createElement('button');
  resumeButton.textContent = 'Resume Game';
  resumeButton.style.padding = '10px 20px';
  resumeButton.style.fontSize = '16px';
  resumeButton.style.backgroundColor = '#33ccff';
  resumeButton.style.border = 'none';
  resumeButton.style.borderRadius = '5px';
  resumeButton.style.cursor = 'pointer';
  
  const leaderboardButton = document.createElement('button');
  leaderboardButton.textContent = 'View High Scores';
  leaderboardButton.style.padding = '10px 20px';
  leaderboardButton.style.fontSize = '16px';
  leaderboardButton.style.backgroundColor = '#aa88ff';
  leaderboardButton.style.border = 'none';
  leaderboardButton.style.borderRadius = '5px';
  leaderboardButton.style.cursor = 'pointer';
  
  const quitButton = document.createElement('button');
  quitButton.textContent = 'Quit to Menu';
  quitButton.style.padding = '10px 20px';
  quitButton.style.fontSize = '16px';
  quitButton.style.backgroundColor = '#ff6666';
  quitButton.style.border = 'none';
  quitButton.style.borderRadius = '5px';
  quitButton.style.cursor = 'pointer';
  
  resumeButton.addEventListener('click', () => {
    soundManager.play('menuSelect');
    pauseMenu.remove();
    resumeGame();
  });
  
  leaderboardButton.addEventListener('click', () => {
    soundManager.play('menuSelect');
    pauseMenu.remove();
    showLeaderboard();
  });
  
  quitButton.addEventListener('click', () => {
    soundManager.play('menuSelect');
    pauseMenu.remove();
    gameActive = false;
    showMainMenu();
  });
  
  pauseMenu.appendChild(pauseTitle);
  pauseMenu.appendChild(resumeButton);
  pauseMenu.appendChild(leaderboardButton);
  pauseMenu.appendChild(quitButton);
  
  gameContainer.appendChild(pauseMenu);
  
  log("⏸️ Game paused.");
}

// Update resumeGame to handle the case when coming back from leaderboard
function resumeGame() {
  // Play resume sound
  soundManager.play('resume');
  
  // Resume background music if not muted
  soundManager.resumeBgMusic();

  // Remove pause menu if it exists
  const pauseMenu = document.getElementById('pause-menu');
  if (pauseMenu) pauseMenu.remove();
  
  // Reset pause state
  isPaused = false;
  
  // Only continue if game is still active
  if (!gameActive) return;
  
  // Restart cloud and power-up spawning with level-appropriate timings
  adjustDifficultyForLevel(currentLevel);
  
  // Resume falling clouds and blasts
  document.querySelectorAll('.cloud, .blast, .powerup').forEach(element => {
    element.style.top = element.dataset.pausedTop || element.style.top; // Restore position
    element.style.animationPlayState = 'running'; // Resume CSS animations
  });

  // Restart the game loop
  lastTime = 0; // Reset delta time calculation
  animationFrameId = requestAnimationFrame(gameLoop);

  log("▶️ Game resumed.");
}

// Use requestAnimationFrame more consistently
function animateCloud(cloud) {
  const animate = () => {
    if (!gameActive || isPaused) return;
    
    const currentTop = parseInt(cloud.style.top);
    const speed = window.cloudSpeed || 2;
    
    if (currentTop > gameContainer.offsetHeight) {
      cloud.remove();
    } else {
      cloud.style.top = currentTop + speed + 'px';
      // Check collisions...
      requestAnimationFrame(animate);
    }
  };
  
  requestAnimationFrame(animate);
}

// Game Intervals and Animation References
let animationFrameId;
let cloudSpawnInterval;
let powerupSpawnInterval;
let rapidFireInterval;
let activeShield = null;
let starShields = []; // Array to store individual star shield elements

// Player Movement
let position = gameContainer.offsetWidth / 2 - 30; // Center position
const speed = 4;
const keys = { left: false, right: false, space: false };
let lastTime = 0;

// Debug Helper
function log(message) {
  if (DEBUG) console.log(message);
}

log("Kia ora! Tāwhirimātea is ready. 🌬️");

// Update Game Bounds on Resize
window.addEventListener('resize', () => {
  gameBounds = gameContainer.getBoundingClientRect();
});

// Collision Detection
function checkCollision(rect1, rect2) {
  return (
    rect1.left < rect2.right &&
    rect1.right > rect2.left &&
    rect1.top < rect2.bottom &&
    rect1.bottom > rect2.top
  );
}

// Debug Information
function updateDebugInfo() {
  let debugDisplay = document.getElementById('debug-info');
  if (!debugDisplay) {
    debugDisplay = document.createElement('div');
    debugDisplay.id = 'debug-info';
    debugDisplay.style.position = 'absolute';
    debugDisplay.style.bottom = '10px';
    debugDisplay.style.left = '10px';
    debugDisplay.style.color = 'rgba(255,255,255,0.5)';
    debugDisplay.style.fontSize = '10px';
    debugDisplay.style.fontFamily = 'monospace';
    gameContainer.appendChild(debugDisplay);
  }
  
  debugDisplay.textContent = `Level: ${currentLevel} | Speed: ${window.cloudSpeed.toFixed(1)}`;
}

// Score Management
function updateScore(points) {
  score += points;
  const scoreDisplay = document.getElementById('score-display');
  if (!scoreDisplay) {
    const newScoreDisplay = document.createElement('div');
    newScoreDisplay.id = 'score-display';
    newScoreDisplay.textContent = `Score: ${score}`;
    gameContainer.appendChild(newScoreDisplay);
  } else {
    scoreDisplay.textContent = `Score: ${score}`;
  }
  
  log(`📊 Score updated: ${score}`);
  
  // Check for level progression after updating score
  checkLevelProgression();
}

function updateScores() {
  // Instead of updating the DOM for each score change
  // Batch updates into a single operation
  const scores = document.querySelectorAll('.score');
  scores.forEach(scoreElem => {
    // update all scores at once
  });
}

// Level Progression
function checkLevelProgression() {
  const newLevel = Math.min(Math.floor(score / levelScoreThreshold) + 1, maxLevels);
  
  if (newLevel > currentLevel) {
    log(`⭐ Level up! ${currentLevel} → ${newLevel} (Score: ${score})`);
    currentLevel = newLevel;
    
    // Use setTimeout to slightly delay the level start to ensure score display is updated
    setTimeout(() => startLevel(currentLevel), 100);
  }
}

function updateCloudVisuals(level) {
  // Create or update a style element for cloud animations
  let styleElement = document.getElementById('cloud-speed-style');
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'cloud-speed-style';
    document.head.appendChild(styleElement);
  }
  
  // Create animation that changes with level
  const duration = Math.max(1.0 - (level * 0.2), 0.5); // Faster animation at higher levels
  styleElement.innerHTML = `
    .cloud {
      animation: cloudPulse ${duration}s infinite alternate ease-in-out;
    }
    
    @keyframes cloudPulse {
      0% { opacity: 0.7; }
      100% { opacity: 0.9; }
    }
  `;
}

function adjustDifficultyForLevel(level) {
  // 1. Adjust cloud speed - more significant increase
  window.cloudSpeed = 2 + (level * 0.8); // More gradual speed increase
  
  // Always clear intervals before setting new ones
  if (cloudSpawnInterval) clearInterval(cloudSpawnInterval);
  if (powerupSpawnInterval) clearInterval(powerupSpawnInterval);
  
  // 2. Adjust cloud spawn frequency
  const spawnTime = Math.max(2000 - (level * 300), 800); // Faster spawns, minimum 800ms
  cloudSpawnInterval = setInterval(() => {
    if (!isPaused && gameActive) spawnCloud();
  }, spawnTime);
  
  // 3. Adjust cloud size and appearance based on level
  updateCloudVisuals(level);
  
  // 4. Adjust power-up spawn rate
  const powerupTime = Math.max(10000 - (level * 500), 7000);
  powerupSpawnInterval = setInterval(() => {
    if (!isPaused && gameActive) {
      const types = ['rapid', 'shield', 'slow', 'blast', 'multi'];
      spawnPowerUp(types[Math.floor(Math.random() * types.length)]);
    }
  }, powerupTime);
  
  log(`🌩️ Level ${level}: Cloud speed set to ${window.cloudSpeed}, spawn rate: ${spawnTime}ms`);
}

// Game pause/resume functionality
function pauseGame() {
  // Set game state flag
  isPaused = true;
  
  // Clear all intervals
  if (cloudSpawnInterval) clearInterval(cloudSpawnInterval);
  if (powerupSpawnInterval) clearInterval(powerupSpawnInterval);
  if (rapidFireInterval) clearInterval(rapidFireInterval);

  // Stop the game loop
  if (animationFrameId) cancelAnimationFrame(animationFrameId);

  // Pause falling clouds and blasts
  document.querySelectorAll('.cloud, .blast, .powerup').forEach(element => {
    element.dataset.pausedTop = element.style.top; // Save current position
    element.style.animationPlayState = 'paused'; // Pause CSS animations
  });

  log("⏸️ Game paused.");
}

function resumeGame() {
  // Reset pause state
  isPaused = false;
  
  // Restart cloud and power-up spawning with level-appropriate timings
  adjustDifficultyForLevel(currentLevel);
  
  // No need to restore paused elements since we've cleared them in showLevelIntro
  
  // Restart the game loop
  lastTime = 0; // Reset delta time calculation
  animationFrameId = requestAnimationFrame(gameLoop);

  log("▶️ Game resumed.");
  
  // Ensure rapid fire is reapplied if it was active
  if (rapidFire && !rapidFireInterval) {
    rapidFireInterval = setInterval(() => {
      if (gameActive && !isPaused) shootBlast();
    }, 20);
  }
}

// Show level transition animation
function showLevelIntro(level) {
  if (isPaused) return; // Prevent overlapping pauses
  
  // Play level up sound
  soundManager.play('levelUp');

  // Pause the game
  pauseGame();
  
  // Clear all clouds, power-ups, and blasts
  cloudContainer.innerHTML = '';
  powerupContainer.innerHTML = '';
  blastContainer.innerHTML = '';
  
  const overlay = document.createElement("div");
  overlay.className = "level-overlay";
  overlay.style.position = "absolute";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  overlay.style.color = "white";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.fontSize = "36px";
  overlay.style.fontWeight = "bold";
  overlay.style.zIndex = "10";
  overlay.textContent = `Level ${level}`;

  // Add animation
  overlay.style.animation = "fadeInOut 1.5s ease-in-out";

  const keyframes = document.createElement("style");
  keyframes.innerHTML = `
    @keyframes fadeInOut {
      0% { opacity: 0; }
      20% { opacity: 1; }
      80% { opacity: 1; }
      100% { opacity: 0; }
    }
  `;
  document.head.appendChild(keyframes);

  gameContainer.appendChild(overlay);

  // Remove after animation completes and resume game
  setTimeout(() => {
    overlay.remove();
    keyframes.remove();
    resumeGame();
  }, 1500);
}

function startLevel(level) {
  // Update current level
  currentLevel = level;
  
  // Update game difficulty based on level
  adjustDifficultyForLevel(level);
  
  // Show level transition animation
  showLevelIntro(level);
  
  log(`📈 Level ${level} started!`);
  
  // Update debug info
  if (DEBUG) {
    updateDebugInfo();
  }
}

// Cloud Spawning
function spawnCloud() {
  if (!gameActive) return;
  
  const cloud = document.createElement('div');
  cloud.className = 'cloud'; // Remove all other classes, only keep 'cloud'

  // Force the correct cloud image for each level:
  if (currentLevel === 1) {
    cloud.style.backgroundImage = "url('images/cloud.png')";
  } else if (currentLevel === 2) {
    cloud.style.backgroundImage = "url('images/dark-cloud.png')";
  } else if (currentLevel === 3) {
    cloud.style.backgroundImage = "url('images/storm-cloud.png')";
  }

  // Size variation based on level
  const size = 40 + (Math.random() * 10) - 5; // Base size with variation
  cloud.style.width = `${size}px`;
  cloud.style.height = `${size * 0.6}px`; // Keep aspect ratio
  cloud.style.left = Math.random() * (gameContainer.offsetWidth - 80) + 20 + 'px';
  cloud.style.top = '0px';
  cloudContainer.appendChild(cloud);

  const fallInterval = setInterval(() => {
    if (!gameActive || isPaused) {
      clearInterval(fallInterval);
      return;
    }
    
    const currentTop = parseInt(cloud.style.top);
    const speed = window.cloudSpeed || 2; // Use level-based speed
    
    if (currentTop > gameContainer.offsetHeight) {
      cloud.remove();
      clearInterval(fallInterval);
    } else {
      cloud.style.top = currentTop + speed + 'px';

      // Check for collisions with blasts
      document.querySelectorAll('.blast').forEach(blast => {
        if (checkCollision(cloud.getBoundingClientRect(), blast.getBoundingClientRect())) {
          cloud.remove();
          blast.remove();
          clearInterval(fallInterval);
          
          // Play cloud hit sound
          soundManager.play('cloudHit');

          // Add score when cloud is destroyed
          updateScore(10);
        }
      });

      // Check for collisions with stars - MODIFIED to account for shield protection
      stars.forEach(star => {
        if (
          checkCollision(cloud.getBoundingClientRect(), star.getBoundingClientRect()) &&
          !blockedStars.has(star.id)
        ) {
          // Check if shield is active - if so, protect the star and destroy the cloud
          if (shieldActive) {
            // Create a temporary flash effect on the star shield
            const starShield = document.getElementById(`shield-${star.id}`);
            if (starShield) {
              starShield.style.animation = 'none';
              setTimeout(() => {
                starShield.style.animation = 'shieldPulse 2s infinite';
              }, 10);
            }
            
            // Play shield hit sound
            soundManager.play('shield');

            // Remove the cloud but don't block the star
            cloud.remove();
            clearInterval(fallInterval);
            
            // Give player some points for the shield protection
            updateScore(5);
            
            log(`🛡️ Shield protected ${star.id} from cloud!`);
          } else {
            // No shield active, block the star as normal
            blockedStars.add(star.id);
            star.style.opacity = '0.2';
            cloud.remove();
            clearInterval(fallInterval);
            
            // Play star blocked sound
            soundManager.play('starBlocked');

            log(`🌫️ ${star.id} blocked!`);
            checkGameOver();
          }
        }
      });
      
      // Check for collision with player (only if shield is not active)
      if (!shieldActive && checkCollision(cloud.getBoundingClientRect(), tawhirimatea.getBoundingClientRect())) {
        cloud.remove();
        clearInterval(fallInterval);

        // Play player hit sound
        soundManager.play('playerHit');

        updateScore(-20);
      }
    }
  }, 16);
}

// Shooting Blasts
function shootBlast() {
  if (!gameActive || isPaused) return;
  
  // Play shoot sound
  soundManager.play('shoot');
  
  const playerRect = tawhirimatea.getBoundingClientRect();
  const gameRect = gameContainer.getBoundingClientRect();
  
  // Player center position relative to game container
  const playerX = playerRect.left - gameRect.left + playerRect.width / 2;
  
  if (multiShotActive) {
    fireBlast(playerX - 15, -2);
    fireBlast(playerX, 0);
    fireBlast(playerX + 15, 2);
  } else {
    fireBlast(playerX, 0);
  }
}

function fireBlast(posX, xVelocity = 0) {
  const blast = document.createElement('div');
  blast.classList.add('blast');

  const blastWidth = 10;
  blast.style.left = `${posX - blastWidth / 2}px`;
  
  // Get player top position relative to game container
  const playerRect = tawhirimatea.getBoundingClientRect();
  const gameRect = gameContainer.getBoundingClientRect();
  const playerTop = playerRect.top - gameRect.top;
  
  // Start blast from top of player
  blast.style.top = `${playerTop}px`;
  
  blastContainer.appendChild(blast);
  
  const blastInterval = setInterval(() => {
    if (!gameActive || isPaused) {
      clearInterval(blastInterval);
      return;
    }
    
    const currentTop = parseInt(blast.style.top);
    const currentLeft = parseInt(blast.style.left);

    if (currentTop < 0) {
      blast.remove();
      clearInterval(blastInterval);
    } else {
      blast.style.top = `${currentTop - 10}px`;  // Move upward
      blast.style.left = `${currentLeft + parseInt(xVelocity)}px`;
    }
  }, 20);
}

// Power-Up Activation
function activatePowerUp(type, duration, callback) {
  log(`⚡ ${type.charAt(0).toUpperCase() + type.slice(1)} Activated!`);
  const deactivate = () => {
    if (gameActive) {
      log(`🛑 ${type.charAt(0).toUpperCase() + type.slice(1)} Deactivated`);
      callback(false);
    }
  };
  
  callback(true);
  setTimeout(deactivate, duration);
}

function activateRapidFire() {
  activatePowerUp('rapid fire', 8000, (active) => {
    rapidFire = active;
    
    if (active && gameActive) {
      if (rapidFireInterval) clearInterval(rapidFireInterval);
      rapidFireInterval = setInterval(() => {
        if (gameActive && !isPaused) shootBlast();
      }, 200);
      
      setTimeout(() => {
        if (rapidFireInterval) clearInterval(rapidFireInterval);
        rapidFireInterval = null;
      }, 8000);
    }
  });
}

// Enhanced shield activation to protect stars
function activateShield() {
  // Remove any existing player shield first
  const existingShield = document.getElementById('shield-indicator');
  if (existingShield) existingShield.remove();
  
  // Add CSS for shield pulse animation if it doesn't exist
  let shieldStyle = document.getElementById('shield-style');
  if (!shieldStyle) {
    shieldStyle = document.createElement('style');
    shieldStyle.id = 'shield-style';
    shieldStyle.innerHTML = `
      @keyframes shieldPulse {
        0% { box-shadow: 0 0 10px 5px cyan; opacity: 0.7; }
        50% { box-shadow: 0 0 15px 8px cyan; opacity: 0.9; }
        100% { box-shadow: 0 0 10px 5px cyan; opacity: 0.7; }
      }
    `;
    document.head.appendChild(shieldStyle);
  }
  
  activatePowerUp('shield', 8000, (active) => {
    shieldActive = active;
    
    if (active) {
      // Player shield effect
      // tawhirimatea.style.boxShadow = "0 0 20px 10px cyan";
      
      // Remove any existing player shield first
      if (activeShield) activeShield.remove();
      
      // Create visual shield effect around player
      activeShield = document.createElement('div');
      activeShield.id = 'shield-indicator';
      
      // Calculate position properly using getBoundingClientRect()
      const playerRect = tawhirimatea.getBoundingClientRect();
      const gameRect = gameContainer.getBoundingClientRect();
      const relativeTop = playerRect.top - gameRect.top;
      const relativeLeft = playerRect.left - gameRect.left;
      
      activeShield.style.left = (relativeLeft + playerRect.width/2 - 35) + 'px';
      activeShield.style.top = (relativeTop + playerRect.height/2 - 35) + 'px';
      
      gameContainer.appendChild(activeShield);
      
      // Create shields around each star
      stars.forEach(star => {
        const starRect = star.getBoundingClientRect();
        const starShield = document.createElement('div');
        starShield.id = `shield-${star.id}`;
        starShield.className = 'star-shield';
        
        // Position the shield around the star
        starShield.style.position = 'absolute';
        starShield.style.width = '40px';
        starShield.style.height = '40px';
        starShield.style.borderRadius = '50%';
        starShield.style.boxShadow = '0 0 10px 5px cyan';
        starShield.style.animation = 'shieldPulse 2s infinite';
        starShield.style.pointerEvents = 'none';
        
        // Position relative to game container
        const relativeLeft = starRect.left - gameRect.left + (starRect.width / 2) - 20;
        const relativeTop = starRect.top - gameRect.top + (starRect.height / 2) - 20;
        
        starShield.style.left = `${relativeLeft}px`;
        starShield.style.top = `${relativeTop}px`;
        
        gameContainer.appendChild(starShield);
        starShields.push(starShield);
      });
      
      // Remove shields after duration
      setTimeout(() => {
        // Remove player shield
        if (activeShield) {
          activeShield.remove();
          activeShield = null;
        }
        // tawhirimatea.style.boxShadow = "0 0 10px #33ccff";
        
        // Remove all star shields
        starShields.forEach(shield => {
          shield.remove();
        });
        starShields = [];
      }, 8000);
    } else {
      // If deactivating early for some reason, clean up shields
      if (activeShield) {
        activeShield.remove();
        activeShield = null;
      }
      // tawhirimatea.style.boxShadow = "0 0 10px #33ccff";
      
      // Remove all star shields
      starShields.forEach(shield => {
        shield.remove();
      });
      starShields = [];
    }
  });
}

function activateMultiShot() {
  activatePowerUp('multi shot', 8000, (active) => {
    multiShotActive = active;
  });
}

function activateBlastWave() {
  log("💥 Blast Wave Activated!");
  
  document.querySelectorAll('.cloud').forEach(cloud => {
    cloud.classList.add('cloud-blast');
    setTimeout(() => cloud.remove(), 300);
    updateScore(5);
  });
  
  // Create a flash overlay instead of using a class
  const flashOverlay = document.createElement('div');
  flashOverlay.style.position = 'absolute';
  flashOverlay.style.top = '0';
  flashOverlay.style.left = '0';
  flashOverlay.style.width = '100%';
  flashOverlay.style.height = '100%';
  flashOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
  flashOverlay.style.zIndex = '10';
  flashOverlay.style.pointerEvents = 'none';
  gameContainer.appendChild(flashOverlay);
  
  // Remove it after animation would be complete
  setTimeout(() => {
    flashOverlay.remove();
  }, 500);
}

function activateSlowTime() {
  log("🕒 Slow Time Activated!");
  
  // Store original cloud speed
  const originalSpeed = window.cloudSpeed;
  window.cloudSpeed = window.cloudSpeed * 0.5;
  
  // Slow down cloud movement
  document.querySelectorAll('.cloud').forEach(cloud => {
    cloud.style.transition = 'top 0.5s linear';
  });
  
  setTimeout(() => {
    // Restore cloud speed
    window.cloudSpeed = originalSpeed;
    
    document.querySelectorAll('.cloud').forEach(cloud => {
      cloud.style.transition = '';
    });
  }, 8000);
}

// Spawn Power-Ups
function spawnPowerUp(type = 'rapid') {
  if (!gameActive) return;
  
  const powerup = document.createElement('div');
  powerup.classList.add('powerup');
  powerup.dataset.type = type;
  powerup.style.left = Math.random() * (gameContainer.offsetWidth - 30) + 'px';
  powerup.style.top = '0px';
  powerupContainer.appendChild(powerup);

  const fallInterval = setInterval(() => {
    if (!gameActive || isPaused) {
      clearInterval(fallInterval);
      return;
    }
    
    const currentTop = parseInt(powerup.style.top);
    if (currentTop > gameContainer.offsetHeight) {
      powerup.remove();
      clearInterval(fallInterval);
    } else {
      powerup.style.top = currentTop + 2 + 'px';
      
      if (checkCollision(powerup.getBoundingClientRect(), tawhirimatea.getBoundingClientRect())) {
        triggerPowerUp(powerup.dataset.type);
        powerup.remove();
        clearInterval(fallInterval);
      }
    }
  }, 16);
}

function triggerPowerUp(type) {
  // Play power-up collect sound
  soundManager.play('powerupCollect');
  
  switch (type) {
    case 'rapid': 
      activateRapidFire(); 
      soundManager.play('rapidFire');
      updateScore(20);
      break;
    case 'shield': 
      activateShield(); 
      soundManager.play('shield');
      updateScore(20);
      break;
    case 'slow': 
      activateSlowTime(); 
      soundManager.play('slowTime');
      updateScore(20);
      break;
    case 'blast': 
      activateBlastWave(); 
      soundManager.play('blastWave');
      updateScore(20);
      break;
    case 'multi': 
      activateMultiShot(); 
      soundManager.play('multiShot');
      updateScore(20);
      break;
  }
}

// Movement Controls
function moveLeft() {
  if (!gameActive || isPaused) return;
  
  position -= speed;
  if (position < 0) position = 0;
  updatePosition();
}

function moveRight() {
  if (!gameActive || isPaused) return;
  
  const maxRight = gameContainer.offsetWidth - tawhirimatea.offsetWidth;
  position += speed;
  if (position > maxRight) position = maxRight;
  updatePosition();
}

function updatePosition() {
  tawhirimatea.style.left = position + 'px';
  tawhirimatea.style.transform = 'none'; // Override the translateX from CSS
  
  // Update shield position if active
  if (activeShield) {
    activeShield.style.left = parseInt(tawhirimatea.style.left) + tawhirimatea.offsetWidth/2 - 35 + 'px';
  }
}

// Clear all intervals and timers
function clearAllIntervals() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (cloudSpawnInterval) clearInterval(cloudSpawnInterval);
  if (powerupSpawnInterval) clearInterval(powerupSpawnInterval);
  if (rapidFireInterval) clearInterval(rapidFireInterval);
  
  // Clear any other running intervals
  const highestId = window.setTimeout(() => {}, 0);
  for (let i = highestId; i >= 0; i--) {
    window.clearInterval(i);
  }
}

// Reset game
function resetGame() {
  // Play game start sound
  soundManager.play('gameStart');
  
  // Start/restart background music
  soundManager.stopBgMusic();
  soundManager.playBgMusic();

  // Reset game state
  gameActive = true;
  blockedStars = new Set();
  rapidFire = false;
  shieldActive = false;
  multiShotActive = false;
  score = 0;
  currentLevel = 1;
  window.cloudSpeed = 2;
  isPaused = false;
  updateScore(0);
  spaceKeyPressed = false; // Reset space key flag
  
  // Reset stars
  stars.forEach(star => {
    star.style.opacity = '1';
  });
  
  // Clear all elements
  cloudContainer.innerHTML = '';
  blastContainer.innerHTML = '';
  powerupContainer.innerHTML = '';
  
  // Remove shields if they exist
  if (activeShield) {
    activeShield.remove();
    activeShield = null;
  }
  
  // Remove all star shields
  starShields.forEach(shield => {
    shield.remove();
  });
  starShields = [];
  
  // Reset player
  position = gameContainer.offsetWidth / 2 - tawhirimatea.offsetWidth / 2;
  updatePosition();
  // tawhirimatea.style.boxShadow = "0 0 10px #33ccff";
  
  // Restart game systems
  startGame();
  
   // Show the score display
  const scoreDisplay = document.getElementById('score-display');
  if (scoreDisplay) {
    scoreDisplay.style.display = 'block';
  }
}

// Start game systems
function startGame() {
  // Initialize position
  updatePosition();
  
  // Start game loop
  animationFrameId = requestAnimationFrame(gameLoop);
  
  // Initialize level 1 (this will set up cloud and powerup intervals)
  startLevel(1);
  
  // Initial powerups
  setTimeout(() => spawnPowerUp('rapid'), 2000);
  setTimeout(() => spawnPowerUp('multi'), 6000);
}

// Game Loop
function gameLoop(timestamp) {
  if (!gameActive || isPaused) {
    return; // Skip updates while paused or game not active
  }

  if (!lastTime) lastTime = timestamp;
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  if (keys.left) moveLeft();
  if (keys.right) moveRight();

  // Update debug info periodically (every ~500ms)
  if (DEBUG && timestamp % 500 < 16) {
    updateDebugInfo();
  }

  animationFrameId = requestAnimationFrame(gameLoop);
}

// Event Listeners
document.addEventListener('keydown', (e) => {
  // For developer testing: Press "L" to skip to next level
if (e.key === 'l' || e.key === 'L') {
  if (currentLevel < maxLevels) {
    currentLevel++;
    startLevel(currentLevel);
    log(`Level skipped! Now on Level ${currentLevel}`);
  }
}

  if (e.key === 'ArrowLeft' || e.key === 'a') {
    keys.left = true;
    tawhirimatea.style.backgroundImage = "url('images/tawhirimatea-left.png')";
  }
  if (e.key === 'ArrowRight' || e.key === 'd') {
    keys.right = true;
    tawhirimatea.style.backgroundImage = "url('images/tawhirimatea-right.png')";
  }
  if (e.key === 'p' || e.key === 'P') {
    isPaused ? resumeGame() : pauseGame();
  }
  if ((e.code === 'Space' || e.key === ' ') && !rapidFire && !spaceKeyPressed) {
    spaceKeyPressed = true;
    keys.space = true;
    shootBlast();
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a') {
    keys.left = false;
    // tawhirimatea.style.backgroundImage = "url('images/tawhirimatea.png')";
  }
  if (e.key === 'ArrowRight' || e.key === 'd') {
    keys.right = false;
    // tawhirimatea.style.backgroundImage = "url('images/tawhirimatea.png')";
  }
  // This will check after either key is released
  if (!keys.left && !keys.right) {
    tawhirimatea.style.backgroundImage = "url('images/tawhirimatea.png')";
  }
  if (e.code === 'Space' || e.key === ' ') {
    keys.space = false;
    spaceKeyPressed = false;
  }
});

// Touch Controls
// document.getElementById('move-left').addEventListener('click', moveLeft);
// document.getElementById('move-right').addEventListener('click', moveRight);
let leftInterval = null;
let rightInterval = null;

// Move Left Button Hold
document.getElementById('move-left').addEventListener('touchstart', (e) => {
  e.preventDefault();
  keys.left = true;
  tawhirimatea.style.backgroundImage = "url('images/tawhirimatea-left.png')";
  if (!leftInterval) {
    leftInterval = setInterval(() => {
      if (keys.left && !isPaused && gameActive) moveLeft();
    }, 16); // ~60 frames per second
  }
});

document.getElementById('move-left').addEventListener('touchend', (e) => {
  e.preventDefault();
  keys.left = false;
  clearInterval(leftInterval);
  leftInterval = null;
  if (!keys.left && !keys.right) {
    tawhirimatea.style.backgroundImage = "url('images/tawhirimatea.png')";
  }
});

// Move Right Button Hold
document.getElementById('move-right').addEventListener('touchstart', (e) => {
  e.preventDefault();
  keys.right = true;
  tawhirimatea.style.backgroundImage = "url('images/tawhirimatea-right.png')";
  if (!rightInterval) {
    rightInterval = setInterval(() => {
      if (keys.right && !isPaused && gameActive) moveRight();
    }, 16); // ~60 frames per second
  }
});

document.getElementById('move-right').addEventListener('touchend', (e) => {
  e.preventDefault();
  keys.right = false;
  clearInterval(rightInterval);
  rightInterval = null;
  if (!keys.left && !keys.right) {
    tawhirimatea.style.backgroundImage = "url('images/tawhirimatea.png')";
  }
});

document.getElementById('shoot').addEventListener('click', shootBlast);

// Create a pool of reusable cloud elements
const cloudPool = [];

function getCloudFromPool() {
  if (cloudPool.length > 0) {
    return cloudPool.pop();
  } else {
    return document.createElement('div');
  }
}

function returnCloudToPool(cloud) {
  cloud.style.display = 'none';
  cloudPool.push(cloud);
}

