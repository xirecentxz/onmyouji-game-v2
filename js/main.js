import { state, shuffle, checkAnswer } from './engine.js';
import { ROMAJI_MAP, STAGE_CONFIG, POOL } from './constants.js';

// Fungsi utama untuk render UI
window.startGame = async function() {
    // ... logika fetch data dan mulai game ...
};

window.renderHand = function() {
    const container = document.getElementById('player-hand');
    container.innerHTML = '';
    state.hand.forEach((char, i) => {
        // ... buat kartu ...
    });
};

// Expose fungsi ke window agar tombol HTML bisa memanggilnya
window.showLevelSelector = () => { /* ... */ };
window.confirmWord = () => { /* ... */ };
