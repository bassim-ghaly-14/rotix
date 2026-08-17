import { GAME_CONFIG, PIPE_MASKS } from "./config.js";

const DIRECTION_STEPS = [
    [-1, 0, 2],
    [0, 1, 3],
    [1, 0, 0],
    [0, -1, 1]
];

export function getDirections(type, rotation) {
    const mask = [...PIPE_MASKS[type]];
    const turns = (rotation / 90) % 4;

    for (let index = 0; index < turns; index += 1) {
        mask.unshift(mask.pop());
    }

    return mask;
}

export function evaluatePower(grid) {
    grid.forEach(node => {
        node.powered.cyan = false;
        node.powered.magenta = false;
    });

    ["cyan", "magenta"].forEach(color => {
        const source = grid.findIndex(node => node.isSource === color);
        if (source !== -1) propagatePower(grid, source, color);
    });
}

export function isSinkSynchronized(grid) {
    const sink = grid.find(node => node.isSink === "gold");
    return Boolean(sink?.powered.cyan && sink?.powered.magenta);
}

function propagatePower(grid, start, color) {
    const queue = [start];
    const visited = new Set();

    while (queue.length > 0) {
        const current = queue.shift();
        if (visited.has(current)) continue;

        visited.add(current);
        grid[current].powered[color] = true;

        getConnectedNeighbors(grid, current).forEach(next => {
            if (!visited.has(next)) queue.push(next);
        });
    }
}

export function getConnectedNeighbors(grid, index) {
    const size = GAME_CONFIG.gridSize;
    const row = Math.floor(index / size);
    const column = index % size;
    const directions = getDirections(grid[index].type, grid[index].rotation);
    const neighbors = [];

    DIRECTION_STEPS.forEach(([rowStep, columnStep, opposite], direction) => {
        if (!directions[direction]) return;

        const nextRow = row + rowStep;
        const nextColumn = column + columnStep;
        if (nextRow < 0 || nextRow >= size || nextColumn < 0 || nextColumn >= size) return;

        const nextIndex = nextRow * size + nextColumn;
        const neighbor = grid[nextIndex];
        if (getDirections(neighbor.type, neighbor.rotation)[opposite]) {
            neighbors.push(nextIndex);
        }
    });

    return neighbors;
}

// Finds two board paths and chooses rotations that support them. It keeps
// unconstrained pieces unchanged, so diagnostic solve remains minimally invasive.
export function findSolution(grid) {
    const cyanSource = grid.findIndex(node => node.isSource === "cyan");
    const magentaSource = grid.findIndex(node => node.isSource === "magenta");
    const sink = grid.findIndex(node => node.isSink === "gold");
    if (cyanSource === -1 || magentaSource === -1 || sink === -1) return null;

    const cyanPaths = findSimplePaths(cyanSource, sink);
    const magentaPaths = findSimplePaths(magentaSource, sink);

    for (const cyanPath of cyanPaths) {
        for (const magentaPath of magentaPaths) {
            const requiredDirections = createRequirements(cyanPath, magentaPath);
            const rotations = grid.map((node, index) => {
                const required = requiredDirections.get(index);
                if (!required) return node.rotation;

                return [node.rotation, 0, 90, 180, 270]
                    .find(rotation => required.every(direction =>
                        getDirections(node.type, rotation)[direction]
                    ));
            });

            if (rotations.every(rotation => rotation !== undefined)) {
                return rotations.map((rotation, index) => ({ index, rotation }));
            }
        }
    }

    return null;
}

function findSimplePaths(start, target) {
    const paths = [];
    const visit = (index, path, visited) => {
        if (index === target) {
            paths.push(path);
            return;
        }

        getBoardNeighbors(index).forEach(next => {
            if (visited.has(next)) return;
            visited.add(next);
            visit(next, [...path, next], visited);
            visited.delete(next);
        });
    };

    visit(start, [start], new Set([start]));
    return paths;
}

function getBoardNeighbors(index) {
    const size = GAME_CONFIG.gridSize;
    const row = Math.floor(index / size);
    const column = index % size;

    return DIRECTION_STEPS
        .map(([rowStep, columnStep]) => [row + rowStep, column + columnStep])
        .filter(([nextRow, nextColumn]) =>
            nextRow >= 0 && nextRow < size && nextColumn >= 0 && nextColumn < size
        )
        .map(([nextRow, nextColumn]) => nextRow * size + nextColumn);
}

function createRequirements(...paths) {
    const requirements = new Map();
    const addDirection = (index, direction) => {
        if (!requirements.has(index)) requirements.set(index, []);
        requirements.get(index).push(direction);
    };

    paths.forEach(path => {
        path.slice(1).forEach((next, pathIndex) => {
            const current = path[pathIndex];
            const direction = getDirectionBetween(current, next);
            addDirection(current, direction);
            addDirection(next, DIRECTION_STEPS[direction][2]);
        });
    });

    return requirements;
}

function getDirectionBetween(from, to) {
    const size = GAME_CONFIG.gridSize;
    const rowDifference = Math.floor(to / size) - Math.floor(from / size);
    const columnDifference = (to % size) - (from % size);
    return DIRECTION_STEPS.findIndex(([rowStep, columnStep]) =>
        rowStep === rowDifference && columnStep === columnDifference
    );
}
