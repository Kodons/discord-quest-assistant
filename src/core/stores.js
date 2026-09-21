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
