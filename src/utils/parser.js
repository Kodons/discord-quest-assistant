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
