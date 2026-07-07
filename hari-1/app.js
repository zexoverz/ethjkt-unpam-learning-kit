// Pokemon Gacha Game Logic with Roaming Safari Park and Audio Synth

// --- IMAGE CDN PROXY FOR REGIONAL BLOCK BYPASS ---
function proxyUrl(url) {
  if (!url) return url;
  // Bypasses regional block and handles jsdelivr package size limit by avoiding branch name
  return url.replace('https://raw.githubusercontent.com/PokeAPI/sprites/master/', 'https://cdn.jsdelivr.net/gh/PokeAPI/sprites/');
}

// --- AUDIO SYNTH (Web Audio API) ---
class SoundSynth {
  constructor() {
    this.ctx = null;
    this.enabled = false;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playSelect() {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playCoin() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    
    const playTone = (freq, time, dur) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + dur);
    };

    playTone(987.77, now, 0.08); // B5
    playTone(1318.51, now + 0.08, 0.25); // E6
  }

  playShake() {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.25);
    
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playSuccess() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    
    const melody = [
      { f: 523.25, d: 0.1 },  // C5
      { f: 659.25, d: 0.1 },  // E5
      { f: 783.99, d: 0.1 },  // G5
      { f: 1046.50, d: 0.15 }, // C6
      { f: 1318.51, d: 0.3 }   // E6
    ];
    
    let time = now;
    melody.forEach(note => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, time);
      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + note.d);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + note.d);
      time += note.d - 0.02;
    });
  }

  playCry(baseFreq) {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(baseFreq || 300, now);
    osc.frequency.linearRampToValueAtTime((baseFreq || 300) * 1.5, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime((baseFreq || 300) * 0.7, now + 0.35);
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.35);
  }

  playError() {
    if (!this.enabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.setValueAtTime(100, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }
}

// --- BGM RETRO 8-BIT melody SEQUENCER ---
class BGMPlayer {
  constructor(synth) {
    this.synth = synth;
    this.isPlaying = false;
    this.timeouts = [];
    this.currentNoteIndex = 0;
    
    // Pokemon Theme Song (Chorus & Main Verse notes)
    this.melody = [
      // Verse: "I wanna be the very best..."
      { f: 392.00, d: 0.25 }, // G4
      { f: 392.00, d: 0.25 }, // G4
      { f: 392.00, d: 0.25 }, // G4
      { f: 392.00, d: 0.25 }, // G4
      { f: 466.16, d: 0.25 }, // A#4
      { f: 523.25, d: 0.25 }, // C5
      { f: 466.16, d: 0.50 }, // A#4
      { f: 0, d: 0.10 },      // rest
      
      // "Like no one ever was..."
      { f: 523.25, d: 0.25 }, // C5
      { f: 523.25, d: 0.25 }, // C5
      { f: 523.25, d: 0.25 }, // C5
      { f: 523.25, d: 0.25 }, // C5
      { f: 587.33, d: 0.25 }, // D5
      { f: 622.25, d: 0.25 }, // D#5
      { f: 587.33, d: 0.50 }, // D5
      { f: 0, d: 0.10 },      // rest
      
      // "To catch them is my real test..."
      { f: 622.25, d: 0.25 }, // D#5
      { f: 622.25, d: 0.25 }, // D#5
      { f: 622.25, d: 0.25 }, // D#5
      { f: 622.25, d: 0.25 }, // D#5
      { f: 698.46, d: 0.25 }, // F5
      { f: 783.99, d: 0.25 }, // G5
      { f: 698.46, d: 0.50 }, // F5
      { f: 0, d: 0.10 },      // rest
      
      // "To train them is my cause..."
      { f: 783.99, d: 0.25 }, // G5
      { f: 783.99, d: 0.25 }, // G5
      { f: 783.99, d: 0.25 }, // G5
      { f: 783.99, d: 0.25 }, // G5
      { f: 830.61, d: 0.25 }, // G#5
      { f: 932.33, d: 0.25 }, // A#5
      { f: 830.61, d: 0.50 }, // G#5
      { f: 0, d: 0.15 },      // rest
      
      // Chorus: "Pokemon! Gotta catch 'em all!"
      { f: 523.25, d: 0.35 }, // C5
      { f: 587.33, d: 0.15 }, // D5
      { f: 622.25, d: 0.50 }, // D#5
      { f: 0, d: 0.20 },      // rest
      
      // "It's you and me..."
      { f: 698.46, d: 0.25 }, // F5
      { f: 783.99, d: 0.25 }, // G5
      { f: 830.61, d: 0.25 }, // G#5
      { f: 783.99, d: 0.50 }, // G5
      { f: 0, d: 0.10 },      // rest
      
      // "I know it's my destiny..."
      { f: 932.33, d: 0.30 }, // A#5
      { f: 830.61, d: 0.15 }, // G#5
      { f: 783.99, d: 0.30 }, // G5
      { f: 698.46, d: 0.30 }, // F5
      { f: 622.25, d: 0.60 }, // D#5
      { f: 0, d: 0.15 },      // rest
      
      // "Pokemon! Oh, you're my best friend"
      { f: 523.25, d: 0.35 }, // C5
      { f: 587.33, d: 0.15 }, // D5
      { f: 622.25, d: 0.50 }, // D#5
      { f: 0, d: 0.20 },      // rest
      { f: 698.46, d: 0.25 }, // F5
      { f: 783.99, d: 0.25 }, // G5
      { f: 830.61, d: 0.25 }, // G#5
      { f: 783.99, d: 0.50 }, // G5
      { f: 0, d: 0.10 },      // rest
      
      // "In a world we must defend!"
      { f: 932.33, d: 0.25 }, // A#5
      { f: 932.33, d: 0.25 }, // A#5
      { f: 932.33, d: 0.25 }, // A#5
      { f: 1046.50, d: 0.25 },// C6
      { f: 932.33, d: 0.70 }, // A#5
      
      { f: 0, d: 2.50 }       // delay before repeating
    ];
  }

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentNoteIndex = 0;
    this.playNextNote();
  }

  stop() {
    this.isPlaying = false;
    this.timeouts.forEach(clearTimeout);
    this.timeouts = [];
  }

  playNextNote() {
    if (!this.isPlaying || !this.synth.enabled) {
      this.isPlaying = false;
      return;
    }

    const note = this.melody[this.currentNoteIndex];
    
    if (note.f > 0) {
      this.synth.init();
      const osc = this.synth.ctx.createOscillator();
      const gain = this.synth.ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(note.f, this.synth.ctx.currentTime);
      
      // Very soft volume so it plays nicely as background music
      gain.gain.setValueAtTime(0.015, this.synth.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.synth.ctx.currentTime + note.d);
      
      osc.connect(gain);
      gain.connect(this.synth.ctx.destination);
      osc.start();
      osc.stop(this.synth.ctx.currentTime + note.d);
    }

    this.currentNoteIndex = (this.currentNoteIndex + 1) % this.melody.length;
    const t = setTimeout(() => this.playNextNote(), note.d * 1000);
    this.timeouts.push(t);
  }
}

