let ALL_DATA = null;
let currentStage = 1;
let currentQuestion = null;
let isRomajiVisible = false;
let gameActive = false;
let timeLeft = 90;
let yokaiHP = 100;
let selectedLetters = [];
let hand = [];
let timerInt = null;
let questionPool = [];
let gameMode = 'story'; // 'tutorial', 'story', 'challenge'

const STAGE_CONFIG = {
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
    'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
    'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', ' de': 'de', 'ど': 'do',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
    'ゃ': 'ya', 'ゅ': 'yu', 'ょ': 'yo', 'っ': 'tsu'
};

const POOL = ['あ','い','う','え','お','か','き','く','け','こ','さ','し','す','せ','そ','た','ち','つ','て','ot','な','に','ぬ','ね','の','ま','み','む','め','も','ら','り','る','れ','ろ','が','ざ','だ','ば'];

// --- NAVIGATION ---

function showLevelSelector() {
    document.getElementById('homepage-screen').classList.replace('d-flex', 'd-none');
    document.getElementById('level-selector').classList.replace('d-none', 'd-flex');
}

function backToHome() {
    clearInterval(timerInt);
    gameActive = false;
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('level-selector').classList.replace('d-flex', 'd-none');
    hideModal();
    document.getElementById('homepage-screen').classList.replace('d-none', 'd-flex');
}

function backToSelector() {
    clearInterval(timerInt);
    gameActive = false;
    document.getElementById('game-screen').style.display = 'none';
    hideModal();
    document.getElementById('level-selector').classList.replace('d-none', 'd-flex');
}

function startMode(mode, stage) {
    gameMode = mode;
    currentStage = stage;
    document.getElementById('level-selector').classList.replace('d-flex', 'd-none');
    startGame();
}

async function startGame() {
    document.getElementById('game-screen').style.display = 'block'; 
    
    if (!ALL_DATA) {
        try {
            const res = await fetch('database.json');
            ALL_DATA = await res.json();
        } catch (e) { 
            console.error("Database missing", e); 
            return; 
        }
    }
    
    resetStageState();
    loadQuestion();
    if (gameMode !== 'tutorial') startTimer();
}

// --- GAME LOGIC ---

function resetStageState() {
    yokaiHP = 100;
    timeLeft = (gameMode === 'tutorial') ? 999 : 90;
    questionPool = [];
    selectedLetters = [];
    updateUI();
}

function loadQuestion() {
    const stageData = ALL_DATA.levels[currentStage];
    const config = STAGE_CONFIG[currentStage];
    
    if (questionPool.length === 0) {
        let allWords = [...stageData.words];
        shuffle(allWords);
        // Challenge mode mengambil semua kata, tutorial & story dibatasi config
        let limit = (gameMode === 'challenge') ? allWords.length : config.target;
        questionPool = allWords.slice(0, limit);
    }
    
    currentQuestion = questionPool.pop();
    
    document.getElementById('stage-banner').innerText = `Stage ${currentStage}: ${stageData.category} (${gameMode.toUpperCase()})`;
    document.getElementById('kanji-question').innerText = currentQuestion.kanji;
    document.getElementById('kanji-meaning').innerText = currentQuestion.meaning;
    
    selectedLetters = [];
    generateHand(currentQuestion.reading);
    renderWordZone();
    renderSupportButtons();
    gameActive = true;
}

function confirmWord() {
    if(!gameActive) return;
    const answer = selectedLetters.join('');
    const config = STAGE_CONFIG[currentStage];

    if(answer === currentQuestion.reading) {
        yokaiHP -= config.dmg; 
        if(yokaiHP <= 0.5) {
            yokaiHP = 0; 
            gameActive = false; 
            updateUI(); 
            showModal(true);
        } else {
            updateUI();
            loadQuestion();
        }
    } else {
        if (gameMode === 'challenge') {
            // Sudden Death di Challenge Mode
            gameActive = false;
            timeLeft = 0;
            updateUI();
            showModal(false);
        } else {
            timeLeft = Math.max(0, timeLeft - 10);
            clearWord();
            showFlashError();
            updateUI();
        }
    }
}

function showModal(isWin) {
    const overlay = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const desc = document.getElementById('modal-desc');
    const btnArea = document.getElementById('modal-buttons-area');
    
    overlay.classList.replace('d-none', 'd-flex');
    btnArea.innerHTML = '';

    if (isWin) {
        title.innerText = "RITUAL BERHASIL!";
        title.className = "text-success mb-3 fw-bold";
        desc.innerText = "Yokai telah tersegel dengan sempurna. ✨";

        if (gameMode === 'challenge' && currentStage < 10) {
            btnArea.innerHTML += `<button class="btn btn-warning fw-bold py-2" onclick="nextChallenge()">Lanjut Stage ${currentStage + 1}</button>`;
        } else if (currentStage < 10) {
            btnArea.innerHTML += `<button class="btn btn-warning fw-bold py-2" onclick="nextStage()">Stage Berikutnya</button>`;
        } else {
            title.innerText = "MASTER ONMYOJI!";
            desc.innerText = "Semua segel kuno telah berhasil Anda kuasai.";
        }
    } else {
        title.innerText = "RITUAL GAGAL!";
        title.className = "text-danger mb-3 fw-bold";
        desc.innerText = (gameMode === 'challenge') ? "Sudden Death! Kamu gagal di tengah tantangan." : "Waktu habis, Yokai melarikan diri.";
        
        const retryText = (gameMode === 'challenge') ? "Mulai Dari Awal" : "Coba Lagi";
        const retryTarget = (gameMode === 'challenge') ? 1 : currentStage;
        
        btnArea.innerHTML += `<button class="btn btn-danger fw-bold py-2" onclick="startMode('${gameMode}', ${retryTarget})">${retryText}</button>`;
    }
    btnArea.innerHTML += `<button class="btn btn-outline-light btn-sm mt-2" onclick="backToSelector()">Kembali ke List Stage</button>`;
}

