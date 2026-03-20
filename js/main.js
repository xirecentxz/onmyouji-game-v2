import { state, resetState, shuffle } from './engine.js';
import { ROMAJI_MAP, STAGE_CONFIG, POOL } from './constants.js';

// --- NAVIGASI LAYAR (WAJIB EXPOSE KE WINDOW) ---
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
    
    // Pastikan database dimuat
    if (!state.allData) {
        try {
            const res = await fetch('database.json');
            state.allData = await res.json();
        } catch (e) { console.error("Database Gagal", e); return; }
    }
    
    resetState();
    loadQuestion();
    // Jalankan timer hanya jika bukan mode tutorial
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
    renderSupportButtons();
    state.gameActive = true;
}

// Tambahkan fungsi updateUI, startTimer, dan renderHand di bawahnya...
// Pastikan semua fungsi yang dipanggil di HTML diawali "window.namaFungsi"
