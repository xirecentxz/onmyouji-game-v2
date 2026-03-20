import { STAGE_CONFIG } from './constants.js';

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
    gameMode: 'story'
};

export function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function checkAnswer() {
    const answer = state.selectedLetters.join('');
    return answer === state.currentQuestion.reading;
}