const sfx = new SoundSynth();
const bgm = new BGMPlayer(sfx);

// --- GAME STATE ---
const GAME_STATE = {
  coins: parseInt(localStorage.getItem('pkmn_coins')) || 500,
  tickets: parseInt(localStorage.getItem('pkmn_tickets')) || 5,
  collection: JSON.parse(localStorage.getItem('pkmn_collection')) || {},
  roamingLimit: 12,
  cache: JSON.parse(localStorage.getItem('pkmn_api_cache')) || {}
};

// Legendary / Epic IDs
const EPIC_IDS = [
  150, 151, // Mewtwo, Mew
  249, 250, 251, // Lugia, Ho-Oh, Celebi
  382, 383, 384, 385, // Kyogre, Groudon, Rayquaza, Jirachi
  483, 484, 487, 493, // Dialga, Palkia, Giratina, Arceus
  643, 644, 646, // Reshiram, Zekrom, Kyurem
  716, 717, 718, 719, // Xerneas, Yveltal, Zygarde, Diancie
  789, 790, 791, 792, 800, // Cosmog, Cosmoem, Solgaleo, Lunala, Necrozma
  888, 889, 890, // Zacian, Zamazenta, Eternatus
  1007, 1008 // Koraidon, Miraidon
];

// Rare IDs (Starters, Eeveelutions, cool Pokemon)
const RARE_IDS = [
  1, 4, 7, // Bulbasaur, Charmander, Squirtle
  3, 6, 9, // Venusaur, Charizard, Blastoise
  25, 26, // Pikachu, Raichu
  133, 134, 135, 136, 196, 197, 470, 471, 700, // Eeveelutions
  94, // Gengar
  143, // Snorlax
  147, 148, 149, // Dratini, Dragonair, Dragonite
  448, // Lucario
  658 // Greninja
];

