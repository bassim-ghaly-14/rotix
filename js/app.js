import { GAME_CONFIG, getDifficulty } from "./core/config.js";
import { createGameState, createGrid } from "./core/game-state.js";
import { evaluatePower, findSolution, isSinkSynchronized } from "./core/pipeline.js";
import { loadProgress, saveProgress } from "./core/storage.js";
import { LEVEL_SCHEMATICS } from "./levels.js";
import { initializeAudio, initializeTouchFeedback, playTone, vibrate } from "./systems/feedback.js";
import { createGameUI } from "./ui/game-ui.js";
import { createModalController } from "./ui/modal-controller.js";

const state = createGameState();
const ui = createGameUI();
let modalController;
let solveTimer = null;

initializeApp();

function initializeApp() {
    const savedProgress = loadProgress(GAME_CONFIG.saveKey, LEVEL_SCHEMATICS.length);
    state.currentLevel = savedProgress.currentLevel;
    state.cheatMode = savedProgress.cheatMode;

    initializeAudio();
    initializeTouchFeedback();
    initializeNavigation();
    initializeCheatControls();
    initializeKeyboardControls();
    modalController = createModalController({
        onNext: nextLevel,
        onReboot: rebootLevel,
        onRestart: restartCampaign
    });

    document.body.classList.toggle("cheat-active", state.cheatMode);
    if (state.cheatMode) renderCheatDashboard();
    runSplash();
}

function runSplash() {
    const splash = document.getElementById("splash-screen");
    window.setTimeout(() => {
        splash.classList.add("fade-out");
        window.setTimeout(() => {
            splash.hidden = true;
            bootLevel();
        }, 500);
    }, 1400);
}

function initializeNavigation() {
    const tabs = [...document.querySelectorAll(".tab-item")];
    const panels = [...document.querySelectorAll(".view-panel")];

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            if (state.isLocked) return;

            tabs.forEach(item => {
                const active = item === tab;
                item.classList.toggle("active", active);
                item.setAttribute("aria-selected", String(active));
            });
            panels.forEach(panel => panel.classList.toggle("active", panel.id === tab.dataset.target));
        });
    });
}

function bootLevel() {
    clearPressureLoop();
    clearSolveTimer();
    state.pressure = 0;
    state.moves = 0;
    state.isLocked = false;
    state.levelSolved = false;
    ui.setSuccess(false);

    const level = LEVEL_SCHEMATICS[state.currentLevel - 1];
    if (!level) {
        state.isComplete = true;
        modalController.open("complete");
        return;
    }

    state.grid = createGrid(level);
    ui.renderGrid(state.grid, rotateNode);
    updateHUD();
    evaluateGrid();
    startPressureLoop();
}

function rotateNode(index) {
    if (state.isLocked) return;

    const node = state.grid[index];
    if (!node) return;

    node.rotation = (node.rotation + 90) % 360;
    state.moves += 1;
    ui.rotateNode(index, node.rotation);
    ui.pulseNode(index);
    playTone(420, 0.04);
    vibrate(10);
    updateHUD();
    evaluateGrid();
    persistProgress();
}

function evaluateGrid() {
    evaluatePower(state.grid);
    ui.renderPower(state.grid, state.cheatMode);
    checkVictory();
}

function checkVictory() {
    if (state.levelSolved || !isSinkSynchronized(state.grid)) return;

    state.levelSolved = true;
    state.isLocked = true;
    clearPressureLoop();
    ui.setSuccess(true);
    playTone(780, 0.2);
    vibrate([20, 40, 20]);
    updateResultStats();
    persistProgress();

    window.setTimeout(() => {
        modalController.open(
            state.currentLevel >= LEVEL_SCHEMATICS.length ? "complete" : "success"
        );
    }, 600);
}

function updateHUD() {
    ui.updateHUD(state, getDifficulty(state.currentLevel));
}

