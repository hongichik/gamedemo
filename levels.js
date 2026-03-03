// levels.js - show level list and navigate to game.html with selected level
(async function(){
  function qs(name){
    return new URLSearchParams(location.search).get(name);
  }
  const player = qs('player') || '';
  const levelsList = document.getElementById('levelsList');
  const backBtn = document.getElementById('backBtn');

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

  // Initialize background music on page load
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      initBackgroundMusic();
    }, 300);
  });

  backBtn.addEventListener('click', ()=>{
    // Stop music before navigating back
    stopBackgroundMusic();
    
    // go back to start
    window.location.href = 'index.html';
  });

  async function loadIndex(){
    try{
      const res = await fetch('levels/levels.json');
      const list = await res.json();
      return list;
    }catch(e){
      return ['level1.json','level2.json','level3.json'];
    }
  }

  async function getLevelInfo(filename){
    try{
      const r = await fetch('levels/'+filename);
      const d = await r.json();
      return {
        name: d.name || filename,
        background: d.background || null
      };
    }catch(e){ 
      return {
        name: filename,
        background: null
      }; 
    }
  }

  const levels = await loadIndex();
  levelsList.innerHTML = '';
  for(let i=0;i<levels.length;i++){
    const fname = levels[i];
    const levelInfo = await getLevelInfo(fname);
    const el = document.createElement('div');
    el.className = 'level-item';
    
    // Create level content structure
    el.innerHTML = `
      <div class="level-background" ${levelInfo.background ? `style="background-image: url('${levelInfo.background}')"` : ''}></div>
      <div class="level-content">
        <div class="level-number">${i+1}</div>
        <div class="level-info">
          <div class="level-title">${levelInfo.name}</div>
          <div class="level-subtitle">Nhấp để chơi</div>
        </div>
      </div>
    `;
    
    el.addEventListener('click', ()=>{
      // Stop music before navigating to game
      stopBackgroundMusic();
      
      // navigate to game, pass player and level index
      window.location.href = `game.html?player=${encodeURIComponent(player)}&level=${i}`;
    });
    levelsList.appendChild(el);
  }
})();
