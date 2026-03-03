// start.js - handle name input and navigate to levels.html
(function(){
  const startBtn = document.getElementById('startBtn');
  const input = document.getElementById('playerName');
  
  // Background music setup
  let backgroundMusic = null;
  
  function initBackgroundMusic() {
    // Stop any existing background music first
    if (window.backgroundMusicInstance) {
      window.backgroundMusicInstance.pause();
      window.backgroundMusicInstance.currentTime = 0;
    }
    
    if (!backgroundMusic) {
      backgroundMusic = new Audio('assets/music/xtremefreddy-game-music-loop-6-144641.mp3');
      backgroundMusic.loop = true;
      backgroundMusic.volume = 0.3;
      
      // Store reference globally
      window.backgroundMusicInstance = backgroundMusic;
    }
    
    // Try to play background music
    backgroundMusic.play().catch(error => {
      console.log('Background music autoplay prevented:', error);
    });
  }
  
  // Function to stop background music when leaving page
  function stopBackgroundMusic() {
    if (backgroundMusic) {
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
      backgroundMusic = null;
    }
    if (window.backgroundMusicInstance) {
      window.backgroundMusicInstance.pause();
      window.backgroundMusicInstance.currentTime = 0;
      window.backgroundMusicInstance = null;
    }
  }
  
  // Stop music when leaving page
  window.addEventListener('beforeunload', stopBackgroundMusic);
  window.addEventListener('unload', stopBackgroundMusic);
  
  // Request audio permissions immediately when page loads
  async function requestAudioPermissions() {
    try {
      // Try to initialize audio context for permission
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create a dummy audio element to trigger permission request
      const audio = new Audio();
      audio.volume = 0.01; // Very quiet
      audio.muted = true;
      
      // Try to play a silent sound to request permission
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dtt2slBjiW1vbFdiLu';
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise.catch(() => {});
      }
      
      // Clean up
      audio.pause();
      audio.currentTime = 0;
      
      console.log('Audio permissions initialized');
      
      // Resume AudioContext if needed
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // Start background music after permission granted
      setTimeout(() => {
        initBackgroundMusic();
      }, 500);
      
    } catch (error) {
      console.log('Audio permission request failed:', error);
      
      // Show user-friendly message
      const message = document.createElement('div');
      message.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 193, 7, 0.9);
        color: #333;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        backdrop-filter: blur(10px);
      `;
      message.textContent = '🔊 Vui lòng cho phép truy cập âm thanh để có trải nghiệm tốt nhất!';
      document.body.appendChild(message);
      
      // Remove message after 5 seconds
      setTimeout(() => {
        if (message.parentNode) {
          message.parentNode.removeChild(message);
        }
      }, 5000);
    }
  }
  
  // Initialize audio permissions on page load
  document.addEventListener('DOMContentLoaded', requestAudioPermissions);
  
  // Also try again on first user interaction
  let hasTriedUserInteraction = false;
  document.addEventListener('click', () => {
    if (!hasTriedUserInteraction) {
      hasTriedUserInteraction = true;
      requestAudioPermissions();
    }
  });
  
  startBtn.addEventListener('click', ()=>{
    const name = input.value.trim();
    if(!name){ alert('Vui lòng nhập họ và tên'); return; }
    
    // Stop music before navigating to prevent overlap
    stopBackgroundMusic();
    
    // use simple relative navigation
    window.location.href = `levels.html?player=${encodeURIComponent(name)}`;
  });
})();
