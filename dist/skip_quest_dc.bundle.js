/**
 * Discord Quest Auto-Completer & Bypass Tool (Bundled)
 * Generated at: 2026-09-25T18:53:45.315Z
 * Source modules: 13 files from src/
 */
(function () {
  "use strict";

  var __modules = {
  // --- Module: ./core/state ---
  "./core/state": function(require, module, exports) {
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

  },

  // --- Module: ./core/stores ---
  "./core/stores": function(require, module, exports) {
const { findModule, getWebpackRequire, isExcludedOrProxy } = require("./webpack");

let stores = null;

async function fetchQuestsAPI(api, FluxDispatcher) {
    if (!api || typeof api.get !== "function") return null;

    try {
        const res = await api.get({ url: "/quests/@me" });
        if (res && res.body) {
            const list = Array.isArray(res.body) ? res.body : (res.body.quests || []);
            if (list.length > 0 && FluxDispatcher) {
                try {
                    FluxDispatcher.dispatch({
                        type: "QUESTS_FETCH_CURRENT_QUESTS_SUCCESS",
                        quests: list
                    });
                } catch (e) {}
            }
            return list;
        }
    } catch (err) {
        console.warn("[Stores] Gagal mengambil /quests/@me via API:", err);
    }
    return null;
}

function initStores() {
    if (stores) return stores;

    const wp = getWebpackRequire();

    // 1. QuestsStore (Prioritaskan pola asli Discord, lalu dynamic search)
    let QuestsStore = null;
    if (wp?.c) {
        for (const id in wp.c) {
            const ex = wp.c[id]?.exports;
            if (ex?.A?.__proto__?.getQuest) {
                QuestsStore = ex.A;
                break;
            }
            if (ex?.default?.__proto__?.getQuest) {
                QuestsStore = ex.default;
                break;
            }
        }
    }
    if (!QuestsStore) {
        QuestsStore = findModule(exp => {
            const hasGetQuest = typeof exp.getQuest === "function" || (exp.__proto__ && typeof exp.__proto__.getQuest === "function");
            const hasQuests = exp.quests !== undefined || (exp.__proto__ && exp.__proto__.quests !== undefined);
            return hasGetQuest && hasQuests;
        });
    }

    // 2. HTTP / API Module (Wajib modul transport HTTP Discord asli, bukan web client / i18n)
    let api = null;
    if (wp?.c) {
        // Cari modul 'Bo' seperti pada script asli yang terbukti bekerja
        for (const id in wp.c) {
            const ex = wp.c[id]?.exports;
            if (ex?.Bo?.get && ex?.Bo?.post) {
                api = ex.Bo;
                break;
            }
        }
    }

    if (!api && wp?.c) {
        // Cari modul HTTP resmi lainnya
        for (const id in wp.c) {
            const ex = wp.c[id]?.exports;
            if (ex?.HTTP?.get && ex?.HTTP?.post && ex?.HTTP?.del) {
                api = ex.HTTP;
                break;
            }
            if (ex?.default?.get && ex?.default?.post && ex?.default?.del && ex?.default?.patch) {
                api = ex.default;
                break;
            }
        }
    }

    if (!api) {
        api = findModule(exp => {
            if (!exp || exp.intl || exp.Messages) return false;
            return (
                typeof exp.get === "function" &&
                typeof exp.post === "function" &&
                typeof exp.del === "function" &&
                typeof exp.put === "function" &&
                typeof exp.patch === "function"
            );
        });
    }

    // 3. RunningGameStore
    let RunningGameStore = null;
    if (wp?.c) {
        for (const id in wp.c) {
            const ex = wp.c[id]?.exports;
            if (ex?.Ay?.getRunningGames) {
                RunningGameStore = ex.Ay;
                break;
            }
        }
    }
    if (!RunningGameStore) {
        RunningGameStore = findModule(exp => {
            return typeof exp.getRunningGames === "function" || (exp.__proto__ && typeof exp.__proto__.getRunningGames === "function");
        });
    }

    // 4. FluxDispatcher
    let FluxDispatcher = null;
    if (wp?.c) {
        for (const id in wp.c) {
            const ex = wp.c[id]?.exports;
            if (ex?.h?.__proto__?.flushWaitQueue) {
                FluxDispatcher = ex.h;
                break;
            }
        }
    }
    if (!FluxDispatcher) {
        FluxDispatcher = findModule(exp => {
            return typeof exp.dispatch === "function" && typeof exp.subscribe === "function";
        });
    }

    // 5. ApplicationStreamingStore
    let ApplicationStreamingStore = null;
    if (wp?.c) {
        for (const id in wp.c) {
            const ex = wp.c[id]?.exports;
            if (ex?.A?.__proto__?.getStreamerActiveStreamMetadata) {
                ApplicationStreamingStore = ex.A;
                break;
            }
        }
    }
    if (!ApplicationStreamingStore) {
        ApplicationStreamingStore = findModule(exp => {
            return typeof exp.getStreamerActiveStreamMetadata === "function" || (exp.__proto__ && typeof exp.__proto__.getStreamerActiveStreamMetadata === "function");
        });
    }

    // 6. Channels & Voice
    let ChannelStore = null;
    if (wp?.c) {
        for (const id in wp.c) {
            const ex = wp.c[id]?.exports;
            if (ex?.A?.__proto__?.getAllThreadsForParent) {
                ChannelStore = ex.A;
                break;
            }
        }
    }
    if (!ChannelStore) {
        ChannelStore = findModule(exp => {
            return (typeof exp.getChannel === "function" || typeof exp.getSortedPrivateChannels === "function") &&
                   Boolean(exp.__proto__?.getAllThreadsForParent || exp.getAllThreadsForParent);
        });
    }

    let GuildChannelStore = null;
    if (wp?.c) {
        for (const id in wp.c) {
            const ex = wp.c[id]?.exports;
            if (ex?.Ay?.getSFWDefaultChannel) {
                GuildChannelStore = ex.Ay;
                break;
            }
        }
    }
    if (!GuildChannelStore) {
        GuildChannelStore = findModule(exp => {
            return typeof exp.getSFWDefaultChannel === "function" || (exp.__proto__ && typeof exp.__proto__.getSFWDefaultChannel === "function");
        });
    }

    let VoiceStateStore = findModule(exp => {
        return typeof exp.getVoiceChannelId === "function" || typeof exp.getCurrentClientVoiceChannelId === "function";
    });

    let UserStore = null;
    if (wp?.c) {
        for (const id in wp.c) {
            const ex = wp.c[id]?.exports;
            if (!isExcludedOrProxy(ex?.default) && ex?.default?.getCurrentUser) {
                UserStore = ex.default;
                break;
            }
            if (!isExcludedOrProxy(ex?.ZP) && ex?.ZP?.getCurrentUser) {
                UserStore = ex.ZP;
                break;
            }
        }
    }
    if (!UserStore) {
        UserStore = findModule(exp => {
            return typeof exp.getCurrentUser === "function";
        });
    }

    let AuthenticationStore = null;
    if (wp?.c) {
        for (const id in wp.c) {
            const ex = wp.c[id]?.exports;
            if (!isExcludedOrProxy(ex?.default) && ex?.default?.getId && (ex?.default?.getToken || ex?.default?.getSessionId)) {
                AuthenticationStore = ex.default;
                break;
            }
            if (!isExcludedOrProxy(ex?.ZP) && ex?.ZP?.getId && (ex?.ZP?.getToken || ex?.ZP?.getSessionId)) {
                AuthenticationStore = ex.ZP;
                break;
            }
        }
    }
    if (!AuthenticationStore) {
        AuthenticationStore = findModule(exp => {
            return typeof exp.getId === "function" && (typeof exp.getToken === "function" || typeof exp.getSessionId === "function");
        });
    }

    const isDesktopApp = typeof DiscordNative !== "undefined";

    stores = {
        QuestsStore,
        RunningGameStore,
        ApplicationStreamingStore,
        FluxDispatcher,
        ChannelStore,
        GuildChannelStore,
        VoiceStateStore,
        UserStore,
        AuthenticationStore,
        api,
        isDesktopApp,
        fetchQuestsAPI: () => fetchQuestsAPI(api, FluxDispatcher),
        isReady: Boolean(QuestsStore && FluxDispatcher && api)
    };

    return stores;
}

module.exports = {
    initStores,
    fetchQuestsAPI
};

  },

  // --- Module: ./core/webpack ---
  "./core/webpack": function(require, module, exports) {
/**
 * Discord Webpack Chunk & Module Extractor
 */
let wpRequire = null;

function getWebpackRequire() {
    if (wpRequire) return wpRequire;

    try {
        if (typeof webpackChunkdiscord_app !== "undefined") {
            wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
            webpackChunkdiscord_app.pop();
        }
    } catch (err) {
        console.error("[Webpack] Gagal mengambil webpackChunk:", err);
    }
    return wpRequire;
}

/**
 * Filter pencegah i18n / Translation Proxy Discord.
 * Discord menggunakan Proxy untuk modul bahasa/i18n yang merespons 'truthy'
 * ke sembarang nama properti (misal getQuests, get, dll) sehingga sering salah terdeteksi.
 */
function isExcludedOrProxy(exp) {
    if (!exp || (typeof exp !== "object" && typeof exp !== "function")) return true;
    try {
        // Jika suatu objek merespons nilai untuk key acak yang tidak pernah ada, maka objek ini adalah Proxy i18n!
        if (exp.__test_non_existent_key_xyz987__ !== undefined) return true;
        if (exp.intl && exp.t) return true;
        if (exp.Messages && exp.defaultMessages) return true;
    } catch (e) {
        return true;
    }
    return false;
}

function findModule(filter) {
    const wp = getWebpackRequire();
    if (!wp || !wp.c) return null;

    for (const id in wp.c) {
        const m = wp.c[id];
        if (!m || !m.exports) continue;

        const candidates = [
            m.exports,
            m.exports.default,
            m.exports.Z,
            m.exports.ZP,
            m.exports.Ay,
            m.exports.A,
            m.exports.Bo,
            m.exports.h
        ];

        for (const exp of candidates) {
            if (exp && !isExcludedOrProxy(exp)) {
                try {
                    if (filter(exp)) return exp;
                } catch (err) {}
            }
        }

        // Pencarian mendalam jika di-export dalam sub-key
        if (typeof m.exports === "object" && !isExcludedOrProxy(m.exports)) {
            for (const key of Object.keys(m.exports)) {
                try {
                    const item = m.exports[key];
                    if (item && !isExcludedOrProxy(item) && filter(item)) return item;
                } catch (e) {}
            }
        }
    }
    return null;
}

function findByProps(...props) {
    return findModule(exp => {
        return props.every(p => {
            try {
                return exp[p] !== undefined || (exp.__proto__ && exp.__proto__[p] !== undefined);
            } catch (e) {
                return false;
            }
        });
    });
}

module.exports = {
    getWebpackRequire,
    isExcludedOrProxy,
    findModule,
    findByProps
};

  },

  // --- Module: ./index ---
  "./index": function(require, module, exports) {
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

  },

  // --- Module: ./tasks/activityTask ---
  "./tasks/activityTask": function(require, module, exports) {
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

  },

  // --- Module: ./tasks/desktopPlayTask ---
  "./tasks/desktopPlayTask": function(require, module, exports) {
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

  },

  // --- Module: ./tasks/desktopStreamTask ---
  "./tasks/desktopStreamTask": function(require, module, exports) {
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

  },

  // --- Module: ./tasks/taskRunner ---
  "./tasks/taskRunner": function(require, module, exports) {
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

  },

  // --- Module: ./tasks/videoTask ---
  "./tasks/videoTask": function(require, module, exports) {
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

  },

  // --- Module: ./ui/dragDrop ---
  "./ui/dragDrop": function(require, module, exports) {
/**
 * Helper Drag-and-Drop Floating Window
 */
function attachDragAndDrop(element, handle) {
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    function onMouseDown(e) {
        if (e.target.closest("button")) return;
        isDragging = true;
        const rect = element.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        element.style.transition = "none";
    }

    function onMouseMove(e) {
        if (!isDragging) return;
        const left = Math.max(10, Math.min(window.innerWidth - element.offsetWidth - 10, e.clientX - offsetX));
        const top = Math.max(10, Math.min(window.innerHeight - element.offsetHeight - 10, e.clientY - offsetY));
        element.style.left = `${left}px`;
        element.style.top = `${top}px`;
        element.style.right = "auto";
    }

    function onMouseUp() {
        isDragging = false;
        element.style.transition = "";
    }

    handle.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
        handle.removeEventListener("mousedown", onMouseDown);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    };
}

module.exports = {
    attachDragAndDrop
};

  },

  // --- Module: ./ui/overlay ---
  "./ui/overlay": function(require, module, exports) {
/**
 * Komponen Overlay Floating UI untuk Discord Quest Assistant
 */
const { createStyles } = require("./styles");
const { attachDragAndDrop } = require("./dragDrop");
const { parseQuests } = require("../utils/parser");
const { enrollQuest, runQuestQueue, stopQuestQueue } = require("../tasks/taskRunner");
const { state } = require("../core/state");

const UI_CONTAINER_ID = "discord-quest-completer-ui";

function initOverlay(stores) {
    const existing = document.getElementById(UI_CONTAINER_ID);
    if (existing) existing.remove();

    const root = document.createElement("div");
    root.id = UI_CONTAINER_ID;

    // Inject Styles
    const styleEl = document.createElement("style");
    styleEl.textContent = createStyles(UI_CONTAINER_ID);
    document.head.appendChild(styleEl);

    const isDesktopApp = stores.isDesktopApp;

    root.innerHTML = `
        <div class="dqu-header" id="dqu-drag-handle">
            <div class="dqu-title">
                <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
                Quest Assistant
            </div>
            <div class="dqu-controls">
                <button class="dqu-btn-icon" id="dqu-btn-min" title="Minimize / Expand">_</button>
                <button class="dqu-btn-icon close" id="dqu-btn-close" title="Tutup">✕</button>
            </div>
        </div>
        <div class="dqu-body" id="dqu-content">
            <div class="dqu-stats">
                <div class="dqu-stats-item">
                    <span class="dqu-stats-label">Mode App</span>
                    <span class="dqu-stats-val">
                        <span class="dqu-dot green"></span>
                        ${isDesktopApp ? "Desktop Native" : "Web Client"}
                    </span>
                </div>
                <div class="dqu-stats-item">
                    <span class="dqu-stats-label">Sisa Quest</span>
                    <span class="dqu-stats-val" id="dqu-stats-count">
                        <span class="dqu-dot blue"></span> 0
                    </span>
                </div>
                <div class="dqu-stats-item">
                    <span class="dqu-stats-label">Status</span>
                    <span class="dqu-stats-val" id="dqu-status-text" style="color:#23a55a">
                        <span class="dqu-dot green" id="dqu-status-dot"></span> Idle
                    </span>
                </div>
            </div>

            <!-- Filter & Search Controls -->
            <div class="dqu-filter-box">
                <div class="dqu-search-row">
                    <div class="dqu-search-wrap">
                        <span class="dqu-search-icon">🔍</span>
                        <input type="text" class="dqu-search-input" id="dqu-filter-search" placeholder="Cari nama game atau hadiah (mis: Orbs, Border)..." />
                        <button class="dqu-search-clear" id="dqu-search-clear" title="Bersihkan">✕</button>
                    </div>
                    <select class="dqu-status-select" id="dqu-filter-status" title="Filter Status Quest">
                        <option value="ACTIVE">⏳ Belum Selesai</option>
                        <option value="ALL">📋 Semua Status</option>
                        <option value="DONE">✅ Sudah Selesai</option>
                    </select>
                </div>

                <!-- Category Pills -->
                <div class="dqu-pills-row" id="dqu-pills-container">
                    <button class="dqu-pill active" data-category="ALL">🌟 Semua</button>
                    <button class="dqu-pill" data-category="AUTO">⚡ 100% Auto</button>
                    <button class="dqu-pill" data-category="ORBS">🔮 Orbs</button>
                    <button class="dqu-pill" data-category="BORDER">🖼️ Border</button>
                    <button class="dqu-pill" data-category="ITEM">🎮 Item</button>
                    <button class="dqu-pill" data-category="MANUAL">🕹️ Mini-Game</button>
                </div>

                <!-- Info bar -->
                <div class="dqu-filter-info">
                    <span id="dqu-filter-count-text">Memuat quest...</span>
                    <span class="dqu-filter-reset" id="dqu-filter-reset-btn" style="display:none;">Reset Filter</span>
                </div>
            </div>

            <div class="dqu-quest-list" id="dqu-list-container"></div>

            <div class="dqu-actions">
                <button class="dqu-btn" id="dqu-btn-start-all">▶ Selesaikan Otomatis</button>
                <button class="dqu-btn danger" id="dqu-btn-stop" disabled>■ Berhenti</button>
                <button class="dqu-btn secondary sm" id="dqu-btn-refresh" title="Refresh Quest">↻</button>
            </div>

            <div class="dqu-console" id="dqu-log-output">Quest Assistant siap digunakan. Sedang memuat quest...</div>
        </div>
    `;

    document.body.appendChild(root);

    // Elements
    const logBox = root.querySelector("#dqu-log-output");
    const listContainer = root.querySelector("#dqu-list-container");
    const statusText = root.querySelector("#dqu-status-text");
    const statusDot = root.querySelector("#dqu-status-dot");
    const countText = root.querySelector("#dqu-stats-count");
    const btnStartAll = root.querySelector("#dqu-btn-start-all");
    const btnStop = root.querySelector("#dqu-btn-stop");
    const btnRefresh = root.querySelector("#dqu-btn-refresh");
    const btnMin = root.querySelector("#dqu-btn-min");
    const btnClose = root.querySelector("#dqu-btn-close");
    const dragHandle = root.querySelector("#dqu-drag-handle");
    const bodyContent = root.querySelector("#dqu-content");

    const filterSearch = root.querySelector("#dqu-filter-search");
    const filterSearchClear = root.querySelector("#dqu-search-clear");
    const filterStatus = root.querySelector("#dqu-filter-status");
    const pillsContainer = root.querySelector("#dqu-pills-container");
    const filterCountText = root.querySelector("#dqu-filter-count-text");
    const filterResetBtn = root.querySelector("#dqu-filter-reset-btn");

    let cachedQuests = [];
    let selectedCategory = "ALL";

    function log(msg, type = "info") {
        const time = new Date().toLocaleTimeString();
        const prefix = type === "error" ? "❌" : type === "success" ? "✅" : "ℹ️";
        const line = `[${time}] ${prefix} ${msg}\n`;
        logBox.textContent += line;
        logBox.scrollTop = logBox.scrollHeight;
        console.log(`[QuestUI] ${msg}`);
    }

    // Attach Drag and Drop
    const detachDrag = attachDragAndDrop(root, dragHandle);

    // Minimize & Close
    btnMin.addEventListener("click", () => {
        const isHidden = bodyContent.style.display === "none";
        bodyContent.style.display = isHidden ? "flex" : "none";
        root.classList.toggle("minimized", !isHidden);
        btnMin.textContent = isHidden ? "_" : "□";
    });

    // Event listener: Search input
    filterSearch.addEventListener("input", () => {
        filterSearchClear.style.display = filterSearch.value ? "block" : "none";
        renderList();
    });

    filterSearchClear.addEventListener("click", () => {
        filterSearch.value = "";
        filterSearchClear.style.display = "none";
        filterSearch.focus();
        renderList();
    });

    // Event listener: Status Select
    filterStatus.addEventListener("change", () => renderList());

    // Event listener: Category Pills
    pillsContainer.querySelectorAll(".dqu-pill").forEach(pill => {
        pill.addEventListener("click", () => {
            pillsContainer.querySelectorAll(".dqu-pill").forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            selectedCategory = pill.dataset.category || "ALL";
            renderList();
        });
    });

    // Event listener: Reset Filter
    filterResetBtn.addEventListener("click", () => {
        filterSearch.value = "";
        filterSearchClear.style.display = "none";
        filterStatus.value = "ACTIVE";
        selectedCategory = "ALL";
        pillsContainer.querySelectorAll(".dqu-pill").forEach(p => {
            p.classList.toggle("active", p.dataset.category === "ALL");
        });
        renderList();
    });

    // Render Quests
    function renderList(quests = cachedQuests) {
        listContainer.innerHTML = "";

        const uncompletedAll = quests.filter(q => !q.isCompleted);
        countText.innerHTML = `<span class="dqu-dot blue"></span> ${uncompletedAll.length} Aktif`;

        // Terapkan Filter
        const statusVal = filterStatus.value;
        const searchVal = filterSearch.value.trim().toLowerCase();

        const isFiltered = statusVal !== "ACTIVE" || selectedCategory !== "ALL" || searchVal !== "";
        filterResetBtn.style.display = isFiltered ? "inline-block" : "none";

        const filtered = quests.filter(q => {
            // Filter Status
            if (statusVal === "ACTIVE" && q.isCompleted) return false;
            if (statusVal === "DONE" && !q.isCompleted) return false;

            // Filter Category Pill
            if (selectedCategory === "AUTO" && !q.executionMethod?.isAuto) return false;
            if (selectedCategory === "MANUAL" && q.executionMethod?.isAuto) return false;
            if (selectedCategory === "ORBS" && q.reward?.type !== "ORBS") return false;
            if (selectedCategory === "BORDER" && q.reward?.type !== "BORDER") return false;
            if (selectedCategory === "ITEM" && q.reward?.type !== "ITEM") return false;

            // Filter Search Text
            if (searchVal) {
                const combined = `${q.name} ${q.gameTitle} ${q.reward?.name || ""} ${q.taskType}`.toLowerCase();
                if (!combined.includes(searchVal)) return false;
            }

            return true;
        });

        filterCountText.textContent = `Menampilkan ${filtered.length} dari ${quests.length} quest`;

        if (filtered.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align:center;padding:24px 12px;color:#949ba4;">
                    <div style="font-size:24px;margin-bottom:6px;">🔍</div>
                    <div style="font-weight:600;color:#dbdee1;">Tidak ada quest yang cocok</div>
                    <div style="font-size:11px;margin-top:2px;">Coba ubah kata kunci atau ganti filter di atas.</div>
                </div>
            `;
            return;
        }

        filtered.forEach(q => {
            const card = document.createElement("div");

            // Tentukan accent border kiri
            let accentClass = "accent-default";
            if (q.reward?.type === "ORBS") accentClass = "accent-orb";
            else if (q.reward?.type === "BORDER") accentClass = "accent-border";
            else if (q.reward?.type === "ITEM") accentClass = "accent-item";
            else if (q.reward?.type === "NITRO") accentClass = "accent-nitro";

            card.className = `dqu-quest-card ${accentClass} ${state.activeQuest?.id === q.id ? "active" : ""}`;

            const percent = q.targetSeconds > 0 ? Math.min(100, Math.round((q.currentSeconds / q.targetSeconds) * 100)) : 0;
            const isDone = q.isCompleted;

            let badgeClass = "active";
            if (isDone) badgeClass = "done";

            const displayTaskName = q.taskType
                .replace("_ON_DESKTOP", "")
                .replace("_ON_MOBILE", "")
                .replace("_EMBEDDED", "");

            const rewardTagHtml = q.reward ? `<span class="dqu-reward-tag ${q.reward.badgeClass}">${q.reward.icon} ${q.reward.name}</span>` : "";
            const methodTagHtml = q.executionMethod ? `<span class="dqu-method-tag ${q.executionMethod.tagClass}">${q.executionMethod.label}</span>` : "";

            const isItemCount = q.taskType === "ACHIEVEMENT_IN_ACTIVITY";
            const progressDisplay = isDone
                ? "Selesai (100%)"
                : isItemCount
                ? `${percent}% (${q.currentSeconds} / ${q.targetSeconds} item)`
                : `${percent}% (${Math.floor(q.currentSeconds / 60)} / ${Math.ceil(q.targetSeconds / 60)} mnt)`;

            card.innerHTML = `
                <div class="dqu-quest-header">
                    <div class="dqu-quest-title-wrap">
                        <div class="dqu-quest-name">${q.name}</div>
                        <div class="dqu-quest-tags">
                            ${rewardTagHtml}
                            <span style="font-size:11px;color:#949ba4;">${q.gameTitle || displayTaskName}</span>
                        </div>
                    </div>
                    <div class="dqu-quest-badges">
                        ${methodTagHtml}
                        <span class="dqu-badge ${badgeClass}">${isDone ? "Selesai" : displayTaskName}</span>
                    </div>
                </div>

                <div class="dqu-progress-wrap">
                    <div class="dqu-progress-bar ${isDone ? "done" : ""}" style="width: ${isDone ? 100 : percent}%;"></div>
                </div>

                <div class="dqu-quest-footer">
                    <span>${progressDisplay}</span>
                    <div style="display:flex;gap:4px;">
                        ${!q.isEnrolled && !isDone ? `<button class="dqu-btn sm secondary dqu-btn-enroll" data-id="${q.id}">Enroll</button>` : ""}
                        ${!isDone ? `<button class="dqu-btn sm dqu-btn-play-single" data-id="${q.id}" ${state.isRunning ? "disabled" : ""}>${q.executionMethod?.isAuto ? "▶ Start" : "👁️ Pantau"}</button>` : `<span style="color:#23a55a;font-weight:700;">✓ Selesai</span>`}
                    </div>
                </div>
            `;

            const enrollBtn = card.querySelector(".dqu-btn-enroll");
            if (enrollBtn) {
                enrollBtn.addEventListener("click", async () => {
                    await enrollQuest(q, stores.api, log);
                    renderList();
                });
            }

            const playBtn = card.querySelector(".dqu-btn-play-single");
            if (playBtn) {
                playBtn.addEventListener("click", () => {
                    startExecution([q]);
                });
            }

            listContainer.appendChild(card);
        });
    }

    async function refreshQuests(showToast = false) {
        statusText.innerHTML = `<span class="dqu-dot blue pulse"></span> Loading...`;
        statusText.style.color = "#f0b232";

        // 1. Ambil dari QuestsStore
        let parsed = parseQuests(stores.QuestsStore);

        // 2. Jika QuestsStore belum memuat quest atau user meminta refresh
        if (parsed.length === 0 || showToast) {
            log("Mengambil quest langsung dari server Discord API (/quests/@me)...", "info");
            try {
                const apiQuests = await stores.fetchQuestsAPI();
                if (apiQuests && apiQuests.length > 0) {
                    parsed = parseQuests(apiQuests);
                }
            } catch (err) {
                log("Error memanggil API quests: " + err.message, "error");
            }
        }

        cachedQuests = parsed;
        renderList(cachedQuests);

        if (state.isRunning) {
            statusText.innerHTML = `<span class="dqu-dot blue pulse"></span> Berjalan`;
            statusText.style.color = "#5865f2";
        } else {
            statusText.innerHTML = `<span class="dqu-dot green"></span> Idle`;
            statusText.style.color = "#23a55a";
        }

        if (showToast || parsed.length > 0) {
            const activeCount = cachedQuests.filter(q => !q.isCompleted).length;
            log(`Ditemukan ${cachedQuests.length} quest (${activeCount} aktif/belum selesai).`, "info");
        }
    }

    const callbacks = {
        onStart: () => {
            btnStartAll.disabled = true;
            btnStop.disabled = false;
            statusText.innerHTML = `<span class="dqu-dot blue pulse"></span> Berjalan`;
            statusText.style.color = "#5865f2";
            renderList();
        },
        onStop: () => {
            btnStartAll.disabled = false;
            btnStop.disabled = true;
            statusText.innerHTML = `<span class="dqu-dot green"></span> Idle`;
            statusText.style.color = "#23a55a";
            renderList();
        },
        onQuestChange: () => {
            renderList();
        },
        onProgress: () => {
            renderList();
        },
        log
    };

    function startExecution(list) {
        runQuestQueue(list, stores, callbacks);
    }

    btnStartAll.addEventListener("click", () => {
        const uncompleted = cachedQuests.filter(q => !q.isCompleted);
        if (uncompleted.length === 0) {
            log("Tidak ada quest aktif yang belum selesai!", "info");
            return;
        }

        const autoQuests = uncompleted.filter(q => q.executionMethod?.isAuto);
        const manualQuests = uncompleted.filter(q => !q.executionMethod?.isAuto);

        if (autoQuests.length > 0) {
            log(`Memulai penyelesaian otomatis untuk ${autoQuests.length} quest...`);
            if (manualQuests.length > 0) {
                log(`💡 Info: ${manualQuests.length} quest bertipe Mini-Game (${manualQuests.map(q => q.name).join(", ")}) butuh dimainkan sebentar di Voice Channel.`, "info");
            }
            startExecution(autoQuests);
        } else {
            log(`Semua quest aktif bertipe Mini-Game/Activity. Silakan klik tombol "👁️ Pantau" pada kartu quest yang ingin kamu buka di Voice Channel!`, "info");
        }
    });

    btnStop.addEventListener("click", () => {
        stopQuestQueue(callbacks);
    });

    btnRefresh.addEventListener("click", () => {
        refreshQuests(true);
    });

    function destroy() {
        stopQuestQueue(callbacks);
        detachDrag();
        root.remove();
        styleEl.remove();
        console.log("[QuestUI] Overlay berhasil ditutup.");
    }

    btnClose.addEventListener("click", () => {
        destroy();
        delete window.__discordQuestUI;
    });

    // Inisialisasi awal dengan auto-fetch
    refreshQuests(false);
    log("Discord Quest Assistant siap! Memeriksa quest aktif...");

    return {
        destroy,
        renderList,
        refreshQuests,
        log
    };
}

module.exports = {
    initOverlay
};

  },

  // --- Module: ./ui/styles ---
  "./ui/styles": function(require, module, exports) {
/**
 * CSS Stylesheet untuk Floating UI Discord Quest Assistant
 */
function createStyles(containerId) {
    return `
        #${containerId} {
            position: fixed;
            top: 50px;
            right: 30px;
            width: 440px;
            background: rgba(30, 31, 34, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            color: #dbdee1;
            border-radius: 14px;
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08);
            font-family: "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
            font-size: 13px;
            z-index: 99999;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            user-select: none;
            transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
        }
        #${containerId}.minimized {
            width: 280px;
        }
        #${containerId} * {
            box-sizing: border-box;
        }
        .dqu-header {
            background: rgba(43, 45, 49, 0.9);
            padding: 12px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: move;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .dqu-title {
            font-weight: 700;
            color: #f2f3f5;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            letter-spacing: 0.2px;
        }
        .dqu-title svg {
            fill: #5865f2;
            width: 19px;
            height: 19px;
            filter: drop-shadow(0 0 6px rgba(88, 101, 242, 0.5));
        }
        .dqu-controls {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .dqu-btn-icon {
            background: transparent;
            border: none;
            color: #949ba4;
            cursor: pointer;
            padding: 4px 6px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            transition: all 0.15s ease;
        }
        .dqu-btn-icon:hover {
            color: #f2f3f5;
            background: rgba(255, 255, 255, 0.1);
        }
        .dqu-btn-icon.close:hover {
            background: #f23f43;
            color: #ffffff;
        }
        .dqu-body {
            padding: 12px 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-height: 560px;
            overflow-y: auto;
        }
        .dqu-body::-webkit-scrollbar {
            width: 6px;
        }
        .dqu-body::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.12);
            border-radius: 3px;
        }
        .dqu-body::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.25);
        }

        /* Stats Bar */
        .dqu-stats {
            background: rgba(43, 45, 49, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 8px 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .dqu-stats-item {
            display: flex;
            flex-direction: column;
        }
        .dqu-stats-label {
            font-size: 9.5px;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #949ba4;
            font-weight: 700;
        }
        .dqu-stats-val {
            font-weight: 700;
            font-size: 13.5px;
            color: #f2f3f5;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .dqu-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            display: inline-block;
        }
        .dqu-dot.green { background: #23a55a; box-shadow: 0 0 6px #23a55a; }
        .dqu-dot.blue { background: #5865f2; box-shadow: 0 0 6px #5865f2; }
        .dqu-dot.pulse { animation: dquPulse 1.5s infinite; }
        @keyframes dquPulse {
            0% { transform: scale(0.95); opacity: 0.7; }
            50% { transform: scale(1.15); opacity: 1; }
            100% { transform: scale(0.95); opacity: 0.7; }
        }

        /* Filter Section */
        .dqu-filter-box {
            display: flex;
            flex-direction: column;
            gap: 7px;
            background: rgba(43, 45, 49, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 8px 10px;
        }
        .dqu-search-row {
            display: flex;
            gap: 6px;
            align-items: center;
        }
        .dqu-search-wrap {
            position: relative;
            flex: 1;
            display: flex;
            align-items: center;
        }
        .dqu-search-icon {
            position: absolute;
            left: 8px;
            color: #80848e;
            font-size: 11px;
            pointer-events: none;
        }
        .dqu-search-input {
            width: 100%;
            background: #1e1f22;
            color: #f2f3f5;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 6px;
            padding: 6px 26px 6px 26px;
            font-size: 11.5px;
            font-family: inherit;
            outline: none;
            transition: border-color 0.15s, box-shadow 0.15s;
        }
        .dqu-search-input:focus {
            border-color: #5865f2;
            box-shadow: 0 0 0 1px #5865f2;
        }
        .dqu-search-input::placeholder {
            color: #80848e;
        }
        .dqu-search-clear {
            position: absolute;
            right: 6px;
            background: transparent;
            border: none;
            color: #80848e;
            cursor: pointer;
            font-size: 11px;
            padding: 2px 4px;
            border-radius: 50%;
            display: none;
        }
        .dqu-search-clear:hover {
            color: #f2f3f5;
            background: rgba(255, 255, 255, 0.1);
        }
        .dqu-status-select {
            background: #1e1f22;
            color: #dbdee1;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 6px;
            padding: 5px 8px;
            font-size: 11px;
            font-family: inherit;
            cursor: pointer;
            outline: none;
            transition: border-color 0.15s;
            width: 130px;
        }
        .dqu-status-select:focus, .dqu-status-select:hover {
            border-color: #5865f2;
        }

        /* Filter Pill Tabs */
        .dqu-pills-row {
            display: flex;
            gap: 5px;
            align-items: center;
            overflow-x: auto;
            padding-bottom: 2px;
        }
        .dqu-pills-row::-webkit-scrollbar {
            height: 3px;
        }
        .dqu-pills-row::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
        }
        .dqu-pill {
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.06);
            color: #b5bac1;
            font-size: 10.5px;
            font-weight: 600;
            padding: 3px 9px;
            border-radius: 12px;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.15s ease;
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }
        .dqu-pill:hover {
            background: rgba(255, 255, 255, 0.12);
            color: #f2f3f5;
        }
        .dqu-pill.active {
            background: #5865f2;
            color: #ffffff;
            border-color: #5865f2;
            box-shadow: 0 2px 8px rgba(88, 101, 242, 0.4);
        }

        /* Filter Info Count */
        .dqu-filter-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10.5px;
            color: #949ba4;
            padding: 0 2px;
        }
        .dqu-filter-reset {
            color: #5865f2;
            cursor: pointer;
            text-decoration: underline;
        }
        .dqu-filter-reset:hover {
            color: #7983f5;
        }

        /* Quest List */
        .dqu-quest-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-height: 280px;
            overflow-y: auto;
            padding-right: 2px;
        }
        .dqu-quest-list::-webkit-scrollbar {
            width: 5px;
        }
        .dqu-quest-list::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
        }

        /* Quest Card */
        .dqu-quest-card {
            background: #2b2d31;
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-left: 3.5px solid #5865f2;
            border-radius: 9px;
            padding: 10px 12px;
            display: flex;
            flex-direction: column;
            gap: 7px;
            transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .dqu-quest-card:hover {
            border-color: rgba(88, 101, 242, 0.4);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        .dqu-quest-card.accent-orb { border-left-color: #9b59b6; }
        .dqu-quest-card.accent-border { border-left-color: #3498db; }
        .dqu-quest-card.accent-item { border-left-color: #2ecc71; }
        .dqu-quest-card.accent-nitro { border-left-color: #f1c40f; }
        .dqu-quest-card.active {
            border-color: #5865f2;
            background: rgba(88, 101, 242, 0.08);
        }

        .dqu-quest-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8px;
        }
        .dqu-quest-title-wrap {
            flex: 1;
            min-width: 0;
        }
        .dqu-quest-name {
            font-weight: 700;
            color: #f2f3f5;
            font-size: 13px;
            line-height: 1.25;
            word-break: break-word;
        }
        .dqu-quest-tags {
            display: flex;
            gap: 5px;
            align-items: center;
            margin-top: 4px;
            flex-wrap: wrap;
        }
        .dqu-quest-badges {
            display: flex;
            gap: 4px;
            align-items: center;
            flex-wrap: wrap;
            justify-content: flex-end;
        }

        .dqu-badge {
            font-size: 9.5px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
            background: #383a40;
            color: #dbdee1;
            text-transform: uppercase;
            white-space: nowrap;
        }
        .dqu-badge.done {
            background: rgba(35, 165, 90, 0.2);
            color: #23a55a;
            border: 1px solid rgba(35, 165, 90, 0.3);
        }
        .dqu-badge.active {
            background: rgba(88, 101, 242, 0.2);
            color: #5865f2;
            border: 1px solid rgba(88, 101, 242, 0.3);
        }

        .dqu-method-tag {
            font-size: 9.5px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
            white-space: nowrap;
        }
        .dqu-method-tag.auto {
            background: rgba(88, 101, 242, 0.2);
            color: #7983f5;
            border: 1px solid rgba(88, 101, 242, 0.35);
        }
        .dqu-method-tag.manual {
            background: rgba(235, 69, 158, 0.2);
            color: #f47fff;
            border: 1px solid rgba(235, 69, 158, 0.35);
        }

        .dqu-reward-tag {
            font-size: 10.5px;
            font-weight: 600;
            padding: 2px 7px;
            border-radius: 4px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
        }
        .dqu-reward-tag.orb {
            background: rgba(155, 89, 182, 0.22);
            color: #d7aefb;
            border: 1px solid rgba(155, 89, 182, 0.45);
        }
        .dqu-reward-tag.border {
            background: rgba(52, 152, 219, 0.22);
            color: #70c5ff;
            border: 1px solid rgba(52, 152, 219, 0.45);
        }
        .dqu-reward-tag.item {
            background: rgba(46, 204, 113, 0.22);
            color: #57f287;
            border: 1px solid rgba(46, 204, 113, 0.45);
        }
        .dqu-reward-tag.nitro {
            background: rgba(241, 196, 15, 0.22);
            color: #f1c40f;
            border: 1px solid rgba(241, 196, 15, 0.45);
        }
        .dqu-reward-tag.other {
            background: rgba(148, 155, 164, 0.15);
            color: #dbdee1;
            border: 1px solid rgba(148, 155, 164, 0.3);
        }

        .dqu-progress-wrap {
            height: 6px;
            background: #1e1f22;
            border-radius: 3px;
            overflow: hidden;
            position: relative;
        }
        .dqu-progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #5865f2, #7983f5);
            width: 0%;
            border-radius: 3px;
            transition: width 0.3s ease;
        }
        .dqu-progress-bar.done {
            background: linear-gradient(90deg, #23a55a, #2dc770);
        }

        .dqu-quest-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #949ba4;
        }

        /* Action Buttons */
        .dqu-actions {
            display: flex;
            gap: 6px;
        }
        .dqu-btn {
            background: #5865f2;
            color: #ffffff;
            border: none;
            border-radius: 6px;
            padding: 8px 12px;
            font-weight: 600;
            font-size: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            transition: all 0.15s ease;
            flex: 1;
        }
        .dqu-btn:hover:not(:disabled) {
            background: #4752c4;
            box-shadow: 0 2px 8px rgba(88, 101, 242, 0.4);
        }
        .dqu-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .dqu-btn.secondary {
            background: #4e5058;
            color: #ffffff;
        }
        .dqu-btn.secondary:hover:not(:disabled) {
            background: #6d6f78;
        }
        .dqu-btn.danger {
            background: #da373c;
            color: #ffffff;
        }
        .dqu-btn.danger:hover:not(:disabled) {
            background: #a1282c;
        }
        .dqu-btn.sm {
            padding: 4px 8px;
            font-size: 11px;
            flex: none;
        }

        /* Console Output */
        .dqu-console {
            background: #111214;
            border-radius: 6px;
            padding: 8px 10px;
            font-family: Consolas, monospace;
            font-size: 11px;
            color: #23a55a;
            height: 75px;
            overflow-y: auto;
            white-space: pre-wrap;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .dqu-console::-webkit-scrollbar {
            width: 4px;
        }
        .dqu-console::-webkit-scrollbar-thumb {
            background: #2b2d31;
        }
    `;
}

module.exports = {
    createStyles
};

  },

  // --- Module: ./utils/parser ---
  "./utils/parser": function(require, module, exports) {
/**
 * Utilitas Parser Data Discord Quest
 */
const SUPPORTED_TASKS = [
    "ACHIEVEMENT_IN_ACTIVITY",
    "PLAY_ACTIVITY",
    "LAUNCH_ACTIVITY",
    "PLAY_EMBEDDED_ACTIVITY",
    "PLAY_GAME",
    "WATCH_VIDEO",
    "WATCH_VIDEO_ON_MOBILE",
    "PLAY_ON_DESKTOP",
    "STREAM_ON_DESKTOP",
    "PLAY_ON_MOBILE",
    "PLAY_IN_BROWSER"
];

function getRawQuests(input) {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    if (input.quests) {
        const q = input.quests;
        if (q instanceof Map || typeof q.values === "function") {
            return Array.from(q.values());
        }
        if (Array.isArray(q)) return q;
        if (typeof q === "object") return Object.values(q);
    }
    return [];
}

function extractReward(q) {
    const config = q.config || {};
    const messages = config.messages || {};
    const rewardsConfig = config.rewardsConfig || {};
    const rewards = rewardsConfig.rewards || [];

    let rewardType = "OTHER";
    let rewardName = messages.rewardName || "";
    let rewardIcon = "🎁";
    let badgeClass = "other";

    // 1. Periksa dari rewards array
    if (rewards.length > 0) {
        const firstReward = rewards[0];
        if (firstReward.messages?.name) {
            rewardName = firstReward.messages.name;
        }

        const t = firstReward.type;
        const typeStr = String(firstReward.tag || firstReward.type || "").toUpperCase();

        if (firstReward.orbQuantity || t === 4 || typeStr.includes("ORB") || rewardName.toLowerCase().includes("orb")) {
            rewardType = "ORBS";
            const qty = firstReward.orbQuantity || (rewardName.match(/\d+/) ? rewardName.match(/\d+/)[0] : "");
            rewardName = qty ? `${qty} Orbs` : "Orbs";
            rewardIcon = "🔮";
            badgeClass = "orb";
        } else if (
            t === 2 ||
            typeStr.includes("COLLECTIBLE") ||
            typeStr.includes("DECORATION") ||
            typeStr.includes("BORDER") ||
            typeStr.includes("FRAME") ||
            rewardName.toLowerCase().includes("decoration") ||
            rewardName.toLowerCase().includes("frame") ||
            rewardName.toLowerCase().includes("border") ||
            rewardName.toLowerCase().includes("profile")
        ) {
            rewardType = "BORDER";
            rewardIcon = "🖼️";
            badgeClass = "border";
        } else if (t === 1 || typeStr.includes("NITRO") || rewardName.toLowerCase().includes("nitro")) {
            rewardType = "NITRO";
            rewardIcon = "✨";
            badgeClass = "nitro";
        } else if (typeStr.includes("GAME") || typeStr.includes("ITEM") || typeStr.includes("CODE") || t === 0 || t === 3) {
            rewardType = "ITEM";
            rewardIcon = "🎮";
            badgeClass = "item";
        }
    }

    // 2. Fallback scan dari seluruh pesan & deskripsi quest
    if (rewardType === "OTHER" || !rewardName) {
        const textToScan = `${messages.rewardName || ""} ${messages.taskDescription || ""} ${messages.questName || ""} ${config.application?.name || ""}`.toLowerCase();
        if (textToScan.includes("orb")) {
            rewardType = "ORBS";
            rewardIcon = "🔮";
            badgeClass = "orb";
            const orbMatch = textToScan.match(/(\d+)\s*orb/i);
            if (!rewardName) rewardName = orbMatch ? `${orbMatch[1]} Orbs` : "Orbs";
        } else if (textToScan.includes("decoration") || textToScan.includes("border") || textToScan.includes("frame") || textToScan.includes("avatar")) {
            rewardType = "BORDER";
            rewardIcon = "🖼️";
            badgeClass = "border";
            if (!rewardName) rewardName = "Avatar Border / Frame";
        } else if (textToScan.includes("nitro")) {
            rewardType = "NITRO";
            rewardIcon = "✨";
            badgeClass = "nitro";
            if (!rewardName) rewardName = "Discord Nitro";
        } else if (textToScan.includes("item") || textToScan.includes("skin") || textToScan.includes("dlc") || textToScan.includes("charm") || textToScan.includes("code")) {
            rewardType = "ITEM";
            rewardIcon = "🎮";
            badgeClass = "item";
            if (!rewardName) rewardName = "In-Game Item";
        } else {
            if (!rewardName) rewardName = "Hadiah Khusus";
        }
    }

    return {
        type: rewardType,
        name: rewardName,
        icon: rewardIcon,
        badgeClass
    };
}

function parseQuests(input) {
    const raw = getRawQuests(input);

    return raw.map(q => {
        const config = q.config || {};
        const messages = config.messages || {};
        const taskConfig = config.taskConfig ?? config.taskConfigV2 ?? q.taskConfig ?? { tasks: {} };
        const tasks = taskConfig.tasks || {};

        // Cari tipe task yang cocok dari supported tasks, atau ambil key pertama yang tersedia
        const taskKeys = Object.keys(tasks);
        const progressKeys = q.userStatus?.progress ? Object.keys(q.userStatus.progress) : [];

        let taskType = SUPPORTED_TASKS.find(t => tasks[t] != null);
        if (!taskType) {
            taskType = progressKeys.find(t => SUPPORTED_TASKS.includes(t)) || taskKeys[0] || progressKeys[0] || "LAUNCH_ACTIVITY";
        }

        const taskData = tasks[taskType] || {};

        let targetSeconds = taskData.target ?? taskData.targetSeconds ?? taskConfig.target ?? 0;
        if (!targetSeconds && (taskType.includes("ACTIVITY") || taskType.includes("LAUNCH"))) {
            targetSeconds = 60; // Default jika launch quest tidak mencantumkan durasi eksplisit
        }

        let currentSeconds = 0;
        if (q.userStatus?.progress?.[taskType]?.value != null) {
            currentSeconds = Math.floor(q.userStatus.progress[taskType].value);
        } else if (q.userStatus?.streamProgressSeconds != null) {
            currentSeconds = Math.floor(q.userStatus.streamProgressSeconds);
        } else if (q.userStatus?.progress) {
            for (const k of Object.keys(q.userStatus.progress)) {
                if (q.userStatus.progress[k]?.value != null) {
                    currentSeconds = Math.floor(q.userStatus.progress[k].value);
                    break;
                }
            }
        }

        const expiresAt = config.expiresAt || q.expiresAt;
        const isExpired = expiresAt ? new Date(expiresAt).getTime() <= Date.now() : false;
        const isEnrolled = Boolean(q.userStatus?.enrolledAt);
        const isCompleted = Boolean(q.userStatus?.completedAt) || (targetSeconds > 0 && currentSeconds >= targetSeconds);

        const reward = extractReward(q);

        const isAuto =
            taskType === "WATCH_VIDEO" ||
            taskType === "WATCH_VIDEO_ON_MOBILE" ||
            taskType === "PLAY_ON_DESKTOP" ||
            taskType === "PLAY_GAME" ||
            taskType === "STREAM_ON_DESKTOP";

        const executionMethod = {
            isAuto,
            label: isAuto ? "⚡ Auto" : "🎮 Mini-Game",
            tagClass: isAuto ? "auto" : "manual"
        };

        return {
            id: q.id,
            name: messages.questName || config.application?.name || q.name || "Quest Tanpa Nama",
            gameTitle: messages.gameTitle || config.application?.name || "",
            taskType,
            taskData,
            targetSeconds,
            currentSeconds,
            isEnrolled,
            isCompleted,
            isExpired,
            reward,
            executionMethod,
            rawQuest: q
        };
    }).filter(q => !q.isExpired);
}

module.exports = {
    SUPPORTED_TASKS,
    getRawQuests,
    parseQuests,
    extractReward
};

  }
  };

  var __cache = {};

  function __normalizePath(base, relative) {
    if (!relative.startsWith(".")) return relative;
    var cleanBase = base.startsWith("./") ? base.slice(2) : base;
    var stack = cleanBase.split("/").filter(function(x) { return x && x !== "."; });
    stack.pop(); // remove current file name
    var parts = relative.split("/");
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      if (part === "." || part === "") continue;
      if (part === "..") {
        if (stack.length > 0) stack.pop();
      } else {
        stack.push(part);
      }
    }
    var res = stack.join("/");
    if (res.endsWith(".js")) res = res.slice(0, -3);
    return "./" + res;
  }

  function __require(name, currentModule) {
    var resolved = __normalizePath(currentModule || "./entry", name);
    if (__cache[resolved]) {
      return __cache[resolved].exports;
    }

    var cleanName = resolved.indexOf("./") === 0 ? resolved.slice(2) : resolved;
    var modFn = __modules[resolved] || __modules[resolved + ".js"] || __modules[cleanName] || __modules[cleanName + ".js"];
    if (!modFn) {
      throw new Error("Module not found: " + name + " (resolved as: " + resolved + ")");
    }

    var module = { exports: {} };
    __cache[resolved] = module;

    function localRequire(reqPath) {
      return __require(reqPath, resolved);
    }

    modFn(localRequire, module, module.exports);
    return module.exports;
  }

  // Jalankan entry point src/index.js
  __require("./index", "./entry");
})();
