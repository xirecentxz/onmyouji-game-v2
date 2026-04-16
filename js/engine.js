// Variable state untuk menyimpan status game
export let state = {
    allData: null,
    currentStage: 1,
    currentQuestion: null,
    isRomajiVisible: false,
    gameActive: false,
    timeLeft: 90,
    yokaiHP: 100,
    selectedLetters: [],
    hand: [],
    questionPool: [],
    gameMode: 'story',
    timerInt: null
};

/**
 * AUTO-LOAD DATABASE (Anti-Cache)
 * Menggunakan timestamp agar tidak perlu ganti v1, v2 secara manual.
 */
(async function initDatabase() {
    try {
        // Trik ?t= akan menghasilkan angka unik setiap detik
        const response = await fetch(`database.json?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error("File database.json tidak ditemukan atau error");
        
        state.allData = await response.json();
        console.log("Engine: Database terbaru berhasil dimuat otomatis.");
    } catch (error) {
        console.error("Engine Error:", error);
    }
})();

export function resetState() {
    state.yokaiHP = 100;
    state.timeLeft = (state.gameMode === 'tutorial') ? 999 : 90;
    state.selectedLetters = [];
    state.questionPool = [];
    state.gameActive = false;
    
    if (state.timerInt) {
        clearInterval(state.timerInt);
        state.timerInt = null;
    }
    console.log("Engine: State has been reset.");
}

export function shuffle(array) {
    if (!array || array.length === 0) return [];
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}
