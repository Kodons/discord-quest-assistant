/**
 * Discord Quest Assistant - Entry Point
 */
const { initStores } = require("./core/stores");
const { initOverlay } = require("./ui/overlay");

function main() {
    // Bersihkan instance lama jika ada
    if (window.__discordQuestUI && typeof window.__discordQuestUI.destroy === "function") {
        window.__discordQuestUI.destroy();
    }

    const stores = initStores();

    if (!stores.isReady) {
        alert("Gagal menemukan store Discord yang diperlukan (QuestsStore/API/FluxDispatcher). Pastikan script ini dijalankan di Console Discord!");
        return;
    }

    const overlay = initOverlay(stores);
    window.__discordQuestUI = overlay;
}

main();
