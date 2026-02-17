let ALL_DATA = null;
let currentLevel = 1;
let currentQuestion = null;
let isRomajiVisible = false;
let gameActive = false;
let timeLeft = 90;
let yokaiHP = 100;
let selectedLetters = [];
let hand = [];
let timerInt = null;
let questionPool = [];

const LEVEL_CONFIG = {
    1: { target: 10, dmg: 10 },
    2: { target: 15, dmg: 6.7 },
    3: { target: 15, dmg: 6.7 },
    4: { target: 10, dmg: 10 },
    5: { target: 15, dmg: 6.7 },
    6: { target: 10, dmg: 10 },
    7: { target: 5,  dmg: 20 },
    8: { target: 10, dmg: 10 },
    9: { target: 15, dmg: 6.7 },
    10: { target: 5,  dmg: 20 }
};

const ROMAJI_MAP = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'を': 'wo', 'ん': 'n',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
    'ゃ': 'ya', 'ゅ': 'yu', 'ょ': 'yo', 'っ': '(stop)'
};

const POOL = ['あ','い','う','え','お','か','き','く','け','こ','さ','し','す','せ','そ','た','ち','つ','て','と','な','に','ぬ','ね','の','ま','み','む','め','も','ら','り','る','れ','ろ'];

// --- FUNGSI NAVIGASI SESUAI GAME FLOW ---

