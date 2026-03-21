import { state, resetState, shuffle } from './engine.js';
import { ROMAJI_MAP, STAGE_CONFIG, POOL } from './constants.js';

// --- NAVIGASI LAYAR ---
window.showLevelSelector = () => {
    document.getElementById('homepage-screen').classList.add('d-none');
    document.getElementById('level-selector').classList.remove('d-none');
};

window.backToHome = () => {
    document.getElementById('level-selector').classList.add('d-none');
    document.getElementById('homepage-screen').classList.remove('d-none');
};

window.startMode = (mode, stage) => {
    state.gameMode = mode;
    state.currentStage = stage;
    document.getElementById('level-selector').classList.add('d-none');
    startGame();
};

// --- LOGIKA GAME ---
async function startGame() {
    document.getElementById('game-screen').style.display = 'block';
    if (!state.allData) {
        const res = await fetch('database.json');
        state.allData = await res.json();
    }
    resetState();
    loadQuestion();
    if (state.gameMode !== 'tutorial') startTimer();
}

function loadQuestion() {
    const stageData = state.allData.levels[state.currentStage];
    const config = STAGE_CONFIG[state.currentStage];
    
    if (state.questionPool.length === 0) {
        let allWords = [...stageData.words];
        shuffle(allWords);
        state.questionPool = allWords.slice(0, config.target);
    }
    
    state.currentQuestion = state.questionPool.pop();
    document.getElementById('kanji-question').innerText = state.currentQuestion.kanji;
    document.getElementById('kanji-meaning').innerText = state.currentQuestion.meaning;
    document.getElementById('stage-banner').innerText = `Stage ${state.currentStage}: ${stageData.category}`;
    
    state.selectedLetters = [];
    generateHand(state.currentQuestion.reading);
    renderWordZone(); // Render ulang slot kosong
    renderSupportButtons();
    state.gameActive = true;
}

// --- FITUR INTERAKSI (Hapus, Hint, Romaji) ---
window.clearWord = () => {
    // Kembalikan kartu ke tangan jika bukan karakter kecil
    state.selectedLetters.forEach(char => {
        if (!['ゃ', 'ゅ', 'ょ', 'っ'].includes(char)) state.hand.push(char);
    });
    state.selectedLetters = [];
    renderHand();
    renderWordZone();
};

window.toggleRomaji = () => {
    state.isRomajiVisible = !state.isRomajiVisible;
    const btn = document.getElementById('romaji-toggle-btn');
    if(btn) btn.classList.toggle('btn-warning'); 
    renderHand();
    renderWordZone();
};

window.showHint = () => {
    if (!state.gameActive) return;
    const firstChar = state.currentQuestion.reading[0];
    document.querySelectorAll('.card').forEach(card => {
        if (card.querySelector('.kana').innerText === firstChar) {
            card.classList.add('hint-glow');
            setTimeout(() => card.classList.remove('hint-glow'), 2000);
        }
    });
};

window.confirmWord = () => {
    if (!state.gameActive) return;
    const answer = state.selectedLetters.join('');
    if (answer === state.currentQuestion.reading) {
        state.yokaiHP -= STAGE_CONFIG[state.currentStage].dmg;
        updateUI();
        if (state.yokaiHP <= 0) {
            state.gameActive = false;
            showModal(true);
        } else {
            loadQuestion();
        }
    } else {
        // Efek Getar jika salah
        document.querySelector('.scroll-box').classList.add('shake');
        setTimeout(() => document.querySelector('.scroll-box').classList.remove('shake'), 400);
        state.timeLeft = Math.max(0, state.timeLeft - 10);
        window.clearWord();
        updateUI();
    }
};

// --- RENDER ENGINE ---
function generateHand(reading) {
    let required = reading.split('').filter(c => !['ゃ', 'ゅ', 'ょ', 'っ'].includes(c));
    let finalCards = [...required];
    while (finalCards.length < 10) {
        finalCards.push(POOL[Math.floor(Math.random() * POOL.length)]);
    }
    state.hand = shuffle(finalCards);
    renderHand();
}

function renderHand() {
    const container = document.getElementById('player-hand');
    container.innerHTML = '';
    state.hand.forEach((char, i) => {
        const card = document.createElement('div');
        card.className = 'card';
        const romaji = state.isRomajiVisible ? `<div class="romaji">${ROMAJI_MAP[char] || ''}</div>` : '';
        card.innerHTML = `<div class="kana">${char}</div>${romaji}`;
        card.onclick = () => {
            if (state.gameActive && state.selectedLetters.length < 7) {
                state.selectedLetters.push(state.hand.splice(i, 1)[0]);
                renderHand();
                renderWordZone();
            }
        };
        container.appendChild(card);
    });
}

function renderWordZone() {
    const zone = document.getElementById('word-zone');
    zone.innerHTML = '';
    // Buat 5 slot permanen
    for (let i = 0; i < 5; i++) {
        const slot = document.createElement('div');
        slot.className = 'letter-slot';
        const char = state.selectedLetters[i];
        if (char) {
            const romaji = state.isRomajiVisible ? `<div style="font-size:8px;">${ROMAJI_MAP[char] || ''}</div>` : '';
            slot.innerHTML = `<div>${char}</div>${romaji}`;
        }
        zone.appendChild(slot);
    }
}

function renderSupportButtons() {
    const container = document.getElementById('support-container');
    container.innerHTML = '';
    ['ゃ', 'ゅ', 'ょ', 'っ'].forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-gold-oval btn-sm px-3';
        btn.innerText = s;
        btn.onclick = () => {
            if (state.gameActive && state.selectedLetters.length < 7) {
                state.selectedLetters.push(s);
                renderWordZone();
            }
        };
        container.appendChild(btn);
    });
}

function updateUI() {
    document.getElementById('hp-progress').style.width = state.yokaiHP + "%";
    document.getElementById('time-val').innerText = state.timeLeft + "s";
}

function startTimer() {
    clearInterval(state.timerInt);
    state.timerInt = setInterval(() => {
        if (state.gameActive && state.timeLeft > 0) {
            state.timeLeft--;
            updateUI();
            if (state.timeLeft <= 0) {
                state.gameActive = false;
                showModal(false);
            }
        }
    }, 1000);
}

function showModal(isWin) {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.replace('d-none', 'd-flex');
    document.getElementById('modal-title').innerText = isWin ? "RITUAL BERHASIL!" : "RITUAL GAGAL!";
    document.getElementById('modal-desc').innerText = isWin ? "Yokai tersegel sempurna." : "Yokai melarikan diri!";
    document.getElementById('modal-buttons-area').innerHTML = `<button class="btn btn-warning py-2 fw-bold" onclick="location.reload()">KE MENU UTAMA</button>`;
}
