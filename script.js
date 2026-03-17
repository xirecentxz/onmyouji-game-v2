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
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', ' mo': 'mo',
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

const POOL = ['あ','い','う','え','お','か','き','く','け','こ','さ','し','す','せ','そ','た','ち','つ','て','と','な','に','ぬ','ね','の','ま','み','む','め','も','ら','り','る','れ','ろ','が','ざ','だ','ば'];

async function startGame() {
    document.getElementById('homepage-screen').classList.replace('d-flex', 'd-none');
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
    startTimer();
}

function backToHome() {
    clearInterval(timerInt);
    gameActive = false;
    document.getElementById('game-screen').style.display = 'none';
    hideModal();
    document.getElementById('homepage-screen').classList.replace('d-none', 'd-flex');
}

function hideModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.replace('d-flex', 'd-none');
}

function resetStageState() {
    yokaiHP = 100;
    timeLeft = 90;
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
        questionPool = allWords.slice(0, config.target);
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

function toggleRomaji() {
    isRomajiVisible = !isRomajiVisible;
    const romajiBtn = document.getElementById('romaji-toggle-btn');
    if (romajiBtn) {
        romajiBtn.innerText = `Romaji: ${isRomajiVisible ? 'ON' : 'OFF'}`;
    }
    renderHand();
    renderWordZone();
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
        timeLeft = Math.max(0, timeLeft - 10);
        clearWord();
        showFlashError();
        if(timeLeft === 0) { 
            gameActive = false; 
            updateUI(); 
            showModal(false); 
        }
    }
    updateUI();
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
        desc.innerText = "Yokai telah tersegel dengan sempurna.";
        if (currentStage < 10) {
            btnArea.innerHTML += `<button class="btn btn-warning fw-bold py-2 shadow" onclick="nextStage()">Stage Berikutnya</button>`;
        } else {
            title.innerText = "MASTER ONMYOJI!";
            desc.innerText = "Semua segel kuno telah berhasil Anda kuasai.";
        }
    } else {
        title.innerText = "RITUAL GAGAL!";
        desc.innerText = "Waktu habis, Yokai melarikan diri ke kegelapan.";
        btnArea.innerHTML += `<button class="btn btn-danger fw-bold py-2 shadow" onclick="retryCurrentStage()">Coba Lagi</button>`;
    }
    btnArea.innerHTML += `<button class="btn btn-outline-light btn-sm mt-2" onclick="backToHome()">Kembali ke Beranda</button>`;
}

function retryCurrentStage() {
    yokaiHP = 100;
    timeLeft = 90;
    questionPool = []; 
    hideModal();
    loadQuestion();
    gameActive = true;
}

function nextStage() {
    currentStage++;
    questionPool = [];
    yokaiHP = 100;
    timeLeft = 90;
    hideModal();
    loadQuestion();
    gameActive = true;
}

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
        const romajiTag = isRomajiVisible ? `<div class="romaji">${ROMAJI_MAP[char] || ''}</div>` : '';
        card.innerHTML = `<div class="kana">${char}</div>${romajiTag}`;
        card.onclick = () => { 
            if(gameActive && selectedLetters.length < 5) { 
                selectedLetters.push(hand.splice(i, 1)[0]); 
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
        const char = selectedLetters[i];
        if(char) {
            const romajiHint = isRomajiVisible ? `<div style="font-size:8px; opacity:0.6; margin-top:-2px;">${ROMAJI_MAP[char] || ''}</div>` : '';
            slot.innerHTML = `<div style="margin-top:2px;">${char}</div>${romajiHint}`;
        } else { 
            slot.innerHTML = ''; 
        }
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
        btn.onclick = () => { if(gameActive && selectedLetters.length < 5) { selectedLetters.push(s); renderWordZone(); } };
        container.appendChild(btn);
    });
}

function clearWord() {
    selectedLetters.forEach(c => { if(!['ゃ','ゅ','ょ','っ'].includes(c)) hand.push(c); });
    selectedLetters = []; 
    renderHand(); 
    renderWordZone();
}

function showHint() {
    if(!gameActive) return;
    const firstChar = currentQuestion.reading[0];
    document.querySelectorAll('.card').forEach(c => {
        if(c.querySelector('.kana').innerText === firstChar) {
            c.classList.add('hint-glow'); 
            setTimeout(() => c.classList.remove('hint-glow'), 3000);
        }
    });
}

function startTimer() {
    clearInterval(timerInt);
    timerInt = setInterval(() => {
        if(gameActive && timeLeft > 0) {
            timeLeft--; 
            updateUI();
            if(timeLeft <= 0) { 
                timeLeft = 0; 
                gameActive = false; 
                updateUI();
                showModal(false); 
            }
        }
    }, 1000);
}

function showFlashError() {
    const timeDisplay = document.querySelector('.timer-display');
    if (timeDisplay) {
        timeDisplay.classList.add('text-danger');
        setTimeout(() => timeDisplay.classList.remove('text-danger'), 500);
    }
}

function updateUI() {
    const progressBar = document.getElementById('hp-progress');
    if (progressBar) {
        const percentage = Math.max(0, yokaiHP);
        progressBar.style.width = percentage + "%";
        
        if (percentage > 50) {
            progressBar.className = "progress-bar bg-success progress-bar-striped progress-bar-animated";
        } else if (percentage > 20) {
            progressBar.className = "progress-bar bg-warning progress-bar-striped progress-bar-animated";
        } else {
            progressBar.className = "progress-bar bg-danger progress-bar-striped progress-bar-animated";
        }
    }

    const timeVal = document.getElementById('time-val');
    if (timeVal) {
        timeVal.innerText = timeLeft + "s";
        if(timeLeft < 20) timeVal.classList.add('text-danger');
        else timeVal.classList.remove('text-danger');
    }
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
