// Game Logic with Start Button, Countdown, Timer and End Game
(async function(){
  // Get URL parameters
  function qs(name){ 
    return new URLSearchParams(location.search).get(name); 
  }
  
  const player = qs('player') || '';
  const levelIndex = parseInt(qs('level') || '0', 10);
  
  // DOM Elements
  const gameStart = document.getElementById('gameStart');
  const countdown = document.getElementById('countdown');
  const timerSection = document.getElementById('timerSection');
  const gamePlaying = document.getElementById('gamePlaying');
  const gameOver = document.getElementById('gameOver');
  
  const startGameBtn = document.getElementById('startGameBtn');
  const endGameBtn = document.getElementById('endGameBtn');
  const endGameBtnPlaying = document.getElementById('endGameBtnPlaying');
  const countdownNumber = document.getElementById('countdownNumber');
  const timeLeft = document.getElementById('timeLeft');
  
  const scoreEl = document.getElementById('score');
  const heartsEl = document.getElementById('hearts');
  const playBtn = document.getElementById('playBtn');
  const grid = document.getElementById('grid');
  const message = document.getElementById('message');
  const roundInfo = document.getElementById('roundInfo');
  
  const gameOverTitle = document.getElementById('gameOverTitle');
  const finalScore = document.getElementById('finalScore');
  const gameOverMessage = document.getElementById('gameOverMessage');
  const playAgainBtn = document.getElementById('playAgainBtn');
  const backToLevelsBtn = document.getElementById('backToLevelsBtn');
  
  // Game State
  let gameState = 'start'; // 'start', 'countdown', 'playing', 'ended'
  let levelData = null;
  let animals = [];
  let pool = [];
  let current = null;
  let score = 0;
  let hearts = 3;
  let timeLimit = 60;
  let timer = null;
  let gameStartTime = null;
  
  // Audio Cache
  const audioCache = new Map();
  
  // Preload countdown audio
  const countdownAudioSrc = 'assets/music/tuomas_data-game-countdown-62-199828.mp3';
  const countdownAudio = new Audio(countdownAudioSrc);
  countdownAudio.preload = 'auto';
  countdownAudio.volume = 0.7;
  
  // Preload correct and wrong sound effects
  const correctSound = new Audio('assets/music/dragon-studio-correct-472358.mp3');
  correctSound.preload = 'auto';
  correctSound.volume = 0.6;
  
  const wrongSound = new Audio('assets/music/universfield-fail-trumpet-242645.mp3');
  wrongSound.preload = 'auto';
  wrongSound.volume = 0.5;  
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
  
  function stopBackgroundMusic() {
    if (backgroundMusic) {
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
      backgroundMusic = null;
    }
    
    // Also stop any global background music from other pages
    if (window.backgroundMusicInstance) {
      window.backgroundMusicInstance.pause();
      window.backgroundMusicInstance.currentTime = 0;
      window.backgroundMusicInstance = null;
    }
  }  
  // Utility Functions
  function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  
  function updateUI() {
    scoreEl.textContent = score;
    heartsEl.textContent = hearts > 0 ? '❤️'.repeat(hearts) : '💔';
  }
  
  function showSection(sectionId) {
    const sections = [gameStart, countdown, timerSection, gamePlaying, gameOver];
    sections.forEach(section => {
      if (section.id === sectionId) {
        section.classList.remove('hidden');
      } else {
        section.classList.add('hidden');
      }
    });
  }
  
  // Audio Functions
  async function fetchAudioFor(word) {
    if (audioCache.has(word)) return audioCache.get(word);
    
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      if (!response.ok) throw new Error('No API audio');
      
      const data = await response.json();
      for (const entry of data) {
        if (entry.phonetics) {
          for (const phonetic of entry.phonetics) {
            if (phonetic.audio) {
              let url = phonetic.audio;
              if (url.startsWith('//')) url = 'https:' + url;
              audioCache.set(word, url);
              return url;
            }
          }
        }
      }
    } catch (e) {
      // Fallback to speech synthesis
    }
    
    audioCache.set(word, null);
    return null;
  }
  
  async function playWord(word) {
    const url = await fetchAudioFor(word);
    if (url) {
      try {
        const audio = new Audio(url);
        await audio.play();
        return;
      } catch (e) {
        // Fallback to speech synthesis
      }
    }
    
    // Use speech synthesis as fallback
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }
  
  // Game Functions
  async function loadLevel() {
    try {
      const response = await fetch(`levels/levels.json`);
      const levels = await response.json();
      const levelFile = levels[levelIndex];
      
      const levelResponse = await fetch(`levels/${levelFile}`);
      levelData = await levelResponse.json();
      
      animals = levelData.words.map(w => w.word);
      timeLimit = levelData.timelimit || 60;
      
      roundInfo.textContent = (player ? player + ' — ' : '') + (levelData.name || `Level ${levelIndex + 1}`);
      
    } catch (e) {
      // Fallback level data
      levelData = {
        name: `Level ${levelIndex + 1}`,
        words: [
          { word: 'dog', description: 'A common pet that barks.', image: 'assets/dog.png' },
          { word: 'cat', description: 'A furry pet that meows.', image: 'assets/cat.png' },
          { word: 'bird', description: 'An animal that flies.', image: 'assets/bird.png' }
        ],
        timelimit: 60
      };
      animals = levelData.words.map(w => w.word);
      timeLimit = 60;
    }
  }
  
  function pickOptions(correct, count = 4) {
    const others = animals.filter(word => word !== correct);
    const picks = shuffle(others).slice(0, Math.max(0, count - 1));
    picks.push(correct);
    return shuffle(picks);
  }
  
  function showGrid(options) {
    grid.innerHTML = '';
    options.forEach(word => {
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.word = word;
      
      // Find the word data in levelData to get the image
      const wordData = levelData.words.find(w => w.word === word);
      const imageUrl = wordData ? wordData.image : `assets/${word}.png`;
      
      const img = document.createElement('img');
      img.alt = word;
      img.src = imageUrl;
      
      const label = document.createElement('div');
      label.className = 'label';
      label.textContent = word;
      
      const overlay = document.createElement('div');
      overlay.className = 'overlay';
      
      card.appendChild(img);
      card.appendChild(label);
      card.appendChild(overlay);
      
      card.addEventListener('click', () => onCardClick(card));
      grid.appendChild(card);
    });
  }
  
  function onCardClick(card) {
    if (gameState !== 'playing' || !current) return;
    
    const picked = card.dataset.word;
    const overlay = card.querySelector('.overlay');
    
    if (picked === current) {
      // Correct answer
      score += 10;
      updateUI();
      
      // Play correct sound
      correctSound.currentTime = 0;
      correctSound.play().catch(e => console.log('Could not play correct sound:', e));
      
      card.classList.add('correct');
      overlay.textContent = '✓';
      overlay.classList.add('show', 'ok');
      
      disableAllCards();
      
      setTimeout(() => {
        nextRound();
      }, 1000);
      
    } else {
      // Wrong answer
      score -= 5;
      if (score < 0) score = 0;
      hearts -= 1;
      
      // Play wrong sound
      wrongSound.currentTime = 0;
      wrongSound.play().catch(e => console.log('Could not play wrong sound:', e));
      
      card.classList.add('incorrect');
      overlay.textContent = '✗';
      overlay.classList.add('show', 'wrong');
      card.classList.add('disabled');
      
      updateUI();
      
      if (hearts <= 0) {
        setTimeout(() => {
          endGame('outOfHearts');
        }, 1000);
      }
    }
  }
  
  function disableAllCards() {
    document.querySelectorAll('.card').forEach(card => {
      card.classList.add('disabled');
    });
  }
  
  function enableAllCards() {
    document.querySelectorAll('.card').forEach(card => {
      card.classList.remove('disabled', 'correct', 'incorrect');
      const overlay = card.querySelector('.overlay');
      overlay.className = 'overlay';
      overlay.textContent = '';
    });
  }
  
  function nextRound() {
    if (gameState !== 'playing') return;
    
    enableAllCards();
    
    if (pool.length === 0) {
      // Level complete
      endGame('levelComplete');
      return;
    }
    
    current = pool.pop();
    const options = pickOptions(current, 4);
    showGrid(options);
    
    setTimeout(() => {
      if (gameState === 'playing') {
        playWord(current);
      }
    }, 500);
  }
  
  function startCountdown() {
    showSection('countdown');
    gameState = 'countdown';
    
    // Play countdown audio
    countdownAudio.currentTime = 0; // Reset to start
    countdownAudio.play().catch(e => {
      console.log('Could not play countdown audio:', e);
    });
    
    let count = 3;
    countdownNumber.textContent = count;
    
    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        countdownNumber.textContent = count;
      } else if (count === 0) {
        countdownNumber.textContent = 'Bắt đầu!';
      } else {
        clearInterval(countdownInterval);
        startGame();
      }
    }, 1000);
  }
  
  function startGame() {
    gameState = 'playing';
    gameStartTime = Date.now();
    
    // Stop background music when actual gameplay starts
    stopBackgroundMusic();
    
    showSection('gamePlaying');
    timerSection.classList.remove('hidden');
    
    // Initialize game state
    score = 0;
    hearts = 3;
    pool = shuffle([...animals]);
    current = null;
    
    updateUI();
    
    // Start timer
    timeLeft.textContent = timeLimit;
    timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
      const remaining = Math.max(0, timeLimit - elapsed);
      timeLeft.textContent = remaining;
      
      if (remaining <= 0) {
        endGame('timeUp');
      }
    }, 1000);
    
    // Start first round
    nextRound();
  }
  
  function endGame(reason) {
    gameState = 'ended';
    
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    
    disableAllCards();
    
    // Show final results
    finalScore.textContent = score;
    
    let title = '';
    let message = '';
    
    switch (reason) {
      case 'timeUp':
        title = '⏰ Hết thời gian!';
        message = `Bạn đã chơi hết ${timeLimit} giây và đạt được ${score} điểm.`;
        break;
      case 'outOfHearts':
        title = '💔 Hết tim!';
        message = `Bạn đã sai quá 3 lần và đạt được ${score} điểm.`;
        break;
      case 'levelComplete':
        title = '🎉 Hoàn thành!';
        message = `Bạn đã hoàn thành level và đạt được ${score} điểm!`;
        break;
      case 'userEnded':
        title = '⏹️ Kết thúc game';
        message = `Bạn đã kết thúc game và đạt được ${score} điểm.`;
        break;
    }
    
    gameOverTitle.textContent = title;
    gameOverMessage.textContent = message;
    
    showSection('gameOver');
  }
  
  function resetGame() {
    gameState = 'start';
    score = 0;
    hearts = 3;
    current = null;
    pool = [];
    
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    
    updateUI();
    showSection('gameStart');
  }
  
  // Event Listeners
  startGameBtn.addEventListener('click', () => {
    startCountdown();
  });
  
  endGameBtn.addEventListener('click', () => {
    stopBackgroundMusic();
    window.location.href = `levels.html?player=${encodeURIComponent(player)}`;
  });
  
  endGameBtnPlaying.addEventListener('click', () => {
    endGame('userEnded');
  });
  
  playBtn.addEventListener('click', () => {
    if (current && gameState === 'playing') {
      playWord(current);
    }
  });
  
  playAgainBtn.addEventListener('click', () => {
    resetGame();
  });
  
  backToLevelsBtn.addEventListener('click', () => {
    stopBackgroundMusic();
    window.location.href = `levels.html?player=${encodeURIComponent(player)}`;
  });
  
  // Stop music when leaving page
  window.addEventListener('beforeunload', stopBackgroundMusic);
  window.addEventListener('unload', stopBackgroundMusic);
  
  // Initialize
  await loadLevel();
  updateUI();
  showSection('gameStart');
  
  // Initialize background music for game page
  setTimeout(() => {
    initBackgroundMusic();
  }, 300);
  
})();