async function startGame() {
    // Sembunyikan Homepage, Tampilkan Game Screen 
    document.getElementById('homepage-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'flex';
    
    if (!ALL_DATA) {
        try {
            const res = await fetch('database.json');
            ALL_DATA = await res.json();
        } catch (e) { console.error("Database missing", e); return; }
    }
    
    resetGameState();
    loadQuestion();
    startTimer();
}

function backToHome() {
    // Kembali ke Beranda 
    clearInterval(timerInt);
    gameActive = false;
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
    document.getElementById('homepage-screen').style.display = 'flex';
}

function resetGameState() {
    currentLevel = 1;
    yokaiHP = 100;
    timeLeft = 90;
    questionPool = [];
    selectedLetters = [];
    updateUI();
}

// --- LOGIKA PERMAINAN ---

function loadQuestion() {
    const levelData = ALL_DATA.levels[currentLevel];
    const config = LEVEL_CONFIG[currentLevel];
    
    if (questionPool.length === 0) {
        questionPool = [...levelData.words];
        shuffle(questionPool);
        if(questionPool.length > config.target) {
            questionPool = questionPool.slice(0, config.target);
        }
    }
    
    currentQuestion = questionPool.pop();
    
    document.getElementById('level-banner').innerText = `Level ${currentLevel}: ${levelData.category}`;
    document.getElementById('kanji-question').innerText = currentQuestion.kanji;
    document.getElementById('kanji-meaning').innerText = currentQuestion.meaning;
    
    const kanjiHint = document.getElementById('kanji-reading-hint');
    kanjiHint.innerText = currentQuestion.reading_romaji;
    kanjiHint.classList.toggle('hidden', !isRomajiVisible);

    selectedLetters = [];
    generateHand(currentQuestion.reading);
    renderWordZone();
    renderSupportButtons();
    gameActive = true;
}

function confirmWord() {
    if(!gameActive) return;
    const answer = selectedLetters.join('');
    const config = LEVEL_CONFIG[currentLevel];

    if(answer === currentQuestion.reading) {
        yokaiHP -= config.dmg; 
        if(yokaiHP <= 0.5) {
            yokaiHP = 0; gameActive = false; showModal(true);
        } else {
            loadQuestion();
        }
    } else {
        timeLeft = Math.max(0, timeLeft - 10);
        clearWord();
        showFlashError();
        if(timeLeft === 0) { gameActive = false; showModal(false); }
    }
    updateUI();
}

function showModal(isWin) {
    const overlay = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const desc = document.getElementById('modal-desc');
    const btnArea = document.getElementById('modal-buttons-area');
    
    overlay.style.display = 'flex';
    btnArea.innerHTML = ''; // Clear previous buttons

    if (isWin) {
        title.innerText = "RITUAL BERHASIL!";
        desc.innerText = "Yokai telah tersegel.";
        
        if (currentLevel < 10) {
            // Tombol Lanjut Level 
            btnArea.innerHTML += `<button class="btn-modal btn-next-level" onclick="nextLevel()">Level Berikutnya</button>`;
        } else {
            title.innerText = "MASTER ONMYOJI!";
            desc.innerText = "Semua segel telah dikuasai.";
        }
    } else {
        title.innerText = "RITUAL GAGAL!";
        desc.innerText = "Waktu habis, Yokai melarikan diri.";
        // Tombol Retry 
        btnArea.innerHTML += `<button class="btn-modal btn-retry-level" onclick="retryCurrentLevel()">Coba Lagi</button>`;
    }

    // Tombol Exit selalu ada sesuai diagram 
    btnArea.innerHTML += `<button class="btn-modal btn-exit-level" onclick="backToHome()">Exit ke Beranda</button>`;
}

function retryCurrentLevel() {
    yokaiHP = 100;
    timeLeft = 90;
    questionPool = []; // Reset antrean untuk level yang sama 
    document.getElementById('modal-overlay').style.display = 'none';
    loadQuestion();
    gameActive = true;
}

function nextLevel() {
    currentLevel++;
    questionPool = [];
    yokaiHP = 100;
    timeLeft = 90;
    document.getElementById('modal-overlay').style.display = 'none';
    loadQuestion();
    gameActive = true;
}

// --- FUNGSI HELPER (TETAP SAMA) ---

function generateHand(reading) {
    let required = reading.split('').filter(c => !['ゃ','ゅ','ょ','っ'].includes(c));
    let extraCount = 10 - required.length;
    let finalCards = [...required];
    for(let i=0; i<extraCount; i++) {
        finalCards.push(POOL[Math.floor(Math.random() * POOL.length)]);
    }
    hand = shuffle(finalCards);
    renderHand();
}

function toggleRomaji() {
    isRomajiVisible = !isRomajiVisible;
    document.getElementById('romaji-toggle-btn').innerText = `Romaji: ${isRomajiVisible ? 'ON' : 'OFF'}`;
    document.getElementById('kanji-reading-hint').classList.toggle('hidden', !isRomajiVisible);
    renderHand(); renderWordZone();
}

function renderHand() {
    const container = document.getElementById('player-hand');
    container.innerHTML = '';
    hand.forEach((char, i) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<div class="kana">${char}</div><div class="romaji ${isRomajiVisible ? '' : 'hidden'}">${ROMAJI_MAP[char] || ''}</div>`;
        card.onclick = () => { if(gameActive && selectedLetters.length < 7) { selectedLetters.push(hand.splice(i, 1)[0]); renderHand(); renderWordZone(); } };
        container.appendChild(card);
    });
}

function renderWordZone() {
    const slots = document.querySelectorAll('.letter-slot');
    slots.forEach((slot, i) => {
        const char = selectedLetters[i];
        if(char) {
            slot.innerHTML = `<div style="font-size:20px; font-weight:bold; color:black;">${char}</div><div style="font-size:9px; color:#666;" class="${isRomajiVisible ? '' : 'hidden'}">${ROMAJI_MAP[char] || ''}</div>`;
            slot.style.backgroundColor = "white"; slot.classList.add('active');
        } else { slot.innerHTML = ''; slot.style.backgroundColor = "transparent"; slot.classList.remove('active'); }
    });
    document.getElementById('confirm-btn').disabled = selectedLetters.length === 0;
}

function renderSupportButtons() {
    const container = document.getElementById('support-container');
    container.innerHTML = '';
    ['ゃ', 'ゅ', 'ょ', 'っ'].forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'btn-support'; btn.innerText = s;
        btn.onclick = () => { if(gameActive && selectedLetters.length < 7) { selectedLetters.push(s); renderWordZone(); } };
        container.appendChild(btn);
    });
}

function clearWord() {
    selectedLetters.forEach(c => { if(!['ゃ','ゅ','ょ','っ'].includes(c)) hand.push(c); });
    selectedLetters = []; renderHand(); renderWordZone();
}

function showHint() {
    if(!gameActive) return;
    const firstChar = currentQuestion.reading[0];
    document.querySelectorAll('.card').forEach(c => {
        if(c.querySelector('.kana').innerText === firstChar) {
            c.classList.add('hint-glow'); setTimeout(() => c.classList.remove('hint-glow'), 3000);
        }
    });
}

function startTimer() {
    clearInterval(timerInt);
    timerInt = setInterval(() => {
        if(gameActive && timeLeft > 0) {
            timeLeft--; updateUI();
            if(timeLeft <= 0) { timeLeft = 0; gameActive = false; showModal(false); }
        }
    }, 1000);
}

function showFlashError() {
    const timer = document.querySelector('.timer-section');
    timer.style.color = "red"; setTimeout(() => timer.style.color = "white", 500);
}

function updateUI() {
    document.getElementById('hp-fill').style.width = yokaiHP + "%";
    document.getElementById('time-val').innerText = timeLeft;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
