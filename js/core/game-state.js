export function createGameState() {
    return {
        currentLevel: 1,
        pressure: 0,
        moves: 0,
        isLocked: false,
        isComplete: false,
        cheatMode: false,
        grid: [],
        levelSolved: false,
        pressureLoop: null
    };
}

export function createGrid(level) {
    return level.map((cell, index) => ({
        id: index,
        type: cell.type,
        rotation: cell.rotation,
        isSource: cell.isSource || null,
        isSink: cell.isSink || null,
        powered: { cyan: false, magenta: false }
    }));
}