// --- IMAGE CDN MIGRATION FOR OLD COLLECTION ITEMS ---
function migrateCollectionUrls() {
  let updated = false;
  for (let key in GAME_STATE.collection) {
    let pkmn = GAME_STATE.collection[key];
    if (pkmn.sprites?.artwork && pkmn.sprites.artwork.includes('raw.githubusercontent.com')) {
      pkmn.sprites.artwork = proxyUrl(pkmn.sprites.artwork);
      updated = true;
    }
    if (pkmn.sprites?.front_default && pkmn.sprites.front_default.includes('raw.githubusercontent.com')) {
      pkmn.sprites.front_default = proxyUrl(pkmn.sprites.front_default);
      updated = true;
    }
    if (pkmn.sprites?.versions?.['generation-v']?.['black-white']?.animated?.front_default &&
        pkmn.sprites.versions['generation-v']['black-white'].animated.front_default.includes('raw.githubusercontent.com')) {
      pkmn.sprites.versions['generation-v']['black-white'].animated.front_default = 
        proxyUrl(pkmn.sprites.versions['generation-v']['black-white'].animated.front_default);
      updated = true;
    }
  }
  if (updated) {
    localStorage.setItem('pkmn_collection', JSON.stringify(GAME_STATE.collection));
  }
  
  // Also clear cache for clean reload
  let cacheUpdated = false;
  for (let id in GAME_STATE.cache) {
    let cached = GAME_STATE.cache[id];
    if (cached.sprites?.artwork && cached.sprites.artwork.includes('raw.githubusercontent.com')) {
      cached.sprites.artwork = proxyUrl(cached.sprites.artwork);
      cacheUpdated = true;
    }
    if (cached.sprites?.front_default && cached.sprites.front_default.includes('raw.githubusercontent.com')) {
      cached.sprites.front_default = proxyUrl(cached.sprites.front_default);
      cacheUpdated = true;
    }
    if (cached.sprites?.versions?.['generation-v']?.['black-white']?.animated?.front_default &&
        cached.sprites.versions['generation-v']['black-white'].animated.front_default.includes('raw.githubusercontent.com')) {
      cached.sprites.versions['generation-v']['black-white'].animated.front_default = 
        proxyUrl(cached.sprites.versions['generation-v']['black-white'].animated.front_default);
      cacheUpdated = true;
    }
  }
  if (cacheUpdated) {
    localStorage.setItem('pkmn_api_cache', JSON.stringify(GAME_STATE.cache));
  }
}

// --- SAFARI PARK WORLD PHYSICS & ACTIVITIES ---
let globalTrees = [];

class RoamingPokemon {
  constructor(pokemonData, parentEl) {
    this.data = pokemonData;
    this.parent = parentEl;
    this.width = 64;
    this.height = 64;
    
    // Choose random starting position inside bounds
    const pRect = parentEl.getBoundingClientRect();
    this.x = Math.random() * (pRect.width - this.width);
    // Keep them on the lower grass area
    this.y = (pRect.height * 0.4) + Math.random() * (pRect.height * 0.5 - this.height);
    
    // Low speeds for gentle wandering
    this.dx = (Math.random() - 0.5) * 0.8;
    this.dy = (Math.random() - 0.5) * 0.8;
    
    this.speechTimer = Math.random() * 5000 + 3000;
    this.isHopping = false;
    
    // Interactive states: 'wandering', 'sleeping', 'walking_to_tree', 'eating'
    this.state = 'wandering';
    this.stateTimer = Math.random() * 10000 + 5000;
    this.targetTree = null;
    
    this.createDOM();
  }

