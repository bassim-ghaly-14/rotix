export function loadProgress(key, maxLevels) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return { currentLevel: 1, cheatMode: false };

        const saved = JSON.parse(raw);
        const savedLevel = Number(saved.currentLevel);

        return {
            currentLevel: Number.isInteger(savedLevel)
                ? Math.min(Math.max(savedLevel, 1), maxLevels)
                : 1,
            cheatMode: saved.cheatMode === true
        };
    } catch (error) {
        console.warn("Unable to load Rotix progress.", error);
        return { currentLevel: 1, cheatMode: false };
    }
}

export function saveProgress(key, state) {
    try {
        localStorage.setItem(key, JSON.stringify({
            currentLevel: state.currentLevel,
            cheatMode: state.cheatMode
        }));
    } catch (error) {
        console.warn("Unable to save Rotix progress.", error);
    }
}
