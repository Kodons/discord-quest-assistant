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
                    <span class="dqu-stats-val">${isDesktopApp ? "Desktop Native" : "Web Browser"}</span>
                </div>
                <div class="dqu-stats-item">
                    <span class="dqu-stats-label">Sisa Quest</span>
                    <span class="dqu-stats-val" id="dqu-stats-count">0</span>
                </div>
                <div class="dqu-stats-item">
                    <span class="dqu-stats-label">Status</span>
                    <span class="dqu-stats-val" id="dqu-status-text" style="color:#23a55a">Idle</span>
                </div>
            </div>

            <div class="dqu-filters">
                <input type="text" class="dqu-search-input" id="dqu-filter-search" placeholder="🔍 Cari game, quest, atau hadiah (mis: Orbs, Border)..." />
                <div class="dqu-filter-row">
                    <select class="dqu-select" id="dqu-filter-status" title="Filter Status">
                        <option value="ACTIVE">⏳ Belum Selesai</option>
                        <option value="ALL">📋 Semua Status</option>
                        <option value="DONE">✅ Sudah Selesai</option>
                    </select>
                    <select class="dqu-select" id="dqu-filter-method" title="Filter Metode">
                        <option value="ALL">⚡ Semua Tipe</option>
                        <option value="AUTO">⚡ 100% Otomatis Saja</option>
                        <option value="MANUAL">🎮 Mini-Game Saja</option>
                    </select>
                    <select class="dqu-select" id="dqu-filter-reward" title="Filter Hadiah">
                        <option value="ALL">🎁 Semua Hadiah</option>
                        <option value="ORBS">🔮 Orbs</option>
                        <option value="BORDER">🖼️ Border / Frame</option>
                        <option value="ITEM">🎮 In-Game Item</option>
                        <option value="NITRO">✨ Nitro</option>
                    </select>
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
    const countText = root.querySelector("#dqu-stats-count");
    const btnStartAll = root.querySelector("#dqu-btn-start-all");
    const btnStop = root.querySelector("#dqu-btn-stop");
    const btnRefresh = root.querySelector("#dqu-btn-refresh");
    const btnMin = root.querySelector("#dqu-btn-min");
    const btnClose = root.querySelector("#dqu-btn-close");
    const dragHandle = root.querySelector("#dqu-drag-handle");
    const bodyContent = root.querySelector("#dqu-content");

    const filterSearch = root.querySelector("#dqu-filter-search");
    const filterStatus = root.querySelector("#dqu-filter-status");
    const filterMethod = root.querySelector("#dqu-filter-method");
    const filterReward = root.querySelector("#dqu-filter-reward");

    let cachedQuests = [];

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

    // Event listeners untuk filter
    filterSearch.addEventListener("input", () => renderList());
    filterStatus.addEventListener("change", () => renderList());
    filterMethod.addEventListener("change", () => renderList());
    filterReward.addEventListener("change", () => renderList());

    // Render Quests
    function renderList(quests = cachedQuests) {
        listContainer.innerHTML = "";

        const uncompletedAll = quests.filter(q => !q.isCompleted);
        countText.textContent = `${uncompletedAll.length} Aktif`;

        // Terapkan Filter
        const statusVal = filterStatus.value;
        const methodVal = filterMethod.value;
        const rewardVal = filterReward.value;
        const searchVal = filterSearch.value.trim().toLowerCase();

        const filtered = quests.filter(q => {
            // Filter Status
            if (statusVal === "ACTIVE" && q.isCompleted) return false;
            if (statusVal === "DONE" && !q.isCompleted) return false;

            // Filter Metode
            if (methodVal === "AUTO" && !q.executionMethod?.isAuto) return false;
            if (methodVal === "MANUAL" && q.executionMethod?.isAuto) return false;

            // Filter Hadiah
            if (rewardVal !== "ALL" && q.reward?.type !== rewardVal) return false;

            // Filter Search
            if (searchVal) {
                const combined = `${q.name} ${q.gameTitle} ${q.reward?.name || ""} ${q.taskType}`.toLowerCase();
                if (!combined.includes(searchVal)) return false;
            }

            return true;
        });

        if (filtered.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align:center;padding:18px;color:#949ba4;">
                    <div>Tidak ada quest yang cocok dengan filter.</div>
                    ${quests.length === 0 ? `<button class="dqu-btn sm" id="dqu-btn-force-fetch" style="margin: 10px auto 0 auto;">↻ Ambil Ulang via API Discord</button>` : ""}
                </div>
            `;
            const forceBtn = listContainer.querySelector("#dqu-btn-force-fetch");
            if (forceBtn) {
                forceBtn.addEventListener("click", () => refreshQuests(true));
            }
            return;
        }

        filtered.forEach(q => {
            const card = document.createElement("div");
            card.className = `dqu-quest-card ${state.activeQuest?.id === q.id ? "active" : ""}`;

            const percent = q.targetSeconds > 0 ? Math.min(100, Math.round((q.currentSeconds / q.targetSeconds) * 100)) : 0;
            let badgeClass = "active";
            if (q.isCompleted) badgeClass = "done";
            else if (q.taskType.includes("VIDEO")) badgeClass = "video";

            const displayTaskName = q.taskType
                .replace("_ON_DESKTOP", "")
                .replace("_ON_MOBILE", "")
                .replace("_EMBEDDED", "");

            const rewardTagHtml = q.reward ? `<span class="dqu-reward-tag ${q.reward.badgeClass}">${q.reward.icon} ${q.reward.name}</span>` : "";
            const methodTagHtml = q.executionMethod ? `<span class="dqu-method-tag ${q.executionMethod.tagClass}">${q.executionMethod.label}</span>` : "";

            const isItemCount = q.taskType === "ACHIEVEMENT_IN_ACTIVITY";
            const progressDisplay = isItemCount
                ? `${percent}% (${q.currentSeconds} / ${q.targetSeconds} item)`
                : `${percent}% (${Math.floor(q.currentSeconds / 60)} / ${Math.ceil(q.targetSeconds / 60)} mnt)`;

            card.innerHTML = `
                <div class="dqu-quest-header">
                    <div style="flex:1;min-width:0;">
                        <div class="dqu-quest-name">${q.name}</div>
                        <div style="display:flex;gap:4px;align-items:center;margin-top:4px;flex-wrap:wrap;">
                            ${rewardTagHtml}
                            <span style="font-size:11px;color:#949ba4;">${q.gameTitle || q.taskType}</span>
                        </div>
                    </div>
                    <div class="dqu-quest-badges">
                        ${methodTagHtml}
                        <span class="dqu-badge ${badgeClass}">${q.isCompleted ? "Selesai" : displayTaskName}</span>
                    </div>
                </div>
                <div class="dqu-progress-wrap">
                    <div class="dqu-progress-bar" style="width: ${q.isCompleted ? 100 : percent}%;"></div>
                </div>
                <div class="dqu-quest-footer">
                    <span>${progressDisplay}</span>
                    <div style="display:flex;gap:4px;">
                        ${!q.isEnrolled ? `<button class="dqu-btn sm secondary dqu-btn-enroll" data-id="${q.id}">Enroll</button>` : ""}
                        ${!q.isCompleted ? `<button class="dqu-btn sm dqu-btn-play-single" data-id="${q.id}" ${state.isRunning ? "disabled" : ""}>${q.executionMethod?.isAuto ? "Start" : "Pantau"}</button>` : ""}
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
        statusText.textContent = "Loading...";
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

        statusText.textContent = state.isRunning ? "Berjalan" : "Idle";
        statusText.style.color = state.isRunning ? "#5865f2" : "#23a55a";

        if (showToast || parsed.length > 0) {
            const activeCount = cachedQuests.filter(q => !q.isCompleted).length;
            log(`Ditemukan ${cachedQuests.length} quest (${activeCount} aktif/belum selesai).`, "info");
        }
    }

    const callbacks = {
        onStart: () => {
            btnStartAll.disabled = true;
            btnStop.disabled = false;
            statusText.textContent = "Berjalan";
            statusText.style.color = "#5865f2";
            renderList();
        },
        onStop: () => {
            btnStartAll.disabled = false;
            btnStop.disabled = true;
            statusText.textContent = "Idle";
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
            log(`Semua quest aktif bertipe Mini-Game/Activity. Silakan klik tombol "Pantau" pada kartu quest yang ingin kamu buka di Voice Channel!`, "info");
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
