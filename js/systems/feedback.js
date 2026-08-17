let audioContext = null;

export function initializeAudio() {
    const unlockAudio = () => {
        if (!audioContext) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            audioContext = new AudioContext();
        }

        if (audioContext.state === "suspended") audioContext.resume();
    };

    document.addEventListener("touchstart", unlockAudio, { once: true, passive: true });
    document.addEventListener("click", unlockAudio, { once: true });
}

export function playTone(frequency, duration) {
    if (!audioContext || audioContext.state !== "running") return;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    gain.gain.value = 0.02;
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

export function vibrate(pattern) {
    navigator.vibrate?.(pattern);
}

export function initializeTouchFeedback() {
    const activate = () => document.body.classList.add("touching");
    const deactivate = () => document.body.classList.remove("touching");

    document.addEventListener("touchstart", activate, { passive: true });
    document.addEventListener("touchend", deactivate, { passive: true });
    document.addEventListener("touchcancel", deactivate, { passive: true });
}
