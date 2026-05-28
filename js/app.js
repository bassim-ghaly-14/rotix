/**
 * Rotix // Cyber-Fluid Pipeline
 * Production Puzzle Engine
 */

/* =========================
   CORE CONFIG
========================= */

const GAME_CONFIG = {
    gridSize: 4,
    maxLevels: 30,
    pressureLimit: 100,
    saveKey: "rotix_save_v2"
};

const DIFFICULTY_CONFIG = {
    easy: {
        label: "EASY SECTOR",
        pressureSpeed: 0.18
    },

    advanced: {
        label: "ADVANCED SECTOR",
        pressureSpeed: 0.28
    },

    chaos: {
        label: "CHAOS SECTOR",
        pressureSpeed: 0.38
    }
};

/* =========================
   PIPE DEFINITIONS
========================= */

const PIPE_MASKS = {

    I: [false, true, false, true],

    L: [false, true, true, false],

    T: [true, true, true, false],

    X: [true, true, true, true]

};

/* =========================
   STATE
========================= */

const gameState = {

    currentLevel: 1,

    pressure: 0,

    moves: 0,

    isLocked: false,

    isComplete: false,

    cheatMode: false,

    grid: [],

    levelSolved: false,

    pressureLoop: null,

    hintPointer: 0

};

/* =========================
   AUDIO
========================= */

let audioContext = null;

/* =========================
   INIT
========================= */

document.addEventListener("DOMContentLoaded", () => {

    loadSave();

    initAudio();

    initNavigation();

    initModals();

    initCheatMode();

    initTouchFeedback();

    runSplash();

});

/* =========================
   SPLASH
========================= */

function runSplash() {

    const splash = document.getElementById("splash-screen");

    setTimeout(() => {

        splash.style.opacity = "0";

        setTimeout(() => {

            splash.style.display = "none";

            bootLevel();

        }, 500);

    }, 1400);

}

/* =========================
   AUDIO INIT
========================= */