  createDOM() {
    this.el = document.createElement('div');
    this.el.className = 'roaming-pokemon';
    
    // Setup position
    this.el.style.left = `${this.x}px`;
    this.el.style.top = `${this.y}px`;
    
    // Sprites: Animated GIF generation-v Black & White or fallback
    const animatedSprite = this.data.sprites?.versions?.['generation-v']?.['black-white']?.animated?.front_default;
    const fallbackSprite = this.data.sprites?.front_default;
    const imgUrl = proxyUrl(animatedSprite || fallbackSprite || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/132.png');
    
    const img = document.createElement('img');
    img.src = imgUrl;
    img.alt = this.data.name;
    img.draggable = false;
    
    // If the image fails to load, let's fallback to standard static artwork so the user never sees a broken image!
    img.onerror = () => {
      const fallbackArtwork = this.data.sprites?.artwork;
      if (fallbackArtwork && img.src !== fallbackArtwork) {
        img.src = fallbackArtwork;
      }
    };
    
    this.el.appendChild(img);
    this.parent.appendChild(this.el);
    
    // Events
    this.el.addEventListener('click', () => this.interact());
  }

  step(width, height) {
    const playHeightMin = height * 0.4;
    const playHeightMax = height - this.height;

    // State machine updates
    this.stateTimer -= 16.6;

    if (this.state === 'sleeping') {
      this.dx = 0;
      this.dy = 0;
      if (this.stateTimer <= 0) {
        // Awake
        this.state = 'wandering';
        this.el.classList.remove('sleeping');
        this.stateTimer = Math.random() * 10000 + 6000;
        this.dx = (Math.random() - 0.5) * 0.8;
        this.dy = (Math.random() - 0.5) * 0.8;
        this.showCustomBubble("Pagi dunia!");
      }
    } 
    else if (this.state === 'eating') {
      this.dx = 0;
      this.dy = 0;
      if (this.stateTimer <= 0) {
        // Done eating
        this.state = 'wandering';
        this.stateTimer = Math.random() * 12000 + 8000;
        this.dx = (Math.random() - 0.5) * 0.8;
        this.dy = (Math.random() - 0.5) * 0.8;
      }
    } 
    else if (this.state === 'walking_to_tree') {
      if (!this.targetTree || this.stateTimer <= 0) {
        this.state = 'wandering';
        this.stateTimer = Math.random() * 8000 + 4000;
      } else {
        // Walk towards target tree (aim for base of tree trunk)
        const targetX = this.targetTree.x + 8; // Tree trunk center
        const targetY = this.targetTree.y + 70; // Tree trunk base
        
        const diffX = targetX - this.x;
        const diffY = targetY - this.y;
        const dist = Math.sqrt(diffX * diffX + diffY * diffY);
        
        if (dist < 20) {
          // Reached tree! Eat fruit
          this.state = 'eating';
          this.stateTimer = 4000; // Eat for 4 seconds
          this.dx = 0;
          this.dy = 0;
          this.showCustomBubble("Nyam Nyam! 🍎");
        } else {
          // Move towards tree slightly faster than normal wander
          const speed = 1.2;
          this.dx = (diffX / dist) * speed;
          this.dy = (diffY / dist) * speed;
          
          this.x += this.dx;
          this.y += this.dy;
        }
      }
    } 
    else { // wandering
      this.x += this.dx;
      this.y += this.dy;
      
      // Boundary collision bouncing
      if (this.x <= 0) { this.x = 0; this.dx *= -1; }
      if (this.x >= width - this.width) { this.x = width - this.width; this.dx *= -1; }
      if (this.y <= playHeightMin) { this.y = playHeightMin; this.dy *= -1; }
      if (this.y >= playHeightMax) { this.y = playHeightMax; this.dy *= -1; }
      
      // Check for state change
      if (this.stateTimer <= 0) {
        const rand = Math.random();
        if (rand < 0.25 && globalTrees.length > 0) {
          // Go eat from a tree
          this.targetTree = globalTrees[Math.floor(Math.random() * globalTrees.length)];
          this.state = 'walking_to_tree';
          this.stateTimer = 15000; // Timeout walking
          this.showCustomBubble("Laper... 🍇");
        } else if (rand < 0.5) {
          // Sleep
          this.state = 'sleeping';
          this.el.classList.add('sleeping');
          this.stateTimer = 6000; // Sleep for 6 seconds
          this.showCustomBubble("Zzz...");
          this.dx = 0;
          this.dy = 0;
        } else {
          // Keep wandering, reset timer
          this.stateTimer = Math.random() * 12000 + 6000;
        }
      }
      
      // Random wandering direction shifts
      if (Math.random() < 0.005) {
        this.dx = (Math.random() - 0.5) * 0.8;
        this.dy = (Math.random() - 0.5) * 0.8;
      }
    }

    // Face direction depending on horizontal velocity
    if (this.dx < 0) {
      this.el.classList.add('facing-left');
      this.el.classList.remove('facing-right');
    } else if (this.dx > 0) {
      this.el.classList.add('facing-right');
      this.el.classList.remove('facing-left');
    }
    
    // Update DOM position
    this.el.style.left = `${this.x}px`;
    this.el.style.top = `${this.y}px`;
    
    // Random speech bubble phrases (only if wandering)
    if (this.state === 'wandering') {
      this.speechTimer -= 16.6;
      if (this.speechTimer <= 0) {
        this.showBubble();
        this.speechTimer = Math.random() * 18000 + 10000;
      }
    }
  }

  showBubble() {
    const existing = this.el.querySelector('.speech-bubble');
    if (existing) existing.remove();
    
    const bubble = document.createElement('div');
    bubble.className = 'speech-bubble';
    
    const phrases = [
      `${this.data.name.toUpperCase()}!`,
      "Kyaa~",
      "Hello!",
      "*sniff*",
      "Lalalala~",
      "Yay!",
      "♥"
    ];
    bubble.innerText = phrases[Math.floor(Math.random() * phrases.length)];
    
    this.el.appendChild(bubble);
    setTimeout(() => bubble.remove(), 2500);
  }

  showCustomBubble(text) {
    const existing = this.el.querySelector('.speech-bubble');
    if (existing) existing.remove();
    
    const bubble = document.createElement('div');
    bubble.className = 'speech-bubble';
    bubble.innerText = text;
    
    this.el.appendChild(bubble);
    setTimeout(() => bubble.remove(), 3000);
  }

  interact() {
    if (this.isHopping) return;
    this.isHopping = true;
    sfx.playCry(250 + (this.data.id % 400));
    
    const img = this.el.querySelector('img');
    img.style.transform = 'translateY(-18px) scaleY(1.15)';
    
    setTimeout(() => {
      img.style.transform = 'translateY(0) scaleY(1)';
      this.isHopping = false;
    }, 250);
    
    if (this.state === 'sleeping') {
      // Wake up upon click!
      this.state = 'wandering';
      this.el.classList.remove('sleeping');
      this.stateTimer = Math.random() * 8000 + 4000;
      this.dx = (Math.random() - 0.5) * 0.8;
      this.dy = (Math.random() - 0.5) * 0.8;
      this.showCustomBubble("Eh! Kebangun!");
    } else {
      this.showBubble();
    }
  }

  destroy() {
    this.el.remove();
  }
}

// Global active roaming items
let activeRoamers = [];
let safariPlaygroundEl = null;
let animationFrameId = null;

function initSafariPark() {
  safariPlaygroundEl = document.getElementById('safari-playground');
  
  // Clean old roamers & trees
  activeRoamers.forEach(r => r.destroy());
  activeRoamers = [];
  
  const existingTrees = safariPlaygroundEl.querySelectorAll('.safari-tree');
  existingTrees.forEach(t => t.remove());
  globalTrees = [];
  
  // Generate Trees dynamically
  const pRect = safariPlaygroundEl.getBoundingClientRect();
  const treePositions = [
    { x: pRect.width * 0.15, y: pRect.height * 0.45 },
    { x: pRect.width * 0.5, y: pRect.height * 0.52 },
    { x: pRect.width * 0.8, y: pRect.height * 0.48 }
  ];
  
  treePositions.forEach((pos, idx) => {
    const treeEl = document.createElement('div');
    treeEl.className = 'safari-tree';
    treeEl.style.left = `${pos.x}px`;
    treeEl.style.top = `${pos.y}px`;
    
    // foliage container
    const foliage = document.createElement('div');
    foliage.className = 'safari-tree-foliage';
    
    // 3 layered pixel leaves blocks
    for (let i = 1; i <= 3; i++) {
      const layer = document.createElement('div');
      layer.className = `foliage-layer foliage-${i}`;
      foliage.appendChild(layer);
    }
    
    // Add pixel apples to foliage-2 layer
    const apples = [
      { t: '12px', l: '16px' },
      { t: '28px', l: '36px' },
      { t: '16px', l: '44px' }
    ];
    apples.forEach(applePos => {
      const apple = document.createElement('div');
      apple.className = 'safari-fruit';
      apple.style.top = applePos.t;
      apple.style.left = applePos.l;
      foliage.querySelector('.foliage-2').appendChild(apple);
    });
    
    const trunk = document.createElement('div');
    trunk.className = 'safari-tree-trunk';
    
    treeEl.appendChild(foliage);
    treeEl.appendChild(trunk);
    safariPlaygroundEl.appendChild(treeEl);
    
    globalTrees.push({ x: pos.x, y: pos.y, el: treeEl });
  });
  
  // Get list of caught pokemon
  const caughtList = Object.values(GAME_STATE.collection);
  if (caughtList.length === 0) return;
  
  // Pick up to roamingLimit random ones to roam around
  const shuffled = [...caughtList].sort(() => 0.5 - Math.random());
  const toRoam = shuffled.slice(0, GAME_STATE.roamingLimit);
  
  toRoam.forEach(pkmn => {
    const roamer = new RoamingPokemon(pkmn, safariPlaygroundEl);
    activeRoamers.push(roamer);
  });
  
  // Start animation loop if not running
  if (!animationFrameId) {
    animateSafari();
  }
}

function animateSafari() {
  if (safariPlaygroundEl) {
    const rect = safariPlaygroundEl.getBoundingClientRect();
    activeRoamers.forEach(roamer => {
      roamer.step(rect.width, rect.height);
    });
  }
  animationFrameId = requestAnimationFrame(animateSafari);
}

// --- POKEAPI FETCH CLIENT WITH CACHING ---
async function fetchPokemonData(id) {
  // Check local cache first
  if (GAME_STATE.cache[id]) {
    return GAME_STATE.cache[id];
  }
  
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!response.ok) throw new Error("Gagal mengambil data dari PokeAPI");
    