function nextChallenge() {
    currentStage++;
    hideModal();
    resetStageState();
    loadQuestion();
}

function nextStage() {
    currentStage++;
    hideModal();
    resetStageState();
    loadQuestion();
}

function retryCurrentStage() {
    hideModal();
    resetStageState();
    loadQuestion();
}

function hideModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.replace('d-flex', 'd-none');
}

// --- RENDER ENGINE ---

function generateHand(reading) {
    let required = reading.split('').filter(c => !['ゃ','ゅ','ょ','っ'].includes(c));
    let finalCards = [...required];
    while(finalCards.length < 10) {
        let randomChar = POOL[Math.floor(Math.random() * POOL.length)];
        finalCards.push(randomChar);
    }
    hand = shuffle(finalCards);
    renderHand();
}

function renderHand() {
    const container = document.getElementById('player-hand');
    if (!container) return;
    container.innerHTML = '';
    hand.forEach((char, i) => {
        const card = document.createElement('div');
        card.className = 'card';
        const romaji = isRomajiVisible ? `<div class="romaji">${ROMAJI_MAP[char] || ''}</div>` : '';
        card.innerHTML = `<div class="kana">${char}</div>${romaji}`;
        card.onclick = () => { 
            if(gameActive && selectedLetters.length < 7) { 
                selectedLetters.push(hand.splice(i, 1)[0]); 
                renderHand(); renderWordZone(); 
            } 
        };
        container.appendChild(card);
    });
}

function renderWordZone() {
    const slots = document.querySelectorAll('.letter-slot');
    slots.forEach((slot, i) => {
        const char = selectedLetters[i];
        if(char) {
            const romaji = isRomajiVisible ? `<div>${ROMAJI_MAP[char] || ''}</div>` : '';
            slot.innerHTML = `<div>${char}</div>${romaji}`;
        } else slot.innerHTML = '';
    });
    const confirmBtn = document.getElementById('confirm-btn');
    if (confirmBtn) confirmBtn.disabled = selectedLetters.length === 0;
}

function renderSupportButtons() {
    const container = document.getElementById('support-container');
    if (!container) return;
    container.innerHTML = '';
    ['ゃ', 'ゅ', 'ょ', 'っ'].forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline-warning btn-sm fw-bold px-3'; 
        btn.innerText = s;
        btn.onclick = () => { if(gameActive && selectedLetters.length < 7) { selectedLetters.push(s); renderWordZone(); } };
        container.appendChild(btn);
    });
}

function clearWord() {
    selectedLetters.forEach(c => { if(!['ゃ','ゅ','ょ','っ'].includes(c)) hand.push(c); });
    selectedLetters = []; renderHand(); renderWordZone();
}

function toggleRomaji() {
    isRomajiVisible = !isRomajiVisible;
    document.getElementById('romaji-toggle-btn').innerText = `Romaji: ${isRomajiVisible ? 'ON' : 'OFF'}`;
    renderHand(); renderWordZone();
}

function showHint() {
    if(!gameActive) return;
    const firstChar = currentQuestion.reading[0];
    document.querySelectorAll('.card').forEach(c => {
        if(c.querySelector('.kana').innerText === firstChar) {
            c.classList.add('hint-glow'); 
            // Tutorial mode: Hint tidak hilang cepat
            let timeout = (gameMode === 'tutorial') ? 10000 : 3000;
            setTimeout(() => c.classList.remove('hint-glow'), timeout);
        }
    });
}

// --- CORE SYSTEM ---

function startTimer() {
    clearInterval(timerInt);
    timerInt = setInterval(() => {
        if(gameActive && timeLeft > 0) {
            timeLeft--; updateUI();
            if(timeLeft <= 0) { 
                timeLeft = 0; gameActive = false; updateUI(); showModal(false); 
            }
        }
    }, 1000);
}

function updateUI() {
    const progressBar = document.getElementById('hp-progress');
    if (progressBar) {
        progressBar.style.width = yokaiHP + "%";
        if (yokaiHP > 50) progressBar.className = "progress-bar bg-success";
        else if (yokaiHP > 20) progressBar.className = "progress-bar bg-warning";
        else progressBar.className = "progress-bar bg-danger";
    }

    const timeVal = document.getElementById('time-val');
    if (timeVal) {
        timeVal.innerText = timeLeft + "s";
        if(timeLeft < 20 && gameMode !== 'tutorial') timeVal.classList.add('text-danger');
        else timeVal.classList.remove('text-danger');
    }
}

function showFlashError() {
    const timeDisplay = document.querySelector('.timer-display');
    if (timeDisplay) {
        timeDisplay.classList.add('text-danger');
        setTimeout(() => timeDisplay.classList.remove('text-danger'), 500);
    }
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