function initAudio() {

    const unlock = () => {

        if (!audioContext) {

            audioContext = new (
                window.AudioContext ||
                window.webkitAudioContext
            )();

        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        document.removeEventListener("touchstart", unlock);
        document.removeEventListener("click", unlock);

    };

    document.addEventListener("touchstart", unlock, { once: true });
    document.addEventListener("click", unlock, { once: true });

}

/* =========================
   NAVIGATION
========================= */

function initNavigation() {

    const tabs = document.querySelectorAll(".tab-item");

    tabs.forEach(tab => {

        tab.addEventListener("click", () => {

            if (gameState.isLocked) return;

            tabs.forEach(t => {
                t.classList.remove("active");
            });

            document
                .querySelectorAll(".view-panel")
                .forEach(panel => {
                    panel.classList.remove("active");
                });

            tab.classList.add("active");

            document
                .getElementById(tab.dataset.target)
                .classList.add("active");

        });

    });

}

/* =========================
   MODALS
========================= */

function initModals() {

    document
        .getElementById("btn-next-level")
        .addEventListener("click", nextLevel);

    document
        .getElementById("btn-reboot")
        .addEventListener("click", rebootLevel);

    document
        .getElementById("btn-restart-campaign")
        .addEventListener("click", restartCampaign);

}

function openModal(type) {

    const portal = document.getElementById("modal-portal");

    portal.classList.add("active");

    document
        .querySelectorAll(".cyber-modal")
        .forEach(modal => {
            modal.classList.remove("active");
        });

    if (type === "success") {
        document
            .getElementById("modal-success")
            .classList.add("active");
    }

    if (type === "failure") {
        document
            .getElementById("modal-failure")
            .classList.add("active");
    }

    if (type === "complete") {
        document
            .getElementById("modal-complete")
            .classList.add("active");
    }

}

function closeModal() {

    document
        .getElementById("modal-portal")
        .classList.remove("active");

    document
        .querySelectorAll(".cyber-modal")
        .forEach(modal => {
            modal.classList.remove("active");
        });

}

/* =========================
   BOOT LEVEL
========================= */

function bootLevel() {

    clearPressureLoop();

    gameState.pressure = 0;

    gameState.moves = 0;

    gameState.isLocked = false;

    gameState.levelSolved = false;

    const levelData = LEVEL_SCHEMATICS[
        gameState.currentLevel - 1
    ];

    if (!levelData) {

        gameState.isComplete = true;

        openModal("complete");

        return;

    }

    updateHUD();

    buildGrid(levelData);

    startPressureLoop();

    evaluateGrid();

}

/* =========================
   HUD
========================= */

function updateHUD() {

    document.getElementById("level-display").textContent =
        String(gameState.currentLevel).padStart(2, "0");

    document.getElementById("moves-display").textContent =
        gameState.moves;

    document.getElementById("pressure-bar").style.width =
        `${gameState.pressure}%`;

    document
        .getElementById("difficulty-display")
        .textContent = getDifficulty().label;

}

/* =========================
   DIFFICULTY
========================= */

function getDifficulty() {

    if (gameState.currentLevel <= 10) {
        return DIFFICULTY_CONFIG.easy;
    }

    if (gameState.currentLevel <= 20) {
        return DIFFICULTY_CONFIG.advanced;
    }

    return DIFFICULTY_CONFIG.chaos;

}

/* =========================
   BUILD GRID
========================= */

function buildGrid(level) {

    const grid = document.getElementById("pipeline-matrix");

    grid.innerHTML = "";

    gameState.grid = [];

    level.forEach((cell, index) => {

        const node = {

            id: index,

            type: cell.type,

            rotation: cell.rotation,

            isSource: cell.isSource || null,

            isSink: cell.isSink || null,

            powered: {
                cyan: false,
                magenta: false
            }

        };

        gameState.grid.push(node);

        const element = document.createElement("div");

        element.id = `node-${index}`;

        element.className =
            `rotator-node node-type-${node.type}`;

        applyRotation(element, node.rotation);

        if (node.isSource) {
            element.classList.add(
                `node-source-${node.isSource}`
            );
        }

        if (node.isSink) {
            element.classList.add(
                `node-sink-${node.isSink}`
            );
        }

        createPipeVisuals(element, node.type);

        element.addEventListener("click", () => {
            rotateNode(index);
        });

        grid.appendChild(element);

    });

}

/* =========================
   PIPE VISUALS
========================= */

function createPipeVisuals(element, type) {

    let count = 1;

    if (type === "L") count = 2;
    if (type === "T") count = 3;
    if (type === "X") count = 2;

    for (let i = 0; i < count; i++) {

        const pipe = document.createElement("div");

        pipe.className = "pipe-vector";

        element.appendChild(pipe);

    }

}

/* =========================
   ROTATION
========================= */

function rotateNode(index) {

    if (gameState.isLocked) return;

    const node = gameState.grid[index];

    node.rotation =
        (node.rotation + 90) % 360;

    gameState.moves++;

    const element = document.getElementById(
        `node-${index}`
    );

    applyRotation(element, node.rotation);

    createPulse(index);

    playTone(420, 0.04);

    vibrate(10);

    updateHUD();

    evaluateGrid();

    saveGame();

}

function applyRotation(element, rotation) {

    element.style.transform =
        `rotate(${rotation}deg)`;

}

/* =========================
   GRID EVALUATION
========================= */

function evaluateGrid() {

    resetPowerState();

    const cyanSource = findSource("cyan");
    const magentaSource = findSource("magenta");

    if (cyanSource !== -1) {
        propagatePower(cyanSource, "cyan");
    }

    if (magentaSource !== -1) {
        propagatePower(magentaSource, "magenta");
    }

    renderPowerState();

    if (gameState.cheatMode) {
        renderCheatOverlay();
    } else {
        clearCheatOverlay();
    }

    checkVictory();

}

/* =========================
   RESET POWER
========================= */

function resetPowerState() {

    gameState.grid.forEach(node => {

        node.powered.cyan = false;

        node.powered.magenta = false;

    });

}

/* =========================
   SOURCE FINDER
========================= */

function findSource(color) {

    return gameState.grid.findIndex(node => {
        return node.isSource === color;
    });

}

/* =========================
   POWER PROPAGATION
========================= */

function propagatePower(start, color) {

    const queue = [start];

    const visited = new Set();

    while (queue.length) {

        const current = queue.shift();

        if (visited.has(current)) continue;

        visited.add(current);

        gameState.grid[current]
            .powered[color] = true;

        const neighbors =
            getConnectedNeighbors(current);

        neighbors.forEach(next => {

            if (!visited.has(next)) {
                queue.push(next);
            }

        });

    }

}

/* =========================
   CONNECTIONS
========================= */

function getConnectedNeighbors(index) {

    const size = GAME_CONFIG.gridSize;

    const row = Math.floor(index / size);

    const col = index % size;

    const node = gameState.grid[index];

    const nodeDirections =
        getDirections(node.type, node.rotation);

    const map = [

        [-1, 0, 2],
        [0, 1, 3],
        [1, 0, 0],
        [0, -1, 1]

    ];

    const result = [];

    map.forEach((step, direction) => {

        if (!nodeDirections[direction]) return;

        const nextRow = row + step[0];

        const nextCol = col + step[1];

        if (
            nextRow < 0 ||
            nextRow >= size ||
            nextCol < 0 ||
            nextCol >= size
        ) {
            return;
        }

        const nextIndex =
            nextRow * size + nextCol;

        const neighbor =
            gameState.grid[nextIndex];

        const neighborDirections =
            getDirections(
                neighbor.type,
                neighbor.rotation
            );

        if (neighborDirections[step[2]]) {
            result.push(nextIndex);
        }

    });

    return result;

}

/* =========================
   DIRECTION MAP
========================= */

function getDirections(type, rotation) {

    const mask = [...PIPE_MASKS[type]];

    const turns = (rotation / 90) % 4;

    for (let i = 0; i < turns; i++) {
        mask.unshift(mask.pop());
    }

    return mask;

}

/* =========================
   RENDER POWER
========================= */

function renderPowerState() {

    gameState.grid.forEach((node, index) => {

        const element =
            document.getElementById(
                `node-${index}`
            );

        element.classList.remove(
            "powered-cyan",
            "powered-magenta",
            "powered-mixed"
        );

        if (
            node.powered.cyan &&
            node.powered.magenta
        ) {

            element.classList.add(
                "powered-mixed"
            );

            return;

        }

        if (node.powered.cyan) {
            element.classList.add(
                "powered-cyan"
            );
        }

        if (node.powered.magenta) {
            element.classList.add(
                "powered-magenta"
            );
        }

    });

}

/* =========================
   VICTORY
========================= */

function checkVictory() {

    if (gameState.levelSolved) return;

    const sink = gameState.grid.find(node => {
        return node.isSink === "gold";
    });

    if (!sink) return;

    const solved =
        sink.powered.cyan &&
        sink.powered.magenta;

    if (!solved) return;

    gameState.levelSolved = true;

    gameState.isLocked = true;

    clearPressureLoop();

    document
        .getElementById("matrix-card")
        .classList.add("success-glow");

    playTone(780, 0.2);

    vibrate([20, 40, 20]);

    updateResultStats();

    saveGame();

    setTimeout(() => {

        if (
            gameState.currentLevel >=
            GAME_CONFIG.maxLevels
        ) {

            openModal("complete");

            return;

        }

        openModal("success");

    }, 600);

}

/* =========================
   RESULT STATS
========================= */

function updateResultStats() {

    const efficiency =
        Math.max(
            10,
            100 - (gameState.moves * 2)
        );

    document
        .getElementById("modal-level-val")
        .textContent =
        String(gameState.currentLevel)
            .padStart(2, "0");

    document
        .getElementById("modal-moves-val")
        .textContent =
        gameState.moves;

    document
        .getElementById("modal-efficiency-val")
        .textContent =
        `${efficiency}%`;

    document
        .getElementById("failure-level-val")
        .textContent =
        String(gameState.currentLevel)
            .padStart(2, "0");

    document
        .getElementById("failure-moves-val")
        .textContent =
        gameState.moves;

}

/* =========================
   PRESSURE LOOP
========================= */

function startPressureLoop() {

    clearPressureLoop();

    const pressureBar =
        document.getElementById("pressure-bar");

    const pill =
        document.getElementById("pressure-pill");

    const speed =
        getDifficulty().pressureSpeed;

    gameState.pressureLoop =
        setInterval(() => {

            if (gameState.isLocked) return;

            gameState.pressure += speed;

            if (gameState.pressure > 100) {
                gameState.pressure = 100;
            }

            pressureBar.style.width =
                `${gameState.pressure}%`;

            if (gameState.pressure >= 75) {

                pill.classList.add(
                    "danger-alert"
                );

            } else {

                pill.classList.remove(
                    "danger-alert"
                );

            }

            if (
                gameState.pressure >=
                GAME_CONFIG.pressureLimit
            ) {

                triggerFailure();

            }

        }, 100);

}

function clearPressureLoop() {

    clearInterval(gameState.pressureLoop);

    gameState.pressureLoop = null;

}

/* =========================
   FAILURE
========================= */

function triggerFailure() {

    gameState.isLocked = true;

    clearPressureLoop();

    playTone(180, 0.2);

    vibrate([60, 80, 60]);

    updateResultStats();

    openModal("failure");

}

/* =========================
   LEVEL FLOW
========================= */

function nextLevel() {

    closeModal();

    gameState.currentLevel++;

    saveGame();

    bootLevel();

}

function rebootLevel() {

    closeModal();

    bootLevel();

}

function restartCampaign() {

    closeModal();

    gameState.currentLevel = 1;

    gameState.isComplete = false;

    saveGame();

    bootLevel();

}

/* =========================
   CHEAT MODE
========================= */

function initCheatMode() {

    document
        .getElementById("rotix-logo")
        .addEventListener("dblclick", () => {

            gameState.cheatMode =
                !gameState.cheatMode;

            document.body.classList.toggle(
                "cheat-active",
                gameState.cheatMode
            );

            if (gameState.cheatMode) {

                renderCheatDashboard();

            } else {

                removeCheatDashboard();

            }

            evaluateGrid();

            saveGame();

        });

}

function renderCheatDashboard() {

    removeCheatDashboard();

    const panel = document.createElement("div");

    panel.id = "cheat-dashboard";

    panel.innerHTML = `
        <button id="cheat-solve">SOLVE</button>
        <button id="cheat-hint">HINT</button>
        <button id="cheat-skip">SKIP</button>
    `;

    document.body.appendChild(panel);

    document
        .getElementById("cheat-solve")
        .addEventListener("click", autoSolve);

    document
        .getElementById("cheat-hint")
        .addEventListener("click", showHint);

    document
        .getElementById("cheat-skip")
        .addEventListener("click", nextLevel);

}

function removeCheatDashboard() {

    const panel =
        document.getElementById(
            "cheat-dashboard"
        );

    if (panel) {
        panel.remove();
    }

}

/* =========================
   REAL SOLVER
========================= */

function autoSolve() {

    if (gameState.isLocked) return;

    const solution =
        LEVEL_SOLUTIONS[
            gameState.currentLevel - 1
        ];

    if (!solution) return;

    gameState.isLocked = true;

    let step = 0;

    const animation = setInterval(() => {

        if (step >= solution.length) {

            clearInterval(animation);

            gameState.isLocked = false;

            evaluateGrid();

            return;

        }

        const target =
            solution[step];

        const node =
            gameState.grid[target.index];

        node.rotation =
            target.rotation;

        const element =
            document.getElementById(
                `node-${target.index}`
            );

        applyRotation(
            element,
            target.rotation
        );

        createPulse(target.index);

        playTone(620, 0.04);

        step++;

    }, 90);

}

/* =========================
   REAL HINT SYSTEM
========================= */

function showHint() {

    if (gameState.isLocked) return;

    const solution =
        LEVEL_SOLUTIONS[
            gameState.currentLevel - 1
        ];

    if (!solution) return;

    const incorrect =
        solution.find(item => {

            const node =
                gameState.grid[item.index];

            return (
                node.rotation !==
                item.rotation
            );

        });

    if (!incorrect) return;

    const element =
        document.getElementById(
            `node-${incorrect.index}`
        );

    element.classList.add("hint-flash");

    playTone(520, 0.08);

    setTimeout(() => {

        element.classList.remove(
            "hint-flash"
        );

    }, 900);

}

/* =========================
   CHEAT OVERLAY
========================= */

function renderCheatOverlay() {

    gameState.grid.forEach((node, index) => {

        const element =
            document.getElementById(
                `node-${index}`
            );

        if (
            node.powered.cyan ||
            node.powered.magenta
        ) {

            element.style.outline =
                "1px dashed rgba(255,255,255,0.25)";

        } else {

            element.style.outline =
                "none";

        }

    });

}

function clearCheatOverlay() {

    gameState.grid.forEach((node, index) => {

        document.getElementById(
            `node-${index}`
        ).style.outline = "none";

    });

}

/* =========================
   EFFECTS
========================= */

function createPulse(index) {

    const element =
        document.getElementById(
            `node-${index}`
        );

    const pulse =
        document.createElement("div");

    pulse.className = "flow-pulse";

    element.appendChild(pulse);

    setTimeout(() => {
        pulse.remove();
    }, 700);

}

function playTone(freq, duration) {

    if (!audioContext) return;

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.type = "sine";

    oscillator.frequency.value = freq;

    oscillator.connect(gain);

    gain.connect(audioContext.destination);

    gain.gain.value = 0.02;

    oscillator.start();

    oscillator.stop(
        audioContext.currentTime + duration
    );

}

function vibrate(pattern) {

    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }

}

