import { state, resetState, shuffle } from './engine.js';
import { ROMAJI_MAP, STAGE_CONFIG, POOL } from './constants.js';

// --- NAVIGASI KE WINDOW (Agar onclick di HTML berfungsi) ---
window.showLevelSelector = function() {
    document.getElementById('homepage-screen').classList.add('d-none');
    document.getElementById('level-selector').classList.remove('d-none');
};

window.backToHome = function() {
    document.getElementById('level-selector').classList.add('d-none');
    document.getElementById('homepage-screen').classList.remove('d-none');
};

window.startMode = function(mode, stage) {
    state.gameMode = mode;
    state.currentStage = stage;
    document.getElementById('level-selector').classList.add('d-none');
    startGame();
};

// --- LOGIKA UTAMA ---
async function startGame() {
    document.getElementById('game-screen').style.display = 'block';
    if (!state.allData) {
        try {
            const res = await fetch('database.json');
            state.allData = await res.json();
        } catch (e) { console.error("Database Gagal Dimuat", e); return; }
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
    document.getElementById('stage-banner').innerText = `Stage ${state.currentStage}: ${stageData.category}`;
    document.getElementById('kanji-question').innerText = state.currentQuestion.kanji;
    document.getElementById('kanji-meaning').innerText = state.currentQuestion.meaning;
    
    state.selectedLetters = [];
    generateHand(state.currentQuestion.reading);
    renderWordZone();
    state.gameActive = true;
}

function startTimer() {
    clearInterval(state.timerInt);
    state.timerInt = setInterval(() => {
        if(state.gameActive && state.timeLeft > 0) {
            state.timeLeft--;
            updateUI();
            if(state.timeLeft <= 0) {
                state.gameActive = false;
                showModal(false);
            }
        }
    }, 1000);
}

function updateUI() {
    const hp = document.getElementById('hp-progress');
    if (hp) hp.style.width = state.yokaiHP + "%";
    document.getElementById('time-val').innerText = state.timeLeft + "s";
}

function generateHand(reading) {
    let required = reading.split('').filter(c => !['ゃ','ゅ','ょ','っ'].includes(c));
    let finalCards = [...required];
    while(finalCards.length < 10) {
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
        card.innerHTML = `<div class="kana">${char}</div>`;
        card.onclick = () => {
            if(state.gameActive && state.selectedLetters.length < 7) {
                state.selectedLetters.push(state.hand.splice(i, 1)[0]);
                renderHand();
                renderWordZone();
            }
        };
        container.appendChild(card);
    });
}

function renderWordZone() {
    const slots = document.querySelectorAll('.letter-slot');
    slots.forEach((slot, i) => {
        const char = state.selectedLetters[i];
        slot.innerHTML = char ? `<div>${char}</div>` : '';
    });
}

function showModal(isWin) {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.replace('d-none', 'd-flex');
    document.getElementById('modal-title').innerText = isWin ? "RITUAL BERHASIL!" : "RITUAL GAGAL!";
    document.getElementById('modal-buttons-area').innerHTML = `<button class="btn btn-warning" onclick="location.reload()">Selesai</button>`;
}
