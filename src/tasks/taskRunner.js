/**
 * Task Runner Pipeline - Menjalankan antrean quest
 */
const { state, runAllCleanups, resetState } = require("../core/state");
const { executeVideoTask } = require("./videoTask");
const { executeDesktopPlayTask } = require("./desktopPlayTask");
const { executeDesktopStreamTask } = require("./desktopStreamTask");
const { executeActivityTask } = require("./activityTask");

async function enrollQuest(quest, api, log) {
    log(`Mendaftarkan (enroll) quest: ${quest.name}...`);
    try {
        await api.post({
            url: `/quests/${quest.id}/enroll`,
            body: { location: 11 }
        });
        log(`Berhasil enroll quest: ${quest.name}`, "success");
        quest.isEnrolled = true;
        return true;
    } catch (err) {
        try {
            await api.post({
                url: `/quests/${quest.id}/enroll`,
                body: { location: 1 }
            });
            log(`Berhasil enroll quest: ${quest.name} (fallback)`, "success");
            quest.isEnrolled = true;
            return true;
        } catch (err2) {
            const errMsg = err?.body?.message || err?.message || "Bad Request";
            log(`Gagal enroll ${quest.name}: ${errMsg}`, "error");
            return false;
        }
    }
}

async function runQuestQueue(questList, stores, callbacks) {
    if (state.isRunning) return;

    const { api } = stores;
    const { onStart, onStop, onQuestChange, onProgress, log } = callbacks;

    state.isRunning = true;
    state.stopRequested = false;
    state.questQueue = [...questList];

    if (onStart) onStart();

    while (state.questQueue.length > 0 && !state.stopRequested) {
        const quest = state.questQueue.shift();
        state.activeQuest = quest;

        if (onQuestChange) onQuestChange(quest);

        // Auto enroll jika belum
        if (!quest.isEnrolled) {
            const enrolled = await enrollQuest(quest, api, log);
            if (!enrolled) {
                log(`Mencoba memproses ${quest.name} meskipun enroll otomatis belum berhasil...`, "info");
            }
        }

        log(`Mulai memproses: ${quest.name} (${quest.taskType})...`);

        try {
            const taskCallbacks = { onProgress, log };

            if (quest.taskType === "WATCH_VIDEO" || quest.taskType === "WATCH_VIDEO_ON_MOBILE") {
                await executeVideoTask(quest, stores, taskCallbacks);
            } else if (quest.taskType === "PLAY_ON_DESKTOP" || quest.taskType === "PLAY_GAME") {
                await executeDesktopPlayTask(quest, stores, taskCallbacks);
            } else if (quest.taskType === "STREAM_ON_DESKTOP") {
                await executeDesktopStreamTask(quest, stores, taskCallbacks);
            } else if (
                quest.taskType === "PLAY_ACTIVITY" ||
                quest.taskType === "LAUNCH_ACTIVITY" ||
                quest.taskType.includes("ACTIVITY") ||
                quest.taskType.includes("LAUNCH")
            ) {
                await executeActivityTask(quest, stores, taskCallbacks);
            } else {
                log(`Tipe task ${quest.taskType} tidak dikenal, mencoba Activity heartbeat...`, "info");
                await executeActivityTask(quest, stores, taskCallbacks);
            }
        } catch (err) {
            log(`Terjadi error pada ${quest.name}: ${err?.message}`, "error");
        }

        runAllCleanups();
    }

    resetState();
    if (onStop) onStop();
}

function stopQuestQueue(callbacks) {
    resetState();
    if (callbacks?.log) {
        callbacks.log("Proses dihentikan dan seluruh Discord hooks dikembalikan ke kondisi normal.");
    }
    if (callbacks?.onStop) {
        callbacks.onStop();
    }
}

module.exports = {
    enrollQuest,
    runQuestQueue,
    stopQuestQueue
};
