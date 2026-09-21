/**
 * Task Handler untuk PLAY_ON_DESKTOP (Game Process Spoofing)
 */
const { state, addCleanup } = require("../core/state");

async function executeDesktopPlayTask(quest, stores, callbacks) {
    const { api, RunningGameStore, FluxDispatcher, isDesktopApp } = stores;
    const { onProgress, log } = callbacks;

    if (!isDesktopApp) {
        log(`Quest "${quest.name}" butuh aplikasi Discord Desktop (bukan web browser)!`, "error");
        return;
    }

    const taskData = quest.taskData;
    const applicationId = quest.rawQuest.config?.application?.id ?? taskData.applications?.[0]?.id;
    const secondsNeeded = quest.targetSeconds;

    log(`Mengambil data aplikasi publik untuk ${quest.name}...`);
    const res = await api.get({ url: `/applications/public?application_ids=${applicationId}` });
    const appData = res.body?.[0];

    if (!appData) {
        log(`Gagal memuat detail aplikasi untuk ID: ${applicationId}`, "error");
        return;
    }

    const pid = Math.floor(Math.random() * 30000) + 1000;
    const appName = appData.name || quest.name || "game";
    const exeName = appData.executables?.find(x => x.os === "win32")?.name?.replace(">", "") ?? appName.replace(/[\/\\:*?"<>|]/g, "") + ".exe";

    const fakeGame = {
        cmdLine: `C:\\Program Files\\${appName}\\${exeName}`,
        exeName,
        exePath: `c:/program files/${appName.toLowerCase()}/${exeName}`,
        hidden: false,
        isLauncher: false,
        id: applicationId,
        name: appName,
        pid: pid,
        pidPath: [pid],
        processName: appName,
        start: Date.now()
    };

    const realGames = RunningGameStore.getRunningGames();
    const fakeGames = [fakeGame];
    const realGetRunningGames = RunningGameStore.getRunningGames;
    const realGetGameForPID = RunningGameStore.getGameForPID;

    // Hijack functions
    RunningGameStore.getRunningGames = () => fakeGames;
    RunningGameStore.getGameForPID = p => (p === pid ? fakeGame : undefined);

    const restore = () => {
        RunningGameStore.getRunningGames = realGetRunningGames;
        RunningGameStore.getGameForPID = realGetGameForPID;
        FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: [fakeGame], added: [], games: [] });
    };
    addCleanup(restore);

    FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: realGames, added: [fakeGame], games: fakeGames });
    log(`Berhasil spoof game: ${appData.name}. Menunggu Discord mengirimkan heartbeat...`);

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
                : Math.floor(data.userStatus?.progress?.PLAY_ON_DESKTOP?.value ?? 0);

            if (progress != null) {
                quest.currentSeconds = progress;
                if (onProgress) onProgress(quest);
                log(`Progres ${quest.name}: ${progress}/${secondsNeeded}s (${Math.ceil((secondsNeeded - progress) / 60)} mnt tersisa)`);
            }

            if (progress >= secondsNeeded) {
                log(`Quest game selesai: ${quest.name}! 🎉`, "success");
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
    executeDesktopPlayTask
};
