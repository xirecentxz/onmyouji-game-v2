import { state, shuffle, resetState } from './engine.js';
import { ROMAJI_MAP, STAGE_CONFIG, POOL } from './constants.js';

// --- FUNGSI NAVIGASI (Expose ke HTML) ---
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

async function startGame() {
    document.getElementById('game-screen').style.display = 'block';
    if (!state.allData) {
        try {
            const res = await fetch('database.json');
            state.allData = await res.json();
        } catch (e) { console.error("Database missing", e); return; }
    }
    resetState();
    loadQuestion();
    if (state.gameMode !== 'tutorial') startTimer();
}

// --- FUNGSI GAMEPLAY (Expose ke HTML) ---
window.confirmWord = () => {
    const answer = state.selectedLetters.join('');
    if(answer === state.currentQuestion.reading) {
        state.yokaiHP -= STAGE_CONFIG[state.currentStage].dmg;
        if(state.yokaiHP <= 0) { showModal(true); } 
        else { updateUI(); loadQuestion(); }
    } else {
        state.timeLeft -= 10;
        window.clearWord();
        updateUI();
    }
};

window.clearWord = () => {
    state.selectedLetters.forEach(c => { if(!['ゃ','ゅ','ょ','っ'].includes(c)) state.hand.push(c); });
    state.selectedLetters = [];
    renderHand();
    renderWordZone();
};

window.showHint = () => {
    const firstChar = state.currentQuestion.reading[0];
    document.querySelectorAll('.card').forEach(c => {
        if(c.querySelector('.kana').innerText === firstChar) {
            c.classList.add('hint-glow');
            setTimeout(() => c.classList.remove('hint-glow'), 3000);
        }
    });
};

// Fungsi render internal (tidak perlu window.)
function loadQuestion() {
    // ... logika ambil pertanyaan dari allData ...
    renderHand();
    renderWordZone();
}

function renderHand() {
    const container = document.getElementById('player-hand');
    container.innerHTML = '';
    state.hand.forEach((char, i) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<div class="kana">${char}</div>`;
        card.onclick = () => { /* logika pilih kartu */ };
        container.appendChild(card);
    });
}
