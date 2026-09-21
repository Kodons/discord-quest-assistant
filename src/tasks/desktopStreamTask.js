/**
 * Task Handler untuk STREAM_ON_DESKTOP (Screen Share Metadata Spoofing)
 */
const { state, addCleanup } = require("../core/state");

async function executeDesktopStreamTask(quest, stores, callbacks) {
    const { ApplicationStreamingStore, FluxDispatcher, isDesktopApp } = stores;
    const { onProgress, log } = callbacks;

    if (!isDesktopApp) {
        log(`Quest stream "${quest.name}" memerlukan aplikasi Discord Desktop!`, "error");
        return;
    }

    const taskData = quest.taskData;
    const applicationId = quest.rawQuest.config?.application?.id ?? taskData.applications?.[0]?.id;
    const secondsNeeded = quest.targetSeconds;
    const pid = Math.floor(Math.random() * 30000) + 1000;

    const realFunc = ApplicationStreamingStore.getStreamerActiveStreamMetadata;
    ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
        id: applicationId,
        pid,
        sourceName: null
    });

    const restore = () => {
        ApplicationStreamingStore.getStreamerActiveStreamMetadata = realFunc;
    };
    addCleanup(restore);

    log(`Metadata stream dispoof ke target game. Mulai streaming layar apa saja di voice channel.`);

    return new Promise(resolve => {
        const onHeartbeat = data => {
            if (state.stopRequested) {
                FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", onHeartbeat);
                restore();
                resolve();
                return;
            }

            let progress = quest.rawQuest.config?.configVersion === 1
                ? data.userStatus?.streamProgressSeconds
                : Math.floor(data.userStatus?.progress?.STREAM_ON_DESKTOP?.value ?? 0);

            if (progress != null) {
                quest.currentSeconds = progress;
                if (onProgress) onProgress(quest);
                log(`Progres Stream: ${progress}/${secondsNeeded}s`);
            }

            if (progress >= secondsNeeded) {
                log(`Quest stream selesai: ${quest.name}! 🎉`, "success");
                FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", onHeartbeat);
                restore();
                resolve();
            }
        };

        addCleanup(() => {
            FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", onHeartbeat);
            restore();
        });

        FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", onHeartbeat);
    });
}

module.exports = {
    executeDesktopStreamTask
};
