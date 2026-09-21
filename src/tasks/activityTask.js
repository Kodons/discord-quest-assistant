/**
 * Task Handler untuk PLAY_ACTIVITY, LAUNCH_ACTIVITY & ACHIEVEMENT_IN_ACTIVITY
 */
const { state, addCleanup } = require("../core/state");

async function executeActivityTask(quest, stores, callbacks) {
    const { api, ChannelStore, GuildChannelStore, VoiceStateStore, UserStore, AuthenticationStore, RunningGameStore, FluxDispatcher, isDesktopApp } = stores;
    const { onProgress, log } = callbacks;

    const currentUserId = AuthenticationStore?.getId?.() || UserStore?.getCurrentUser?.()?.id;
    const activeVoiceChannelId = VoiceStateStore?.getVoiceChannelId?.();

    // Log detail quest untuk inspeksi
    try {
        const rawTaskCfg = quest.rawQuest?.config?.taskConfig ?? quest.rawQuest?.config?.taskConfigV2;
        log(`Detail Task [${quest.taskType}]: ${JSON.stringify(rawTaskCfg?.tasks?.[quest.taskType] || quest.taskData || {})}`);
    } catch (e) {}

    // Prioritas 1: Channel voice tempat user sedang berada
    let channelId = activeVoiceChannelId;

    if (!channelId) {
        log(`ℹ️ [Info] Kamu belum terhubung ke Voice Channel di Discord.`, "info");
        log(`Untuk quest "${quest.name}", silakan masuk (Join) ke salah satu Voice Channel di server kamu (bisa channel kosong di server sendiri).`, "info");

        // Fallback jika belum di voice channel
        if (ChannelStore?.getSortedPrivateChannels) {
            channelId = ChannelStore.getSortedPrivateChannels()?.[0]?.id;
        }
        if (!channelId && GuildChannelStore) {
            const allGuilds = GuildChannelStore.getAllGuilds?.() || {};
            const guildWithVocal = Object.values(allGuilds).find(x => x && x.VOCAL && x.VOCAL.length > 0);
            channelId = guildWithVocal?.VOCAL?.[0]?.channel?.id;
        }
    }

    if (!channelId) {
        log(`Tidak dapat menemukan channel untuk Activity quest: ${quest.name}. Masuklah ke salah satu Voice Channel di Discord!`, "error");
        return;
    }

    // Bangun stream_key yang valid sesuai user ID dan tipe channel (Guild / Call)
    const channel = ChannelStore?.getChannel?.(channelId);
    const userId = currentUserId || "1";
    let streamKey;

    if (channel && channel.guild_id) {
        streamKey = `guild:${channel.guild_id}:${channelId}:${userId}`;
    } else {
        streamKey = `call:${channelId}:${userId}`;
    }

    const secondsNeeded = quest.targetSeconds || 60;
    const applicationId = quest.rawQuest.config?.application?.id ?? quest.taskData?.applications?.[0]?.id;

    // Spoof Activity di RunningGameStore untuk Discord Desktop dengan field lengkap agar tidak error toLowerCase
    if (applicationId && RunningGameStore && FluxDispatcher && isDesktopApp) {
        let appName = quest.rawQuest.config?.application?.name || quest.name;
        let exeName = (appName || "game").replace(/[\/\\:*?"<>|]/g, "") + ".exe";

        try {
            const resApp = await api.get({ url: `/applications/public?application_ids=${applicationId}` });
            const appData = resApp?.body?.[0];
            if (appData) {
                if (appData.name) appName = appData.name;
                const winExe = appData.executables?.find(x => x.os === "win32")?.name?.replace(">", "");
                if (winExe) exeName = winExe;
            }
        } catch (e) {}

        const pid = Math.floor(Math.random() * 30000) + 1000;
        const fakeGame = {
            cmdLine: `C:\\Program Files\\${appName}\\${exeName}`,
            exeName: exeName,
            exePath: `c:/program files/${(appName || "game").toLowerCase()}/${exeName}`,
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
        const realGetRunningGames = RunningGameStore.getRunningGames;
        const realGetGameForPID = RunningGameStore.getGameForPID;

        RunningGameStore.getRunningGames = () => [fakeGame];
        RunningGameStore.getGameForPID = p => (p === pid ? fakeGame : undefined);

        const restoreGame = () => {
            RunningGameStore.getRunningGames = realGetRunningGames;
            RunningGameStore.getGameForPID = realGetGameForPID;
            FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: [fakeGame], added: [], games: [] });
        };
        addCleanup(restoreGame);

        // Listener heartbeat internal Discord
        const onInternalHeartbeat = data => {
            log(`[Discord Heartbeat] Berhasil disinkronkan oleh client.`);
            let progress = null;
            if (data?.userStatus?.streamProgressSeconds != null) {
                progress = Math.floor(data.userStatus.streamProgressSeconds);
            } else if (data?.userStatus?.progress) {
                const progObj = data.userStatus.progress;
                if (progObj[quest.taskType]?.value != null) {
                    progress = Math.floor(progObj[quest.taskType].value);
                } else {
                    for (const k in progObj) {
                        if (progObj[k]?.value != null) {
                            progress = Math.floor(progObj[k].value);
                            break;
                        }
                    }
                }
            }
            if (progress != null) {
                quest.currentSeconds = progress;
                if (onProgress) onProgress(quest);
                log(`Progres ${quest.name}: ${quest.currentSeconds}/${secondsNeeded}s`);
            }
            if ((progress != null && progress >= secondsNeeded) || data?.userStatus?.completedAt != null) {
                quest.isCompleted = true;
                log(`Quest activity selesai: ${quest.name}! 🎉`, "success");
            }
        };
        FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", onInternalHeartbeat);
        addCleanup(() => {
            FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", onInternalHeartbeat);
        });

        FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: realGames, added: [fakeGame], games: [fakeGame] });
        log(`Activity dispoof ke background: ${appName} (${exeName})`);
    }

    log(`Memulai tracking untuk "${quest.name}" (Channel: ${channel?.name || channelId})...`);

    let consecutive403 = 0;

    const isAchievement = quest.taskType === "ACHIEVEMENT_IN_ACTIVITY";
    if (isAchievement) {
        log(`ℹ️ [Achievement Quest] Quest "${quest.name}" memerlukan interaksi di game: ${quest.taskData?.messages?.taskDescription || "Capai target di game"}`);
        log(`👉 Klik "Launch" di Discord, klik "Authorize" pada pop-up, lalu mainkan game singkatnya di Voice Channel.`);
        log(`Asisten akan terus memantau progresmu secara realtime...`);
    }

    while (!state.stopRequested) {
        if (isAchievement) {
            try {
                const refreshed = await stores.fetchQuestsAPI();
                const current = refreshed?.find(x => x.id === quest.id);
                const prog = current?.userStatus?.progress?.ACHIEVEMENT_IN_ACTIVITY?.value ?? current?.userStatus?.progress?.[quest.taskType]?.value;
                if (prog != null) {
                    quest.currentSeconds = Math.floor(prog);
                    if (onProgress) onProgress(quest);
                    log(`Progres ${quest.name}: ${quest.currentSeconds}/${secondsNeeded}`);
                }
                if (current?.userStatus?.completedAt != null || quest.currentSeconds >= secondsNeeded) {
                    quest.isCompleted = true;
                    log(`Quest achievement selesai: ${quest.name}! 🎉`, "success");
                    break;
                }
            } catch (e) {}
            await new Promise(r => setTimeout(r, 10000));
            continue;
        }

        // Jika manual heartbeat ditolak berulang kali karena 403, andalkan background spoofing
        if (consecutive403 < 3) {
            try {
                const res = await api.post({
                    url: `/quests/${quest.id}/heartbeat`,
                    body: { stream_key: streamKey, terminal: false }
                });

                let progress = quest.currentSeconds;
                if (res?.body?.progress) {
                    const progObj = res.body.progress;
                    if (progObj[quest.taskType]?.value != null) {
                        progress = Math.floor(progObj[quest.taskType].value);
                    } else if (progObj.ACHIEVEMENT_IN_ACTIVITY?.value != null) {
                        progress = Math.floor(progObj.ACHIEVEMENT_IN_ACTIVITY.value);
                    } else if (progObj.PLAY_ACTIVITY?.value != null) {
                        progress = Math.floor(progObj.PLAY_ACTIVITY.value);
                    } else {
                        const firstKey = Object.keys(progObj)[0];
                        if (firstKey && progObj[firstKey]?.value != null) {
                            progress = Math.floor(progObj[firstKey].value);
                        }
                    }
                }

                quest.currentSeconds = progress;
                consecutive403 = 0;
                if (onProgress) onProgress(quest);
                log(`Progres ${quest.name}: ${progress}/${secondsNeeded}s`);

                if (res?.body?.completed_at != null || progress >= secondsNeeded) {
                    try {
                        await api.post({ url: `/quests/${quest.id}/heartbeat`, body: { stream_key: streamKey, terminal: true } });
                    } catch (e) {}
                    log(`Quest activity selesai: ${quest.name}! 🎉`, "success");
                    break;
                }
            } catch (err) {
                const errBodyMsg = err?.body?.message;
                const errStatus = err?.status || err?.statusCode;
                let errMsg = errBodyMsg || err?.message || "Error";

                if (errMsg.includes("<!DOCTYPE")) {
                    errMsg = "Endpoint 404";
                }

                if (errStatus === 403) {
                    consecutive403++;
                    log(`Heartbeat ditolak server (403 Forbidden).`, "error");
                    if (consecutive403 === 1) {
                        log(`💡 Catatan: Quest tipe ini mungkin memerlukan kamu mengklik "Launch" di Discord sekali untuk membuka aplikasinya di Voice Channel.`, "info");
                        log(`Game spoofing tetap berjalan di background...`, "info");
                    }
                } else {
                    log(`Gagal kirim heartbeat: ${errMsg}`, "error");
                }
            }
        } else {
            // Tunggu pasif sambil background spoofing berjalan
            log(`Menunggu heartbeat background dari Discord... (${quest.currentSeconds}/${secondsNeeded}s)`);
        }

        await new Promise(r => setTimeout(r, 20000));
    }
}

module.exports = {
    executeActivityTask
};
