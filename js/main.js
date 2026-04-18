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
    
    // Gunakan remove/add agar lebih pasti dibanding replace
    const modal = document.getElementById('modal-overlay');
    modal.classList.add('d-none');
    modal.classList.remove('d-flex');
    
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
    state.comboCount = 0; 
    loadQuestion();
    if (state.gameMode !== 'tutorial') startTimer();
}

function loadQuestion() {
    const stageData = state.allData.levels[state.currentStage];
    
    if (state.questionPool.length === 0) {
        let allWords = [...stageData.words];
        shuffle(allWords);
        state.questionPool = allWords; 
        state.dynamicDmg = 100 / allWords.length;
    }
    
    state.currentQuestion = state.questionPool.pop();
    document.getElementById('kanji-question').innerText = state.currentQuestion.kanji;
    document.getElementById('kanji-meaning').innerText = ""; 
    document.getElementById('stage-banner').innerText = `Stage ${state.currentStage}: ${stageData.category}`;
    
    state.selectedLetters = [];
    generateHand(state.currentQuestion.reading);
    renderWordZone();
    renderSupportButtons();
    state.gameActive = true;
}

// --- FITUR INTERAKSI ---
window.confirmWord = () => {
    if (!state.gameActive) return;
    const answer = state.selectedLetters.join('');
    
    if (answer === state.currentQuestion.reading) {
        state.comboCount++;
        if (state.comboCount === 3) {
            state.timeLeft += 5; 
            state.comboCount = 0; 
            const timeDisplay = document.getElementById('time-val');
            if(timeDisplay) {
                timeDisplay.style.color = "#28a745"; 
                setTimeout(() => timeDisplay.style.color = "", 500);
            }
        }

        state.yokaiHP -= state.dynamicDmg;
        updateUI();
        
        if (state.yokaiHP <= 0.1) {
            state.gameActive = false;
            showModal(true);
        } else {
            loadQuestion();
        }
    } else {
        state.comboCount = 0;
        document.querySelector('.scroll-box').classList.add('shake');
        setTimeout(() => document.querySelector('.scroll-box').classList.remove('shake'), 400);
        
        // CEK KALAH INSTAN JIKA PENALTI WAKTU
        state.timeLeft = Math.max(0, state.timeLeft - 10);
        updateUI();
        
        if (state.timeLeft <= 0) {
            state.gameActive = false;
            showModal(false); 
        } else {
            window.clearWord();
        }
    }
};

window.clearWord = () => {
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
    const meaningLabel = document.getElementById('kanji-meaning');
    if (meaningLabel) {
        meaningLabel.innerText = state.isRomajiVisible ? state.currentQuestion.meaning : "";
    }

    const zone = document.getElementById('word-zone');
    zone.innerHTML = '';
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
    const hpProgress = document.getElementById('hp-progress');
    if (hpProgress) hpProgress.style.width = Math.max(0, state.yokaiHP) + "%";
    
    const timeVal = document.getElementById('time-val');
    if (timeVal) timeVal.innerText = state.timeLeft + "s";
}

function startTimer() {
    clearInterval(state.timerInt);
    state.timerInt = setInterval(() => {
        if (!state.gameActive) {
            clearInterval(state.timerInt);
            return;
        }

        if (state.timeLeft > 0) {
            state.timeLeft--;
            updateUI();
        } 
        
        // Pengecekan kalah dipisah agar lebih akurat
        if (state.timeLeft <= 0) {
            state.gameActive = false;
            showModal(false);
            clearInterval(state.timerInt);
        }
    }, 1000);
}

function showModal(isWin) {
    console.log("Modal Triggered! isWin:", isWin); // Cek di F12 Console laptopmu
    const overlay = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const desc = document.getElementById('modal-desc');
    const btnArea = document.getElementById('modal-buttons-area');
    
    // Pastikan modal muncul dengan pasti
    overlay.classList.remove('d-none');
    overlay.classList.add('d-flex');
    btnArea.innerHTML = ''; 

    if (isWin) {
        title.innerText = "RITUAL BERHASIL!";
        desc.innerText = "Yokai telah tersegel sempurna. ✨";
        btnArea.innerHTML = `
            <button class="btn btn-warning fw-bold py-2" onclick="window.startMode('${state.gameMode}', ${state.currentStage})">ULANGI RITUAL</button>
            <button class="btn btn-outline-light btn-sm mt-2" onclick="location.reload()">KE MENU UTAMA</button>
        `;
    } else {
        title.innerText = "RITUAL GAGAL!";
        desc.innerText = "Waktu habis, Yokai melarikan diri.";
        btnArea.innerHTML = `
            <button class="btn btn-danger fw-bold py-2" onclick="window.startMode('${state.gameMode}', ${state.currentStage})">COBA LAGI</button>
            <button class="btn btn-outline-light btn-sm mt-2" onclick="location.reload()">MENYERAH</button>
        `;
    }
}