    const data = await response.json();
    
    // Save only necessary details to minimize storage consumption
    const cleanData = {
      id: data.id,
      name: data.name,
      types: data.types.map(t => t.type.name),
      stats: data.stats.map(s => ({ name: s.stat.name, val: s.base_stat })),
      sprites: {
        front_default: proxyUrl(data.sprites.front_default),
        artwork: proxyUrl(data.sprites.other?.['official-artwork']?.front_default),
        versions: {
          'generation-v': {
            'black-white': {
              animated: {
                front_default: proxyUrl(data.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default)
              }
            }
          }
        }
      }
    };
    
    // Cache it
    GAME_STATE.cache[id] = cleanData;
    localStorage.setItem('pkmn_api_cache', JSON.stringify(GAME_STATE.cache));
    
    return cleanData;
  } catch (err) {
    console.error("Kesalahan fetch PokeAPI:", err);
    return null;
  }
}

// --- GACHA ROLL GENERATOR ---
function determineRarity() {
  const rand = Math.random() * 100;
  if (rand < 1) return { key: 'shiny', ball: 'master', label: 'Shiny/Master' };
  if (rand < 10) return { key: 'epic', ball: 'ultra', label: 'Epic' };
  if (rand < 40) return { key: 'rare', ball: 'great', label: 'Rare' };
  return { key: 'common', ball: 'normal', label: 'Common' };
}

