// Sound System for Tāwhirimātea Game
// ===========================

// Sound Configuration
const SOUNDS = {
    // UI Sounds
    menuSelect: { src: 'sounds/menu-select.mp3', volume: 0.5 },
    gameStart: { src: 'sounds/game-start.mp3', volume: 0.7 },
    pause: { src: 'sounds/pause.mp3', volume: 0.5 },
    resume: { src: 'sounds/resume.mp3', volume: 0.5 },
    
    // Gameplay Sounds
    shoot: { src: 'sounds/shoot.mp3', volume: 0.4 },
    cloudHit: { src: 'sounds/cloud-hit.mp3', volume: 0.6 },
    playerHit: { src: 'sounds/player-hit.mp3', volume: 0.7 },
    starBlocked: { src: 'sounds/star-blocked.mp3', volume: 0.8 },
    
    // Power-up Sounds
    powerupCollect: { src: 'sounds/powerup-collect.mp3', volume: 0.6 },
    rapidFire: { src: 'sounds/rapid-fire.mp3', volume: 0.5 },
    shield: { src: 'sounds/shield.mp3', volume: 0.6 },
    multiShot: { src: 'sounds/multi-shot.mp3', volume: 0.5 },
    blastWave: { src: 'sounds/blast-wave.mp3', volume: 0.7 },
    slowTime: { src: 'sounds/slow-time.mp3', volume: 0.6 },
    
    // Game State Sounds
    levelUp: { src: 'sounds/level-up.mp3', volume: 0.8 },
    gameOver: { src: 'sounds/game-over.mp3', volume: 0.7 },
    highScore: { src: 'sounds/high-score.mp3', volume: 0.8 },
    
    // Background Music
    bgMusic: { src: 'sounds/bg-music.mp3', volume: 0.3, loop: true }
  };
  
  // Sound Manager Class
  class SoundManager {
    constructor() {
      this.sounds = {};
      this.muted = false;
      this.bgMusicPlaying = false;
      this.currentBgMusic = null;
      this.soundsLoaded = false;
      this.audioSupported = 'Audio' in window; // Fixed: Moved inside the constructor
      
      // Create volume controls
      this.createVolumeControl();
      
      // Check if localStorage has mute preference
      const muteSetting = localStorage.getItem('tawSoundMuted');
      if (muteSetting !== null) {
        this.muted = muteSetting === 'true';
        this.updateMuteButton();
      }
    }
    
    // In sound-manager.js, modify the preloadSounds method:
preloadSounds() {
  return new Promise((resolve) => {
    let soundsToLoad = Object.keys(SOUNDS).length;
    let soundsLoaded = 0;
    
    // If we've already loaded sounds, resolve immediately
    if (this.soundsLoaded) {
      resolve();
      return;
    }
    
    for (const [key, config] of Object.entries(SOUNDS)) {
      const sound = new Audio();
      sound.src = config.src;
      sound.volume = config.volume || 0.5;
      sound.preload = 'auto';
      
      if (config.loop) {
        sound.loop = true;
      }
      
      // Track load completion
      sound.addEventListener('canplaythrough', () => {
        soundsLoaded++;
        console.log(`✅ Loaded: ${key} (${soundsLoaded}/${soundsToLoad})`);
        if (soundsLoaded >= soundsToLoad) {
          this.soundsLoaded = true;
          resolve();
        }
      }, { once: true });
      
      // Handle loading errors
      sound.addEventListener('error', (e) => {
        console.error(`❌ Error loading sound ${key} from ${config.src}:`, e);
        soundsLoaded++;
        if (soundsLoaded >= soundsToLoad) {
          this.soundsLoaded = true;
          resolve();
        }
      });
      
      this.sounds[key] = sound;
    }
  });
}
    
    // Play a sound by key
    play(soundKey) {
      if (!this.audioSupported || this.muted || !this.sounds[soundKey]) return;
      
      try {
        // For sounds that might overlap, clone the audio
        if (soundKey === 'shoot' || soundKey === 'cloudHit') {
          const clone = this.sounds[soundKey].cloneNode();
          clone.volume = SOUNDS[soundKey].volume || 0.5;
          clone.play().catch(e => console.error('Error playing sound:', e));
        } else {
          // For other sounds, reset and play the original
          const sound = this.sounds[soundKey];
          sound.currentTime = 0;
          sound.play().catch(e => console.error('Error playing sound:', e));
        }
      } catch (error) {
        console.error(`Error playing sound ${soundKey}:`, error);
      }
    }
    
    // Start background music
    playBgMusic(key = 'bgMusic') {
      if (this.muted || this.bgMusicPlaying) return;
      
      try {
        const music = this.sounds[key];
        if (music) {
          music.loop = true;
          music.currentTime = 0;
          music.play().catch(e => console.error('Error playing background music:', e));
          this.bgMusicPlaying = true;
          this.currentBgMusic = key;
        }
      } catch (error) {
        console.error('Error starting background music:', error);
      }
    }
    
    // Stop background music
    stopBgMusic() {
      if (!this.currentBgMusic || !this.bgMusicPlaying) return;
      
      try {
        const music = this.sounds[this.currentBgMusic];
        if (music) {
          music.pause();
          music.currentTime = 0;
          this.bgMusicPlaying = false;
        }
      } catch (error) {
        console.error('Error stopping background music:', error);
      }
    }
    
    // New method: Resume background music
    resumeBgMusic() {
      if (this.muted || !this.currentBgMusic) return;
      
      try {
        const music = this.sounds[this.currentBgMusic];
        if (music && !this.bgMusicPlaying) {
          music.play().catch(e => console.error('Error resuming background music:', e));
          this.bgMusicPlaying = true;
        }
      } catch (error) {
        console.error('Error resuming background music:', error);
      }
    }
    
    // Toggle mute state
    toggleMute() {
      this.muted = !this.muted;
      
      // Save preference to localStorage
      localStorage.setItem('tawSoundMuted', this.muted);
      
      // Update button appearance
      this.updateMuteButton();
      
      // Handle background music
      if (this.muted) {
        if (this.currentBgMusic && this.bgMusicPlaying) {
          const music = this.sounds[this.currentBgMusic];
          if (music) {
            music.pause();
          }
        }
      } else if (this.currentBgMusic && !this.bgMusicPlaying && gameActive && !isPaused) {
        const music = this.sounds[this.currentBgMusic];
        if (music) {
          music.play().catch(e => console.error('Error resuming music after unmute:', e));
          this.bgMusicPlaying = true;
        }
      }
      
      return this.muted;
    }
    
    // Create volume control UI
    createVolumeControl() {
      const controlsContainer = document.createElement('div');
      controlsContainer.id = 'sound-controls';
      controlsContainer.style.position = 'absolute';
      controlsContainer.style.top = '10px';
      controlsContainer.style.left = '10px';
      controlsContainer.style.zIndex = '10';
      
      const muteButton = document.createElement('button');
      muteButton.id = 'mute-button';
      muteButton.style.background = 'rgba(0, 0, 0, 0.5)';
      muteButton.style.border = 'none';
      muteButton.style.borderRadius = '50%';
      muteButton.style.width = '36px';
      muteButton.style.height = '36px';
      muteButton.style.color = 'white';
      muteButton.style.fontSize = '20px';
      muteButton.style.cursor = 'pointer';
      muteButton.style.display = 'flex';
      muteButton.style.justifyContent = 'center';
      muteButton.style.alignItems = 'center';
      muteButton.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.3)';
      muteButton.innerHTML = '🔊';
      muteButton.title = 'Toggle Sound';
      
      muteButton.addEventListener('click', () => {
        this.toggleMute();
      });
      
      controlsContainer.appendChild(muteButton);
      
      // Append to DOM when ready
      if (document.readyState === 'complete') {
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
          gameContainer.appendChild(controlsContainer);
        }
      } else {
        window.addEventListener('DOMContentLoaded', () => {
          const gameContainer = document.getElementById('game-container');
          if (gameContainer) {
            gameContainer.appendChild(controlsContainer);
          }
        });
      }
    }
    
    // Update mute button appearance
    updateMuteButton() {
      const muteButton = document.getElementById('mute-button');
      if (muteButton) {
        muteButton.innerHTML = this.muted ? '🔇' : '🔊';
      }
    }
  }
  
  // Create global sound manager instance
  const soundManager = new SoundManager();
  