function updateResultStats() {
    const levelText = String(state.currentLevel).padStart(2, "0");
    const efficiency = Math.max(10, 100 - state.moves * 2);

    document.getElementById("modal-level-val").textContent = levelText;
    document.getElementById("modal-moves-val").textContent = state.moves;
    document.getElementById("modal-efficiency-val").textContent = `${efficiency}%`;
    document.getElementById("failure-level-val").textContent = levelText;
    document.getElementById("failure-moves-val").textContent = state.moves;
}

function startPressureLoop() {
    clearPressureLoop();
    const speed = getDifficulty(state.currentLevel).pressureSpeed;

    state.pressureLoop = window.setInterval(() => {
        if (state.isLocked) return;

        state.pressure = Math.min(state.pressure + speed, GAME_CONFIG.pressureLimit);
        updateHUD();
        if (state.pressure >= GAME_CONFIG.pressureLimit) triggerFailure();
    }, 100);
}

function clearPressureLoop() {
    if (state.pressureLoop !== null) window.clearInterval(state.pressureLoop);
    state.pressureLoop = null;
}

function triggerFailure() {
    state.isLocked = true;
    clearPressureLoop();
    playTone(180, 0.2);
    vibrate([60, 80, 60]);
    updateResultStats();
    modalController.open("failure");
}

function nextLevel() {
    modalController.close();
    state.currentLevel += 1;
    persistProgress();
    bootLevel();
}

function rebootLevel() {
    modalController.close();
    bootLevel();
}

function restartCampaign() {
    modalController.close();
    state.currentLevel = 1;
    state.isComplete = false;
    persistProgress();
    bootLevel();
}

function initializeCheatControls() {
    document.getElementById("rotix-logo").addEventListener("dblclick", toggleCheatMode);
}

function initializeKeyboardControls() {
    document.addEventListener("keydown", event => {
        if (event.repeat) return;

        switch (event.key.toLowerCase()) {
            case "c":
                toggleCheatMode();
                break;
            case "h":
                showHint();
                break;
            case "s":
                autoSolve();
                break;
        }
    });
}

function toggleCheatMode() {
    state.cheatMode = !state.cheatMode;
    document.body.classList.toggle("cheat-active", state.cheatMode);
    if (state.cheatMode) {
        renderCheatDashboard();
    } else {
        removeCheatDashboard();
    }

    evaluateGrid();
    persistProgress();
}

function renderCheatDashboard() {
    removeCheatDashboard();
    const panel = document.createElement("div");
    panel.id = "cheat-dashboard";
    panel.setAttribute("aria-label", "Diagnostic controls");

    [
        ["SOLVE", autoSolve],
        ["HINT", showHint],
        ["SKIP", nextLevel]
    ].forEach(([label, action]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.addEventListener("click", action);
        panel.appendChild(button);
    });

    document.body.appendChild(panel);
}

function removeCheatDashboard() {
    document.getElementById("cheat-dashboard")?.remove();
}

function autoSolve() {
    if (state.isLocked) return;

    const solution = findSolution(state.grid);
    if (!solution) return;

    state.isLocked = true;
    let step = 0;
    solveTimer = window.setInterval(() => {
        if (step >= solution.length) {
            clearSolveTimer();
            state.isLocked = false;
            evaluateGrid();
            return;
        }

        const target = solution[step];
        const node = state.grid[target.index];
        node.rotation = target.rotation;
        ui.rotateNode(target.index, target.rotation);
        ui.pulseNode(target.index);
        playTone(620, 0.04);
        step += 1;
    }, 90);
}

function clearSolveTimer() {
    if (solveTimer !== null) window.clearInterval(solveTimer);
    solveTimer = null;
}

function showHint() {
    if (state.isLocked) return;

    const solution = findSolution(state.grid);
    const incorrect = solution?.find(target => state.grid[target.index].rotation !== target.rotation);
    if (!incorrect) return;

    ui.flashHint(incorrect.index);
    playTone(520, 0.08);
}

function persistProgress() {
    saveProgress(GAME_CONFIG.saveKey, state);
}