function getRandomIdForRarity(rarityKey) {
  if (rarityKey === 'epic') {
    return EPIC_IDS[Math.floor(Math.random() * EPIC_IDS.length)];
  }
  if (rarityKey === 'rare') {
    return RARE_IDS[Math.floor(Math.random() * RARE_IDS.length)];
  }
  
  // Common: Random from Gen 1-3 excluding special ones
  let randomId;
  do {
    randomId = Math.floor(Math.random() * 386) + 1;
  } while (EPIC_IDS.includes(randomId) || RARE_IDS.includes(randomId));
  
  return randomId;
}

// --- ROLL LOGIC ---
async function handleGachaRoll(amount) {
  const cost = amount === 10 ? 900 : 100;
  
  // Balance Validation
  if (GAME_STATE.coins < cost) {
    sfx.playError();
    alert("Koin Anda kurang! Klik tombol +100 pada koin untuk mendapatkan koin tambahan secara gratis.");
    return;
  }
  
  // Deduct Coins
  GAME_STATE.coins -= cost;
  updateUIStats();
  
  // Show Gacha Dialog
  const dialog = document.getElementById('gacha-dialog');
  const animationBox = document.getElementById('gacha-animation-box');
  const revealContainer = document.getElementById('reveal-container');
  const revealGrid = document.getElementById('reveal-grid');
  const ballEl = document.getElementById('animation-ball');
  const closeBtn = document.getElementById('gacha-close-btn');
  
  // Reset dialog state
  revealGrid.innerHTML = '';
  revealContainer.style.display = 'none';
  closeBtn.style.display = 'none';
  animationBox.style.display = 'flex';
  ballEl.className = 'gacha-pokeball shake';
  
  // Show modal
  dialog.showModal();
  
  // Generate roll outcomes
  const batchPulls = [];
  let maxRarityBall = 'normal';
  
  for (let i = 0; i < amount; i++) {
    const rarity = determineRarity();
    const id = getRandomIdForRarity(rarity.key);
    
    // Keep track of highest Pokéball rarity animation
    if (rarity.key === 'shiny') maxRarityBall = 'master';
    else if (rarity.key === 'epic' && maxRarityBall !== 'master') maxRarityBall = 'ultra';
    else if (rarity.key === 'rare' && maxRarityBall !== 'master' && maxRarityBall !== 'ultra') maxRarityBall = 'great';
    
    batchPulls.push({ id, rarity });
  }
  
  // Set Pokéball color on screen
  ballEl.className = `gacha-pokeball shake ${maxRarityBall}`;
  
  // Sound of shaking ball
  let shakeInterval = setInterval(() => sfx.playShake(), 500);
  
  // Fetch all batch items parallelly
  const loadedPulls = await Promise.all(
    batchPulls.map(async pull => {
      const data = await fetchPokemonData(pull.id);
      return { data, rarity: pull.rarity };
    })
  );
  
  clearInterval(shakeInterval);
  
  // Transition Pokéball from shaking to opening burst
  setTimeout(() => {
    ballEl.className = `gacha-pokeball open ${maxRarityBall}`;
    sfx.playSuccess();
    
    setTimeout(() => {
      // Hide Pokéball and display cards
      animationBox.style.display = 'none';
      revealContainer.style.display = 'flex';
      
      // Render cards
      loadedPulls.forEach((pull, index) => {
        if (!pull.data) return;
        
        // Save to collection
        const pkmnId = pull.data.id;
        const storageKey = pull.rarity.key === 'shiny' ? `${pkmnId}_shiny` : `${pkmnId}`;
        
        if (GAME_STATE.collection[storageKey]) {
          GAME_STATE.collection[storageKey].count += 1;
        } else {
          GAME_STATE.collection[storageKey] = {
            ...pull.data,
            isShiny: pull.rarity.key === 'shiny',
            count: 1,
            rarityKey: pull.rarity.key
          };
        }
        
        // Build card HTML
        const card = document.createElement('div');
        card.className = 'reveal-card';
        card.innerHTML = `
          <div class="card-inner">
            <div class="card-front">
              <div class="card-front-pokeball"></div>
            </div>
            <div class="card-back ${pull.rarity.key}">
              <span class="rarity-label">${pull.rarity.label}</span>
              <img src="${proxyUrl(pull.data.sprites.artwork || pull.data.sprites.front_default)}" alt="${pull.data.name}" />
              <div class="title">${pull.data.name}</div>
            </div>
          </div>
        `;
        
        // Add card flip functionality
        card.addEventListener('click', () => {
          if (!card.classList.contains('flipped')) {
            card.classList.add('flipped');
            sfx.playSelect();
            checkAllCardsRevealed();
          }
        });
        
        revealGrid.appendChild(card);
      });
      
      // Save collection
      localStorage.setItem('pkmn_collection', JSON.stringify(GAME_STATE.collection));
      updateCollectionGrid();
      
      // Show Close button or reveal helper
      function checkAllCardsRevealed() {
        const total = revealGrid.querySelectorAll('.reveal-card').length;
        const flipped = revealGrid.querySelectorAll('.reveal-card.flipped').length;
        if (flipped === total) {
          closeBtn.style.display = 'block';
        }
      }
      
    }, 500);
  }, 1500);
}

