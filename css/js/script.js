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
    'な': 'na', 'ni': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'ya': 'ya', 'yu': 'yu', 'yo': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'を': 'wo', 'ん': 'n',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'za': 'za', 'ji': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
    'da': 'da', 'ji': 'ji', 'zu': 'zu', 'de': 'de', 'do': 'do',
    'ba': 'ba', 'bi': 'bi', 'bu': 'bu', 'be': 'be', 'bo': 'bo',
    'pa': 'pa', 'pi': 'pi', 'pu': 'pu', 'pe': 'pe', 'po': 'po',
    'ゃ': 'ya', 'ゅ': 'yu', 'ょ': 'yo', 'っ': 'tsu'
};

const POOL = ['あ','い','う','え','お','か','き','く','け','こ','さ','し','す','せ','そ','た','ち','つ','て','と','な','に','ぬ','ね','の','ま','mi','mu','me','mo','ra','ri','ru','re','ro','ga','za','da','ba'];

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
    document.getElementById('homepage-screen').classList.replace('d-none', 'd-flex');
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
        } catch (e) { console.error("Database missing", e); return; }
    }
    resetStageState();
    loadQuestion();
    if (gameMode !== 'tutorial') startTimer();
}

function loadQuestion() {
    const stageData = ALL_DATA.levels[currentStage];
    if (questionPool.length === 0) {
        let allWords = [...stageData.words];
        shuffle(allWords);
        let limit = (gameMode === 'challenge') ? allWords.length : STAGE_CONFIG[currentStage].target;
        questionPool = allWords.slice(0, limit);
    }
    currentQuestion = questionPool.pop();
    document.getElementById('stage-banner').innerText = `Stage ${currentStage}: ${stageData.category}`;
    document.getElementById('kanji-question').innerText = currentQuestion.kanji;
    document.getElementById('kanji-meaning').innerText = currentQuestion.meaning;
    selectedLetters = [];
    generateHand(currentQuestion.reading);
    renderWordZone();
    renderSupportButtons();
    gameActive = true;
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
        desc.innerText = "Yokai telah tersegel. ✨";
        if (gameMode === 'challenge' && currentStage < 10) {
            btnArea.innerHTML += `<button class="btn btn-warning fw-bold py-2" onclick="nextStage()">Lanjut Stage ${currentStage + 1}</button>`;
        } else if (currentStage < 10) {
            btnArea.innerHTML += `<button class="btn btn-warning fw-bold py-2" onclick="nextStage()">Stage Berikutnya</button>`;
        }
    } else {
        title.innerText = "RITUAL GAGAL!";
        desc.innerText = "Waktu habis, Yokai melarikan diri.";
        btnArea.innerHTML += `<button class="btn btn-danger fw-bold py-2" onclick="retryCurrentStage()">Coba Lagi</button>`;
    }
    btnArea.innerHTML += `<button class="btn btn-outline-light btn-sm mt-2" onclick="backToSelector()">Kembali ke List</button>`;
}

function nextStage() { hideModal(); currentStage++; resetStageState(); loadQuestion(); }
function retryCurrentStage() { hideModal(); resetStageState(); loadQuestion(); }
function hideModal() { document.getElementById('modal-overlay').classList.replace('d-flex', 'd-none'); }
function backToSelector() { backToHome(); showLevelSelector(); }

// --- LOGIC LAINNYA ---
function updateUI() {
    const hpProgress = document.getElementById('hp-progress');
    if (hpProgress) hpProgress.style.width = yokaiHP + "%";
    document.getElementById('time-val').innerText = timeLeft + "s";
}

function generateHand(reading) {
    let required = reading.split('').filter(c => !['ゃ','ゅ','ょ','っ'].includes(c));
    let finalCards = [...required];
    while(finalCards.length < 10) { finalCards.push(POOL[Math.floor(Math.random() * POOL.length)]); }
    hand = shuffle(finalCards);
    renderHand();
}

function renderHand() {
    const container = document.getElementById('player-hand');
    container.innerHTML = '';
    hand.forEach((char, i) => {
        const card = document.createElement('div');
        card.className = 'card';
        const romaji = isRomajiVisible ? `<div class="romaji">${ROMAJI_MAP[char] || ''}</div>` : '';
        card.innerHTML = `<div class="kana">${char}</div>${romaji}`;
        card.onclick = () => { if(gameActive && selectedLetters.length < 7) { selectedLetters.push(hand.splice(i, 1)[0]); renderHand(); renderWordZone(); } };
        container.appendChild(card);
    });
}

function renderWordZone() {
    const slots = document.querySelectorAll('.letter-slot');
    slots.forEach((slot, i) => {
        const char = selectedLetters[i];
        if(char) {
            const romaji = isRomajiVisible ? `<div style="font-size:8px;">${ROMAJI_MAP[char] || ''}</div>` : '';
            slot.innerHTML = `<div>${char}</div>${romaji}`;
        } else slot.innerHTML = '';
    });
}

function confirmWord() {
    if(!gameActive) return;
    if(selectedLetters.join('') === currentQuestion.reading) {
        yokaiHP -= STAGE_CONFIG[currentStage].dmg;
        if(yokaiHP <= 0) { yokaiHP = 0; updateUI(); showModal(true); } else { updateUI(); loadQuestion(); }
    } else { timeLeft -= 10; clearWord(); updateUI(); }
}

function startTimer() {
    clearInterval(timerInt);
    timerInt = setInterval(() => { if(gameActive && timeLeft > 0) { timeLeft--; updateUI(); if(timeLeft <= 0) { gameActive = false; showModal(false); } } }, 1000);
}

function clearWord() { selectedLetters.forEach(c => { if(!['ゃ','ゅ','ょ','っ'].includes(c)) hand.push(c); }); selectedLetters = []; renderHand(); renderWordZone(); }
function toggleRomaji() { isRomajiVisible = !isRomajiVisible; renderHand(); renderWordZone(); }
function shuffle(a) { for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
function resetStageState() { yokaiHP = 100; timeLeft = (gameMode === 'tutorial') ? 999 : 90; selectedLetters = []; updateUI(); }
function renderSupportButtons() {
    const container = document.getElementById('support-container');
    container.innerHTML = '';
    ['ゃ', 'ゅ', 'ょ', 'っ'].forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline-warning btn-sm fw-bold px-3'; btn.innerText = s;
        btn.onclick = () => { if(gameActive && selectedLetters.length < 7) { selectedLetters.push(s); renderWordZone(); } };
        container.appendChild(btn);
    });
}
function showHint() {
    if(!gameActive) return;
    const firstChar = currentQuestion.reading[0];
    document.querySelectorAll('.card').forEach(c => { if(c.querySelector('.kana').innerText === firstChar) { c.classList.add('hint-glow'); setTimeout(() => c.classList.remove('hint-glow'), 3000); } });
}
