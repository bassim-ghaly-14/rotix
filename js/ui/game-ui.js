export function createGameUI() {
    const elements = {
        grid: document.getElementById("pipeline-matrix"),
        matrixCard: document.getElementById("matrix-card"),
        level: document.getElementById("level-display"),
        moves: document.getElementById("moves-display"),
        pressureBar: document.getElementById("pressure-bar"),
        pressurePill: document.getElementById("pressure-pill"),
        difficulty: document.getElementById("difficulty-display")
    };

    function renderGrid(grid, onRotate) {
        const nodes = grid.map(node => {
            const element = document.createElement("button");
            element.id = `node-${node.id}`;
            element.className = `rotator-node node-type-${node.type}`;
            element.type = "button";
            element.setAttribute("aria-label", `Rotate ${node.type} pipeline node ${node.id + 1}`);
            applyRotation(element, node.rotation);

            if (node.isSource) element.classList.add(`node-source-${node.isSource}`);
            if (node.isSink) element.classList.add(`node-sink-${node.isSink}`);

            createPipeVisuals(element, node.type);
            element.addEventListener("click", () => onRotate(node.id));
            return element;
        });

        elements.grid.replaceChildren(...nodes);
    }

    function updateHUD(state, difficulty) {
        elements.level.textContent = String(state.currentLevel).padStart(2, "0");
        elements.moves.textContent = state.moves;
        elements.pressureBar.style.width = `${state.pressure}%`;
        elements.pressurePill.classList.toggle("danger-alert", state.pressure >= 75);
        elements.difficulty.textContent = difficulty.label;
    }

    function renderPower(grid, cheatMode) {
        grid.forEach(node => {
            const element = getNodeElement(node.id);
            if (!element) return;

            element.classList.remove("powered-cyan", "powered-magenta", "powered-mixed");
            if (node.powered.cyan && node.powered.magenta) {
                element.classList.add("powered-mixed");
            } else if (node.powered.cyan) {
                element.classList.add("powered-cyan");
            } else if (node.powered.magenta) {
                element.classList.add("powered-magenta");
            }

            element.classList.toggle(
                "cheat-path",
                cheatMode && (node.powered.cyan || node.powered.magenta)
            );
        });
    }

    function rotateNode(index, rotation) {
        const element = getNodeElement(index);
        if (element) applyRotation(element, rotation);
    }

    function pulseNode(index) {
        const element = getNodeElement(index);
        if (!element) return;

        const pulse = document.createElement("span");
        pulse.className = "flow-pulse";
        element.appendChild(pulse);
        window.setTimeout(() => pulse.remove(), 700);
    }

    function flashHint(index) {
        const element = getNodeElement(index);
        if (!element) return;

        element.classList.add("hint-flash");
        window.setTimeout(() => element.classList.remove("hint-flash"), 900);
    }

    function setSuccess(isSuccessful) {
        elements.matrixCard.classList.toggle("success-glow", isSuccessful);
    }

    return {
        renderGrid,
        updateHUD,
        renderPower,
        rotateNode,
        pulseNode,
        flashHint,
        setSuccess
    };
}

function getNodeElement(index) {
    return document.getElementById(`node-${index}`);
}

function applyRotation(element, rotation) {
    element.style.transform = `rotate(${rotation}deg)`;
}

function createPipeVisuals(element, type) {
    const count = { I: 1, L: 2, T: 3, X: 2 }[type] || 0;
    for (let index = 0; index < count; index += 1) {
        const pipe = document.createElement("span");
        pipe.className = "pipe-vector";
        element.appendChild(pipe);
    }
}