// --- COLLECTION GRID MANAGEMENT ---
let currentFilter = 'all';

function updateCollectionGrid() {
  const grid = document.getElementById('pokemon-grid');
  
  grid.innerHTML = '';
  const caughtItems = Object.values(GAME_STATE.collection);
  
  document.getElementById('caught-total').innerText = caughtItems.length;
  
  // Filter list
  const filtered = caughtItems.filter(item => {
    if (currentFilter === 'all') return true;
    return item.rarityKey === currentFilter;
  });
  
  if (filtered.length === 0) {
    const emptyEl = document.createElement('div');
    emptyEl.id = 'empty-state';
    emptyEl.style.cssText = 'grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px 0;';
    emptyEl.innerText = `Belum ada Pokémon berkategori ${currentFilter.toUpperCase()} yang tertangkap. Yuk gacha sekarang!`;
    grid.appendChild(emptyEl);
    return;
  }
  
  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = `pkmn-card ${item.rarityKey}`;
    
    const spriteUrl = proxyUrl(item.sprites.artwork || item.sprites.front_default);
    
    card.innerHTML = `
      <span class="rarity-badge">${item.rarityKey}</span>
      <img src="${spriteUrl}" alt="${item.name}" />
      <div class="name">${item.name}</div>
      <div class="count">Jumlah: ${item.count}x</div>
    `;
    
    card.addEventListener('click', () => showPokemonDetail(item));
    grid.appendChild(card);
  });
}

