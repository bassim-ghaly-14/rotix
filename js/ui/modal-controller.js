export function createModalController({ onNext, onReboot, onRestart }) {
    const portal = document.getElementById("modal-portal");
    const modals = [...document.querySelectorAll(".cyber-modal")];

    document.getElementById("btn-next-level").addEventListener("click", onNext);
    document.getElementById("btn-reboot").addEventListener("click", onReboot);
    document.getElementById("btn-restart-campaign").addEventListener("click", onRestart);

    function open(type) {
        portal.classList.add("active");
        modals.forEach(modal => modal.classList.toggle("active", modal.id === `modal-${type}`));
    }

    function close() {
        portal.classList.remove("active");
        modals.forEach(modal => modal.classList.remove("active"));
    }

    return { open, close };
}
