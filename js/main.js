// --- BAGIAN ATAS MAIN.JS ---
import { state, resetState, shuffle } from './engine.js';
import { ROMAJI_MAP, STAGE_CONFIG, POOL } from './constants.js';

// --- WAJIB: Tempelkan fungsi navigasi ke 'window' agar HTML bisa 'melihatnya' ---

window.showLevelSelector = function() {
    console.log("Membuka daftar level...");
    const home = document.getElementById('homepage-screen');
    const selector = document.getElementById('level-selector');
    
    if (home && selector) {
        home.classList.add('d-none');
        selector.classList.remove('d-none');
    } else {
        console.error("Elemen screen tidak ditemukan di HTML!");
    }
};

window.backToHome = function() {
    document.getElementById('level-selector').classList.add('d-none');
    document.getElementById('homepage-screen').classList.remove('d-none');
};

window.startMode = function(mode, stage) {
    state.gameMode = mode;
    state.currentStage = stage;
    document.getElementById('level-selector').classList.add('d-none');
    startGame(); // Fungsi internal startGame tidak perlu pakai window.
};