function showPokemonDetail(pokemon) {
  const dialog = document.getElementById('detail-dialog');
  const body = document.getElementById('detail-body');
  
  // Build detail view
  let typeBadges = pokemon.types.map(t => `<span class="type-badge type-${t}">${t}</span>`).join(' ');
  
  let statsHTML = pokemon.stats.map(s => `
    <div class="stat-row">
      <span class="stat-name">${s.name}</span>
      <div class="stat-val-container">
        <span>${s.val}</span>
        <div class="stat-bar-outer">
          <div class="stat-bar-inner" style="width: ${Math.min(100, (s.val / 150) * 100)}%;"></div>
        </div>
      </div>
    </div>
  `).join('');

  body.innerHTML = `
    <img src="${proxyUrl(pokemon.sprites.artwork || pokemon.sprites.front_default)}" alt="${pokemon.name}" />
    <div class="detail-types">${typeBadges}</div>
    <div class="detail-stats">
      ${statsHTML}
    </div>
  `;
  
  document.getElementById('detail-dialog-title').innerText = pokemon.name + (pokemon.isShiny ? ' (★ Shiny)' : '');
  
  sfx.playCry(250 + (pokemon.id % 400));
  dialog.showModal();
}

// --- SETUP EVENT LISTENERS & STATS UPDATE ---
function updateUIStats() {
  document.getElementById('coin-count').innerText = GAME_STATE.coins;
  document.getElementById('ticket-count').innerText = GAME_STATE.tickets;
  localStorage.setItem('pkmn_coins', GAME_STATE.coins);
  localStorage.setItem('pkmn_tickets', GAME_STATE.tickets);
}

function setupEvents() {
  // Coin claim
  document.getElementById('claim-coins-btn').addEventListener('click', () => {
    GAME_STATE.coins += 100;
    sfx.playCoin();
    updateUIStats();
  });
  
  // Gacha Rolls
  document.getElementById('roll-1-btn').addEventListener('click', () => {
    sfx.playSelect();
    handleGachaRoll(1);
  });
  
  document.getElementById('roll-10-btn').addEventListener('click', () => {
    sfx.playSelect();
    handleGachaRoll(10);
  });
  
  // Sound control
  const soundBtn = document.getElementById('sound-btn');
  const soundOnIcon = document.getElementById('sound-icon-on');
  const soundOffIcon = document.getElementById('sound-icon-off');
  
  soundBtn.addEventListener('click', () => {
    sfx.enabled = !sfx.enabled;
    if (sfx.enabled) {
      soundOnIcon.style.display = 'block';
      soundOffIcon.style.display = 'none';
      sfx.init();
      sfx.playSelect();
      bgm.play();
    } else {
      soundOnIcon.style.display = 'none';
      soundOffIcon.style.display = 'block';
      bgm.stop();
    }
  });
  
  // Auto-init sound on first interaction (required by browsers)
  const initAudioOnFirstClick = () => {
    sfx.init();
    if (sfx.enabled) {
      bgm.play();
    }
    window.removeEventListener('click', initAudioOnFirstClick);
    window.removeEventListener('keydown', initAudioOnFirstClick);
  };
  window.addEventListener('click', initAudioOnFirstClick);
  window.addEventListener('keydown', initAudioOnFirstClick);
  
  // Modal Close
  document.getElementById('gacha-close-btn').addEventListener('click', () => {
    sfx.playSelect();
    document.getElementById('gacha-dialog').close();
    initSafariPark();
  });
  
  document.getElementById('detail-close-btn').addEventListener('click', () => {
    sfx.playSelect();
    document.getElementById('detail-dialog').close();
  });
  
  // Collection Filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      sfx.playSelect();
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.dataset.filter;
      updateCollectionGrid();
    });
  });
}

// --- INIT APP ---
window.addEventListener('DOMContentLoaded', () => {
  migrateCollectionUrls();
  setupEvents();
  updateUIStats();
  updateCollectionGrid();
  initSafariPark();
});
