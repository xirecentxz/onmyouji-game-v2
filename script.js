let ALL_DATA = null;
let currentLevel = 1;
let currentQuestion = null;
let isRomajiVisible = false;
let gameActive = false;
let timeLeft = 90;
let yokaiHP = 100;
let selectedLetters = [];
let hand = [];
let timerInt = null;

// VARIABEL BARU UNTUK ANTRIAN ANTI-BERULANG
let questionPool = []; 

const ROMAJI_MAP = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'な': 'na', 'ni': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'を': 'wo', 'ん': 'n',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
    'ゃ': 'ya', 'ゅ': 'yu', 'ょ': 'yo', 'っ': '(stop)'
};

const POOL = ['あ','い','う','え','お','か','き','く','け','こ','さ','し','す','せ','そ','た','ち','つ','て','と','な','に','ぬ','ね','の','ま','み','む','め','も','ら','り','る','れ','ろ'];

async function init() {
    try {
        const res = await fetch('database.json');
        ALL_DATA = await res.json();
        loadQuestion();
        startTimer();
    } catch (e) { console.error("Database missing", e); }
}

function loadQuestion() {
    const levelData = ALL_DATA.levels[currentLevel];
    
    // LOGIKA SHUFFLED QUEUE (ANTI-BERULANG)
    if (questionPool.length === 0) {
        questionPool = [...levelData.words]; // Ambil semua kata dari kategori 
        shuffle(questionPool); // Kocok urutannya 
    }
    
    // Ambil satu per satu sampai habis
    currentQuestion = questionPool.pop();
    
    document.getElementById('level-banner').innerText = `Level ${currentLevel}: ${levelData.category}`;
    document.getElementById('kanji-question').innerText = currentQuestion.kanji;
    document.getElementById('kanji-meaning').innerText = currentQuestion.meaning;
    
    const kanjiHint = document.getElementById('kanji-reading-hint');
    kanjiHint.innerText = currentQuestion.reading_romaji;
    if(isRomajiVisible) kanjiHint.classList.remove('hidden');
    else kanjiHint.classList.add('hidden');

    selectedLetters = [];
    generateHand(currentQuestion.reading);
    renderWordZone();
    renderSupportButtons();
    gameActive = true;
}

function generateHand(reading) {
    let required = reading.split('').filter(c => !['ゃ','ゅ','ょ','っ'].includes(c));
    let extraCount = 10 - required.length;
    let finalCards = [...required];
    for(let i=0; i<extraCount; i++) {
        finalCards.push(POOL[Math.floor(Math.random() * POOL.length)]);
    }
    hand = shuffle(finalCards);
    renderHand();
}

function toggleRomaji() {
    isRomajiVisible = !isRomajiVisible;
    document.getElementById('romaji-toggle-btn').innerText = `Romaji: ${isRomajiVisible ? 'ON' : 'OFF'}`;
    
    const kanjiHint = document.getElementById('kanji-reading-hint');
    if(isRomajiVisible) kanjiHint.classList.remove('hidden');
    else kanjiHint.classList.add('hidden');

    renderHand(); 
    renderWordZone();
}

function renderHand() {
    const container = document.getElementById('player-hand');
    container.innerHTML = '';
    hand.forEach((char, i) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="kana">${char}</div>
            <div class="romaji ${isRomajiVisible ? '' : 'hidden'}">${ROMAJI_MAP[char] || ''}</div>
        `;
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
            slot.innerHTML = `<div style="font-size:20px; font-weight:bold; color:black;">${char}</div>
                              <div style="font-size:9px; color:#666;" class="${isRomajiVisible ? '' : 'hidden'}">${ROMAJI_MAP[char] || ''}</div>`;
            slot.style.backgroundColor = "white";
            slot.classList.add('active');
        } else {
            slot.innerHTML = ''; slot.style.backgroundColor = "transparent"; slot.classList.remove('active');
        }
    });
    document.getElementById('confirm-btn').disabled = selectedLetters.length === 0;
}

function confirmWord() {
    if(!gameActive) return;
    const answer = selectedLetters.join('');
    if(answer === currentQuestion.reading) {
        // Bonus Damage berdasarkan panjang kata
        let damage = 20 + (answer.length * 5); 
        yokaiHP -= damage;
        
        if(yokaiHP <= 0) {
            yokaiHP = 0; gameActive = false; showModal(true);
        } else {
            loadQuestion();
        }
    } else {
        // FIX TIMER MINUS: Gunakan Math.max untuk membatasi angka paling rendah adalah 0
        timeLeft = Math.max(0, timeLeft - 10);
        clearWord();
        showFlashError();
        
        // Cek jika waktu habis setelah pengurangan penalti
        if(timeLeft === 0) {
            gameActive = false;
            showModal(false);
        }
    }
    updateUI();
}

function renderSupportButtons() {
    const container = document.getElementById('support-container');
    container.innerHTML = '';
    ['ゃ', 'ゅ', 'ょ', 'っ'].forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'btn-support';
        btn.innerText = s;
        btn.onclick = () => {
            if(gameActive && selectedLetters.length < 7) {
                selectedLetters.push(s);
                renderWordZone();
            }
        };
        container.appendChild(btn);
    });
}

function clearWord() {
    selectedLetters.forEach(c => { if(!['ゃ','ゅ','ょ','っ'].includes(c)) hand.push(c); });
    selectedLetters = [];
    renderHand(); renderWordZone();
}

function showHint() {
    if(!gameActive) return;
    const cards = document.querySelectorAll('.card');
    const firstChar = currentQuestion.reading[0];
    cards.forEach(c => {
        if(c.querySelector('.kana').innerText === firstChar) {
            c.classList.add('hint-glow');
            setTimeout(() => c.classList.remove('hint-glow'), 3000);
        }
    });
}

function startTimer() {
    timerInt = setInterval(() => {
        if(gameActive && timeLeft > 0) {
            timeLeft--; 
            updateUI();
            if(timeLeft <= 0) { 
                timeLeft = 0;
                gameActive = false; 
                showModal(false); 
            }
        }
    }, 1000);
}

function showFlashError() {
    const timer = document.querySelector('.timer-section');
    timer.style.color = "red";
    setTimeout(() => timer.style.color = "white", 500);
}

function updateUI() {
    document.getElementById('hp-fill').style.width = yokaiHP + "%";
    document.getElementById('time-val').innerText = timeLeft;
}

function showModal(isWin) {
    const overlay = document.getElementById('modal-overlay');
    overlay.style.display = 'flex';
    document.getElementById('modal-title').innerText = isWin ? "RITUAL BERHASIL!" : "RITUAL GAGAL!";
}

function nextLevel() {
    // Sesuaikan batas level dengan database Anda (Level 1-10) [cite: 3, 10, 25]
    if(currentLevel < 10) {
        currentLevel++;
        questionPool = []; // Reset antrean untuk level baru
        yokaiHP = 100; timeLeft = 90;
        loadQuestion();
        document.getElementById('modal-overlay').style.display = 'none';
    } else {
        alert("Selamat! Anda telah menguasai semua segel Kanji!");
        location.reload();
    }
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

window.onload = init;
