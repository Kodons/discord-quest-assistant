/**
 * State Global & Hook Cleanup Registry
 */
const state = {
    isRunning: false,
    stopRequested: false,
    activeQuest: null,
    activeCleanups: [],
    questQueue: []
};

function addCleanup(fn) {
    if (typeof fn === "function") {
        state.activeCleanups.push(fn);
    }
}

function runAllCleanups() {
    while (state.activeCleanups.length > 0) {
        try {
            const cleanup = state.activeCleanups.pop();
            cleanup();
        } catch (err) {
            console.error("[State] Error saat cleanup hook:", err);
        }
    }
}

function resetState() {
    state.stopRequested = true;
    runAllCleanups();
    state.isRunning = false;
    state.activeQuest = null;
    state.questQueue = [];
}

module.exports = {
    state,
    addCleanup,
    runAllCleanups,
    resetState
};
