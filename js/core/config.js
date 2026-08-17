export const GAME_CONFIG = {
    gridSize: 4,
    maxLevels: 30,
    pressureLimit: 100,
    saveKey: "rotix_save_v2"
};

export const DIFFICULTY_CONFIG = {
    easy: { label: "EASY SECTOR", pressureSpeed: 0.18 },
    advanced: { label: "ADVANCED SECTOR", pressureSpeed: 0.28 },
    chaos: { label: "CHAOS SECTOR", pressureSpeed: 0.38 }
};

export const PIPE_MASKS = {
    I: [false, true, false, true],
    L: [false, true, true, false],
    T: [true, true, true, false],
    X: [true, true, true, true]
};

export function getDifficulty(level) {
    if (level <= 10) return DIFFICULTY_CONFIG.easy;
    if (level <= 20) return DIFFICULTY_CONFIG.advanced;
    return DIFFICULTY_CONFIG.chaos;
}
