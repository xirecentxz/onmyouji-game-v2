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

export function resetState() {
    state.yokaiHP = 100;
    state.timeLeft = (state.gameMode === 'tutorial') ? 999 : 90;
    state.selectedLetters = [];
    state.questionPool = [];
    state.gameActive = false;
    if (state.timerInt) clearInterval(state.timerInt);
    console.log("Engine: State has been reset.");
}

export function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}