/* =========================
   TOUCH
========================= */

function initTouchFeedback() {

    document.addEventListener(
        "touchstart",
        () => {
            document.body.classList.add(
                "touching"
            );
        }
    );

    document.addEventListener(
        "touchend",
        () => {
            document.body.classList.remove(
                "touching"
            );
        }
    );

}

/* =========================
   STORAGE
========================= */

function saveGame() {

    const payload = {

        currentLevel:
            gameState.currentLevel,

        cheatMode:
            gameState.cheatMode

    };

    localStorage.setItem(
        GAME_CONFIG.saveKey,
        JSON.stringify(payload)
    );

}

function loadSave() {

    const raw = localStorage.getItem(
        GAME_CONFIG.saveKey
    );

    if (!raw) return;

    try {

        const parsed = JSON.parse(raw);

        gameState.currentLevel =
            parsed.currentLevel || 1;

        gameState.cheatMode =
            parsed.cheatMode || false;

        document.body.classList.toggle(
            "cheat-active",
            gameState.cheatMode
        );

        if (gameState.cheatMode) {
            renderCheatDashboard();
        }

    } catch (error) {

        console.warn(
            "Save load failed"
        );

    }

}

/* =========================
   HOTKEYS
========================= */

document.addEventListener("keydown", event => {

    const key = event.key.toLowerCase();

    if (key === "c") {

        gameState.cheatMode =
            !gameState.cheatMode;

        document.body.classList.toggle(
            "cheat-active",
            gameState.cheatMode
        );

        if (gameState.cheatMode) {

            renderCheatDashboard();

        } else {

            removeCheatDashboard();

        }

        evaluateGrid();

    }

    if (key === "h") {
        showHint();
    }

    if (key === "s") {
        autoSolve();
    }

});