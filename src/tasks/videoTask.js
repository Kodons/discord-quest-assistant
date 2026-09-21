/**
 * Task Handler untuk WATCH_VIDEO & WATCH_VIDEO_ON_MOBILE
 */
const { state } = require("../core/state");

async function executeVideoTask(quest, stores, callbacks) {
    const { api } = stores;
    const { onProgress, log } = callbacks;

    const speed = 7;
    const secondsNeeded = quest.targetSeconds;
    let secondsDone = quest.currentSeconds;

    log(`Memulai video spoofing untuk: ${quest.name}`);

    while (!state.stopRequested) {
        const remaining = Math.min(speed, secondsNeeded - secondsDone);
        await new Promise(r => setTimeout(r, remaining * 1000));
        if (state.stopRequested) break;

        const timestamp = secondsDone + speed;
        try {
            const res = await api.post({
                url: `/quests/${quest.id}/video-progress`,
                body: { timestamp: Math.min(secondsNeeded, timestamp + Math.random()) }
            });

            secondsDone = Math.min(secondsNeeded, timestamp);
            quest.currentSeconds = secondsDone;
            if (onProgress) onProgress(quest);

            const progressPct = Math.min(100, Math.round((secondsDone / secondsNeeded) * 100));
            log(`Progres Video ${quest.name}: ${progressPct}% (${secondsDone}/${secondsNeeded}s)`);

            if (res?.body?.completed_at != null || secondsDone >= secondsNeeded) {
                await api.post({ url: `/quests/${quest.id}/video-progress`, body: { timestamp: secondsNeeded } });
                log(`Quest video selesai: ${quest.name}! 🎉`, "success");
                break;
            }
        } catch (err) {
            log(`Error progress video: ${err?.message || "Rate limit / Network"}`, "error");
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

module.exports = {
    executeVideoTask
};
