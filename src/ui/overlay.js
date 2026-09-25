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
